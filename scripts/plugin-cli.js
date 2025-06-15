#!/usr/bin/env node

// Plugin Development CLI Tools
// scripts/plugin-cli.js

const fs = require('fs').promises
const path = require('path')
const { createHash } = require('crypto')
const AdmZip = require('adm-zip')

class PluginCLI {
  constructor() {
    this.commands = {
      create: this.createPlugin.bind(this),
      validate: this.validatePlugin.bind(this),
      build: this.buildPlugin.bind(this),
      test: this.testPlugin.bind(this),
      package: this.packagePlugin.bind(this),
      install: this.installPlugin.bind(this),
      'generate-manifest': this.generateManifest.bind(this),
      'create-component': this.createComponent.bind(this),
      'create-route': this.createRoute.bind(this),
      help: this.showHelp.bind(this)
    }
  }

  async run() {
    const args = process.argv.slice(2)
    const command = args[0] || 'help'
    const options = this.parseOptions(args.slice(1))

    if (!this.commands[command]) {
      console.error(`❌ Unknown command: ${command}`)
      this.showHelp()
      process.exit(1)
    }

    try {
      await this.commands[command](options)
    } catch (error) {
      console.error(`❌ Error: ${error.message}`)
      process.exit(1)
    }
  }

  parseOptions(args) {
    const options = {}
    for (let i = 0; i < args.length; i += 2) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2)
        const value = args[i + 1] || true
        options[key] = value
      }
    }
    return options
  }

  /**
   * Create a new plugin from template
   */
  async createPlugin(options) {
    const pluginId = options.id || options._?.[0]
    if (!pluginId) {
      throw new Error('Plugin ID is required. Use: plugin-cli create --id my-plugin')
    }

    if (!/^[a-z0-9-]+$/.test(pluginId)) {
      throw new Error('Plugin ID must be lowercase alphanumeric with hyphens only')
    }

    const pluginDir = path.join('plugins/installed', pluginId)
    
    // Check if plugin already exists
    try {
      await fs.access(pluginDir)
      throw new Error(`Plugin directory already exists: ${pluginDir}`)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }

    console.log(`🔧 Creating plugin: ${pluginId}`)

    // Create plugin directory structure
    await fs.mkdir(pluginDir, { recursive: true })
    await fs.mkdir(path.join(pluginDir, 'components'), { recursive: true })
    await fs.mkdir(path.join(pluginDir, 'routes'), { recursive: true })
    await fs.mkdir(path.join(pluginDir, 'assets'), { recursive: true })
    await fs.mkdir(path.join(pluginDir, 'tests'), { recursive: true })

    // Generate plugin files
    await this.generatePluginManifest(pluginDir, pluginId, options)
    await this.generateMainFile(pluginDir, pluginId, options)
    await this.generateExampleRoute(pluginDir, pluginId)
    await this.generateExampleComponent(pluginDir, pluginId)
    await this.generateReadme(pluginDir, pluginId, options)
    await this.generateTestFile(pluginDir, pluginId)

    console.log(`✅ Plugin '${pluginId}' created successfully!`)
    console.log(`📁 Location: ${pluginDir}`)
    console.log('')
    console.log('Next steps:')
    console.log(`1. cd ${pluginDir}`)
    console.log('2. Edit plugin.json to configure your plugin')
    console.log('3. Implement your plugin logic in index.js')
    console.log('4. Test with: plugin-cli test --path ' + pluginDir)
    console.log('5. Package with: plugin-cli package --path ' + pluginDir)
  }

  /**
   * Validate plugin structure and manifest
   */
  async validatePlugin(options) {
    const pluginPath = options.path || process.cwd()
    
    console.log(`🔍 Validating plugin at: ${pluginPath}`)

    const validation = {
      errors: [],
      warnings: [],
      info: []
    }

    // Check for required files
    const requiredFiles = ['plugin.json', 'index.js']
    for (const file of requiredFiles) {
      const filePath = path.join(pluginPath, file)
      try {
        await fs.access(filePath)
        validation.info.push(`✓ Found ${file}`)
      } catch {
        validation.errors.push(`✗ Missing required file: ${file}`)
      }
    }

    // Validate manifest
    try {
      const manifestPath = path.join(pluginPath, 'plugin.json')
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(manifestContent)
      
      const manifestValidation = this.validateManifestData(manifest)
      validation.errors.push(...manifestValidation.errors)
      validation.warnings.push(...manifestValidation.warnings)
      validation.info.push(...manifestValidation.info)
    } catch (error) {
      validation.errors.push(`✗ Invalid plugin.json: ${error.message}`)
    }

    // Check file structure
    const structureValidation = await this.validateFileStructure(pluginPath)
    validation.warnings.push(...structureValidation.warnings)
    validation.info.push(...structureValidation.info)

    // Report results
    this.reportValidation(validation)

    if (validation.errors.length > 0) {
      process.exit(1)
    }
  }

  /**
   * Build plugin (lint, type-check, etc.)
   */
  async buildPlugin(options) {
    const pluginPath = options.path || process.cwd()
    
    console.log(`🔨 Building plugin at: ${pluginPath}`)

    // First validate
    await this.validatePlugin({ path: pluginPath })

    // TODO: Add actual build steps like:
    // - TypeScript compilation
    // - ESLint checking
    // - Asset optimization
    // - Dependency bundling

    console.log('✅ Plugin built successfully!')
  }

  /**
   * Test plugin
   */
  async testPlugin(options) {
    const pluginPath = options.path || process.cwd()
    
    console.log(`🧪 Testing plugin at: ${pluginPath}`)

    // Check for test files
    const testDir = path.join(pluginPath, 'tests')
    try {
      const testFiles = await fs.readdir(testDir)
      const jsTestFiles = testFiles.filter(file => file.endsWith('.test.js'))
      
      if (jsTestFiles.length === 0) {
        console.log('⚠️  No test files found in tests/ directory')
        return
      }

      console.log(`Found ${jsTestFiles.length} test file(s)`)
      
      // TODO: Run actual tests with Jest or similar
      // For now, just check syntax
      for (const testFile of jsTestFiles) {
        const testPath = path.join(testDir, testFile)
        try {
          require(testPath)
          console.log(`✓ ${testFile} - syntax OK`)
        } catch (error) {
          console.log(`✗ ${testFile} - syntax error: ${error.message}`)
        }
      }
    } catch {
      console.log('⚠️  No tests directory found')
    }

    console.log('✅ Plugin tests completed!')
  }

  /**
   * Package plugin into ZIP file
   */
  async packagePlugin(options) {
    const pluginPath = options.path || process.cwd()
    const outputDir = options.output || path.join(pluginPath, '..')
    
    console.log(`📦 Packaging plugin at: ${pluginPath}`)

    // Validate first
    await this.validatePlugin({ path: pluginPath })

    // Read manifest to get plugin info
    const manifestPath = path.join(pluginPath, 'plugin.json')
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
    
    const packageName = `${manifest.id}-${manifest.version}.zip`
    const packagePath = path.join(outputDir, packageName)

    // Create ZIP archive
    const zip = new AdmZip()
    await this.addDirectoryToZip(zip, pluginPath, '')

    // Write ZIP file
    zip.writeZip(packagePath)

    // Calculate checksum
    const zipContent = await fs.readFile(packagePath)
    const checksum = createHash('sha256').update(zipContent).digest('hex')

    console.log(`✅ Plugin packaged successfully!`)
    console.log(`📁 Package: ${packagePath}`)
    console.log(`📊 Size: ${(zipContent.length / 1024).toFixed(2)} KB`)
    console.log(`🔐 SHA256: ${checksum}`)
  }

  /**
   * Install plugin from ZIP or directory
   */
  async installPlugin(options) {
    const source = options.source || options._?.[0]
    if (!source) {
      throw new Error('Plugin source is required. Use: plugin-cli install --source plugin.zip')
    }

    console.log(`📥 Installing plugin from: ${source}`)

    // TODO: Implement actual installation
    // This would integrate with the plugin manager API
    console.log('🚧 Installation feature coming soon! Use the admin interface for now.')
  }

  /**
   * Generate manifest file
   */
  async generateManifest(options) {
    const pluginPath = options.path || process.cwd()
    const manifestPath = path.join(pluginPath, 'plugin.json')
    
    // Check if manifest already exists
    try {
      await fs.access(manifestPath)
      if (!options.force) {
        throw new Error('Manifest already exists. Use --force to overwrite.')
      }
    } catch (error) {
      if (error.code !== 'ENOENT' && !error.message.includes('already exists')) {
        throw error
      }
    }

    const pluginId = options.id || path.basename(pluginPath)
    await this.generatePluginManifest(pluginPath, pluginId, options)
    
    console.log(`✅ Manifest generated: ${manifestPath}`)
  }

  /**
   * Create a new component
   */
  async createComponent(options) {
    const componentName = options.name || options._?.[0]
    if (!componentName) {
      throw new Error('Component name is required. Use: plugin-cli create-component --name MyComponent')
    }

    const pluginPath = options.path || process.cwd()
    const componentType = options.type || 'admin'
    const componentDir = path.join(pluginPath, 'components')
    const componentFile = path.join(componentDir, `${componentName}.tsx`)

    await fs.mkdir(componentDir, { recursive: true })

    const componentTemplate = this.getComponentTemplate(componentName, componentType)
    await fs.writeFile(componentFile, componentTemplate)

    console.log(`✅ Component created: ${componentFile}`)
  }

  /**
   * Create a new route handler
   */
  async createRoute(options) {
    const routeName = options.name || options._?.[0]
    if (!routeName) {
      throw new Error('Route name is required. Use: plugin-cli create-route --name my-route')
    }

    const pluginPath = options.path || process.cwd()
    const routeDir = path.join(pluginPath, 'routes')
    const routeFile = path.join(routeDir, `${routeName}.js`)

    await fs.mkdir(routeDir, { recursive: true })

    const routeTemplate = this.getRouteTemplate(routeName)
    await fs.writeFile(routeFile, routeTemplate)

    console.log(`✅ Route handler created: ${routeFile}`)
  }

  /**
   * Show help
   */
  showHelp() {
    console.log(`
Plugin Development CLI

Usage: plugin-cli <command> [options]

Commands:
  create <id>              Create a new plugin
  validate [--path]        Validate plugin structure
  build [--path]           Build plugin
  test [--path]            Run plugin tests
  package [--path]         Package plugin into ZIP
  install <source>         Install plugin from ZIP
  generate-manifest        Generate plugin.json
  create-component <name>  Create new component
  create-route <name>      Create new route handler
  help                     Show this help

Options:
  --path <path>           Plugin directory path
  --id <id>               Plugin ID
  --name <name>           Plugin name
  --description <desc>    Plugin description
  --author <author>       Author name
  --force                 Force overwrite existing files
  --type <type>           Component type (admin, widget, page)

Examples:
  plugin-cli create my-awesome-plugin
  plugin-cli validate --path ./plugins/my-plugin
  plugin-cli package --path ./plugins/my-plugin
  plugin-cli create-component --name AdminPanel --type admin
  plugin-cli create-route --name api-handler
`)
  }

  // Helper methods

  async generatePluginManifest(pluginDir, pluginId, options) {
    const manifest = {
      id: pluginId,
      name: options.name || this.titleCase(pluginId.replace(/-/g, ' ')),
      version: options.version || '1.0.0',
      description: options.description || `A plugin called ${pluginId}`,
      author: {
        name: options.author || 'Plugin Developer',
        email: options.email || 'developer@example.com'
      },
      license: options.license || 'MIT',
      category: options.category || 'utility',
      permissions: options.permissions ? options.permissions.split(',') : ['database:read'],
      entry: {
        main: 'index.js'
      },
      routes: [],
      adminPages: [],
      dashboardWidgets: [],
      hooks: [],
      settings: {
        schema: {
          enabled: {
            type: 'boolean',
            title: 'Enable Plugin',
            description: 'Enable or disable this plugin',
            default: true
          }
        },
        defaults: {
          enabled: true
        }
      }
    }

    const manifestPath = path.join(pluginDir, 'plugin.json')
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  }

  async generateMainFile(pluginDir, pluginId, options) {
    const className = this.pascalCase(pluginId)
    const content = `// ${manifest.name} Plugin
// Generated by Plugin CLI

class ${className}Plugin {
  constructor(context) {
    this.context = context
    this.config = context.config
    this.database = context.database
    this.logger = context.logger
    this.hooks = context.hooks
    this.utils = context.utils
  }

  /**
   * Initialize the plugin
   */
  async initialize() {
    try {
      this.logger.info('🔄 ${manifest.name}: Initializing...')
      
      // Register hooks
      this.registerHooks()
      
      // Setup database if needed
      await this.setupDatabase()
      
      this.logger.info('✅ ${manifest.name}: Successfully initialized')
      return { success: true }
    } catch (error) {
      this.logger.error('❌ ${manifest.name}: Initialization failed', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Register plugin hooks
   */
  registerHooks() {
    // Example hook registration
    // this.hooks.addAction('user:login', this.onUserLogin.bind(this), 10, '${pluginId}')
  }

  /**
   * Setup database collections and indexes
   */
  async setupDatabase() {
    // Database setup logic here
  }

  /**
   * Cleanup when plugin is deactivated
   */
  async unload() {
    try {
      this.logger.info('🔄 ${manifest.name}: Unloading...')
      
      // Remove hooks
      // this.hooks.removeAction('user:login', this.onUserLogin)
      
      this.logger.info('✅ ${manifest.name}: Unloaded successfully')
    } catch (error) {
      this.logger.error('❌ ${manifest.name}: Unload error', error)
    }
  }
}

module.exports = ${className}Plugin`

    const filePath = path.join(pluginDir, 'index.js')
    await fs.writeFile(filePath, content)
  }

  async generateExampleRoute(pluginDir, pluginId) {
    const content = `// Example API Route Handler
// routes/example.js

async function handleExampleRequest(request, context) {
  const { method, database, user, config, logger } = context

  try {
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        return new Response(JSON.stringify({
          success: true,
          data: {
            message: 'Hello from ${pluginId} plugin!',
            timestamp: new Date().toISOString(),
            user: user?.id || 'anonymous'
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })

      case 'POST':
        const body = await request.json()
        
        // Process the request body
        logger.info('Processing POST request:', body)
        
        return new Response(JSON.stringify({
          success: true,
          data: { processed: body }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Method not allowed'
        }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    logger.error('Route handler error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

module.exports = handleExampleRequest`

    const filePath = path.join(pluginDir, 'routes', 'example.js')
    await fs.writeFile(filePath, content)
  }

  async generateExampleComponent(pluginDir, pluginId) {
    const componentName = this.pascalCase(pluginId) + 'Admin'
    const content = `// Example Admin Component
// components/admin.tsx

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ${componentName}Props {
  pluginConfig?: any
  onConfigChange?: (config: any) => void
}

const ${componentName}: React.FC<${componentName}Props> = ({
  pluginConfig = {},
  onConfigChange
}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/plugin-routes/${pluginId}/example')
      const result = await response.json()
      setData(result.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>${this.titleCase(pluginId.replace(/-/g, ' '))} Plugin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <Badge variant={pluginConfig?.enabled ? 'default' : 'secondary'}>
                {pluginConfig?.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            {data && (
              <div>
                <h4 className="font-medium mb-2">Plugin Data:</h4>
                <pre className="bg-muted p-3 rounded text-sm">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
            
            <Button onClick={loadData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ${componentName}`

    const filePath = path.join(pluginDir, 'components', 'admin.tsx')
    await fs.writeFile(filePath, content)
  }

  async generateReadme(pluginDir, pluginId, options) {
    const pluginName = options.name || this.titleCase(pluginId.replace(/-/g, ' '))
    const content = `# ${pluginName}

${options.description || `A plugin called ${pluginId}`}

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

1. Package the plugin: \`plugin-cli package --path ./\`
2. Install via admin interface or API
3. Activate the plugin
4. Configure settings as needed

## Configuration

This plugin supports the following configuration options:

- \`enabled\`: Enable or disable the plugin

## API Endpoints

- \`GET /api/plugin-routes/${pluginId}/example\` - Example endpoint

## Development

### Testing
\`\`\`bash
plugin-cli test --path ./
\`\`\`

### Building
\`\`\`bash
plugin-cli build --path ./
\`\`\`

### Packaging
\`\`\`bash
plugin-cli package --path ./
\`\`\`

## License

${options.license || 'MIT'}
`

    const filePath = path.join(pluginDir, 'README.md')
    await fs.writeFile(filePath, content)
  }

  async generateTestFile(pluginDir, pluginId) {
    const className = this.pascalCase(pluginId)
    const content = `// Plugin Tests
// tests/plugin.test.js

const ${className}Plugin = require('../index.js')

describe('${className}Plugin', () => {
  let plugin
  let mockContext

  beforeEach(() => {
    mockContext = {
      config: { enabled: true },
      database: {},
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      },
      hooks: {
        addAction: jest.fn(),
        removeAction: jest.fn()
      },
      utils: {
        hash: jest.fn(),
        slugify: jest.fn()
      }
    }

    plugin = new ${className}Plugin(mockContext)
  })

  test('should initialize successfully', async () => {
    const result = await plugin.initialize()
    expect(result.success).toBe(true)
    expect(mockContext.logger.info).toHaveBeenCalled()
  })

  test('should unload cleanly', async () => {
    await plugin.unload()
    expect(mockContext.logger.info).toHaveBeenCalled()
  })

  // Add more tests as needed
})`

    const filePath = path.join(pluginDir, 'tests', 'plugin.test.js')
    await fs.writeFile(filePath, content)
  }

  getComponentTemplate(componentName, type) {
    return `// ${componentName} Component
// Generated by Plugin CLI

import React from 'react'

interface ${componentName}Props {
  // Add your props here
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div>
      <h1>${componentName}</h1>
      <p>This is a ${type} component.</p>
    </div>
  )
}

export default ${componentName}`
  }

  getRouteTemplate(routeName) {
    return `// ${routeName} Route Handler
// Generated by Plugin CLI

async function handle${this.pascalCase(routeName)}Request(request, context) {
  const { method, database, user, config, logger } = context

  try {
    // Your route logic here
    return new Response(JSON.stringify({
      success: true,
      data: { message: 'Hello from ${routeName}' }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    logger.error('${routeName} route error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

module.exports = handle${this.pascalCase(routeName)}Request`
  }

  // Validation methods

  validateManifestData(manifest) {
    const validation = { errors: [], warnings: [], info: [] }

    // Required fields
    const required = ['id', 'name', 'version', 'description', 'author', 'license', 'category']
    for (const field of required) {
      if (!manifest[field]) {
        validation.errors.push(`✗ Missing required field: ${field}`)
      } else {
        validation.info.push(`✓ Has ${field}`)
      }
    }

    // ID format
    if (manifest.id && !/^[a-z0-9-]+$/.test(manifest.id)) {
      validation.errors.push('✗ Plugin ID must be lowercase alphanumeric with hyphens')
    }

    // Version format
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      validation.errors.push('✗ Version must be in format x.y.z')
    }

    // Permissions
    if (manifest.permissions && manifest.permissions.length > 8) {
      validation.warnings.push('⚠ Plugin requests many permissions, consider reducing scope')
    }

    return validation
  }

  async validateFileStructure(pluginPath) {
    const validation = { warnings: [], info: [] }

    // Check for common files
    const commonFiles = ['README.md', 'package.json', '.gitignore']
    for (const file of commonFiles) {
      try {
        await fs.access(path.join(pluginPath, file))
        validation.info.push(`✓ Has ${file}`)
      } catch {
        validation.warnings.push(`⚠ Missing ${file}`)
      }
    }

    return validation
  }

  reportValidation(validation) {
    console.log('\n📋 Validation Report:')
    
    if (validation.info.length > 0) {
      console.log('\n✅ Passed:')
      validation.info.forEach(msg => console.log(`  ${msg}`))
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      validation.warnings.forEach(msg => console.log(`  ${msg}`))
    }

    if (validation.errors.length > 0) {
      console.log('\n❌ Errors:')
      validation.errors.forEach(msg => console.log(`  ${msg}`))
    }

    console.log('')
    if (validation.errors.length === 0) {
      console.log('✅ Plugin validation passed!')
    } else {
      console.log(`❌ Plugin validation failed with ${validation.errors.length} error(s)`)
    }
  }

  async addDirectoryToZip(zip, dirPath, zipPath) {
    const items = await fs.readdir(dirPath)
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const zipItemPath = zipPath ? `${zipPath}/${item}` : item
      
      // Skip certain files/directories
      if (this.shouldSkipFile(item)) continue
      
      const stat = await fs.stat(itemPath)
      
      if (stat.isDirectory()) {
        await this.addDirectoryToZip(zip, itemPath, zipItemPath)
      } else {
        const content = await fs.readFile(itemPath)
        zip.addFile(zipItemPath, content)
      }
    }
  }

  shouldSkipFile(filename) {
    const skipPatterns = [
      '.git',
      'node_modules',
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '.env*',
      'tests',
      '*.test.js',
      '*.spec.js'
    ]
    
    return skipPatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'))
        return regex.test(filename)
      }
      return filename === pattern
    })
  }

  // Utility methods

  titleCase(str) {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  }

  pascalCase(str) {
    return str.replace(/-(.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (_, char) => char.toUpperCase())
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new PluginCLI()
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message)
    process.exit(1)
  })
}

module.exports = PluginCLI