// S3 Storage Plugin - Main File
// index.js

const AWS = require('aws-sdk')
const fs = require('fs').promises
const path = require('path')
const mime = require('mime-types')

module.exports = {
  name: 'S3 Storage Manager',
  version: '1.0.0',
  s3Client: null,
  config: null,
  uploadStats: {
    totalUploads: 0,
    totalSize: 0,
    lastUpload: null
  },

  /**
   * Initialize the S3 Storage plugin
   */
  async init() {
    console.log('☁️ S3 Storage Manager initializing...')
    
    try {
      await this.loadConfiguration()
      
      if (this.config.enabled) {
        await this.initializeS3Client()
        await this.loadStats()
        this.setupEventListeners()
        console.log('✅ S3 Storage Manager initialized successfully')
      } else {
        console.log('⚠️ S3 Storage Manager disabled in configuration')
      }
    } catch (error) {
      console.error('❌ S3 Storage Manager initialization failed:', error)
      throw error
    }
  },

  /**
   * Activate the plugin
   */
  async activate() {
    console.log('🚀 S3 Storage Manager activating...')
    
    try {
      await this.init()
      
      if (this.config.enabled) {
        await this.testConnection()
        this.startServices()
        console.log('✅ S3 Storage Manager activated successfully')
      }
      
      return true
    } catch (error) {
      console.error('❌ S3 Storage Manager activation failed:', error)
      return false
    }
  },

  /**
   * Deactivate the plugin
   */
  async deactivate() {
    console.log('⏹️ S3 Storage Manager deactivating...')
    
    try {
      this.stopServices()
      this.s3Client = null
      console.log('✅ S3 Storage Manager deactivated successfully')
      return true
    } catch (error) {
      console.error('❌ S3 Storage Manager deactivation failed:', error)
      return false
    }
  },

  /**
   * Load plugin configuration
   */
  async loadConfiguration() {
    this.config = {
      enabled: process.env.S3_ENABLED === 'true' || false,
      accessKey: process.env.AWS_ACCESS_KEY_ID || '',
      secretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      bucketName: process.env.S3_BUCKET_NAME || '',
      region: process.env.AWS_REGION || 'us-east-1',
      publicRead: process.env.S3_PUBLIC_READ === 'true' || false,
      maxFileSize: parseInt(process.env.S3_MAX_FILE_SIZE) || 10,
      allowedTypes: process.env.S3_ALLOWED_TYPES ? 
        process.env.S3_ALLOWED_TYPES.split(',') : 
        ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      folderStructure: process.env.S3_FOLDER_STRUCTURE || 'uploads/{year}/{month}'
    }
    
    console.log('📋 S3 Configuration loaded:', {
      enabled: this.config.enabled,
      bucket: this.config.bucketName,
      region: this.config.region,
      publicRead: this.config.publicRead
    })
  },

  /**
   * Initialize AWS S3 client
   */
  async initializeS3Client() {
    if (!this.config.accessKey || !this.config.secretKey || !this.config.bucketName) {
      throw new Error('Missing required S3 configuration: accessKey, secretKey, and bucketName are required')
    }

    AWS.config.update({
      accessKeyId: this.config.accessKey,
      secretAccessKey: this.config.secretKey,
      region: this.config.region
    })

    this.s3Client = new AWS.S3({
      apiVersion: '2006-03-01',
      region: this.config.region
    })

    console.log('🔧 S3 Client initialized for region:', this.config.region)
  },

  /**
   * Test S3 connection
   */
  async testConnection() {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }

    try {
      const params = {
        Bucket: this.config.bucketName
      }
      
      await this.s3Client.headBucket(params).promise()
      console.log('✅ S3 connection test successful')
      return { success: true, message: 'Connection successful' }
    } catch (error) {
      console.error('❌ S3 connection test failed:', error)
      throw new Error(`S3 connection failed: ${error.message}`)
    }
  },

  /**
   * Upload file to S3
   */
  async uploadFile(fileBuffer, fileName, contentType, options = {}) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }

    try {
      // Generate folder path based on structure
      const folderPath = this.generateFolderPath()
      const key = `${folderPath}/${fileName}`

      // Prepare upload parameters
      const uploadParams = {
        Bucket: this.config.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType || mime.lookup(fileName) || 'application/octet-stream',
        ...options
      }

      // Set ACL based on public read setting
      if (this.config.publicRead) {
        uploadParams.ACL = 'public-read'
      }

      // Upload to S3
      const result = await this.s3Client.upload(uploadParams).promise()

      // Update statistics
      this.updateStats(fileBuffer.length)

      console.log('✅ File uploaded successfully:', key)
      
      return {
        success: true,
        key: key,
        url: result.Location,
        bucket: this.config.bucketName,
        size: fileBuffer.length,
        contentType: uploadParams.ContentType
      }
    } catch (error) {
      console.error('❌ File upload failed:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }
  },

  /**
   * Download file from S3
   */
  async downloadFile(key) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }

    try {
      const params = {
        Bucket: this.config.bucketName,
        Key: key
      }

      const result = await this.s3Client.getObject(params).promise()
      
      console.log('✅ File downloaded successfully:', key)
      
      return {
        success: true,
        data: result.Body,
        contentType: result.ContentType,
        size: result.ContentLength,
        lastModified: result.LastModified
      }
    } catch (error) {
      console.error('❌ File download failed:', error)
      throw new Error(`Download failed: ${error.message}`)
    }
  },

  /**
   * Delete file from S3
   */
  async deleteFile(key) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }

    try {
      const params = {
        Bucket: this.config.bucketName,
        Key: key
      }

      await this.s3Client.deleteObject(params).promise()
      
      console.log('✅ File deleted successfully:', key)
      return { success: true, key }
    } catch (error) {
      console.error('❌ File deletion failed:', error)
      throw new Error(`Delete failed: ${error.message}`)
    }
  },

  /**
   * List files in S3 bucket
   */
  async listFiles(prefix = '', maxKeys = 100) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }

    try {
      const params = {
        Bucket: this.config.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      }

      const result = await this.s3Client.listObjectsV2(params).promise()
      
      const files = result.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: this.config.publicRead ? 
          `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${item.Key}` : 
          null
      }))

      console.log(`✅ Listed ${files.length} files from S3`)
      
      return {
        success: true,
        files,
        isTruncated: result.IsTruncated,
        nextContinuationToken: result.NextContinuationToken
      }
    } catch (error) {
      console.error('❌ File listing failed:', error)
      throw new Error(`List failed: ${error.message}`)
    }
  },

  /**
   * Get file URL (signed URL for private files)
   */
  async getFileUrl(key, expiresIn = 3600) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }

    try {
      if (this.config.publicRead) {
        // Return public URL
        return `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`
      } else {
        // Generate signed URL
        const params = {
          Bucket: this.config.bucketName,
          Key: key,
          Expires: expiresIn
        }

        const url = this.s3Client.getSignedUrl('getObject', params)
        return url
      }
    } catch (error) {
      console.error('❌ URL generation failed:', error)
      throw new Error(`URL generation failed: ${error.message}`)
    }
  },

  /**
   * Generate folder path based on structure pattern
   */
  generateFolderPath() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return this.config.folderStructure
      .replace('{year}', year)
      .replace('{month}', month)
      .replace('{day}', day)
  },

  /**
   * Validate file before upload
   */
  validateFile(fileName, fileSize, contentType) {
    const errors = []

    // Check file size
    const maxSizeBytes = this.config.maxFileSize * 1024 * 1024
    if (fileSize > maxSizeBytes) {
      errors.push(`File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${this.config.maxFileSize}MB)`)
    }

    // Check file type
    if (this.config.allowedTypes.length > 0 && !this.config.allowedTypes.includes(contentType)) {
      errors.push(`File type ${contentType} is not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Update upload statistics
   */
  updateStats(fileSize) {
    this.uploadStats.totalUploads++
    this.uploadStats.totalSize += fileSize
    this.uploadStats.lastUpload = new Date()
  },

  /**
   * Load statistics from storage
   */
  async loadStats() {
    try {
      // In a real implementation, you'd load this from a database
      this.uploadStats = {
        totalUploads: 0,
        totalSize: 0,
        lastUpload: null
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  },

  /**
   * Get current statistics
   */
  getStats() {
    return {
      totalUploads: this.uploadStats.totalUploads,
      totalSize: this.uploadStats.totalSize,
      totalSizeMB: (this.uploadStats.totalSize / 1024 / 1024).toFixed(2),
      lastUpload: this.uploadStats.lastUpload,
      isConnected: !!this.s3Client,
      bucketName: this.config.bucketName,
      region: this.config.region
    }
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for file upload events
    this.on('file:uploaded', this.handleFileUploaded.bind(this))
    this.on('file:deleted', this.handleFileDeleted.bind(this))
  },

  /**
   * Handle file uploaded event
   */
  handleFileUploaded(data) {
    console.log('📁 File uploaded event:', data.key)
    // Additional processing if needed
  },

  /**
   * Handle file deleted event
   */
  handleFileDeleted(data) {
    console.log('🗑️ File deleted event:', data.key)
    // Additional processing if needed
  },

  /**
   * Start plugin services
   */
  startServices() {
    console.log('🔧 Starting S3 Storage services...')
    // Start any background services if needed
  },

  /**
   * Stop plugin services
   */
  stopServices() {
    console.log('🛑 Stopping S3 Storage services...')
    // Stop any background services
  },

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up S3 Storage resources...')
    this.s3Client = null
    this.config = null
  }
}