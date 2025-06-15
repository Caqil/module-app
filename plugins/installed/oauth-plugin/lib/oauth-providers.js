class OAuthProviders {
  constructor(config) {
    this.config = config || {}
    this.providers = new Map()
    this.supportedProviders = ['google', 'github', 'facebook', 'linkedin']
  }

  async initialize() {
    console.log('🔗 OAuth Providers: Initializing...')
    
    try {
      // Initialize each enabled provider
      for (const providerId of this.supportedProviders) {
        const providerConfig = this.config[providerId]
        
        if (providerConfig?.enabled && this.validateProviderConfig(providerId, providerConfig)) {
          this.providers.set(providerId, {
            id: providerId,
            name: this.getProviderName(providerId),
            config: providerConfig,
            authUrl: this.buildAuthUrl(providerId, providerConfig),
            tokenUrl: this.getTokenUrl(providerId),
            userInfoUrl: this.getUserInfoUrl(providerId),
            scopes: this.getScopes(providerId),
            isEnabled: true
          })
          
          console.log(`✅ OAuth Provider: ${providerId} initialized`)
        } else {
          console.log(`⏸️ OAuth Provider: ${providerId} disabled or misconfigured`)
        }
      }
      
      console.log(`🔗 OAuth Providers: ${this.providers.size} providers active`)
      return { success: true, activeProviders: this.providers.size }
      
    } catch (error) {
      console.error('❌ OAuth Providers: Initialization failed:', error)
      return { success: false, error: error.message }
    }
  }

  validateProviderConfig(providerId, config) {
    const requiredFields = {
      google: ['clientId', 'clientSecret'],
      github: ['clientId', 'clientSecret'],
      facebook: ['appId', 'appSecret'],
      linkedin: ['clientId', 'clientSecret']
    }

    const required = requiredFields[providerId] || []
    
    for (const field of required) {
      if (!config[field] || config[field].trim() === '') {
        console.warn(`OAuth Provider ${providerId}: Missing required field '${field}'`)
        return false
      }
    }
    
    return true
  }

  getProviderName(providerId) {
    const names = {
      google: 'Google',
      github: 'GitHub',
      facebook: 'Facebook',
      linkedin: 'LinkedIn'
    }
    return names[providerId] || providerId
  }

  buildAuthUrl(providerId, config) {
    const baseUrls = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      github: 'https://github.com/login/oauth/authorize',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization'
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/plugin-routes/oauth/callback/${providerId}`
    
    const params = {
      google: {
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline'
      },
      github: {
        client_id: config.clientId,
        redirect_uri: redirectUri,
        scope: 'user:email'
      },
      facebook: {
        client_id: config.appId,
        redirect_uri: redirectUri,
        scope: 'email',
        response_type: 'code'
      },
      linkedin: {
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: redirectUri,
        scope: 'r_liteprofile r_emailaddress'
      }
    }

    const providerParams = params[providerId]
    if (!providerParams) {
      throw new Error(`Unsupported provider: ${providerId}`)
    }

    const searchParams = new URLSearchParams(providerParams)
    return `${baseUrls[providerId]}?${searchParams}`
  }

  getTokenUrl(providerId) {
    const urls = {
      google: 'https://oauth2.googleapis.com/token',
      github: 'https://github.com/login/oauth/access_token',
      facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
      linkedin: 'https://www.linkedin.com/oauth/v2/accessToken'
    }
    return urls[providerId]
  }

  getUserInfoUrl(providerId) {
    const urls = {
      google: 'https://www.googleapis.com/oauth2/v2/userinfo',
      github: 'https://api.github.com/user',
      facebook: 'https://graph.facebook.com/me?fields=id,name,email,picture',
      linkedin: 'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress,profilePicture)'
    }
    return urls[providerId]
  }

  getScopes(providerId) {
    const scopes = {
      google: ['openid', 'email', 'profile'],
      github: ['user:email'],
      facebook: ['email'],
      linkedin: ['r_liteprofile', 'r_emailaddress']
    }
    return scopes[providerId] || []
  }

  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    // Re-initialize providers with new config
    await this.initialize()
    
    return { success: true }
  }

  getEnabledProviders() {
    const enabled = []
    
    for (const [providerId, provider] of this.providers) {
      if (provider.isEnabled) {
        enabled.push({
          id: provider.id,
          name: provider.name,
          icon: this.getProviderIcon(providerId),
          color: this.getProviderColor(providerId),
          authUrl: provider.authUrl
        })
      }
    }
    
    return enabled
  }

  getProviderIcon(providerId) {
    const icons = {
      google: 'google',
      github: 'github',
      facebook: 'facebook',
      linkedin: 'linkedin'
    }
    return icons[providerId] || 'shield'
  }

  getProviderColor(providerId) {
    const colors = {
      google: '#db4437',
      github: '#333',
      facebook: '#1877f2',
      linkedin: '#0077b5'
    }
    return colors[providerId] || '#6b7280'
  }

  getProvider(providerId) {
    return this.providers.get(providerId)
  }

  isProviderEnabled(providerId) {
    const provider = this.providers.get(providerId)
    return provider?.isEnabled || false
  }

  getAllProviders() {
    return Array.from(this.providers.values())
  }

  getProviderStats() {
    return {
      total: this.supportedProviders.length,
      enabled: this.providers.size,
      disabled: this.supportedProviders.length - this.providers.size,
      providers: this.supportedProviders.map(id => ({
        id,
        name: this.getProviderName(id),
        enabled: this.isProviderEnabled(id)
      }))
    }
  }

  async exchangeCodeForToken(providerId, code) {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found or not enabled`)
    }

    const params = new URLSearchParams({
      client_id: provider.config.clientId || provider.config.appId,
      client_secret: provider.config.clientSecret || provider.config.appSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/plugin-routes/oauth/callback/${providerId}`
    })

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getUserInfo(providerId, accessToken) {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found or not enabled`)
    }

    const response = await fetch(provider.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`User info request failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Normalize user data across providers
    return this.normalizeUserData(providerId, data)
  }

  normalizeUserData(providerId, userData) {
    const normalized = {
      id: userData.id,
      email: userData.email,
      firstName: '',
      lastName: '',
      fullName: '',
      avatar: null,
      provider: providerId
    }

    switch (providerId) {
      case 'google':
        normalized.firstName = userData.given_name || ''
        normalized.lastName = userData.family_name || ''
        normalized.fullName = userData.name || ''
        normalized.avatar = userData.picture
        break

      case 'github':
        const nameParts = (userData.name || '').split(' ')
        normalized.firstName = nameParts[0] || ''
        normalized.lastName = nameParts.slice(1).join(' ') || ''
        normalized.fullName = userData.name || ''
        normalized.avatar = userData.avatar_url
        break

      case 'facebook':
        const fbNameParts = (userData.name || '').split(' ')
        normalized.firstName = fbNameParts[0] || ''
        normalized.lastName = fbNameParts.slice(1).join(' ') || ''
        normalized.fullName = userData.name || ''
        normalized.avatar = userData.picture?.data?.url
        break

      case 'linkedin':
        normalized.firstName = userData.firstName?.localized?.en_US || ''
        normalized.lastName = userData.lastName?.localized?.en_US || ''
        normalized.fullName = `${normalized.firstName} ${normalized.lastName}`.trim()
        normalized.avatar = userData.profilePicture?.displayImage
        normalized.email = userData.emailAddress // LinkedIn uses different field name
        break
    }

    return normalized
  }
}

module.exports = { OAuthProviders }