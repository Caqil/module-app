// S3 Upload API Route
// routes/upload.js

const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Basic file validation - more validation happens in the main plugin
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'video/mp4', 'audio/mpeg'
    ]
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false)
    }
  }
}).single('file')

module.exports = async function uploadHandler(req, res, context) {
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
        error: 'S3 client not initialized. Please check your configuration.'
      }
    }

    // Handle file upload with multer
    return new Promise((resolve) => {
      upload(req, res, async (err) => {
        if (err) {
          console.error('Multer upload error:', err)
          
          if (err.code === 'LIMIT_FILE_SIZE') {
            return resolve({
              success: false,
              error: `File too large. Maximum size is ${plugin.config.maxFileSize}MB`
            })
          }
          
          return resolve({
            success: false,
            error: err.message || 'File upload failed'
          })
        }

        if (!req.file) {
          return resolve({
            success: false,
            error: 'No file provided'
          })
        }

        try {
          const file = req.file
          const folder = req.body.folder || ''

          console.log('📁 Processing file upload:', {
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            folder: folder
          })

          // Validate file with plugin's validation
          const validation = plugin.validateFile(
            file.originalname,
            file.size,
            file.mimetype
          )

          if (!validation.isValid) {
            return resolve({
              success: false,
              error: validation.errors.join(', ')
            })
          }

          // Generate unique filename
          const fileExtension = path.extname(file.originalname)
          const baseName = path.basename(file.originalname, fileExtension)
          const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_')
          const uniqueId = uuidv4().split('-')[0]
          const fileName = `${sanitizedBaseName}_${uniqueId}${fileExtension}`

          // Upload to S3
          const uploadResult = await plugin.uploadFile(
            file.buffer,
            folder ? `${folder}/${fileName}` : fileName,
            file.mimetype,
            {
              Metadata: {
                'original-name': file.originalname,
                'upload-time': new Date().toISOString(),
                'user-agent': req.headers['user-agent'] || 'unknown'
              }
            }
          )

          if (!uploadResult.success) {
            return resolve({
              success: false,
              error: uploadResult.error || 'Upload failed'
            })
          }

          // Emit upload event
          plugin.emit('file:uploaded', {
            key: uploadResult.key,
            originalName: file.originalname,
            size: file.size,
            contentType: file.mimetype,
            url: uploadResult.url
          })

          console.log('✅ File uploaded successfully:', uploadResult.key)

          resolve({
            success: true,
            data: {
              key: uploadResult.key,
              url: uploadResult.url,
              size: file.size,
              contentType: file.mimetype,
              originalName: file.originalname,
              bucket: uploadResult.bucket
            },
            message: 'File uploaded successfully'
          })

        } catch (uploadError) {
          console.error('S3 upload error:', uploadError)
          
          resolve({
            success: false,
            error: uploadError.message || 'Upload to S3 failed'
          })
        }
      })
    })

  } catch (error) {
    console.error('Upload handler error:', error)
    
    return {
      success: false,
      error: 'Internal server error during upload'
    }
  }
}