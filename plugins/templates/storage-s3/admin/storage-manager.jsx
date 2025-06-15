// S3 Storage Manager Admin Page
// admin/storage-manager.jsx

import React, { useState, useEffect } from 'react'

export default function S3StorageManager() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFolder, setCurrentFolder] = useState('')
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: '0 MB',
    lastUpload: null
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')

  useEffect(() => {
    loadFiles()
    loadStats()
  }, [currentFolder])

  const showMessage = (text, type = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/plugin-routes/s3/list?prefix=${currentFolder}`)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files || [])
      } else {
        showMessage(data.error || 'Failed to load files', 'error')
      }
    } catch (error) {
      console.error('Failed to load files:', error)
      showMessage('Failed to load files', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/plugin-routes/s3/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleFileUpload = async (event) => {
    const uploadFiles = Array.from(event.target.files)
    if (uploadFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', currentFolder)

        const response = await fetch('/api/plugin-routes/s3/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed')
        }

        setUploadProgress(((i + 1) / uploadFiles.length) * 100)
      }

      showMessage(`Successfully uploaded ${uploadFiles.length} file(s)`, 'success')
      await loadFiles()
      await loadStats()
      
      // Clear file input
      event.target.value = ''
      
    } catch (error) {
      console.error('Upload failed:', error)
      showMessage(error.message, 'error')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteFile = async (fileKey) => {
    if (!confirm(`Are you sure you want to delete "${fileKey}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/plugin-routes/s3/delete/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        showMessage('File deleted successfully', 'success')
        await loadFiles()
        await loadStats()
      } else {
        showMessage(result.error || 'Delete failed', 'error')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      showMessage('Delete failed', 'error')
    }
  }

  const deleteSelectedFiles = async () => {
    if (selectedFiles.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} selected file(s)?`)) {
      return
    }

    try {
      for (const fileKey of selectedFiles) {
        await fetch(`/api/plugin-routes/s3/delete/${encodeURIComponent(fileKey)}`, {
          method: 'DELETE'
        })
      }

      showMessage(`Successfully deleted ${selectedFiles.length} file(s)`, 'success')
      setSelectedFiles([])
      await loadFiles()
      await loadStats()
    } catch (error) {
      console.error('Bulk delete failed:', error)
      showMessage('Bulk delete failed', 'error')
    }
  }

  const downloadFile = async (fileKey) => {
    try {
      const response = await fetch(`/api/plugin-routes/s3/download/${encodeURIComponent(fileKey)}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileKey.split('/').pop()
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        showMessage('Download failed', 'error')
      }
    } catch (error) {
      console.error('Download failed:', error)
      showMessage('Download failed', 'error')
    }
  }

  const copyFileUrl = async (fileKey) => {
    try {
      // For public files, construct direct URL; for private files, get signed URL
      const response = await fetch(`/api/plugin-routes/s3/url/${encodeURIComponent(fileKey)}`)
      const data = await response.json()
      
      if (data.success) {
        await navigator.clipboard.writeText(data.url)
        showMessage('File URL copied to clipboard', 'success')
      } else {
        showMessage('Failed to get file URL', 'error')
      }
    } catch (error) {
      console.error('Copy URL failed:', error)
      showMessage('Failed to copy URL', 'error')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const filteredFiles = files.filter(file =>
    file.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleFileSelection = (fileKey) => {
    setSelectedFiles(prev => 
      prev.includes(fileKey) 
        ? prev.filter(key => key !== fileKey)
        : [...prev, fileKey]
    )
  }

  const selectAllFiles = () => {
    setSelectedFiles(filteredFiles.map(file => file.key))
  }

  const clearSelection = () => {
    setSelectedFiles([])
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">S3 Storage Manager</h1>
        <p className="text-gray-600">Manage your AWS S3 files and storage</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          messageType === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Files</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalFiles}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Storage Used</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalSize}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Upload</h3>
          <p className="text-lg text-gray-600">
            {stats.lastUpload ? formatDate(stats.lastUpload) : 'No uploads yet'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                📁 Upload Files
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <button
                onClick={deleteSelectedFiles}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                🗑️ Delete Selected ({selectedFiles.length})
              </button>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            
            <button
              onClick={loadFiles}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Files ({filteredFiles.length})
            </h2>
            
            {filteredFiles.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={selectAllFiles}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                {selectedFiles.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No files found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === filteredFiles.length}
                      onChange={() => 
                        selectedFiles.length === filteredFiles.length 
                          ? clearSelection() 
                          : selectAllFiles()
                      }
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((file, index) => (
                  <tr key={file.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.key)}
                        onChange={() => toggleFileSelection(file.key)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {file.key.split('/').pop()}
                      </div>
                      <div className="text-sm text-gray-500">{file.key}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(file.lastModified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadFile(file.key)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => copyFileUrl(file.key)}
                          className="text-green-600 hover:text-green-900"
                          title="Copy URL"
                        >
                          🔗
                        </button>
                        <button
                          onClick={() => deleteFile(file.key)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}