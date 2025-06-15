const { OAuthProviders } = require('./lib/oauth-providers')
const { OAuthDatabase } = require('./lib/database')
const OAuthUtils = require('./lib/oauth-utils')

class OAuthPlugin {
  constructor(context) {
    this.context = context
    this.config = context.config
    this.database = new OAuthDatabase(context.database)
    this.providers = new OAuthProviders(this.config)
  }

  async initialize() {
    console.log('🔐 OAuth Plugin: Initializing...')
    
    try {
      // Initialize database collections and indexes
      await this.database.initialize()
      
      // Initialize OAuth providers
      const providersResult = await this.providers.initialize()
      if (!providersResult.success) {
        console.warn('⚠️ OAuth Plugin: Provider initialization issues:', providersResult.error)
      }
      
      // Register hooks
      this.registerHooks()
      
      // Log initialization summary
      const stats = this.providers.getProviderStats()
      console.log(`✅ OAuth Plugin: Successfully initialized with ${stats.enabled}/${stats.total} providers active`)
      
      return { 
        success: true, 
        providersEnabled: stats.enabled,
        providersTotal: stats.total
      }
    } catch (error) {
      console.error('❌ OAuth Plugin: Initialization failed:', error)
      return { success: false, error: error.message }
    }
  }

  registerHooks() {
    // Hook into authentication flow
    this.context.api.registerHook({
      name: 'auth:before-login',
      handler: this.handleBeforeLogin.bind(this),
      priority: 10
    })

    // Hook into user creation
    this.context.api.registerHook({
      name: 'user:before-create',
      handler: this.handleBeforeUserCreate.bind(this),
      priority: 10
    })

    // Hook into user profile updates
    this.context.api.registerHook({
      name: 'user:before-update',
      handler: this.handleBeforeUserUpdate.bind(this),
      priority: 10
    })
  }

  async handleBeforeLogin(data) {
    // Track OAuth login attempts
    if (data.provider) {
      await OAuthUtils.logOAuthEvent('login_attempt', data.provider, data.email, this.database)
    }
    return data
  }

  async handleBeforeUserCreate(userData) {
    // Add OAuth-specific user data
    if (userData.provider) {
      userData.metadata = userData.metadata || {}
      userData.metadata.primaryProvider = userData.provider
      userData.metadata.providerId = userData.providerId
      userData.metadata.oauthCreatedAt = new Date()
    }
    return userData
  }

  async handleBeforeUserUpdate(userData) {
    // Track OAuth profile updates
    if (userData.metadata?.primaryProvider) {
      userData.metadata.oauthUpdatedAt = new Date()
    }
    return userData
  }

  async getProviders() {
    return this.providers.getEnabledProviders()
  }

  async getProviderStats() {
    return this.providers.getProviderStats()
  }

  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    // Update providers with new configuration
    await this.providers.updateConfig(this.config)
    
    // Update database configuration
    await this.database.updateOAuthConfig(this.config)
    
    console.log('🔐 OAuth Plugin: Configuration updated')
    return { success: true }
  }

  async getStats() {
    try {
      const [dbStats, providerStats] = await Promise.all([
        this.database.getOAuthStats(),
        this.providers.getProviderStats()
      ])

      return {
        ...dbStats,
        providers: providerStats
      }
    } catch (error) {
      console.error('Failed to get OAuth stats:', error)
      return null
    }
  }

  async testProvider(providerId) {
    try {
      const provider = this.providers.getProvider(providerId)
      if (!provider) {
        return { success: false, error: 'Provider not found' }
      }

      // Test provider configuration by attempting to build auth URL
      const authUrl = provider.authUrl
      if (!authUrl) {
        return { success: false, error: 'Failed to build auth URL' }
      }

      return { 
        success: true, 
        message: 'Provider configuration is valid',
        authUrl: authUrl.substring(0, 100) + '...' // Truncated for security
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getProviderHealth() {
    const health = {}
    const enabledProviders = this.providers.getEnabledProviders()

    for (const provider of enabledProviders) {
      const test = await this.testProvider(provider.id)
      health[provider.id] = {
        name: provider.name,
        enabled: true,
        healthy: test.success,
        error: test.error || null
      }
    }

    return health
  }

  async deactivate() {
    console.log('🔐 OAuth Plugin: Deactivating...')
    
    try {
      // Clear any cached data
      this.providers = null
      
      // Log deactivation
      console.log('✅ OAuth Plugin: Successfully deactivated')
      return { success: true }
    } catch (error) {
      console.error('❌ OAuth Plugin: Deactivation failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Utility method for other plugins to check OAuth status
  isUserOAuthEnabled(userId) {
    // This could be used by other plugins to check if a user has OAuth enabled
    return this.database.User.findById(userId).then(user => {
      return !!(user?.metadata?.primaryProvider)
    }).catch(() => false)
  }

  // Get OAuth providers for a specific user
  async getUserProviders(userId) {
    try {
      const user = await this.database.User.findById(userId)
      return user?.metadata?.providers || []
    } catch (error) {
      console.error('Failed to get user providers:', error)
      return []
    }
  }
}

module.exports = OAuthPlugin