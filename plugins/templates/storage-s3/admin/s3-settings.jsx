// S3 Settings Admin Page
// admin/s3-settings.jsx

import React, { useState, useEffect } from 'react'

export default function S3Settings() {
  const [config, setConfig] = useState({
    enabled: false,
    accessKey: '',
    secretKey: '',
    bucketName: '',
    region: 'us-east-1',
    publicRead: false,
    maxFileSize: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    folderStructure: 'uploads/{year}/{month}'
  })
  
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [showSecretKey, setShowSecretKey] = useState(false)

  const regions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU (Ireland)' },
    { value: 'eu-west-2', label: 'EU (London)' },
    { value: 'eu-central-1', label: 'EU (Frankfurt)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' }
  ]

  const fileTypes = [
    { value: 'image/jpeg', label: 'JPEG Images' },
    { value: 'image/png', label: 'PNG Images' },
    { value: 'image/gif', label: 'GIF Images' },
    { value: 'application/pdf', label: 'PDF Documents' },
    { value: 'application/msword', label: 'Word Documents' },
    { value: 'text/plain', label: 'Text Files' },
    { value: 'video/mp4', label: 'Video MP4' },
    { value: 'audio/mpeg', label: 'Audio MP3' }
  ]

  useEffect(() => {
    loadConfig()
  }, [])

  const showMessage = (text, type = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plugin-routes/s3/config')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
      } else {
        showMessage(data.error || 'Failed to load configuration', 'error')
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      showMessage('Failed to load configuration', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/plugin-routes/s3/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })
      
      const data = await response.json()
      
      if (data.success) {
        showMessage('Settings saved successfully!', 'success')
        setConnectionStatus(null) // Reset connection status
      } else {
        showMessage(data.error || 'Failed to save settings', 'error')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      showMessage('Failed to save settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    if (!config.accessKey || !config.secretKey || !config.bucketName) {
      showMessage('Please fill in all required fields before testing connection', 'error')
      return
    }

    try {
      setTesting(true)
      setConnectionStatus(null)
      
      const response = await fetch('/api/plugin-routes/s3/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessKey: config.accessKey,
          secretKey: config.secretKey,
          bucketName: config.bucketName,
          region: config.region
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setConnectionStatus('success')
        showMessage('Connection test successful!', 'success')
      } else {
        setConnectionStatus('error')
        showMessage(data.error || 'Connection test failed', 'error')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
      showMessage('Connection test failed', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Reset connection status when credentials change
    if (['accessKey', 'secretKey', 'bucketName', 'region'].includes(key)) {
      setConnectionStatus(null)
    }
  }

  const handleFileTypeChange = (type, checked) => {
    setConfig(prev => ({
      ...prev,
      allowedTypes: checked
        ? [...prev.allowedTypes, type]
        : prev.allowedTypes.filter(t => t !== type)
    }))
  }

  const generateFolderPreview = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return config.folderStructure
      .replace('{year}', year)
      .replace('{month}', month)
      .replace('{day}', day)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">S3 Storage Settings</h1>
        <p className="text-gray-600">Configure your AWS S3 storage connection and preferences</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          messageType === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      {loading && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="font-medium text-gray-900">Enable S3 Storage</span>
              </label>
            </div>

            {config.enabled && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ⚠️ S3 storage is enabled. Make sure to configure your AWS credentials below.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AWS Credentials */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">AWS Credentials</h2>
            {connectionStatus && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                connectionStatus === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {connectionStatus === 'success' ? '✅ Connected' : '❌ Connection Failed'}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Key ID *
              </label>
              <input
                type="text"
                value={config.accessKey}
                onChange={(e) => handleConfigChange('accessKey', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Access Key *
              </label>
              <div className="relative">
                <input
                  type={showSecretKey ? "text" : "password"}
                  value={config.secretKey}
                  onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showSecretKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bucket Name *
              </label>
              <input
                type="text"
                value={config.bucketName}
                onChange={(e) => handleConfigChange('bucketName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="my-storage-bucket"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AWS Region *
              </label>
              <select
                value={config.region}
                onChange={(e) => handleConfigChange('region', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {regions.map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={testConnection}
              disabled={testing || !config.accessKey || !config.secretKey || !config.bucketName}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Testing Connection...
                </>
              ) : (
                <>
                  🔍 Test Connection
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Settings</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.publicRead}
                  onChange={(e) => handleConfigChange('publicRead', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="font-medium text-gray-900">Allow Public Read Access</span>
              </label>
              <div className="text-sm text-gray-500">
                Files will be publicly accessible via direct URL
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum File Size (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.maxFileSize}
                  onChange={(e) => handleConfigChange('maxFileSize', parseInt(e.target.value) || 10)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder Structure
                </label>
                <input
                  type="text"
                  value={config.folderStructure}
                  onChange={(e) => handleConfigChange('folderStructure', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="uploads/{year}/{month}"
                />
                <div className="mt-1 text-sm text-gray-500">
                  Preview: {generateFolderPreview()}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Available variables: {'{year}'}, {'{month}'}, {'{day}'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Allowed File Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fileTypes.map(type => (
                  <label key={type.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.allowedTypes.includes(type.value)}
                      onChange={(e) => handleFileTypeChange(type.value, e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Environment Variables Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            💡 Environment Variables
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            For security, you can also configure S3 settings using environment variables:
          </p>
          <div className="bg-yellow-100 p-3 rounded-lg font-mono text-sm">
            <div>AWS_ACCESS_KEY_ID=your_access_key</div>
            <div>AWS_SECRET_ACCESS_KEY=your_secret_key</div>
            <div>S3_BUCKET_NAME=your_bucket_name</div>
            <div>AWS_REGION=us-east-1</div>
            <div>S3_ENABLED=true</div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={loadConfig}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>
          
          <button
            onClick={saveConfig}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                💾 Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}