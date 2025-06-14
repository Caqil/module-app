async function handleConfigRequest(context) {
  const { request, method, database, user } = context

  // Check admin permissions
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Admin access required'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (method === 'GET') {
    try {
      const pluginConfig = await database.Plugin.findOne({ 
        pluginId: 'oauth-plugin' 
      })
      
      if (!pluginConfig) {
        return new Response(JSON.stringify({
          success: false,
          error: 'OAuth plugin not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Remove sensitive data for display
      const sanitizedConfig = { ...pluginConfig.config }
      Object.keys(sanitizedConfig).forEach(provider => {
        if (sanitizedConfig[provider] && typeof sanitizedConfig[provider] === 'object') {
          Object.keys(sanitizedConfig[provider]).forEach(key => {
            if (key.includes('Secret') || key.includes('secret')) {
              sanitizedConfig[provider][key] = sanitizedConfig[provider][key] ? '••••••••' : ''
            }
          })
        }
      })

      return new Response(JSON.stringify({
        success: true,
        data: sanitizedConfig
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('Failed to get OAuth config:', error)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get configuration'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  if (method === 'PUT') {
    try {
      const body = await request.json()
      const { config: newConfig } = body

      // Validate configuration
      if (!newConfig || typeof newConfig !== 'object') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid configuration data'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Get current config
      const pluginConfig = await database.Plugin.findOne({ 
        pluginId: 'oauth-plugin' 
      })
      
      if (!pluginConfig) {
        return new Response(JSON.stringify({
          success: false,
          error: 'OAuth plugin not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Merge with existing config, preserving secrets if not provided
      const updatedConfig = { ...pluginConfig.config }
      
      Object.keys(newConfig).forEach(provider => {
        if (newConfig[provider] && typeof newConfig[provider] === 'object') {
          updatedConfig[provider] = updatedConfig[provider] || {}
          
          Object.keys(newConfig[provider]).forEach(key => {
            // Don't overwrite secrets with masked values
            if ((key.includes('Secret') || key.includes('secret')) && newConfig[provider][key] === '••••••••') {
              return
            }
            updatedConfig[provider][key] = newConfig[provider][key]
          })
        } else {
          updatedConfig[provider] = newConfig[provider]
        }
      })

      // Update plugin configuration
      await database.Plugin.updateOne(
        { pluginId: 'oauth-plugin' },
        { $set: { config: updatedConfig, updatedAt: new Date() } }
      )

      return new Response(JSON.stringify({
        success: true,
        message: 'OAuth configuration updated successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('Failed to update OAuth config:', error)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update configuration'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'Method not allowed'
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  })
}

module.exports = handleConfigRequest