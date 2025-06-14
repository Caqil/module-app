const { generateId } = require('../lib/oauth-utils')

async function handleOAuthCallback(context) {
  const { request, method, path, user, database, utils } = context
  const url = new URL(request.url)
  const provider = path.split('/').pop()
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  try {
    // Handle OAuth errors
    if (error) {
      console.error(`OAuth ${provider} error:`, error)
      return new Response(JSON.stringify({
        success: false,
        error: 'OAuth authentication failed'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization code not provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get plugin configuration
    const pluginConfig = await database.Plugin.findOne({ 
      pluginId: 'oauth-plugin' 
    })
    
    if (!pluginConfig || !pluginConfig.config[provider]?.enabled) {
      return new Response(JSON.stringify({
        success: false,
        error: 'OAuth provider not enabled'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(provider, code, pluginConfig.config[provider])
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    // Get user info from OAuth provider
    const oauthUser = await getUserInfo(provider, tokenData.access_token)
    
    if (!oauthUser.email) {
      throw new Error('Email not provided by OAuth provider')
    }

    // Check if user exists
    let existingUser = await database.User.findOne({ email: oauthUser.email })
    
    if (existingUser) {
      // Update existing user with OAuth info
      if (!existingUser.metadata) existingUser.metadata = {}
      existingUser.metadata.oauthProviders = existingUser.metadata.oauthProviders || []
      
      if (!existingUser.metadata.oauthProviders.includes(provider)) {
        existingUser.metadata.oauthProviders.push(provider)
      }
      
      existingUser.lastLogin = new Date()
      await existingUser.save()
      
      // Create session
      const sessionData = await createUserSession(existingUser, utils)
      
      // Record successful login
      await recordOAuthEvent('login', provider, existingUser.email, database)
      
      // Redirect to success page with session
      return createSuccessResponse(sessionData)
      
    } else if (pluginConfig.config.autoCreateUsers) {
      // Create new user
      const newUser = {
        email: oauthUser.email,
        firstName: oauthUser.firstName || oauthUser.name?.split(' ')[0] || '',
        lastName: oauthUser.lastName || oauthUser.name?.split(' ').slice(1).join(' ') || '',
        avatar: oauthUser.avatar,
        role: pluginConfig.config.defaultRole || 'user',
        isActive: true,
        isEmailVerified: true, // OAuth emails are pre-verified
        metadata: {
          oauthProvider: provider,
          oauthId: oauthUser.id,
          oauthProviders: [provider]
        }
      }

      // Check domain restrictions
      if (pluginConfig.config.allowedDomains?.length > 0) {
        const emailDomain = oauthUser.email.split('@')[1]
        if (!pluginConfig.config.allowedDomains.includes(emailDomain)) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email domain not allowed'
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }

      const createdUser = await database.User.create(newUser)
      
      // Create session
      const sessionData = await createUserSession(createdUser, utils)
      
      // Record successful registration
      await recordOAuthEvent('register', provider, createdUser.email, database)
      
      return createSuccessResponse(sessionData)
      
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'User registration via OAuth is disabled'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error(`OAuth ${provider} callback error:`, error)
    
    // Record failed attempt
    await recordOAuthEvent('error', provider, null, database, error.message)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'OAuth authentication failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function exchangeCodeForToken(provider, code, config) {
  const tokenUrls = {
    google: 'https://oauth2.googleapis.com/token',
    github: 'https://github.com/login/oauth/access_token',
    facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
    linkedin: 'https://www.linkedin.com/oauth/v2/accessToken'
  }

  const params = new URLSearchParams({
    client_id: config.clientId || config.appId || config.consumerKey,
    client_secret: config.clientSecret || config.appSecret || config.consumerSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/plugin-routes/oauth/callback/${provider}`
  })

  const response = await fetch(tokenUrls[provider], {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })

  return response.json()
}

async function getUserInfo(provider, accessToken) {
  const apiUrls = {
    google: 'https://www.googleapis.com/oauth2/v2/userinfo',
    github: 'https://api.github.com/user',
    facebook: 'https://graph.facebook.com/me?fields=id,name,email,picture',
    linkedin: 'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress,profilePicture)'
  }

  const response = await fetch(apiUrls[provider], {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  const data = await response.json()
  
  // Normalize user data across providers
  return {
    id: data.id,
    email: data.email || data.emailAddress,
    name: data.name || `${data.firstName?.localized?.en_US || data.first_name || ''} ${data.lastName?.localized?.en_US || data.last_name || ''}`.trim(),
    firstName: data.given_name || data.firstName?.localized?.en_US || data.first_name,
    lastName: data.family_name || data.lastName?.localized?.en_US || data.last_name,
    avatar: data.picture || data.avatar_url || data.profilePicture
  }
}

async function createUserSession(user, utils) {
  // Use the app's session creation logic
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  }
  
  const accessToken = utils.generateJWT(payload)
  const refreshToken = utils.generateRefreshToken(payload)
  
  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar
    },
    accessToken,
    refreshToken,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }
}

function createSuccessResponse(sessionData) {
  const response = new Response(
    `<html>
      <body>
        <script>
          window.opener.postMessage({
            type: 'oauth-success',
            data: ${JSON.stringify(sessionData)}
          }, window.location.origin);
          window.close();
        </script>
      </body>
    </html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  )
  
  // Set session cookies
  response.headers.append('Set-Cookie', `session-token=${sessionData.accessToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`)
  response.headers.append('Set-Cookie', `refresh-token=${sessionData.refreshToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`)
  
  return response
}

async function recordOAuthEvent(type, provider, email, database, error = null) {
  try {
    // This would be stored in a custom collection for OAuth events
    const event = {
      type,
      provider,
      email,
      error,
      timestamp: new Date(),
      ip: null // Could be extracted from request
    }
    
    // Store in MongoDB (custom collection)
    // await database.collection('oauth_events').insertOne(event)
  } catch (err) {
    console.error('Failed to record OAuth event:', err)
  }
}

module.exports = handleOAuthCallback