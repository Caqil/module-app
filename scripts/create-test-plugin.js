#!/usr/bin/env node
// Create React-Compatible Plugin for Your System
// scripts/create-react-plugin.js

const fs = require('fs').promises
const path = require('path')
const archiver = require('archiver')

async function createReactPlugin() {
  console.log('🚀 Creating React-Compatible Plugin for Your System...')
  
  const pluginDir = path.join(process.cwd(), 'plugins', 'react-compatible', 'hello-world')
  
  try {
    // Create the directory structure your system expects
    await fs.mkdir(pluginDir, { recursive: true })
    await fs.mkdir(path.join(pluginDir, 'routes'), { recursive: true })
    await fs.mkdir(path.join(pluginDir, 'components'), { recursive: true })
    
    // Plugin Manifest - Correct paths for your system
    const manifest = {
      "id": "hello-world",
      "name": "Hello World Plugin",
      "version": "1.0.0",
      "description": "A React-compatible plugin that works with your existing loader",
      "author": {
        "name": "Plugin Developer",
        "email": "dev@example.com",
        "url": "https://example.com"
      },
      "license": "MIT",
      "category": "utility",
      "keywords": ["test", "react", "hello"],
      "tags": ["demo", "react"],
      "requirements": {
        "nextjs": ">=15.0.0"
      },
      "permissions": [
        "admin:access",
        "api:create"
      ],
      "entry": {
        "main": "index.js",
        "admin": "components/admin.js",
        "api": "routes/api.js"
      },
      "routes": [
        {
          "path": "/hello",
          "method": "GET",
          "handler": "api.js",
          "permissions": ["api:create"]
        }
      ],
      "adminPages": [
        {
          "path": "/hello-world",
          "title": "Hello World",
          "icon": "Heart",
          "component": "admin.js",
          "permissions": ["admin:access"],
          "order": 1
        }
      ],
      "dashboardWidgets": [
        {
          "id": "hello-widget",
          "title": "Hello Widget",
          "component": "widget.js",
          "size": "small",
          "permissions": ["admin:access"],
          "configurable": false
        }
      ]
    }
    
    // Main Plugin File - CommonJS
    const indexJs = `// Hello World Plugin - Main Entry (CommonJS)
function HelloWorldPlugin(api) {
  this.api = api
  this.initialized = false
  this.config = {
    message: 'Hello, World!',
    showTimestamp: true
  }
}

HelloWorldPlugin.prototype.initialize = function() {
  if (this.initialized) return Promise.resolve()

  console.log('🚀 Initializing Hello World Plugin...')
  
  var self = this
  return Promise.resolve().then(function() {
    try {
      return self.api.getPluginConfig('hello-world')
    } catch (error) {
      return {}
    }
  }).then(function(savedConfig) {
    self.config = Object.assign({}, self.config, savedConfig)
    self.initialized = true
    console.log('✅ Hello World Plugin initialized successfully')
  }).catch(function(error) {
    console.log('Using default configuration')
    self.initialized = true
  })
}

HelloWorldPlugin.prototype.getGreeting = function() {
  var message = this.config.message || 'Hello, World!'
  var timestamp = this.config.showTimestamp ? ' (' + new Date().toLocaleString() + ')' : ''
  return message + timestamp
}

HelloWorldPlugin.prototype.updateConfig = function(newConfig) {
  this.config = Object.assign({}, this.config, newConfig)
  return { success: true }
}

HelloWorldPlugin.prototype.getConfig = function() {
  return this.config
}

HelloWorldPlugin.prototype.cleanup = function() {
  this.initialized = false
}

// CommonJS export
module.exports = HelloWorldPlugin`

    // API Route Handler - In routes/ directory (CommonJS)
    const routesApiJs = `// Hello World Plugin - API Handler (CommonJS)
function handleRequest(request, context) {
  return new Promise(function(resolve) {
    try {
      var method = request.method
      
      if (method === 'GET') {
        var message = 'Hello from Hello World Plugin API!'
        
        if (context && context.plugin) {
          try {
            if (typeof context.plugin.getGreeting === 'function') {
              message = context.plugin.getGreeting()
            }
          } catch (error) {
            console.log('Could not get greeting from plugin instance:', error)
          }
        }
        
        var responseData = {
          success: true,
          message: message,
          timestamp: new Date().toISOString(),
          plugin: 'hello-world',
          version: '1.0.0',
          method: method,
          path: '/hello'
        }
        
        resolve(new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'X-Plugin': 'hello-world'
          }
        }))
        return
      }
      
      // Method not allowed
      resolve(new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed',
        allowedMethods: ['GET']
      }), {
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Allow': 'GET'
        }
      }))
      
    } catch (error) {
      console.error('API handler error:', error)
      resolve(new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }))
    }
  })
}

// Export for your system
module.exports = handleRequest
module.exports.default = handleRequest
module.exports.handleRequest = handleRequest
module.exports.GET = handleRequest`

    // React Admin Component - Proper React component function
    const componentsAdminJs = `// Hello World Plugin - React Admin Component
// This is a proper React component function that your loader expects

function HelloWorldAdmin(props) {
  // Mock React if not available (your loader provides it)
  var React = props.React || (typeof require !== 'undefined' ? require('react') : null)
  
  if (!React) {
    // Fallback if React is not available
    return {
      type: 'div',
      props: {
        style: { padding: '20px' },
        children: 'Hello World Admin (React not available)'
      }
    }
  }

  var useState = React.useState
  var useEffect = React.useEffect
  
  // Component state
  var stateResult = useState(null)
  var apiResult = stateResult[0]
  var setApiResult = stateResult[1]
  
  var loadingResult = useState(false)
  var loading = loadingResult[0]
  var setLoading = loadingResult[1]
  
  // Test API function
  var testAPI = function() {
    setLoading(true)
    setApiResult(null)
    
    fetch('/api/plugin-routes/hello')
      .then(function(response) {
        return response.json()
      })
      .then(function(result) {
        setApiResult(result)
        setLoading(false)
      })
      .catch(function(error) {
        setApiResult({ success: false, error: error.message })
        setLoading(false)
      })
  }
  
  // JSX-like structure using React.createElement
  return React.createElement('div', {
    style: { 
      padding: '24px', 
      maxWidth: '800px',
      fontFamily: 'system-ui, sans-serif'
    }
  }, [
    // Header
    React.createElement('div', { 
      key: 'header',
      style: { marginBottom: '24px' }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: { 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#1f2937'
        }
      }, 'Hello World Plugin'),
      React.createElement('p', {
        key: 'subtitle',
        style: { 
          color: '#6b7280', 
          marginBottom: '16px' 
        }
      }, 'React-compatible plugin admin interface')
    ]),
    
    // Status Card
    React.createElement('div', {
      key: 'status-card',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }
    }, [
      React.createElement('h2', {
        key: 'status-title',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#374151'
        }
      }, 'Plugin Status'),
      React.createElement('div', {
        key: 'status-grid',
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }
      }, [
        React.createElement('div', { key: 'status' }, [
          React.createElement('p', {
            key: 'status-label',
            style: { fontSize: '14px', color: '#6b7280', marginBottom: '4px' }
          }, 'Status'),
          React.createElement('p', {
            key: 'status-value',
            style: { fontSize: '16px', fontWeight: '500', color: '#059669' }
          }, '✅ Active & Running')
        ]),
        React.createElement('div', { key: 'version' }, [
          React.createElement('p', {
            key: 'version-label',
            style: { fontSize: '14px', color: '#6b7280', marginBottom: '4px' }
          }, 'Version'),
          React.createElement('p', {
            key: 'version-value',
            style: { fontSize: '16px', fontWeight: '500' }
          }, '1.0.0')
        ]),
        React.createElement('div', { key: 'id' }, [
          React.createElement('p', {
            key: 'id-label',
            style: { fontSize: '14px', color: '#6b7280', marginBottom: '4px' }
          }, 'Plugin ID'),
          React.createElement('p', {
            key: 'id-value',
            style: { 
              fontSize: '16px', 
              fontWeight: '500', 
              fontFamily: 'monospace', 
              color: '#4f46e5' 
            }
          }, 'hello-world')
        ])
      ])
    ]),
    
    // API Testing Card
    React.createElement('div', {
      key: 'api-card',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }
    }, [
      React.createElement('h2', {
        key: 'api-title',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#374151'
        }
      }, 'API Testing'),
      React.createElement('p', {
        key: 'api-description',
        style: { color: '#6b7280', marginBottom: '16px' }
      }, 'Test the plugin\\'s API endpoint to verify it\\'s working correctly.'),
      React.createElement('button', {
        key: 'test-button',
        onClick: testAPI,
        disabled: loading,
        style: {
          background: loading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          marginBottom: '16px'
        }
      }, loading ? 'Testing...' : 'Test API'),
      
      // API Results
      apiResult ? React.createElement('div', {
        key: 'api-results',
        style: {
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px'
        }
      }, [
        React.createElement('p', {
          key: 'results-title',
          style: { fontWeight: '500', marginBottom: '8px' }
        }, 'API Response:'),
        React.createElement('pre', {
          key: 'results-content',
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }
        }, JSON.stringify(apiResult, null, 2))
      ]) : null
    ])
  ])
}

// Export as React component function (what your loader expects)
module.exports = HelloWorldAdmin`

    // React Widget Component - Proper React component function
    const componentsWidgetJs = `// Hello World Plugin - React Widget Component
// This is a proper React component function

function HelloWorldWidget(props) {
  var React = props.React || (typeof require !== 'undefined' ? require('react') : null)
  
  if (!React) {
    return {
      type: 'div',
      props: {
        style: { padding: '16px' },
        children: 'Hello World Widget (React not available)'
      }
    }
  }

  var useState = React.useState
  var useEffect = React.useEffect
  
  // Component state
  var greetingState = useState('Hello, World!')
  var greeting = greetingState[0]
  var setGreeting = greetingState[1]
  
  var timeState = useState(new Date().toLocaleTimeString())
  var time = timeState[0]
  var setTime = timeState[1]
  
  var statusState = useState('🔄')
  var apiStatus = statusState[0]
  var setApiStatus = statusState[1]
  
  // Load greeting from API
  var loadGreeting = function() {
    fetch('/api/plugin-routes/hello')
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status)
        return response.json()
      })
      .then(function(result) {
        if (result.success && result.message) {
          setGreeting(result.message)
          setApiStatus('✅')
        } else {
          throw new Error('Invalid response')
        }
      })
      .catch(function(error) {
        console.warn('Widget API error:', error)
        setGreeting('Hello, World! (API unavailable)')
        setApiStatus('❌')
      })
  }
  
  // Update time
  var updateTime = function() {
    setTime(new Date().toLocaleTimeString())
  }
  
  // Effects
  useEffect(function() {
    updateTime()
    loadGreeting()
    
    var timeInterval = setInterval(updateTime, 30000)
    var apiInterval = setInterval(loadGreeting, 120000)
    
    return function() {
      clearInterval(timeInterval)
      clearInterval(apiInterval)
    }
  }, [])
  
  // Render widget
  return React.createElement('div', {
    style: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      height: '100%',
      minHeight: '140px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      fontFamily: 'system-ui, sans-serif'
    }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: '8px'
      }
    }, [
      React.createElement('h3', {
        key: 'title',
        style: {
          margin: '0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151'
        }
      }, 'Hello World'),
      React.createElement('div', {
        key: 'status-icons',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }
      }, [
        React.createElement('span', {
          key: 'heart',
          style: { fontSize: '18px' }
        }, '❤️'),
        React.createElement('div', {
          key: 'status-dot',
          style: {
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%',
            marginLeft: '4px'
          },
          title: 'Plugin Active'
        })
      ])
    ]),
    
    // Content
    React.createElement('div', {
      key: 'content',
      style: { flex: '1' }
    }, [
      // Greeting
      React.createElement('div', {
        key: 'greeting',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '8px',
          lineHeight: '1.3'
        }
      }, greeting),
      
      // Time
      React.createElement('div', {
        key: 'time',
        style: {
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }
      }, [
        React.createElement('span', { key: 'clock' }, '🕒'),
        React.createElement('span', { key: 'time-value' }, time)
      ]),
      
      // Stats
      React.createElement('div', {
        key: 'stats',
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontSize: '11px'
        }
      }, [
        React.createElement('div', {
          key: 'active-stat',
          style: {
            textAlign: 'center',
            padding: '6px',
            background: '#f9fafb',
            borderRadius: '4px'
          }
        }, [
          React.createElement('div', {
            key: 'active-label',
            style: { fontWeight: '600', color: '#374151' }
          }, 'Active'),
          React.createElement('div', {
            key: 'active-value',
            style: { color: '#10b981' }
          }, '✅')
        ]),
        React.createElement('div', {
          key: 'api-stat',
          style: {
            textAlign: 'center',
            padding: '6px',
            background: '#f9fafb',
            borderRadius: '4px'
          }
        }, [
          React.createElement('div', {
            key: 'api-label',
            style: { fontWeight: '600', color: '#374151' }
          }, 'API'),
          React.createElement('div', {
            key: 'api-value',
            style: { color: '#3b82f6' }
          }, apiStatus)
        ])
      ])
    ])
  ])
}

// Export as React component function
module.exports = HelloWorldWidget`

    // README
    const readme = `# Hello World Plugin - React Compatible

This plugin is designed to work with your existing React component loader.

## Structure

\`\`\`
hello-world/
├── plugin.json              # Plugin manifest
├── index.js                 # Main plugin file (CommonJS)
├── routes/
│   └── api.js               # API handlers (CommonJS functions)
└── components/
    ├── admin.js             # React admin component (React function)
    └── widget.js            # React dashboard widget (React function)
\`\`\`

## Key Features

- ✅ **Proper React components** - Functions that return React elements
- ✅ **Works with your loader** - Passes the "typeof component === 'function'" check
- ✅ **CommonJS exports** - No ES6 syntax issues
- ✅ **Correct directory structure** - Files where your system expects them
- ✅ **Working API endpoint** - \`GET /api/plugin-routes/hello\`

## What Makes This Different

Your loader expects:
\`\`\`javascript
// This is what your loader checks:
if (typeof component === 'function') {
  return component  // ✅ Valid React component
} else {
  throw new Error('Component is not a valid React component')  // ❌ Error
}
\`\`\`

This plugin exports **actual React component functions**:
\`\`\`javascript
function HelloWorldAdmin(props) {
  var React = props.React || require('react')
  return React.createElement('div', {}, 'Hello World!')
}

module.exports = HelloWorldAdmin  // ✅ This is a function!
\`\`\`

## Expected Results

After uploading this plugin:

1. **No loader errors** - Components are valid React functions
2. **Working API** - \`curl http://localhost:3000/api/plugin-routes/hello\`
3. **Functional admin page** - Interactive React components
4. **Dashboard widget** - Live updating widget

## API Response

\`\`\`json
{
  "success": true,
  "message": "Hello, World! (12/15/2024, 3:45:12 PM)",
  "timestamp": "2024-12-15T20:45:12.000Z",
  "plugin": "hello-world",
  "version": "1.0.0"
}
\`\`\`

This should resolve all the React component loading errors! 🚀`

    // Write all files
    await fs.writeFile(path.join(pluginDir, 'plugin.json'), JSON.stringify(manifest, null, 2))
    await fs.writeFile(path.join(pluginDir, 'index.js'), indexJs)
    await fs.writeFile(path.join(pluginDir, 'README.md'), readme)
    
    // Routes directory
    await fs.writeFile(path.join(pluginDir, 'routes', 'api.js'), routesApiJs)
    
    // Components directory - React components
    await fs.writeFile(path.join(pluginDir, 'components', 'admin.js'), componentsAdminJs)
    await fs.writeFile(path.join(pluginDir, 'components', 'widget.js'), componentsWidgetJs)
    
    console.log('✅ React-compatible plugin files created!')
    console.log(`📁 Location: ${pluginDir}`)
    console.log('\n📋 Structure:')
    console.log('├── plugin.json')
    console.log('├── index.js')
    console.log('├── routes/')
    console.log('│   └── api.js           ← CommonJS API handler')
    console.log('├── components/')
    console.log('│   ├── admin.js         ← React component function')
    console.log('│   └── widget.js        ← React component function')
    console.log('└── README.md')
    
    // Create ZIP file
    const zipPath = path.join(path.dirname(pluginDir), 'hello-world-react.zip')
    await createZipFile(pluginDir, zipPath)
    
    console.log(`\n📦 ZIP package created: ${zipPath}`)
    console.log('\n🎯 This plugin has REAL React components!')
    console.log('\n✅ Expected results:')
    console.log('- No "Component is not a valid React component" errors')
    console.log('- Working API: /api/plugin-routes/hello')
    console.log('- Functional admin interface')
    console.log('- Live dashboard widget')
    console.log('\n📋 Next steps:')
    console.log('1. Upload hello-world-react.zip')
    console.log('2. Activate the plugin')
    console.log('3. Test: curl http://localhost:3000/api/plugin-routes/hello')
    
  } catch (error) {
    console.error('❌ Error creating React plugin:', error)
  }
}

