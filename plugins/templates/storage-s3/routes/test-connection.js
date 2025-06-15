// S3 Test Connection API Route
// routes/test-connection.js

const AWS = require('aws-sdk')

module.exports = async function testConnectionHandler(req, res, context) {
  try {
    const { accessKey, secretKey, bucketName, region } = req.body

    console.log('🔍 Testing S3 connection:', {
      bucketName,
      region,
      hasAccessKey: !!accessKey,
      hasSecretKey: !!secretKey
    })

    // Validate required parameters
    if (!accessKey || !secretKey || !bucketName) {
      return {
        success: false,
        error: 'Access Key, Secret Key, and Bucket Name are required'
      }
    }

    if (!region) {
      return {
        success: false,
        error: 'AWS Region is required'
      }
    }

    try {
      // Create temporary S3 client with provided credentials
      const tempS3 = new AWS.S3({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: region,
        apiVersion: '2006-03-01'
      })

      console.log('🔧 Created temporary S3 client for testing')

      // Test 1: Check if bucket exists and is accessible
      const bucketParams = {
        Bucket: bucketName
      }

      console.log('🏪 Testing bucket access...')
      await tempS3.headBucket(bucketParams).promise()
      console.log('✅ Bucket access test passed')

      // Test 2: Check bucket location
      let bucketRegion
      try {
        const locationResult = await tempS3.getBucketLocation(bucketParams).promise()
        bucketRegion = locationResult.LocationConstraint || 'us-east-1'
        console.log('📍 Bucket region detected:', bucketRegion)
      } catch (locationError) {
        console.warn('⚠️ Could not determine bucket region:', locationError.message)
        bucketRegion = region // Use provided region as fallback
      }

      // Test 3: Check permissions by listing objects (limited)
      let hasListPermission = false
      try {
        const listParams = {
          Bucket: bucketName,
          MaxKeys: 1
        }
        await tempS3.listObjectsV2(listParams).promise()
        hasListPermission = true
        console.log('✅ List objects permission test passed')
      } catch (listError) {
        console.warn('⚠️ List objects permission test failed:', listError.message)
      }

      // Test 4: Check write permissions by attempting to put a small test object
      let hasWritePermission = false
      const testKey = `test-connection-${Date.now()}.txt`
      
      try {
        const putParams = {
          Bucket: bucketName,
          Key: testKey,
          Body: 'S3 Storage Plugin Connection Test',
          ContentType: 'text/plain'
        }
        
        await tempS3.putObject(putParams).promise()
        hasWritePermission = true
        console.log('✅ Write permission test passed')
        
        // Clean up test object
        try {
          await tempS3.deleteObject({
            Bucket: bucketName,
            Key: testKey
          }).promise()
          console.log('🧹 Test object cleaned up')
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up test object:', cleanupError.message)
        }
        
      } catch (writeError) {
        console.warn('⚠️ Write permission test failed:', writeError.message)
      }

      // Compile test results
      const testResults = {
        bucketExists: true,
        bucketRegion: bucketRegion,
        canList: hasListPermission,
        canWrite: hasWritePermission,
        regionMatch: bucketRegion === region || bucketRegion === 'us-east-1' && region === 'us-east-1'
      }

      // Determine overall success
      const isFullySuccessful = testResults.bucketExists && 
                               testResults.canList && 
                               testResults.canWrite

      // Generate recommendations
      const recommendations = []
      
      if (!testResults.canList) {
        recommendations.push('Grant s3:ListBucket permission for better file management')
      }
      
      if (!testResults.canWrite) {
        recommendations.push('Grant s3:PutObject and s3:DeleteObject permissions for file uploads')
      }
      
      if (!testResults.regionMatch) {
        recommendations.push(`Bucket is in ${bucketRegion}, but you specified ${region}. Consider updating the region setting.`)
      }

      if (isFullySuccessful) {
        recommendations.push('All tests passed! Your S3 configuration is ready to use.')
      }

      console.log('✅ S3 connection test completed:', {
        success: isFullySuccessful,
        warnings: recommendations.length > 0,
        testResults
      })

      return {
        success: true,
        message: isFullySuccessful ? 
          'Connection test successful! All permissions verified.' :
          'Connection test completed with some limitations.',
        data: {
          connectionStatus: isFullySuccessful ? 'fully_functional' : 'limited_functionality',
          testResults,
          recommendations,
          testedAt: new Date().toISOString()
        }
      }

    } catch (connectionError) {
      console.error('❌ S3 connection test failed:', connectionError)

      // Parse AWS error codes for better user messages
      let userFriendlyError = connectionError.message
      let statusCode = 500

      switch (connectionError.code) {
        case 'InvalidAccessKeyId':
          userFriendlyError = 'Invalid Access Key ID. Please check your AWS credentials.'
          statusCode = 401
          break
        case 'SignatureDoesNotMatch':
          userFriendlyError = 'Invalid Secret Access Key. Please check your AWS credentials.'
          statusCode = 401
          break
        case 'NoSuchBucket':
          userFriendlyError = `Bucket "${bucketName}" does not exist or is not accessible.`
          statusCode = 404
          break
        case 'AccessDenied':
          userFriendlyError = `Access denied to bucket "${bucketName}". Check your permissions.`
          statusCode = 403
          break
        case 'Forbidden':
          userFriendlyError = 'Access forbidden. Check your AWS permissions and bucket policy.'
          statusCode = 403
          break
        case 'InvalidLocationConstraint':
          userFriendlyError = `Invalid region "${region}" for bucket "${bucketName}".`
          statusCode = 400
          break
        case 'NetworkError':
        case 'TimeoutError':
          userFriendlyError = 'Network error. Please check your internet connection and try again.'
          statusCode = 503
          break
        default:
          if (connectionError.message.includes('getaddrinfo ENOTFOUND')) {
            userFriendlyError = 'Network connection failed. Please check your internet connection.'
            statusCode = 503
          }
          break
      }

      return {
        success: false,
        error: userFriendlyError,
        statusCode: statusCode,
        data: {
          connectionStatus: 'failed',
          errorCode: connectionError.code,
          errorDetails: connectionError.message,
          testedAt: new Date().toISOString(),
          troubleshooting: [
            'Verify your AWS Access Key ID and Secret Access Key',
            'Ensure the bucket name is correct and exists',
            'Check that the bucket is in the specified region',
            'Verify your AWS user has the necessary S3 permissions',
            'Check your internet connection'
          ]
        }
      }
    }

  } catch (error) {
    console.error('Test connection handler error:', error)
    
    return {
      success: false,
      error: 'Internal server error during connection test',
      statusCode: 500
    }
  }
}