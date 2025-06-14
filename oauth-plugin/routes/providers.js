const { OAuthProviders } = require('../lib/oauth-providers')
const OAuthUtils = require('../lib/oauth-utils')

async function handleProvidersRequest(context) {
  const { request, method, database } = context

  if (method === 'GET') {
    try {
      // Get plugin configuration
      const pluginConfig = await database.Plugin.findOne({ 
        pluginId: 'oauth-plugin' 
      })
      
      if (!pluginConfig) {
        return OAuthUtils.createErrorResponse('OAuth plugin not configured', 404)
      }

      // Initialize OAuth providers with current config
      const oauthProviders = new OAuthProviders(pluginConfig.config)
      await oauthProviders.initialize()

      // Get enabled providers with their auth URLs
      const enabledProviders = oauthProviders.getEnabledProviders()

      return OAuthUtils.createSuccessResponse(enabledProviders)

    } catch (error) {
      console.error('Failed to get OAuth providers:', error)
      return OAuthUtils.createErrorResponse('Failed to get OAuth providers', 500)
    }
  }

  return OAuthUtils.createErrorResponse('Method not allowed', 405)
}

module.exports = handleProvidersRequest