async function createZipFile(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = require('fs').createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    output.on('close', () => {
      console.log(`📦 ZIP created: ${archive.pointer()} bytes`)
      resolve()
    })
    
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}

// Also need to create the missing deactivate route
const deactivateRouteCode = `// Add to src/app/api/admin/plugins/[id]/deactivate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { connectToDatabase } from '@/lib/database/mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const pluginId = params.id
    await connectToDatabase()

    const plugin = await InstalledPluginModel.findOne({ pluginId })
    if (!plugin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin not found' 
      }, { status: 404 })
    }

    if (!plugin.isActive) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin is already inactive' 
      }, { status: 400 })
    }

    // Deactivate plugin
    await plugin.updateOne({
      isActive: false,
      activatedAt: null,
      $push: {
        errorLog: {
          level: 'info',
          message: 'Plugin deactivated',
          timestamp: new Date()
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: \`Plugin '\${plugin.name}' deactivated successfully\`
    })

  } catch (error) {
    console.error('Plugin deactivation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to deactivate plugin' 
    }, { status: 500 })
  }
}`

// Run if called directly
if (require.main === module) {
  createReactPlugin()
  
  console.log('\n\n🔧 ALSO NEED TO CREATE DEACTIVATE ROUTE:')
  console.log('Create: src/app/api/admin/plugins/[id]/deactivate/route.ts')
  console.log('With the code shown above ↑')
}

module.exports = { createReactPlugin }