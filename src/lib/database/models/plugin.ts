// src/lib/database/models/plugin.ts
// FIXED: Safe model creation that handles Edge Runtime

import { InstallationStatus } from '@/types/global'
import { InstalledPlugin, PluginBackup, PluginPermission } from '@/types/plugin'
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IInstalledPluginDocument extends Omit<InstalledPlugin, '_id'>, Document {
  _id: mongoose.Types.ObjectId
}

export interface IPluginBackupDocument extends Omit<PluginBackup, '_id'>, Document {
  _id: mongoose.Types.ObjectId
}

export interface IInstalledPluginModel extends Model<IInstalledPluginDocument> {
  findByPluginId(pluginId: string): Promise<IInstalledPluginDocument | null>
  findActivePlugins(): Promise<IInstalledPluginDocument[]>
  findByStatus(status: InstallationStatus): Promise<IInstalledPluginDocument[]>
  findByPermission(permission: PluginPermission): Promise<IInstalledPluginDocument[]>
  activatePlugin(pluginId: string): Promise<IInstalledPluginDocument | null>
  deactivatePlugin(pluginId: string): Promise<IInstalledPluginDocument | null>
}

export interface IPluginBackupModel extends Model<IPluginBackupDocument> {
  findByPluginId(pluginId: string): Promise<IPluginBackupDocument[]>
  findRestorable(): Promise<IPluginBackupDocument[]>
}

const installedPluginSchema = new Schema<IInstalledPluginDocument>({
  pluginId: {
    type: String,
    required: [true, 'Plugin ID is required'],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Plugin name is required'],
    trim: true,
    maxlength: [200, 'Plugin name cannot exceed 200 characters'],
  },
  version: {
    type: String,
    required: [true, 'Plugin version is required'],
    match: [/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'],
  },
  status: {
    type: String,
    enum: ['installed', 'installing', 'failed', 'disabled'],
    default: 'installing',
  },
  config: {
    type: Schema.Types.Mixed,
    default: {},
  },
  installPath: {
    type: String,
    required: [true, 'Install path is required'],
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  manifest: {
    type: Schema.Types.Mixed,
    required: [true, 'Plugin manifest is required'],
  },
  installedBy: {
    type: String,
    required: [true, 'Installer user ID is required'],
    ref: 'User',
  },
  lastActivated: {
    type: Date,
    default: null,
  },
  lastDeactivated: {
    type: Date,
    default: null,
  },
  errorLog: [{
    type: String,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Indexes for InstalledPlugin
installedPluginSchema.index({ status: 1 })
installedPluginSchema.index({ isActive: 1 })
installedPluginSchema.index({ installedBy: 1 })
installedPluginSchema.index({ createdAt: -1 })

// Static methods for InstalledPlugin
installedPluginSchema.statics.findByPluginId = function(pluginId: string) {
  return this.findOne({ pluginId })
}

installedPluginSchema.statics.findActivePlugins = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 })
}

installedPluginSchema.statics.findByStatus = function(status: InstallationStatus) {
  return this.find({ status }).sort({ createdAt: -1 })
}

installedPluginSchema.statics.findByPermission = function(permission: PluginPermission) {
  return this.find({ 
    'manifest.permissions': { $in: [permission] } 
  }).sort({ createdAt: -1 })
}

installedPluginSchema.statics.activatePlugin = function(pluginId: string) {
  return this.findOneAndUpdate(
    { pluginId },
    { 
      isActive: true, 
      lastActivated: new Date(),
      status: 'installed'
    },
    { new: true }
  )
}

installedPluginSchema.statics.deactivatePlugin = function(pluginId: string) {
  return this.findOneAndUpdate(
    { pluginId },
    { 
      isActive: false, 
      lastDeactivated: new Date()
    },
    { new: true }
  )
}

const pluginBackupSchema = new Schema<IPluginBackupDocument>({
  pluginId: {
    type: String,
    required: [true, 'Plugin ID is required'],
  },
  pluginName: {
    type: String,
    required: [true, 'Plugin name is required'],
  },
  version: {
    type: String,
    required: [true, 'Plugin version is required'],
  },
  config: {
    type: Schema.Types.Mixed,
    required: [true, 'Plugin config is required'],
  },
  backupPath: {
    type: String,
    required: [true, 'Backup path is required'],
  },
  backupType: {
    type: String,
    enum: ['manual', 'auto', 'migration'],
    required: [true, 'Backup type is required'],
  },
  createdBy: {
    type: String,
    required: [true, 'Creator user ID is required'],
    ref: 'User',
  },
  restorable: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Indexes for PluginBackup
pluginBackupSchema.index({ pluginId: 1 })
pluginBackupSchema.index({ createdAt: -1 })

// Static methods for PluginBackup
pluginBackupSchema.statics.findByPluginId = function(pluginId: string) {
  return this.find({ pluginId }).sort({ createdAt: -1 })
}

pluginBackupSchema.statics.findRestorable = function() {
  return this.find({ restorable: true }).sort({ createdAt: -1 })
}

// FIXED: Safe model creation functions that handle Edge Runtime
function createInstalledPluginModel(): IInstalledPluginModel {
  // Check if model already exists to prevent re-compilation
  if (mongoose.models && mongoose.models.InstalledPlugin) {
    return mongoose.models.InstalledPlugin as IInstalledPluginModel
  }
  
  // Only create model if we have mongoose.model function (Node.js runtime)
  if (typeof mongoose?.model === 'function') {
    try {
      return mongoose.model<IInstalledPluginDocument, IInstalledPluginModel>('InstalledPlugin', installedPluginSchema)
    } catch (error) {
      // If model creation fails, check if it already exists
      if (mongoose.models && mongoose.models.InstalledPlugin) {
        return mongoose.models.InstalledPlugin as IInstalledPluginModel
      }
      throw error
    }
  }
  
  // Fallback for Edge Runtime or other environments
  return new Proxy({} as IInstalledPluginModel, {
    get(target, prop) {
      throw new Error(`InstalledPluginModel.${String(prop)} is not available in this runtime environment. Use API routes instead.`)
    }
  })
}

function createPluginBackupModel(): IPluginBackupModel {
  // Check if model already exists to prevent re-compilation
  if (mongoose.models && mongoose.models.PluginBackup) {
    return mongoose.models.PluginBackup as IPluginBackupModel
  }
  
  // Only create model if we have mongoose.model function (Node.js runtime)
  if (typeof mongoose?.model === 'function') {
    try {
      return mongoose.model<IPluginBackupDocument, IPluginBackupModel>('PluginBackup', pluginBackupSchema)
    } catch (error) {
      // If model creation fails, check if it already exists
      if (mongoose.models && mongoose.models.PluginBackup) {
        return mongoose.models.PluginBackup as IPluginBackupModel
      }
      throw error
    }
  }
  
  // Fallback for Edge Runtime or other environments
  return new Proxy({} as IPluginBackupModel, {
    get(target, prop) {
      throw new Error(`PluginBackupModel.${String(prop)} is not available in this runtime environment. Use API routes instead.`)
    }
  })
}

// Export the models using safe creation functions
export const InstalledPluginModel = createInstalledPluginModel()
export const PluginBackupModel = createPluginBackupModel()

// Export the schemas for testing or other uses
export { installedPluginSchema, pluginBackupSchema }