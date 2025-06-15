// S3 List API Route
// routes/list.js

module.exports = async function listHandler(req, res, context) {
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
        error: 'S3 storage is not enabled'
      }
    }

    if (!plugin.s3Client) {
      return {
        success: false,
        error: 'S3 client not initialized'
      }
    }

    // Parse query parameters
    const prefix = req.query.prefix || ''
    const maxKeys = parseInt(req.query.limit) || 100
    const sort = req.query.sort || 'name' // 'name', 'date', 'size'
    const order = req.query.order || 'asc' // 'asc', 'desc'
    const search = req.query.search || ''

    console.log('📋 Processing file list request:', {
      prefix,
      maxKeys,
      sort,
      order,
      search
    })

    try {
      // List files from S3
      const listResult = await plugin.listFiles(prefix, maxKeys)

      if (!listResult.success) {
        return {
          success: false,
          error: listResult.error || 'List failed'
        }
      }

      let files = listResult.files || []

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase()
        files = files.filter(file => 
          file.key.toLowerCase().includes(searchLower)
        )
      }

      // Apply sorting
      files.sort((a, b) => {
        let aValue, bValue

        switch (sort) {
          case 'date':
            aValue = new Date(a.lastModified).getTime()
            bValue = new Date(b.lastModified).getTime()
            break
          case 'size':
            aValue = a.size
            bValue = b.size
            break
          case 'name':
          default:
            aValue = a.key.toLowerCase()
            bValue = b.key.toLowerCase()
            break
        }

        if (order === 'desc') {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        }
      })

      // Calculate summary statistics
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

      // Group files by type for additional insights
      const fileTypes = {}
      files.forEach(file => {
        const extension = file.key.split('.').pop()?.toLowerCase() || 'unknown'
        if (!fileTypes[extension]) {
          fileTypes[extension] = { count: 0, size: 0 }
        }
        fileTypes[extension].count++
        fileTypes[extension].size += file.size
      })

      console.log('✅ File list retrieved successfully:', {
        totalFiles: files.length,
        totalSizeMB: totalSizeMB,
        fileTypes: Object.keys(fileTypes).length
      })

      return {
        success: true,
        data: {
          files: files,
          pagination: {
            total: files.length,
            limit: maxKeys,
            hasMore: listResult.isTruncated,
            nextToken: listResult.nextContinuationToken
          },
          summary: {
            totalFiles: files.length,
            totalSize: totalSize,
            totalSizeMB: totalSizeMB,
            fileTypes: fileTypes
          },
          filters: {
            prefix,
            search,
            sort,
            order
          }
        }
      }

    } catch (listError) {
      console.error('S3 list error:', listError)

      // Handle specific S3 errors
      if (listError.code === 'AccessDenied') {
        return {
          success: false,
          error: 'Access denied to list files',
          statusCode: 403
        }
      }

      if (listError.code === 'NoSuchBucket') {
        return {
          success: false,
          error: 'Bucket not found',
          statusCode: 404
        }
      }

      return {
        success: false,
        error: listError.message || 'List failed',
        statusCode: 500
      }
    }

  } catch (error) {
    console.error('List handler error:', error)
    
    return {
      success: false,
      error: 'Internal server error during list',
      statusCode: 500
    }
  }
}