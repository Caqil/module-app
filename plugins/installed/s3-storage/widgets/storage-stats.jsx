// S3 Storage Stats Dashboard Widget
// widgets/storage-stats.jsx

import React, { useState, useEffect } from 'react'

export default function S3StorageStats() {
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalSize: '0 MB',
    totalSizeMB: 0,
    lastUpload: null,
    isConnected: false,
    bucketName: '',
    region: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      setError(null)
      const response = await fetch('/api/plugin-routes/s3/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      } else {
        setError(data.error || 'Failed to load stats')
      }
    } catch (error) {
      console.error('Failed to load S3 stats:', error)
      setError('Failed to load storage statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatLastUpload = (dateString) => {
    if (!dateString) return 'No uploads yet'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getStorageUsageColor = () => {
    const sizeMB = parseFloat(stats.totalSizeMB) || 0
    if (sizeMB < 100) return 'text-green-600'
    if (sizeMB < 500) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConnectionStatusColor = () => {
    return stats.isConnected ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md h-48">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          ☁️ S3 Storage
        </h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-red-500 text-2xl mb-2">⚠️</div>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={loadStats}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          ☁️ S3 Storage
        </h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          stats.isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {stats.isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* Storage Usage */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Storage Used</span>
          <span className={`font-semibold ${getStorageUsageColor()}`}>
            {stats.totalSize}
          </span>
        </div>
        
        {/* Total Files */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Files</span>
          <span className="font-semibold text-blue-600">
            {stats.totalUploads.toLocaleString()}
          </span>
        </div>
        
        {/* Last Upload */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Last Upload</span>
          <span className="text-sm font-medium text-gray-900">
            {formatLastUpload(stats.lastUpload)}
          </span>
        </div>
        
        {/* Bucket Info */}
        {stats.bucketName && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Bucket</span>
              <span className="text-xs font-mono text-gray-700">
                {stats.bucketName}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Region</span>
              <span className="text-xs font-mono text-gray-700">
                {stats.region}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
        <button 
          onClick={loadStats}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          🔄 Refresh
        </button>
        
        <a
          href="/admin/s3-storage"
          className="text-xs text-gray-600 hover:text-gray-800"
        >
          Manage Files →
        </a>
      </div>
    </div>
  )
}