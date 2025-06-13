
import path from 'path'
import fs from 'fs/promises'
import AdmZip from 'adm-zip'
import mongoose from 'mongoose'
import { THEME_CONFIG } from '@/lib/constants'
import { 
  generateId, 
  getErrorMessage, 
  ensureDir, 
  getFileExtension 
} from '@/lib/utils'
import { 
  InstalledTheme,
  ThemeCustomization,
  ThemeInstallOptions,
  ThemeActivationOptions,
  ThemeValidationResult,
  LoadedTheme,
  ThemeEvent,
  ThemeBackup
} from '@/types/theme'
import { themeLoader } from './loader'
import { themeRegistry } from './registry'
import { FileUpload, InstallationStatus } from '@/types/global'

// Database models
const InstalledThemeModel = mongoose.models.InstalledTheme || 
  mongoose.model('InstalledTheme', new mongoose.Schema({
    themeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    status: { type: String, enum: ['installed', 'installing', 'failed', 'disabled'], default: 'installing' },
    customization: { type: mongoose.Schema.Types.Mixed, default: {} },
    installPath: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    manifest: { type: mongoose.Schema.Types.Mixed, required: true },
    installedBy: { type: String, required: true },
    activatedAt: { type: Date },
    errorLog: [{ type: String }],
  }, { timestamps: true }))

const ThemeBackupModel = mongoose.models.ThemeBackup ||
  mongoose.model('ThemeBackup', new mongoose.Schema({
    themeId: { type: String, required: true },
    themeName: { type: String, required: true },
    version: { type: String, required: true },
    customization: { type: mongoose.Schema.Types.Mixed, required: true },
    backupPath: { type: String, required: true },
    backupType: { type: String, enum: ['manual', 'auto', 'migration'], required: true },
    createdBy: { type: String, required: true },
    restorable: { type: Boolean, default: true },
  }, { timestamps: true }))

const SystemSettingsModel = mongoose.models.SystemSettings ||
  mongoose.model('SystemSettings', new mongoose.Schema({
    activeTheme: { type: String },
  }, { timestamps: true }))

export class ThemeManager {
  private installDir: string
  private uploadDir: string

  constructor() {
    this.installDir = path.join(process.cwd(), THEME_CONFIG.INSTALL_DIR)
    this.uploadDir = path.join(process.cwd(), THEME_CONFIG.UPLOAD_DIR)
  }

