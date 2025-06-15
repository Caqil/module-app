#!/usr/bin/env node
// CLI Plugin Template Generator
// scripts/generate-plugin.js

const fs = require('fs').promises
const path = require('path')
const readline = require('readline')

class PluginCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve)
    })
  }

  async generatePlugin() {
    console.log('🚀 Plugin Template Generator')
    console.log('================================\n')

    try {
      // Collect plugin information
      const pluginInfo = await this.collectPluginInfo()
      
      // Generate plugin files
      await this.createPluginFiles(pluginInfo)
      
      console.log('\n✅ Plugin template generated successfully!')
      console.log(`📁 Location: ./plugins/templates/${pluginInfo.id}`)
      console.log('\n📋 Next steps:')
      console.log('1. Review and customize the generated files')
      console.log('2. Add your business logic to index.js')
      console.log('3. Create a ZIP file of the plugin directory')
      console.log('4. Upload through the admin interface')
      
    } catch (error) {
      console.error('❌ Error generating plugin:', error.message)
    } finally {
      this.rl.close()
    }
  }

  async collectPluginInfo() {
    const info = {}

    info.name = await this.ask('Plugin name: ')
    info.id = (await this.ask(`Plugin ID (${this.slugify(info.name)}): `)) || this.slugify(info.name)
    info.description = await this.ask('Description: ')
    info.version = (await this.ask('Version (1.0.0): ')) || '1.0.0'
    info.author = await this.ask('Author name: ')
    info.email = await this.ask('Author email: ')
    
    console.log('\n📂 Select plugin category:')
    const categories = [
      'analytics', 'commerce', 'communication', 'content', 'integration',
      'security', 'utility', 'dashboard', 'reporting', 'other'
    ]
    categories.forEach((cat, i) => console.log(`${i + 1}. ${cat}`))
    const categoryIndex = parseInt(await this.ask('Category (number): ')) - 1
    info.category = categories[categoryIndex] || 'other'

    console.log('\n🔧 Select features to include:')
    info.features = {}
    info.features.adminPages = await this.confirm('Include admin pages? (y/n): ')
    info.features.dashboardWidgets = await this.confirm('Include dashboard widgets? (y/n): ')
    info.features.apiRoutes = await this.confirm('Include API routes? (y/n): ')
    info.features.database = await this.confirm('Include database models? (y/n): ')
    info.features.hooks = await this.confirm('Include hooks/filters? (y/n): ')
    info.features.settings = await this.confirm('Include settings panel? (y/n): ')

    console.log('\n🔑 Select permissions needed:')
    const allPermissions = [
      'admin:access', 'database:read', 'database:write', 'users:read', 
      'users:write', 'files:read', 'files:write', 'settings:read', 
      'settings:write', 'api:create'
    ]
    
    info.permissions = []
    for (const perm of allPermissions) {
      if (await this.confirm(`Need ${perm}? (y/n): `)) {
        info.permissions.push(perm)
      }
    }

    return info
  }

  async confirm(question) {
    const answer = await this.ask(question)
    return answer.toLowerCase().startsWith('y')
  }

  slugify(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async createPluginFiles(info) {
    const pluginDir = path.join('./plugins/templates', info.id)
    
    // Create plugin directory
    await fs.mkdir(pluginDir, { recursive: true })

    // Generate all plugin files
    await this.createManifest(pluginDir, info)
    await this.createMainFile(pluginDir, info)
    
    if (info.features.adminPages) {
      await this.createAdminPages(pluginDir, info)
    }
    
    if (info.features.dashboardWidgets) {
      await this.createDashboardWidgets(pluginDir, info)
    }
    
    if (info.features.apiRoutes) {
      await this.createApiRoutes(pluginDir, info)
    }
    
    if (info.features.database) {
      await this.createDatabaseModels(pluginDir, info)
    }
    
    await this.createReadme(pluginDir, info)
    await this.createPackageScript(pluginDir, info)
  }

  async createManifest(pluginDir, info) {
    const manifest = {
      id: info.id,
      name: info.name,
      version: info.version,
      description: info.description,
      author: {
        name: info.author,
        email: info.email
      },
      license: "MIT",
      category: info.category,
      tags: [info.category, "generated"],
      requirements: {
        nextjs: ">=14.0.0",
        node: ">=18.0.0"
      },
      permissions: info.permissions,
      entry: {
        main: "index.js"
      }
    }

    // Add optional features
    if (info.features.adminPages) {
      manifest.adminPages = [{
        path: `/${info.id}-settings`,
        title: `${info.name} Settings`,
        icon: "Settings",
        component: "admin/settings.jsx",
        permissions: ["admin:access"]
      }]
    }

    if (info.features.dashboardWidgets) {
      manifest.dashboardWidgets = [{
        id: `${info.id}-stats`,
        title: `${info.name} Stats`,
        component: "widgets/stats.jsx",
        size: "medium",
        category: info.category
      }]
    }

    if (info.features.apiRoutes) {
      manifest.routes = [
        {
          path: `/${info.id}/status`,
          method: "GET",
          handler: "status.js",
          permissions: info.permissions
        },
        {
          path: `/${info.id}/config`,
          method: "GET",
          handler: "config.js",
          permissions: ["admin:access"]
        }
      ]
    }

    if (info.features.settings) {
      manifest.settings = {
        schema: {
          enabled: {
            type: "boolean",
            title: "Enable Plugin",
            description: "Enable or disable this plugin",
            default: true
          },
          apiKey: {
            type: "string",
            title: "API Key",
            description: "API key for external service",
            required: false
          }
        },
        defaults: {
          enabled: true,
          apiKey: ""
        }
      }
    }

    await fs.writeFile(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(manifest, null, 2)
    )
  }

  async createMainFile(pluginDir, info) {
    const mainContent = `// ${info.name} - Main Plugin File
// Generated by Plugin CLI Generator

module.exports = {
  name: '${info.name}',
  version: '${info.version}',
  
  /**
   * Initialize the plugin
   */
  init() {
    console.log('✅ ${info.name} initialized successfully!')
    this.setupEventListeners()
  },
  
  /**
   * Activate the plugin
   */
  activate() {
    console.log('🚀 ${info.name} activated!')
    this.loadConfiguration()
    return true
  },
  
  /**
   * Deactivate the plugin
   */
  deactivate() {
    console.log('⏹️ ${info.name} deactivated!')
    this.cleanup()
    return true
  },

  /**
   * Load plugin configuration
   */
  loadConfiguration() {
    // Load plugin settings
    const config = this.getConfig()
    if (config.enabled) {
      this.startServices()
    }
  },

  /**
   * Start plugin services
   */
  startServices() {
    console.log('🔧 Starting ${info.name} services...')
    // Add your business logic here
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for system events
    this.on('user:login', this.handleUserLogin.bind(this))
    this.on('system:ready', this.handleSystemReady.bind(this))
  },

  /**
   * Handle user login event
   */
  handleUserLogin(user) {
    console.log('User logged in:', user.email)
    // Add your login handling logic
  },

  /**
   * Handle system ready event
   */
  handleSystemReady() {
    console.log('System is ready, ${info.name} can start full operations')
    // Add initialization logic that requires system to be ready
  },

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('🧹 Cleaning up ${info.name} resources...')
    // Cleanup timers, connections, etc.
  },

  /**
   * Get plugin configuration
   */
  getConfig() {
    return {
      enabled: true,
      apiKey: process.env.${info.id.toUpperCase().replace(/-/g, '_')}_API_KEY || '',
      // Add more config options as needed
    }
  }
}`

    await fs.writeFile(path.join(pluginDir, 'index.js'), mainContent)
  }

  async createAdminPages(pluginDir, info) {
    await fs.mkdir(path.join(pluginDir, 'admin'), { recursive: true })
    
    const adminContent = `// ${info.name} Admin Settings Page
import React, { useState, useEffect } from 'react'

export default function ${info.id.replace(/-/g, '')}Settings() {
  const [config, setConfig] = useState({
    enabled: true,
    apiKey: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plugin-routes/${info.id}/config')
      const data = await response.json()
      if (data.success) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plugin-routes/${info.id}/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      setMessage('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">${info.name} Settings</h1>
      
      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="font-medium">Enable ${info.name}</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter your API key..."
          />
        </div>

        <button
          onClick={saveConfig}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}`

    await fs.writeFile(path.join(pluginDir, 'admin/settings.jsx'), adminContent)
  }

  async createDashboardWidgets(pluginDir, info) {
    await fs.mkdir(path.join(pluginDir, 'widgets'), { recursive: true })
    
    const widgetContent = `// ${info.name} Dashboard Widget
import React, { useState, useEffect } from 'react'

export default function ${info.id.replace(/-/g, '')}Stats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    recent: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/plugin-routes/${info.id}/status')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold text-gray-900 mb-3">${info.name} Stats</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-gray-600">Active</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.recent}</div>
          <div className="text-xs text-gray-600">Recent</div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button 
          onClick={loadStats}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}`

    await fs.writeFile(path.join(pluginDir, 'widgets/stats.jsx'), widgetContent)
  }

  async createApiRoutes(pluginDir, info) {
    await fs.mkdir(path.join(pluginDir, 'routes'), { recursive: true })
    
    // Status route
    const statusContent = `// ${info.name} Status API Route
module.exports = async function statusHandler(req, res, context) {
  try {
    // Get plugin statistics
    const stats = {
      total: 100,
      active: 85,
      recent: 12,
      lastUpdated: new Date().toISOString()
    }

    return {
      success: true,
      stats,
      plugin: '${info.name}',
      version: '${info.version}'
    }
  } catch (error) {
    console.error('Status API error:', error)
    return {
      success: false,
      error: 'Failed to get status'
    }
  }
}`

    await fs.writeFile(path.join(pluginDir, 'routes/status.js'), statusContent)

    // Config route
    const configContent = `// ${info.name} Config API Route
module.exports = {
  async GET(req, res, context) {
    try {
      // Return current configuration
      const config = {
        enabled: true,
        apiKey: process.env.${info.id.toUpperCase().replace(/-/g, '_')}_API_KEY || '',
        // Add more config fields as needed
      }

      return {
        success: true,
        config
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get configuration'
      }
    }
  },

  async PUT(req, res, context) {
    try {
      const { enabled, apiKey } = req.body

      // Validate configuration
      if (typeof enabled !== 'boolean') {
        return {
          success: false,
          error: 'Invalid enabled value'
        }
      }

      // Save configuration (implement your storage logic)
      console.log('Saving config:', { enabled, apiKey: apiKey ? '[HIDDEN]' : '' })

      return {
        success: true,
        message: 'Configuration saved successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save configuration'
      }
    }
  }
}`

    await fs.writeFile(path.join(pluginDir, 'routes/config.js'), configContent)
  }

  async createDatabaseModels(pluginDir, info) {
    await fs.mkdir(path.join(pluginDir, 'models'), { recursive: true })
    
    const modelContent = `// ${info.name} Database Model
const mongoose = require('mongoose')

const ${info.id.replace(/-/g, '')}Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

${info.id.replace(/-/g, '')}Schema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('${info.name.replace(/\s+/g, '')}', ${info.id.replace(/-/g, '')}Schema)`

    await fs.writeFile(path.join(pluginDir, 'models/index.js'), modelContent)
  }

  async createReadme(pluginDir, info) {
    const readmeContent = `# ${info.name}

${info.description}

## Features

${info.features.adminPages ? '- ✅ Admin Settings Page' : ''}
${info.features.dashboardWidgets ? '- ✅ Dashboard Widget' : ''}
${info.features.apiRoutes ? '- ✅ API Routes' : ''}
${info.features.database ? '- ✅ Database Models' : ''}
${info.features.hooks ? '- ✅ Hooks & Filters' : ''}
${info.features.settings ? '- ✅ Settings Panel' : ''}

## Installation

1. Create a ZIP file containing all plugin files
2. Upload through Admin > Plugins > Install Plugin
3. Activate the plugin
4. Configure settings in Admin > ${info.name} Settings

## Configuration

${info.features.settings ? `The plugin can be configured through the admin interface or by setting environment variables:

- \`${info.id.toUpperCase().replace(/-/g, '_')}_API_KEY\` - API key for external services

## API Endpoints

${info.features.apiRoutes ? `- \`GET /${info.id}/status\` - Get plugin status and statistics
- \`GET /${info.id}/config\` - Get plugin configuration  
- \`PUT /${info.id}/config\` - Update plugin configuration` : ''}` : ''}

## Development

To modify this plugin:

1. Edit the source files in this directory
2. Test your changes
3. Create a new ZIP file
4. Upload and activate the updated plugin

## Files Structure

\`\`\`
${info.id}/
├── plugin.json           # Plugin manifest
├── index.js              # Main plugin file
├── README.md             # This file
${info.features.adminPages ? '├── admin/\n│   └── settings.jsx     # Admin settings page' : ''}
${info.features.dashboardWidgets ? '├── widgets/\n│   └── stats.jsx       # Dashboard widget' : ''}
${info.features.apiRoutes ? '├── routes/\n│   ├── status.js        # Status API\n│   └── config.js        # Config API' : ''}
${info.features.database ? '└── models/\n    └── index.js         # Database models' : ''}
\`\`\`

## License

${info.license || 'MIT'}

## Author

${info.author} <${info.email}>
`

    await fs.writeFile(path.join(pluginDir, 'README.md'), readmeContent)
  }

  async createPackageScript(pluginDir, info) {
    const packageContent = `#!/bin/bash
# Package ${info.name} for distribution

echo "📦 Packaging ${info.name}..."

# Create zip file
cd "$(dirname "$0")"
zip -r "../${info.id}.zip" . -x "*.DS_Store" "package.sh" "node_modules/*"

echo "✅ Plugin packaged as ${info.id}.zip"
echo "📁 Ready for upload!"
`

    await fs.writeFile(path.join(pluginDir, 'package.sh'), packageContent)
    
    // Make it executable
    try {
      await fs.chmod(path.join(pluginDir, 'package.sh'), 0o755)
    } catch (error) {
      // Ignore chmod errors on systems that don't support it
    }
  }
}

// Run the CLI
if (require.main === module) {
  const cli = new PluginCLI()
  cli.generatePlugin().catch(console.error)
}

module.exports = PluginCLI