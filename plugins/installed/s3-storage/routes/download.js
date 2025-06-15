// S3 Download API Route
// routes/download.js

module.exports = async function downloadHandler(req, res, context) {
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

    // Get file key from URL parameter
    const fileKey = decodeURIComponent(req.params.key)
    if (!fileKey) {
      return {
        success: false,
        error: 'File key is required'
      }
    }

    console.log('📥 Processing file download:', fileKey)

    try {
      // Download file from S3
      const downloadResult = await plugin.downloadFile(fileKey)

      if (!downloadResult.success) {
        return {
          success: false,
          error: downloadResult.error || 'Download failed'
        }
      }

      // Get filename from key (last part after /)
      const fileName = fileKey.split('/').pop() || 'download'

      // Set appropriate headers for file download
      const headers = {
        'Content-Type': downloadResult.contentType || 'application/octet-stream',
        'Content-Length': downloadResult.size,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache'
      }

      // Log download activity
      console.log('✅ File download successful:', {
        key: fileKey,
        size: downloadResult.size,
        contentType: downloadResult.contentType
      })

      // Return the file data with headers
      // Note: In a real implementation, you might want to stream large files
      return {
        success: true,
        data: downloadResult.data,
        headers: headers,
        isFile: true // Indicates this response contains file data
      }

    } catch (downloadError) {
      console.error('S3 download error:', downloadError)

      // Handle specific S3 errors
      if (downloadError.code === 'NoSuchKey') {
        return {
          success: false,
          error: 'File not found',
          statusCode: 404
        }
      }

      if (downloadError.code === 'AccessDenied') {
        return {
          success: false,
          error: 'Access denied to file',
          statusCode: 403
        }
      }

      return {
        success: false,
        error: downloadError.message || 'Download failed',
        statusCode: 500
      }
    }

  } catch (error) {
    console.error('Download handler error:', error)
    
    return {
      success: false,
      error: 'Internal server error during download',
      statusCode: 500
    }
  }
}