  async installTheme(
    file: FileUpload,
    userId: string,
    options: ThemeInstallOptions = {}
  ): Promise<{ success: boolean; themeId?: string; message: string }> {
    const { overwrite = false, activate = false, skipValidation = false, backup = true } = options

    try {
      // Ensure directories exist
      await ensureDir(this.installDir)
      await ensureDir(this.uploadDir)

      // Validate file
      if (getFileExtension(file.filename) !== '.zip') {
        return { success: false, message: 'Theme must be a ZIP file' }
      }

      if (file.size > THEME_CONFIG.MAX_FILE_SIZE) {
        return { success: false, message: 'Theme file is too large' }
      }

      // Extract theme
      const extractPath = path.join(this.uploadDir, `extract_${generateId()}`)
      await this.extractTheme(file.path, extractPath)

      try {
        // Validate theme
        if (!skipValidation) {
          const validation = await themeLoader.validateTheme(extractPath)
          if (!validation.isValid) {
            await this.cleanup(extractPath)
            return { 
              success: false, 
              message: `Theme validation failed: ${validation.errors.join(', ')}` 
            }
          }
        }

        // Load manifest
        const manifest = await themeLoader.loadManifest(extractPath)
        const themeId = manifest.id

        // Check if theme already exists
        const existingTheme = await InstalledThemeModel.findOne({ themeId })

        if (existingTheme && !overwrite) {
          await this.cleanup(extractPath)
          return { 
            success: false, 
            message: `Theme ${themeId} already exists. Use overwrite option to replace.` 
          }
        }

        // Backup existing theme if requested
        if (existingTheme && backup) {
          await this.backupTheme(themeId, userId, 'auto')
        }

        // Install theme
        const finalThemePath = path.join(this.installDir, themeId)
        if (existingTheme) {
          await this.removeDirectory(finalThemePath)
        }
        await fs.rename(extractPath, finalThemePath)

        // Create/update database record
        const themeData = {
          themeId,
          name: manifest.name,
          version: manifest.version,
          status: 'installed' as InstallationStatus,
          customization: manifest.settings?.defaults || {},
          installPath: finalThemePath,
          isActive: false,
          manifest,
          installedBy: userId,
        }

        if (existingTheme) {
          await InstalledThemeModel.findOneAndUpdate({ themeId }, themeData)
        } else {
          await InstalledThemeModel.create(themeData)
        }

        // Activate if requested
        if (activate) {
          await this.activateTheme(themeId, userId)
        }

        // Emit event
        await this.emitEvent({
          type: 'installed',
          themeId,
          timestamp: new Date(),
          userId,
        })

        return { 
          success: true, 
          themeId, 
          message: `Theme ${manifest.name} installed successfully` 
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

  async activateTheme(
    themeId: string,
    userId: string,
    options: ThemeActivationOptions = {}
  ): Promise<{ success: boolean; message: string }> {
    const { preserveCustomization = true, migrateSettings = false, backup = true } = options

    try {
      // Get current active theme
      const currentActiveTheme = await InstalledThemeModel.findOne({ isActive: true })
      
      // Backup current theme if requested
      if (currentActiveTheme && backup) {
        await this.backupTheme(currentActiveTheme.themeId, userId, 'auto')
      }

      // Get new theme
      const newTheme = await InstalledThemeModel.findOne({ themeId })
      if (!newTheme) {
        return { success: false, message: 'Theme not found' }
      }

      // Load theme to ensure it works
      const loadedTheme = await themeLoader.loadTheme(themeId)
      
      // Deactivate current theme
      if (currentActiveTheme) {
        await InstalledThemeModel.findByIdAndUpdate(currentActiveTheme._id, {
          isActive: false,
        })

        await this.emitEvent({
          type: 'deactivated',
          themeId: currentActiveTheme.themeId,
          timestamp: new Date(),
          userId,
        })
      }

      // Handle customization migration
      let customization = newTheme.customization
      if (preserveCustomization && currentActiveTheme) {
        if (migrateSettings) {
          customization = this.migrateCustomization(
            currentActiveTheme.customization,
            customization
          )
        } else {
          customization = currentActiveTheme.customization
        }
      }

      // Activate new theme
      await InstalledThemeModel.findByIdAndUpdate(newTheme._id, {
        isActive: true,
        customization,
        activatedAt: new Date(),
      })

      // Update system settings
      await SystemSettingsModel.findOneAndUpdate(
        {},
        { activeTheme: themeId },
        { upsert: true }
      )

      // Activate in registry
      await themeRegistry.activateTheme(themeId, customization)

      // Emit event
      await this.emitEvent({
        type: 'activated',
        themeId,
        timestamp: new Date(),
        userId,
        metadata: { previousTheme: currentActiveTheme?.themeId },
      })

      return { 
        success: true, 
        message: `Theme ${newTheme.name} activated successfully` 
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Activation failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async deactivateTheme(themeId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const theme = await InstalledThemeModel.findOne({ themeId })
      if (!theme) {
        return { success: false, message: 'Theme not found' }
      }

      if (!theme.isActive) {
        return { success: false, message: 'Theme is not active' }
      }

      // Update database
      await InstalledThemeModel.findByIdAndUpdate(theme._id, {
        isActive: false,
      })

      // Update system settings
      await SystemSettingsModel.findOneAndUpdate(
        {},
        { $unset: { activeTheme: 1 } }
      )

      // Deactivate in registry
      await themeRegistry.deactivateTheme(themeId)

      // Emit event
      await this.emitEvent({
        type: 'deactivated',
        themeId,
        timestamp: new Date(),
        userId,
      })

      return { success: true, message: 'Theme deactivated successfully' }
    } catch (error) {
      return { 
        success: false, 
        message: `Deactivation failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async uninstallTheme(themeId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const theme = await InstalledThemeModel.findOne({ themeId })
      if (!theme) {
        return { success: false, message: 'Theme not found' }
      }

      // Check if theme is currently active
      if (theme.isActive) {
        return { 
          success: false, 
          message: 'Cannot uninstall active theme. Please activate another theme first.' 
        }
      }

      // Remove from registry
      themeRegistry.unloadTheme(themeId)

      // Remove from file system
      const themePath = path.join(this.installDir, themeId)
      await this.removeDirectory(themePath)

      // Remove from database
      await InstalledThemeModel.findByIdAndDelete(theme._id)

      // Remove backups
      await ThemeBackupModel.deleteMany({ themeId })

      // Emit event
      await this.emitEvent({
        type: 'uninstalled',
        themeId,
        timestamp: new Date(),
        userId,
      })

      return { success: true, message: 'Theme uninstalled successfully' }
    } catch (error) {
      return { 
        success: false, 
        message: `Uninstallation failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async customizeTheme(
    themeId: string,
    customization: Partial<ThemeCustomization>,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const theme = await InstalledThemeModel.findOne({ themeId })
      if (!theme) {
        return { success: false, message: 'Theme not found' }
      }

      // Merge customization
      const newCustomization = {
        ...theme.customization,
        ...customization,
      }

      // Update database
      await InstalledThemeModel.findByIdAndUpdate(theme._id, {
        customization: newCustomization,
      })

      // Update registry if theme is loaded
      if (themeRegistry.isThemeLoaded(themeId)) {
        await themeRegistry.updateThemeCustomization(themeId, customization)
      }

      // Emit event
      await this.emitEvent({
        type: 'customized',
        themeId,
        timestamp: new Date(),
        userId,
        metadata: { customization },
      })

      return { success: true, message: 'Theme customization updated successfully' }
    } catch (error) {
      return { 
        success: false, 
        message: `Customization failed: ${getErrorMessage(error)}` 
      }
    }
  }

  async backupTheme(
    themeId: string,
    userId: string,
    backupType: 'manual' | 'auto' | 'migration' = 'manual'
  ): Promise<{ success: boolean; message: string; backupId?: string }> {
    try {
      const theme = await InstalledThemeModel.findOne({ themeId })
      if (!theme) {
        return { success: false, message: 'Theme not found' }
      }

      const backupId = generateId('backup')
      const backupsDir = path.join(this.uploadDir, 'backups')
      await ensureDir(backupsDir)
      
      const backupPath = path.join(backupsDir, `${backupId}.json`)

      const backup: ThemeBackup = {
        _id: backupId,
        themeId,
        themeName: theme.name,
        version: theme.version,
        customization: theme.customization,
        backupPath,
        backupType,
        createdBy: userId,
        createdAt: new Date(),
        restorable: true,
      }

      // Save backup to file
      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2))
      
      // Save backup record to database
      await ThemeBackupModel.create(backup)

      return { 
        success: true, 
        message: 'Theme backup created successfully',
        backupId 
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Backup failed: ${getErrorMessage(error)}` 
      }
    }
  }

async getInstalledThemes(): Promise<InstalledTheme[]> {
  const themes = await InstalledThemeModel.find().sort({ createdAt: -1 }).lean<InstalledTheme[]>()
  return themes
}

async getActiveTheme(): Promise<InstalledTheme | null> {
  const theme = await InstalledThemeModel.findOne({ isActive: true }).lean<InstalledTheme>()
  return theme
}

async getTheme(themeId: string): Promise<InstalledTheme | null> {
  const theme = await InstalledThemeModel.findOne({ themeId }).lean<InstalledTheme>()
  return theme
}
  private async extractTheme(zipPath: string, extractPath: string): Promise<void> {
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

  private migrateCustomization(
    oldCustomization: ThemeCustomization,
    newDefaults: ThemeCustomization
  ): ThemeCustomization {
    // Smart migration logic - preserve compatible settings
    const migrated = { ...newDefaults }
    
    // Migrate colors if structure is compatible
    if (oldCustomization.colors && newDefaults.colors) {
      migrated.colors = { ...newDefaults.colors, ...oldCustomization.colors }
    }
    
    // Migrate typography if structure is compatible
    if (oldCustomization.typography && newDefaults.typography) {
      migrated.typography = { ...newDefaults.typography, ...oldCustomization.typography }
    }
    
    // Preserve custom CSS/JS
    if (oldCustomization.customCSS) {
      migrated.customCSS = oldCustomization.customCSS
    }
    
    if (oldCustomization.customJS) {
      migrated.customJS = oldCustomization.customJS
    }
    
    return migrated
  }

  private async emitEvent(event: ThemeEvent): Promise<void> {
    // Event broadcasting through registry
    themeRegistry.emit('themeEvent', event)
  }
}

// Singleton instance
export const themeManager = new ThemeManager()