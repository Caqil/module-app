
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

const installedPluginSchema = new Schema<IInstalledPluginDocument>({
  pluginId: {
    type: String,
    required: [true, 'Plugin ID is required'],
    unique: true,
    trim: true,
    index: true,
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
    index: true,
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
    index: true,
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

// Indexes
installedPluginSchema.index({ pluginId: 1 })
installedPluginSchema.index({ status: 1 })
installedPluginSchema.index({ isActive: 1 })
installedPluginSchema.index({ createdAt: -1 })
installedPluginSchema.index({ 'manifest.permissions': 1 })

// Static methods
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
    'manifest.permissions': permission,
    isActive: true 
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
    index: true,
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

// Indexes
pluginBackupSchema.index({ pluginId: 1 })
pluginBackupSchema.index({ createdAt: -1 })

export const InstalledPluginModel = (mongoose.models.InstalledPlugin as IInstalledPluginModel) || 
  mongoose.model<IInstalledPluginDocument, IInstalledPluginModel>('InstalledPlugin', installedPluginSchema)

export const PluginBackupModel = mongoose.models.PluginBackup || 
  mongoose.model<IPluginBackupDocument>('PluginBackup', pluginBackupSchema)
