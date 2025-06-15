// S3 Stats API Route
// routes/stats.js

module.exports = async function statsHandler(req, res, context) {
  try {
    // Get the plugin instance
    const plugin = context.plugin
    if (!plugin) {
      return {
        success: false,
        error: 'Plugin not available'
      }
    }

    // Check if S3 is enabled and configured
    if (!plugin.config || !plugin.config.enabled) {
      return {
        success: false,
        stats: {
          totalUploads: 0,
          totalSize: '0 MB',
          totalSizeMB: 0,
          lastUpload: null,
          isConnected: false,
          bucketName: '',
          region: '',
          enabled: false
        }
      }
    }

    if (!plugin.s3Client) {
      return {
        success: false,
        error: 'S3 client not initialized',
        stats: {
          totalUploads: 0,
          totalSize: '0 MB',
          totalSizeMB: 0,
          lastUpload: null,
          isConnected: false,
          bucketName: plugin.config.bucketName || '',
          region: plugin.config.region || '',
          enabled: plugin.config.enabled
        }
      }
    }

    console.log('📊 Processing stats request')

    try {
      // Get basic stats from plugin
      const basicStats = plugin.getStats()

      // Get more detailed stats from S3
      let detailedStats = {}
      
      try {
        // List all files to calculate accurate statistics
        const listResult = await plugin.listFiles('', 1000) // Limit to 1000 for performance
        
        if (listResult.success && listResult.files) {
          const files = listResult.files
          
          // Calculate detailed statistics
          const totalFiles = files.length
          const totalSize = files.reduce((sum, file) => sum + file.size, 0)
          const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)
          const totalSizeGB = (totalSize / 1024 / 1024 / 1024).toFixed(3)
          
          // Find most recent upload
          const sortedByDate = files.sort((a, b) => 
            new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
          )
          const lastUpload = sortedByDate[0]?.lastModified || null
          
          // Group by file types
          const fileTypes = {}
          const fileSizes = {}
          
          files.forEach(file => {
            const extension = file.key.split('.').pop()?.toLowerCase() || 'unknown'
            
            // Count by type
            if (!fileTypes[extension]) {
              fileTypes[extension] = { count: 0, size: 0 }
            }
            fileTypes[extension].count++
            fileTypes[extension].size += file.size
            
            // Group by size ranges
            const sizeMB = file.size / 1024 / 1024
            let sizeCategory
            if (sizeMB < 1) sizeCategory = 'small' // < 1MB
            else if (sizeMB < 10) sizeCategory = 'medium' // 1-10MB
            else if (sizeMB < 100) sizeCategory = 'large' // 10-100MB
            else sizeCategory = 'xlarge' // > 100MB
            
            if (!fileSizes[sizeCategory]) {
              fileSizes[sizeCategory] = { count: 0, size: 0 }
            }
            fileSizes[sizeCategory].count++
            fileSizes[sizeCategory].size += file.size
          })

          // Calculate upload trends (if we have date information)
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

          const uploadsToday = files.filter(file => 
            new Date(file.lastModified) >= today
          ).length

          const uploadsThisWeek = files.filter(file => 
            new Date(file.lastModified) >= thisWeek
          ).length

          const uploadsThisMonth = files.filter(file => 
            new Date(file.lastModified) >= thisMonth
          ).length

          detailedStats = {
            totalFiles,
            totalSize,
            totalSizeMB: parseFloat(totalSizeMB),
            totalSizeGB: parseFloat(totalSizeGB),
            lastUpload,
            fileTypes,
            fileSizes,
            trends: {
              today: uploadsToday,
              thisWeek: uploadsThisWeek,
              thisMonth: uploadsThisMonth
            }
          }
        }
      } catch (detailError) {
        console.warn('Could not get detailed stats:', detailError.message)
        // Continue with basic stats only
      }

      // Format size display
      const formatSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }

      // Combine basic and detailed stats
      const combinedStats = {
        // Basic stats from plugin
        totalUploads: detailedStats.totalFiles || basicStats.totalUploads || 0,
        totalSize: detailedStats.totalSize ? 
          formatSize(detailedStats.totalSize) : 
          basicStats.totalSize || '0 B',
        totalSizeMB: detailedStats.totalSizeMB || basicStats.totalSizeMB || 0,
        totalSizeGB: detailedStats.totalSizeGB || 0,
        lastUpload: detailedStats.lastUpload || basicStats.lastUpload,
        isConnected: basicStats.isConnected,
        bucketName: basicStats.bucketName,
        region: basicStats.region,
        enabled: plugin.config.enabled,
        
        // Detailed stats (if available)
        ...(detailedStats.fileTypes && {
          breakdown: {
            fileTypes: detailedStats.fileTypes,
            fileSizes: detailedStats.fileSizes,
            trends: detailedStats.trends
          }
        }),
        
        // Configuration info
        config: {
          maxFileSize: plugin.config.maxFileSize,
          allowedTypes: plugin.config.allowedTypes,
          publicRead: plugin.config.publicRead,
          folderStructure: plugin.config.folderStructure
        }
      }

      console.log('✅ Stats retrieved successfully:', {
        totalFiles: combinedStats.totalUploads,
        totalSizeMB: combinedStats.totalSizeMB,
        isConnected: combinedStats.isConnected
      })

      return {
        success: true,
        stats: combinedStats
      }

    } catch (statsError) {
      console.error('Stats error:', statsError)

      return {
        success: false,
        error: statsError.message || 'Failed to get statistics',
        stats: {
          totalUploads: 0,
          totalSize: '0 MB',
          totalSizeMB: 0,
          lastUpload: null,
          isConnected: false,
          bucketName: plugin.config.bucketName || '',
          region: plugin.config.region || '',
          enabled: plugin.config.enabled
        }
      }
    }

  } catch (error) {
    console.error('Stats handler error:', error)
    
    return {
      success: false,
      error: 'Internal server error while getting stats',
      stats: {
        totalUploads: 0,
        totalSize: '0 MB',
        totalSizeMB: 0,
        lastUpload: null,
        isConnected: false,
        bucketName: '',
        region: '',
        enabled: false
      }
    }
  }
}