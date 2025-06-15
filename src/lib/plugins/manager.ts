// Plugin Manager - WordPress-like plugin management system
// src/lib/plugins/manager.ts

import path from 'path'
import fs from 'fs/promises'
import AdmZip from 'adm-zip'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import { 
  PluginManagerInterface, 
  InstalledPlugin, 
  PluginInstallOptions, 
  PluginActivationOptions, 
  PluginValidationResult, 
  PluginManifest,
  PluginEvent,
  PluginEventData,
  LoadedPlugin
} from '@/types/plugin'
import { FileUpload } from '@/types/global'
import { PLUGIN_CONFIG } from '@/lib/constants'
import { InstalledPluginModel, PluginBackupModel } from '@/lib/database/models/plugin'
import { connectToDatabase } from '@/lib/database/mongodb'
import { generateId, getErrorMessage, ensureDir, getFileExtension } from '@/lib/utils'
import { pluginRegistry } from './registry'
import { pluginLoader } from './loader'

export class PluginManager extends EventEmitter implements PluginManagerInterface {
  private installDir: string
  private uploadDir: string
  private backupDir: string
  private initialized: boolean = false

  constructor() {
    super()
    this.installDir = path.join(process.cwd(), PLUGIN_CONFIG.INSTALL_DIR)
    this.uploadDir = path.join(process.cwd(), PLUGIN_CONFIG.UPLOAD_DIR)
    this.backupDir = path.join(process.cwd(), 'backups/plugins')
  }

