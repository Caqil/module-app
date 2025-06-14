class OAuthDatabase {
  constructor(database) {
    this.User = database.User
    this.Plugin = database.Plugin
    this.Settings = database.Settings
    this.db = database
  }

  async initialize() {
    // Create OAuth-specific indexes
    try {
      await this.User.collection.createIndex({ 'metadata.primaryProvider': 1 })
      await this.User.collection.createIndex({ 'metadata.providerId': 1 })
      await this.User.collection.createIndex({ 'metadata.providers': 1 })
      console.log('✅ OAuth Database: Indexes created')
    } catch (error) {
      console.error('❌ OAuth Database: Failed to create indexes:', error)
    }
  }

  async recordLoginAttempt(provider, email, success = false, error = null) {
    try {
      // This would store login attempts in a dedicated collection
      const event = {
        type: success ? 'login_success' : 'login_attempt',
        provider,
        email,
        success,
        error,
        timestamp: new Date(),
        ip: null // Could be extracted from request context
      }

      // In a real implementation, you'd store this in a dedicated collection
      console.log('OAuth Event:', event)
      
      return true
    } catch (error) {
      console.error('Failed to record OAuth login attempt:', error)
      return false
    }
  }

  async getOAuthStats() {
    try {
      // Get total OAuth users
      const totalOAuthUsers = await this.User.countDocuments({
        'metadata.primaryProvider': { $exists: true }
      })

      // Get OAuth logins today (would need events collection)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const oauthLoginsToday = await this.User.countDocuments({
        'metadata.primaryProvider': { $exists: true },
        lastLogin: { $gte: today }
      })

      // Get provider statistics
      const providerStats = await this.User.aggregate([
        { $match: { 'metadata.primaryProvider': { $exists: true } } },
        { $group: { _id: '$metadata.primaryProvider', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])

      const providerCounts = {}
      let popularProvider = 'None'
      
      providerStats.forEach(stat => {
        providerCounts[stat._id] = stat.count
        if (!popularProvider || providerCounts[stat._id] > (providerCounts[popularProvider] || 0)) {
          popularProvider = stat._id
        }
      })

      // Calculate conversion rate (OAuth users vs total users)
      const totalUsers = await this.User.countDocuments({})
      const conversionRate = totalUsers > 0 ? (totalOAuthUsers / totalUsers * 100) : 0

      return {
        totalOAuthUsers,
        oauthLoginsToday,
        popularProvider,
        conversionRate: Math.round(conversionRate * 10) / 10,
        providerCounts
      }
    } catch (error) {
      console.error('Failed to get OAuth stats:', error)
      return null
    }
  }

  async findUserByOAuth(provider, providerId) {
    return this.User.findOne({
      'metadata.primaryProvider': provider,
      'metadata.providerId': providerId
    })
  }

  async findUserByEmail(email) {
    return this.User.findOne({ email: email.toLowerCase() })
  }

  async createOAuthUser(userData) {
    const user = new this.User({
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      avatar: userData.avatar,
      role: userData.role || 'user',
      isActive: true,
      isEmailVerified: true, // OAuth emails are pre-verified
      metadata: {
        primaryProvider: userData.provider,
        providerId: userData.providerId,
        providers: [userData.provider]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return user.save()
  }

  async updateUserOAuthInfo(userId, provider, providerId) {
    return this.User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { 'metadata.providers': provider },
        $set: {
          'metadata.lastOAuthLogin': new Date(),
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      },
      { new: true }
    )
  }

  async getOAuthConfig() {
    const plugin = await this.Plugin.findOne({ pluginId: 'oauth-plugin' })
    return plugin?.config || {}
  }

  async updateOAuthConfig(config) {
    return this.Plugin.findOneAndUpdate(
      { pluginId: 'oauth-plugin' },
      { 
        $set: { 
          config,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    )
  }
}

module.exports = { OAuthDatabase }