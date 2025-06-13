// Plugin manager

import path from 'path'
import fs from 'fs/promises'
import AdmZip from 'adm-zip'
import mongoose from 'mongoose'
import { PLUGIN_CONFIG } from '@/lib/constants'
import { 
  generateId, 
  getErrorMessage, 
  ensureDir, 
  getFileExtension 
} from '@/lib/utils'
import { 
  InstalledPlugin,
  PluginConfig,
  PluginInstallOptions,
  PluginActivationOptions,
  PluginValidationResult,
  LoadedPlugin,
  PluginEvent,
  PluginBackup
} from '@/types/plugin'
import { pluginLoader } from './loader'
import { pluginRegistry } from './registry'
import { FileUpload, InstallationStatus } from '@/types/global'

// Mongoose document interfaces
interface IInstalledPluginDoc extends mongoose.Document {
  pluginId: string
  name: string
  version: string
  status: 'installed' | 'installing' | 'failed' | 'disabled'
  config: any
  installPath: string
  isActive: boolean
  manifest: any
  installedBy: string
  lastActivated?: Date
  lastDeactivated?: Date
  errorLog?: string[]
  createdAt: Date
  updatedAt: Date
}

// Mongoose schemas
const InstalledPluginSchema = new mongoose.Schema({
  pluginId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  version: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['installed', 'installing', 'failed', 'disabled'], 
    default: 'installing' 
  },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  installPath: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  manifest: { type: mongoose.Schema.Types.Mixed, required: true },
  installedBy: { type: String, required: true },
  lastActivated: { type: Date },
  lastDeactivated: { type: Date },
  errorLog: [{ type: String }],
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

const PluginBackupSchema = new mongoose.Schema({
  pluginId: { type: String, required: true },
  pluginName: { type: String, required: true },
  version: { type: String, required: true },
  config: { type: mongoose.Schema.Types.Mixed, required: true },
  backupPath: { type: String, required: true },
  backupType: { 
    type: String, 
    enum: ['manual', 'auto', 'migration'], 
    required: true 
  },
  createdBy: { type: String, required: true },
  restorable: { type: Boolean, default: true },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Mongoose models with proper typing
const InstalledPluginModel = (mongoose.models.InstalledPlugin as mongoose.Model<IInstalledPluginDoc>) || 
  mongoose.model<IInstalledPluginDoc>('InstalledPlugin', InstalledPluginSchema)

const PluginBackupModel = mongoose.models.PluginBackup ||
  mongoose.model('PluginBackup', PluginBackupSchema)

export class PluginManager {
  private installDir: string
  private uploadDir: string

  constructor() {
    this.installDir = path.join(process.cwd(), PLUGIN_CONFIG.INSTALL_DIR)
    this.uploadDir = path.join(process.cwd(), PLUGIN_CONFIG.UPLOAD_DIR)
  }

  async installPlugin(
    file: FileUpload,
    userId: string,
    options: PluginInstallOptions = {}
  ): Promise<{ success: boolean; pluginId?: string; message: string }> {
    const { overwrite = false, activate = false, skipValidation = false, backup = true } = options

    try {
      // Ensure directories exist
      await ensureDir(this.installDir)
      await ensureDir(this.uploadDir)

      // Validate file
      if (getFileExtension(file.filename) !== '.zip') {
        return { success: false, message: 'Plugin must be a ZIP file' }
      }

      if (file.size > PLUGIN_CONFIG.MAX_FILE_SIZE) {
        return { success: false, message: 'Plugin file is too large' }
      }

      // Extract plugin
      const extractPath = path.join(this.uploadDir, `extract_${generateId()}`)
      await this.extractPlugin(file.path, extractPath)

      try {
        // Validate plugin
        if (!skipValidation) {
          const validation = await pluginLoader.validatePlugin(extractPath)
          if (!validation.isValid) {
            await this.cleanup(extractPath)
            return { 
              success: false, 
              message: `Plugin validation failed: ${validation.errors.join(', ')}` 
            }
          }
        }

        // Load manifest
        const manifest = await pluginLoader.loadManifest(extractPath)
        const pluginId = manifest.id

        // Check if plugin already exists
        const existingPlugin = await InstalledPluginModel.findOne({ pluginId })

        if (existingPlugin && !overwrite) {
          await this.cleanup(extractPath)
          return { 
            success: false, 
            message: `Plugin ${pluginId} already exists. Use overwrite option to replace.` 
          }
        }

        // Backup existing plugin if requested
        if (existingPlugin && backup) {
          await this.backupPlugin(pluginId, userId, 'auto')
        }

        // Install plugin
        const finalPluginPath = path.join(this.installDir, pluginId)
        if (existingPlugin) {
          await this.removeDirectory(finalPluginPath)
        }
        await fs.rename(extractPath, finalPluginPath)

        // Create/update database record
        const pluginData = {
          pluginId,
          name: manifest.name,
          version: manifest.version,
          status: 'installed' as InstallationStatus,
          config: manifest.settings?.defaults || {},
          installPath: finalPluginPath,
          isActive: false,
          manifest,
          installedBy: userId,
        }

        if (existingPlugin) {
          await InstalledPluginModel.findOneAndUpdate({ pluginId }, pluginData)
        } else {
          await InstalledPluginModel.create(pluginData)
        }

        // Activate if requested
        if (activate) {
          await this.activatePlugin(pluginId, userId)
        }

        // Emit event
        await this.emitEvent({
          type: 'installed',
          pluginId,
          timestamp: new Date(),
          userId,
        })

        return { 
          success: true, 
          pluginId, 
          message: `Plugin ${manifest.name} installed successfully` 
        }
      } catch (error) {
        await this.cleanup(extractPath)
        throw error
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Installation failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async activatePlugin(
    pluginId: string,
    userId: string,
    options: PluginActivationOptions = {}
  ): Promise<{ success: boolean; message: string }> {
    const { preserveConfig = true, migrateSettings = false, backup = true } = options

    try {
      // Get plugin
      const plugin = await InstalledPluginModel.findOne({ pluginId })
      if (!plugin) {
        return { success: false, message: 'Plugin not found' }
      }

      if (plugin.isActive) {
        return { success: false, message: 'Plugin is already active' }
      }

      // Backup current config if requested
      if (backup) {
        await this.backupPlugin(pluginId, userId, 'auto')
      }

      // Load plugin to ensure it works
      const loadedPlugin = await pluginLoader.loadPlugin(pluginId)
      
      // Handle config migration
      let config = plugin.config
      if (!preserveConfig) {
        config = loadedPlugin.manifest.settings?.defaults || {}
      } else if (migrateSettings) {
        config = this.migrateConfig(
          plugin.config,
          loadedPlugin.manifest.settings?.defaults || {}
        )
      }

      // Activate plugin
      await InstalledPluginModel.findByIdAndUpdate(plugin._id, {
        isActive: true,
        config,
        lastActivated: new Date(),
      })

      // Activate in registry
      await pluginRegistry.activatePlugin(pluginId, config)

      // Emit event
      await this.emitEvent({
        type: 'activated',
        pluginId,
        timestamp: new Date(),
        userId,
      })

      return { 
        success: true, 
        message: `Plugin ${plugin.name} activated successfully` 
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Activation failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async deactivatePlugin(pluginId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const plugin = await InstalledPluginModel.findOne({ pluginId })
      if (!plugin) {
        return { success: false, message: 'Plugin not found' }
      }

      if (!plugin.isActive) {
        return { success: false, message: 'Plugin is not active' }
      }

      // Update database
      await InstalledPluginModel.findByIdAndUpdate(plugin._id, {
        isActive: false,
        lastDeactivated: new Date(),
      })

      // Deactivate in registry
      await pluginRegistry.deactivatePlugin(pluginId)

      // Emit event
      await this.emitEvent({
        type: 'deactivated',
        pluginId,
        timestamp: new Date(),
        userId,
      })

      return { success: true, message: 'Plugin deactivated successfully' }
    } catch (error) {
      return { 
        success: false, 
        message: `Deactivation failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async uninstallPlugin(pluginId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const plugin = await InstalledPluginModel.findOne({ pluginId })
      if (!plugin) {
        return { success: false, message: 'Plugin not found' }
      }

      // Deactivate if active
      if (plugin.isActive) {
        await this.deactivatePlugin(pluginId, userId)
      }

      // Remove from registry
      pluginRegistry.unloadPlugin(pluginId)

      // Remove from file system
      const pluginPath = path.join(this.installDir, pluginId)
      await this.removeDirectory(pluginPath)

      // Remove from database
      await InstalledPluginModel.findByIdAndDelete(plugin._id)

      // Remove backups
      await PluginBackupModel.deleteMany({ pluginId })

      // Emit event
      await this.emitEvent({
        type: 'uninstalled',
        pluginId,
        timestamp: new Date(),
        userId,
      })

      return { success: true, message: 'Plugin uninstalled successfully' }
    } catch (error) {
      return { 
        success: false, 
        message: `Uninstallation failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async configurePlugin(
    pluginId: string,
    config: Partial<PluginConfig>,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const plugin = await InstalledPluginModel.findOne({ pluginId })
      if (!plugin) {
        return { success: false, message: 'Plugin not found' }
      }

      // Merge configuration
      const newConfig = {
        ...plugin.config,
        ...config,
      }

      // Update database
      await InstalledPluginModel.findByIdAndUpdate(plugin._id, {
        config: newConfig,
      })

      // Update registry if plugin is loaded
      if (pluginRegistry.isPluginLoaded(pluginId)) {
        await pluginRegistry.updatePluginConfig(pluginId, config)
      }

      // Emit event
      await this.emitEvent({
        type: 'configured',
        pluginId,
        timestamp: new Date(),
        userId,
        metadata: { config },
      })

      return { success: true, message: 'Plugin configuration updated successfully' }
    } catch (error) {
      return { 
        success: false, 
        message: `Configuration failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async backupPlugin(
    pluginId: string,
    userId: string,
    backupType: 'manual' | 'auto' | 'migration' = 'manual'
  ): Promise<{ success: boolean; message: string; backupId?: string }> {
    try {
      const plugin = await InstalledPluginModel.findOne({ pluginId })
      if (!plugin) {
        return { success: false, message: 'Plugin not found' }
      }

      const backupId = generateId('backup')
      const backupsDir = path.join(this.uploadDir, 'backups')
      await ensureDir(backupsDir)
      
      const backupPath = path.join(backupsDir, `${backupId}.json`)

      const backup: PluginBackup = {
        _id: backupId,
        pluginId,
        pluginName: plugin.name,
        version: plugin.version,
        config: plugin.config,
        backupPath,
        backupType,
        createdBy: userId,
        createdAt: new Date(),
        restorable: true,
      }

      // Save backup to file
      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2))
      
      // Save backup record to database
      await PluginBackupModel.create(backup)

      return { 
        success: true, 
        message: 'Plugin backup created successfully',
        backupId 
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Backup failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async getInstalledPlugins(): Promise<InstalledPlugin[]> {
    const plugins = await InstalledPluginModel.find().sort({ createdAt: -1 }).lean<InstalledPlugin[]>()
    return plugins
  }

  async getActivePlugins(): Promise<InstalledPlugin[]> {
    const plugins = await InstalledPluginModel.find({ isActive: true }).sort({ createdAt: -1 }).lean<InstalledPlugin[]>()
    return plugins
  }

  async getPlugin(pluginId: string): Promise<InstalledPlugin | null> {
    const plugin = await InstalledPluginModel.findOne({ pluginId }).lean<InstalledPlugin>()
    return plugin
  }

  private async extractPlugin(zipPath: string, extractPath: string): Promise<void> {
    await ensureDir(extractPath)
    const zip = new AdmZip(zipPath)
    zip.extractAllTo(extractPath, true)
  }

  private async removeDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true })
    } catch {
      // Directory might not exist, ignore error
    }
  }

  private async cleanup(path: string): Promise<void> {
    await this.removeDirectory(path)
  }

  private migrateConfig(
    oldConfig: PluginConfig,
    newDefaults: PluginConfig
  ): PluginConfig {
    // Smart migration logic - preserve compatible settings
    const migrated = { ...newDefaults }
    
    // Merge compatible settings
    for (const key in oldConfig) {
      if (key in newDefaults) {
        migrated[key] = oldConfig[key]
      }
    }
    
    return migrated
  }

  private async emitEvent(event: PluginEvent): Promise<void> {
    // Event broadcasting through registry
    pluginRegistry.emit('pluginEvent', event)
  }
}

// Singleton instance
export const pluginManager = new PluginManager()
