// S3 Delete API Route
// routes/delete.js

module.exports = async function deleteHandler(req, res, context) {
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

    console.log('🗑️ Processing file deletion:', fileKey)

    try {
      // Delete file from S3
      const deleteResult = await plugin.deleteFile(fileKey)

      if (!deleteResult.success) {
        return {
          success: false,
          error: deleteResult.error || 'Delete failed'
        }
      }

      // Emit delete event
      plugin.emit('file:deleted', {
        key: fileKey,
        deletedAt: new Date().toISOString()
      })

      console.log('✅ File deleted successfully:', fileKey)

      return {
        success: true,
        data: {
          key: fileKey,
          deletedAt: new Date().toISOString()
        },
        message: 'File deleted successfully'
      }

    } catch (deleteError) {
      console.error('S3 delete error:', deleteError)

      // Handle specific S3 errors
      if (deleteError.code === 'NoSuchKey') {
        return {
          success: false,
          error: 'File not found',
          statusCode: 404
        }
      }

      if (deleteError.code === 'AccessDenied') {
        return {
          success: false,
          error: 'Access denied to delete file',
          statusCode: 403
        }
      }

      return {
        success: false,
        error: deleteError.message || 'Delete failed',
        statusCode: 500
      }
    }

  } catch (error) {
    console.error('Delete handler error:', error)
    
    return {
      success: false,
      error: 'Internal server error during delete',
      statusCode: 500
    }
  }
}