  /**
   * Initialize the plugin manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Ensure directories exist
      await ensureDir(this.installDir)
      await ensureDir(this.uploadDir)
      await ensureDir(this.backupDir)

      // Connect to database
      await connectToDatabase()

      // Load all active plugins
      await this.loadActivePlugins()

      this.initialized = true
      console.log('✅ Plugin Manager initialized successfully')
    } catch (error) {
      console.error('❌ Plugin Manager initialization failed:', error)
      throw error
    }
  }

  /**
   * Install a plugin from ZIP file
   */
  async installPlugin(
    file: FileUpload, 
    userId: string, 
    options: PluginInstallOptions = {}
  ): Promise<{ success: boolean; pluginId?: string; error?: string }> {
    try {
      await this.ensureInitialized()

      // Validate file
      if (!file || !file.filename || !file.size) {
        return { success: false, error: 'Invalid file provided' }
      }

      if (!PLUGIN_CONFIG.ALLOWED_EXTENSIONS.includes(getFileExtension(file.name))) {
        return { success: false, error: 'Only ZIP files are allowed' }
      }

      if (file.size > PLUGIN_CONFIG.MAX_FILE_SIZE) {
        return { success: false, error: 'File size exceeds maximum limit' }
      }

      // Generate unique upload path
      const uploadId = generateId()
      const uploadPath = path.join(this.uploadDir, `${uploadId}.zip`)

      // Save uploaded file
      await fs.writeFile(uploadPath, new Uint8Array(await file.arrayBuffer()))

      // Extract and validate plugin
      const extractPath = path.join(this.uploadDir, uploadId)
      const zip = new AdmZip(uploadPath)
      
      try {
        zip.extractAllTo(extractPath, true)
      } catch (error) {
        await this.cleanup([uploadPath, extractPath])
        return { success: false, error: 'Failed to extract plugin archive' }
      }

      // Find manifest file
      const manifestPath = await this.findManifestFile(extractPath)
      if (!manifestPath) {
        await this.cleanup([uploadPath, extractPath])
        return { success: false, error: 'Plugin manifest not found' }
      }

      // Load and validate manifest
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      let manifest: PluginManifest
      
      try {
        manifest = JSON.parse(manifestContent)
      } catch (error) {
        await this.cleanup([uploadPath, extractPath])
        return { success: false, error: 'Invalid manifest format' }
      }

      // Validate manifest structure
      const validation = await this.validateManifest(manifest)
      if (!validation.isValid) {
        await this.cleanup([uploadPath, extractPath])
        return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` }
      }

      // Check if plugin already exists
      const existingPlugin = await InstalledPluginModel.findByPluginId(manifest.id)
      if (existingPlugin && !options.overwrite) {
        await this.cleanup([uploadPath, extractPath])
        return { success: false, error: 'Plugin already exists. Use overwrite option to replace.' }
      }

      // Create backup if overwriting
      if (existingPlugin && options.backup) {
        await this.backupPlugin(manifest.id, 'auto')
      }

      // Prepare installation directory
      const installPath = path.join(this.installDir, manifest.id)
      
      if (existingPlugin) {
        await this.cleanup([installPath])
      }

      // Move plugin to installation directory
      await fs.rename(extractPath, installPath)

      // Create database entry
      const pluginData = {
        pluginId: manifest.id,
        name: manifest.name,
        version: manifest.version,
        status: 'installing' as const,
        isActive: false,
        manifest,
        config: manifest.settings?.defaults || {},
        installPath,
        uploadPath,
        installedBy: userId,
        hooks: this.extractHooksFromManifest(manifest),
        routes: this.extractRoutesFromManifest(manifest),
        adminPages: manifest.adminPages || [],
        dashboardWidgets: manifest.dashboardWidgets || [],
        assets: manifest.assets || { css: [], js: [], images: {}, fonts: [] },
        dependencies: this.extractDependenciesFromManifest(manifest),
        database: this.extractDatabaseFromManifest(manifest),
        performance: { loadTime: 0, memoryUsage: 0, apiCalls: 0, lastMeasured: new Date() },
        settings: { autoUpdate: false, priority: 10, cacheEnabled: true, logLevel: 'info' as const },
        metadata: { downloadCount: 0, rating: 0, reviews: 0, lastChecked: new Date(), updateAvailable: false },
        errorLog: []
      }

      // Update or create plugin record
      let plugin: any
      if (existingPlugin) {
        plugin = await InstalledPluginModel.findOneAndUpdate(
          { pluginId: manifest.id },
          { ...pluginData, status: 'installed' },
          { new: true }
        )
      } else {
        plugin = await InstalledPluginModel.create({ ...pluginData, status: 'installed' })
      }

      // Run installation lifecycle hook
      if (manifest.lifecycle?.install) {
        try {
          await this.runLifecycleHook(installPath, manifest.lifecycle.install, 'install')
        } catch (error) {
          await plugin.updateOne({ 
            status: 'failed',
            $push: { errorLog: { level: 'error', message: `Installation hook failed: ${getErrorMessage(error)}` } }
          })
          return { success: false, error: `Installation hook failed: ${getErrorMessage(error)}` }
        }
      }

      // Auto-activate if requested
      if (options.activate) {
        const activationResult = await this.activatePlugin(manifest.id)
        if (!activationResult.success) {
          return { success: false, error: `Plugin installed but activation failed: ${activationResult.error}` }
        }
      }

      // Cleanup upload files
      await this.cleanup([uploadPath])

      // Emit installation event
      this.emit('plugin:installed', {
        pluginId: manifest.id,
        pluginName: manifest.name,
        version: manifest.version,
        timestamp: new Date(),
        userId,
      })

      return { success: true, pluginId: manifest.id }

    } catch (error) {
      console.error('Plugin installation error:', error)
      return { success: false, error: getErrorMessage(error) }
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureInitialized()

      const plugin = await InstalledPluginModel.findByPluginId(pluginId)
      if (!plugin) {
        return { success: false, error: 'Plugin not found' }
      }

      // Deactivate plugin first
      if (plugin.isActive) {
        const deactivationResult = await this.deactivatePlugin(pluginId)
        if (!deactivationResult.success) {
          return { success: false, error: `Failed to deactivate plugin: ${deactivationResult.error}` }
        }
      }

      // Run uninstall lifecycle hook
      if (plugin.manifest.lifecycle?.uninstall) {
        try {
          await this.runLifecycleHook(plugin.installPath, plugin.manifest.lifecycle.uninstall, 'uninstall')
        } catch (error) {
          console.warn(`Uninstall hook failed for ${pluginId}:`, error)
        }
      }

      // Remove plugin files
      await this.cleanup([plugin.installPath, plugin.uploadPath])

      // Remove database entry
      await InstalledPluginModel.deleteOne({ pluginId })

      // Remove from registry
      pluginRegistry.unregisterPlugin(pluginId)

      // Emit uninstall event
      this.emit('plugin:uninstalled', {
        pluginId,
        pluginName: plugin.name,
        version: plugin.version,
        timestamp: new Date(),
        userId,
      })

      return { success: true }

    } catch (error) {
      console.error('Plugin uninstall error:', error)
      return { success: false, error: getErrorMessage(error) }
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginId: string, options: PluginActivationOptions = {}): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureInitialized()

      const plugin = await InstalledPluginModel.findByPluginId(pluginId)
      if (!plugin) {
        return { success: false, error: 'Plugin not found' }
      }

      if (plugin.status !== 'installed') {
        return { success: false, error: `Plugin status is ${plugin.status}, must be installed` }
      }

      if (plugin.isActive) {
        return { success: false, error: 'Plugin is already active' }
      }

      // Check dependencies unless skipped
      if (!options.skipDependencyCheck) {
        const dependencyCheck = await this.checkDependencies(plugin)
        if (!dependencyCheck.success) {
          return { success: false, error: dependencyCheck.error }
        }
      }

      // Load plugin
      const loadedPlugin = await pluginLoader.loadPlugin(plugin)
      if (loadedPlugin.error) {
        return { success: false, error: `Failed to load plugin: ${loadedPlugin.error.message}` }
      }

      // Run activation lifecycle hook
      if (plugin.manifest.lifecycle?.activate) {
        try {
          await this.runLifecycleHook(plugin.installPath, plugin.manifest.lifecycle.activate, 'activate')
        } catch (error) {
          return { success: false, error: `Activation hook failed: ${getErrorMessage(error)}` }
        }
      }

      // Update database
      await InstalledPluginModel.activatePlugin(pluginId)

      // Register plugin
      pluginRegistry.registerPlugin(loadedPlugin)

      // Emit activation event
      this.emit('plugin:activated', {
        pluginId,
        pluginName: plugin.name,
        version: plugin.version,
        timestamp: new Date(),
      })

      return { success: true }

    } catch (error) {
      console.error('Plugin activation error:', error)
      return { success: false, error: getErrorMessage(error) }
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureInitialized()

      const plugin = await InstalledPluginModel.findByPluginId(pluginId)
      if (!plugin) {
        return { success: false, error: 'Plugin not found' }
      }

      if (!plugin.isActive) {
        return { success: false, error: 'Plugin is not active' }
      }

      // Run deactivation lifecycle hook
      if (plugin.manifest.lifecycle?.deactivate) {
        try {
          await this.runLifecycleHook(plugin.installPath, plugin.manifest.lifecycle.deactivate, 'deactivate')
        } catch (error) {
          console.warn(`Deactivation hook failed for ${pluginId}:`, error)
        }
      }

      // Unload plugin
      await pluginLoader.unloadPlugin(pluginId)

      // Update database
      await InstalledPluginModel.deactivatePlugin(pluginId)

      // Unregister plugin
      pluginRegistry.unregisterPlugin(pluginId)

      // Emit deactivation event
      this.emit('plugin:deactivated', {
        pluginId,
        pluginName: plugin.name,
        version: plugin.version,
        timestamp: new Date(),
      })

      return { success: true }

    } catch (error) {
      console.error('Plugin deactivation error:', error)
      return { success: false, error: getErrorMessage(error) }
    }
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfig(pluginId: string, config: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureInitialized()

      const plugin = await InstalledPluginModel.findByPluginId(pluginId)
      if (!plugin) {
        return { success: false, error: 'Plugin not found' }
      }

      // Validate configuration against schema
      if (plugin.manifest.settings?.schema) {
        const validation = this.validateConfig(config, plugin.manifest.settings.schema)
        if (!validation.isValid) {
          return { success: false, error: `Invalid configuration: ${validation.errors.join(', ')}` }
        }
      }

      // Update configuration
      await InstalledPluginModel.updatePluginConfig(pluginId, config)

      // Reload plugin if active
      if (plugin.isActive) {
        await pluginLoader.reloadPlugin(pluginId)
      }

      // Emit config change event
      this.emit('plugin:config_changed', {
        pluginId,
        pluginName: plugin.name,
        version: plugin.version,
        timestamp: new Date(),
        data: { config }
      })

      return { success: true }

    } catch (error) {
      console.error('Plugin config update error:', error)
      return { success: false, error: getErrorMessage(error) }
    }
  }

  /**
   * Get plugin configuration
   */
  async getPluginConfig(pluginId: string): Promise<Record<string, any> | null> {
    try {
      const plugin = await InstalledPluginModel.findByPluginId(pluginId)
      return plugin ? plugin.config : null
    } catch (error) {
      console.error('Get plugin config error:', error)
      return null
    }
  }

  /**
   * Get a specific plugin
   */
  async getPlugin(pluginId: string): Promise<InstalledPlugin | null> {
    try {
      return await InstalledPluginModel.findByPluginId(pluginId)
    } catch (error) {
      console.error('Get plugin error:', error)
      return null
    }
  }

  /**
   * Get all active plugins
   */
  async getActivePlugins(): Promise<InstalledPlugin[]> {
    try {
      return await InstalledPluginModel.findActivePlugins()
    } catch (error) {
      console.error('Get active plugins error:', error)
      return []
    }
  }

  /**
   * Get all plugins
   */
  async getAllPlugins(): Promise<InstalledPlugin[]> {
    try {
      return await InstalledPluginModel.find().sort({ createdAt: -1 })
    } catch (error) {
      console.error('Get all plugins error:', error)
      return []
    }
  }

  /**
   * Validate plugin file
   */
  async validatePlugin(file: FileUpload): Promise<PluginValidationResult> {
    try {
      // Basic file validation
      if (!file || !file.filename || !file.size) {
        return { isValid: false, errors: ['Invalid file provided'], warnings: [] }
      }

      if (!PLUGIN_CONFIG.ALLOWED_EXTENSIONS.includes(getFileExtension(file.name))) {
        return { isValid: false, errors: ['Only ZIP files are allowed'], warnings: [] }
      }

      if (file.size > PLUGIN_CONFIG.MAX_FILE_SIZE) {
        return { isValid: false, errors: ['File size exceeds maximum limit'], warnings: [] }
      }

      // Extract and validate manifest
      const tempPath = path.join(this.uploadDir, `temp_${generateId()}`)
      await fs.writeFile(`${tempPath}.zip`, new Uint8Array(await file.arrayBuffer()))

      const zip = new AdmZip(`${tempPath}.zip`)
      zip.extractAllTo(tempPath, true)

      const manifestPath = await this.findManifestFile(tempPath)
      if (!manifestPath) {
        await this.cleanup([`${tempPath}.zip`, tempPath])
        return { isValid: false, errors: ['Plugin manifest not found'], warnings: [] }
      }

      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      let manifest: PluginManifest

      try {
        manifest = JSON.parse(manifestContent)
      } catch (error) {
        await this.cleanup([`${tempPath}.zip`, tempPath])
        return { isValid: false, errors: ['Invalid manifest JSON format'], warnings: [] }
      }

      const validation = await this.validateManifest(manifest)

      // Cleanup temp files
      await this.cleanup([`${tempPath}.zip`, tempPath])

      return validation

    } catch (error) {
      console.error('Plugin validation error:', error)
      return { isValid: false, errors: [getErrorMessage(error)], warnings: [] }
    }
  }

  /**
   * Validate plugin manifest
   */
  async validateManifest(manifest: any): Promise<PluginValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!manifest.id) errors.push('Plugin ID is required')
    if (!manifest.name) errors.push('Plugin name is required')
    if (!manifest.version) errors.push('Plugin version is required')
    if (!manifest.description) errors.push('Plugin description is required')
    if (!manifest.author) errors.push('Plugin author is required')

    // Format validation
    if (manifest.id && !/^[a-z0-9-]+$/.test(manifest.id)) {
      errors.push('Plugin ID must be lowercase alphanumeric with hyphens')
    }
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push('Version must be in format x.y.z')
    }

    // Security validation
    const riskLevel = this.assessSecurityRisk(manifest)
    const security = {
      hasUnsafePermissions: riskLevel !== 'low',
      riskLevel,
      recommendations: this.getSecurityRecommendations(manifest)
    }

    if (riskLevel === 'high') {
      warnings.push('Plugin requires high-risk permissions')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      manifest: errors.length === 0 ? manifest : undefined,
      security
    }
  }

  /**
   * Backup a plugin
   */
  async backupPlugin(pluginId: string, type: 'manual' | 'auto'): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      const plugin = await InstalledPluginModel.findByPluginId(pluginId)
      if (!plugin) {
        return { success: false, error: 'Plugin not found' }
      }

      const backupId = generateId()
      const backupPath = path.join(this.backupDir, `${pluginId}_${backupId}.json`)

      const backupData = {
        plugin: plugin.toObject(),
        timestamp: new Date(),
        version: plugin.version,
        config: plugin.config
      }

      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))

      const checksum = crypto.createHash('sha256').update(JSON.stringify(backupData)).digest('hex')

      const backup = await PluginBackupModel.create({
        pluginId,
        pluginName: plugin.name,
        version: plugin.version,
        config: plugin.config,
        backupPath,
        backupType: type,
        createdBy: plugin.installedBy,
        restorable: true,
        size: (await fs.stat(backupPath)).size,
        checksum
      })

      return { success: true, backupId: backup._id.toString() }

    } catch (error) {
      console.error('Plugin backup error:', error)
      return { success: false, error: getErrorMessage(error) }
    }
  }

  /**
   * Restore a plugin from backup
   */
  async restorePlugin(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backup = await PluginBackupModel.findById(backupId)
      if (!backup) {
        return { success: false, error: 'Backup not found' }
      }

      if (!backup.restorable) {
        return { success: false, error: 'Backup is not restorable' }
      }

      const backupData = JSON.parse(await fs.readFile(backup.backupPath, 'utf-8'))

      // Verify checksum
      const calculatedChecksum = crypto.createHash('sha256').update(JSON.stringify(backupData)).digest('hex')
      if (calculatedChecksum !== backup.checksum) {
        return { success: false, error: 'Backup integrity check failed' }
      }

      // Restore plugin configuration
      await InstalledPluginModel.updatePluginConfig(backup.pluginId, backup.config)

      return { success: true }

    } catch (error) {
      console.error('Plugin restore error:', error)
      return { success: false, error: getErrorMessage(error) }
    }
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  private async loadActivePlugins(): Promise<void> {
    try {
      const activePlugins = await InstalledPluginModel.findActivePlugins()
      for (const plugin of activePlugins) {
        try {
          const loadedPlugin = await pluginLoader.loadPlugin(plugin)
          if (!loadedPlugin.error) {
            pluginRegistry.registerPlugin(loadedPlugin)
          }
        } catch (error) {
          console.warn(`Failed to load plugin ${plugin.pluginId}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to load active plugins:', error)
    }
  }

  private async findManifestFile(extractPath: string): Promise<string | null> {
    try {
      const entries = await fs.readdir(extractPath, { withFileTypes: true })
      
      // Check root directory first
      for (const entry of entries) {
        if (entry.isFile() && entry.name === PLUGIN_CONFIG.MANIFEST_FILE) {
          return path.join(extractPath, entry.name)
        }
      }

      // Check subdirectories
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifestPath = path.join(extractPath, entry.name, PLUGIN_CONFIG.MANIFEST_FILE)
          try {
            await fs.access(manifestPath)
            return manifestPath
          } catch {
            continue
          }
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  private async cleanup(paths: string[]): Promise<void> {
    for (const targetPath of paths) {
      try {
        const stat = await fs.stat(targetPath)
        if (stat.isDirectory()) {
          await fs.rm(targetPath, { recursive: true, force: true })
        } else {
          await fs.unlink(targetPath)
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  private async runLifecycleHook(pluginPath: string, hookScript: string, lifecycle: string): Promise<void> {
    // This would execute the lifecycle hook script
    // For security, this should be sandboxed in production
    console.log(`Running ${lifecycle} hook for plugin at ${pluginPath}`)
  }

  private async checkDependencies(plugin: InstalledPlugin): Promise<{ success: boolean; error?: string }> {
    try {
      if (!plugin.dependencies || plugin.dependencies.length === 0) {
        return { success: true }
      }

      for (const dependency of plugin.dependencies) {
        const depPlugin = await InstalledPluginModel.findByPluginId(dependency.pluginId)
        if (!depPlugin) {
          return { success: false, error: `Required plugin ${dependency.pluginId} is not installed` }
        }
        if (!depPlugin.isActive && dependency.required) {
          return { success: false, error: `Required plugin ${dependency.pluginId} is not active` }
        }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  private validateConfig(config: Record<string, any>, schema: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Basic validation - in production, use a proper schema validator like Joi or Zod
    for (const [key, schemaField] of Object.entries(schema)) {
      if (schemaField.required && config[key] === undefined) {
        errors.push(`${key} is required`)
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  private assessSecurityRisk(manifest: PluginManifest): 'low' | 'medium' | 'high' {
    const permissions = manifest.permissions || []
    const highRiskPerms = ['database:write', 'files:write', 'settings:write', 'plugins:manage']
    const mediumRiskPerms = ['database:read', 'admin:access', 'users:write']

    if (permissions.some(p => highRiskPerms.includes(p))) return 'high'
    if (permissions.some(p => mediumRiskPerms.includes(p))) return 'medium'
    return 'low'
  }

  private getSecurityRecommendations(manifest: PluginManifest): string[] {
    const recommendations: string[] = []
    const permissions = manifest.permissions || []

    if (permissions.includes('database:write')) {
      recommendations.push('Review database write operations carefully')
    }
    if (permissions.includes('files:write')) {
      recommendations.push('Ensure file operations are properly sandboxed')
    }
    if (permissions.includes('settings:write')) {
      recommendations.push('Monitor system settings changes')
    }

    return recommendations
  }

  private extractHooksFromManifest(manifest: PluginManifest) {
    return (manifest.hooks || []).map(hook => ({
      name: hook.name,
      callback: hook.callback,
      priority: hook.priority || 10,
      accepted: hook.accepted || 1
    }))
  }

  private extractRoutesFromManifest(manifest: PluginManifest) {
    return (manifest.routes || []).map(route => ({
      path: route.path,
      method: route.method,
      handler: route.handler,
      middleware: route.middleware || [],
      permissions: route.permissions || []
    }))
  }

  private extractDependenciesFromManifest(manifest: PluginManifest) {
    const deps = manifest.dependencies?.plugins || {}
    return Object.entries(deps).map(([pluginId, version]) => ({
      pluginId,
      version,
      required: true
    }))
  }

  private extractDatabaseFromManifest(manifest: PluginManifest) {
    return {
      collections: (manifest.database?.collections || []).map(col => ({
        name: col.name,
        schema: col.schema,
        indexes: col.indexes || []
      })),
      migrations: (manifest.database?.migrations || []).map(mig => ({
        version: mig.version,
        script: mig.script,
        applied: false
      }))
    }
  }
}

// Export singleton instance
export const pluginManager = new PluginManager()

// Export class for testing
export default PluginManager