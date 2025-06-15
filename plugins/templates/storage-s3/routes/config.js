// S3 Config API Route
// routes/config.js

module.exports = {
  // GET /s3/config - Get current S3 configuration
  async GET(req, res, context) {
    try {
      // Get the plugin instance
      const plugin = context.plugin
      if (!plugin) {
        return {
          success: false,
          error: 'Plugin not available'
        }
      }

      console.log('📋 Getting S3 configuration')

      // Return current configuration (without sensitive data)
      const safeConfig = {
        enabled: plugin.config?.enabled || false,
        bucketName: plugin.config?.bucketName || '',
        region: plugin.config?.region || 'us-east-1',
        publicRead: plugin.config?.publicRead || false,
        maxFileSize: plugin.config?.maxFileSize || 10,
        allowedTypes: plugin.config?.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        folderStructure: plugin.config?.folderStructure || 'uploads/{year}/{month}',
        // Don't return sensitive credentials
        accessKey: plugin.config?.accessKey ? '***' : '',
        secretKey: plugin.config?.secretKey ? '***' : ''
      }

      return {
        success: true,
        config: safeConfig
      }

    } catch (error) {
      console.error('Config GET error:', error)
      
      return {
        success: false,
        error: 'Failed to get configuration'
      }
    }
  },

  // PUT /s3/config - Update S3 configuration
  async PUT(req, res, context) {
    try {
      // Get the plugin instance
      const plugin = context.plugin
      if (!plugin) {
        return {
          success: false,
          error: 'Plugin not available'
        }
      }

      const newConfig = req.body
      console.log('💾 Updating S3 configuration:', {
        enabled: newConfig.enabled,
        bucketName: newConfig.bucketName,
        region: newConfig.region,
        publicRead: newConfig.publicRead,
        maxFileSize: newConfig.maxFileSize
      })

      // Validate required fields if enabling S3
      if (newConfig.enabled) {
        if (!newConfig.accessKey || !newConfig.secretKey || !newConfig.bucketName) {
          return {
            success: false,
            error: 'Access Key, Secret Key, and Bucket Name are required when S3 is enabled'
          }
        }
      }

      // Validate file size limits
      if (newConfig.maxFileSize && (newConfig.maxFileSize < 1 || newConfig.maxFileSize > 100)) {
        return {
          success: false,
          error: 'Maximum file size must be between 1 and 100 MB'
        }
      }

      // Validate region
      const validRegions = [
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-central-1',
        'ap-northeast-1', 'ap-southeast-1', 'ap-southeast-2'
      ]
      
      if (newConfig.region && !validRegions.includes(newConfig.region)) {
        return {
          success: false,
          error: 'Invalid AWS region'
        }
      }

      // Validate folder structure
      if (newConfig.folderStructure && !/^[a-zA-Z0-9\/\-_{}\s]*$/.test(newConfig.folderStructure)) {
        return {
          success: false,
          error: 'Invalid folder structure format'
        }
      }

      // Update plugin configuration
      const updatedConfig = {
        enabled: Boolean(newConfig.enabled),
        accessKey: newConfig.accessKey || plugin.config?.accessKey || '',
        secretKey: newConfig.secretKey || plugin.config?.secretKey || '',
        bucketName: newConfig.bucketName || '',
        region: newConfig.region || 'us-east-1',
        publicRead: Boolean(newConfig.publicRead),
        maxFileSize: parseInt(newConfig.maxFileSize) || 10,
        allowedTypes: Array.isArray(newConfig.allowedTypes) ? 
          newConfig.allowedTypes : 
          ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        folderStructure: newConfig.folderStructure || 'uploads/{year}/{month}'
      }

      // Update plugin's configuration
      plugin.config = updatedConfig

      // If S3 is being enabled, reinitialize the client
      if (updatedConfig.enabled) {
        try {
          await plugin.initializeS3Client()
          
          // Test the connection with new config
          await plugin.testConnection()
          
          console.log('✅ S3 client reinitialized with new configuration')
        } catch (initError) {
          console.error('❌ Failed to initialize S3 with new config:', initError)
          
          return {
            success: false,
            error: `Configuration saved but S3 initialization failed: ${initError.message}`
          }
        }
      } else {
        // If disabling S3, clear the client
        plugin.s3Client = null
        console.log('🔇 S3 storage disabled')
      }

      // In a real implementation, you would save this configuration to a database
      // For now, we're just keeping it in memory
      console.log('✅ S3 configuration updated successfully')

      // Return success with safe config (no sensitive data)
      const safeConfig = {
        enabled: updatedConfig.enabled,
        bucketName: updatedConfig.bucketName,
        region: updatedConfig.region,
        publicRead: updatedConfig.publicRead,
        maxFileSize: updatedConfig.maxFileSize,
        allowedTypes: updatedConfig.allowedTypes,
        folderStructure: updatedConfig.folderStructure,
        accessKey: updatedConfig.accessKey ? '***' : '',
        secretKey: updatedConfig.secretKey ? '***' : ''
      }

      return {
        success: true,
        config: safeConfig,
        message: 'Configuration updated successfully'
      }

    } catch (error) {
      console.error('Config PUT error:', error)
      
      return {
        success: false,
        error: 'Failed to update configuration: ' + error.message
      }
    }
  }
}