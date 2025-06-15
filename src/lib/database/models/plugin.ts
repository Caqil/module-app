// Plugin Database Model
// src/lib/database/models/plugin.ts

import mongoose, { Schema, Document, Model } from 'mongoose'
import { InstallationStatus } from '@/types/global'
import { InstalledPlugin, PluginBackup, PluginManifest, PluginPermission, PluginCategory } from '@/types/plugin'

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
  findByCategory(category: PluginCategory): Promise<IInstalledPluginDocument[]>
  activatePlugin(pluginId: string): Promise<IInstalledPluginDocument | null>
  deactivatePlugin(pluginId: string): Promise<IInstalledPluginDocument | null>
  updatePluginConfig(pluginId: string, config: Record<string, any>): Promise<IInstalledPluginDocument | null>
  getPluginHooks(pluginId: string): Promise<any[]>
  getPluginRoutes(): Promise<{ pluginId: string; routes: string[] }[]>
}

const installedPluginSchema = new Schema<IInstalledPluginDocument>({
  pluginId: {
    type: String,
    required: [true, 'Plugin ID is required'],
    unique: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Plugin ID must be lowercase alphanumeric with hyphens'],
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
    enum: ['installed', 'installing', 'failed', 'disabled', 'updating'],
    default: 'installing',
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  manifest: {
    type: Schema.Types.Mixed,
    required: [true, 'Plugin manifest is required'],
    validate: {
      validator: function(v: any) {
        return v && typeof v === 'object' && v.id && v.name && v.version
      },
      message: 'Invalid manifest structure'
    }
  },
  config: {
    type: Schema.Types.Mixed,
    default: {},
  },
  installPath: {
    type: String,
    required: [true, 'Install path is required'],
  },
  uploadPath: {
    type: String,
    required: [true, 'Upload path is required'],
  },
  installedBy: {
    type: String,
    required: [true, 'Installer user ID is required'],
    ref: 'User',
  },
  activatedAt: {
    type: Date,
    default: null,
  },
  lastUsed: {
    type: Date,
    default: null,
  },
  errorLog: [{
    timestamp: { type: Date, default: Date.now },
    level: { type: String, enum: ['error', 'warning', 'info'], default: 'error' },
    message: { type: String, required: true },
    stack: { type: String },
    context: { type: Schema.Types.Mixed },
  }],
  hooks: [{
    name: { type: String, required: true },
    callback: { type: String, required: true },
    priority: { type: Number, default: 10 },
    accepted: { type: Number, default: 1 },
  }],
  routes: [{
    path: { type: String, required: true },
    method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], required: true },
    handler: { type: String, required: true },
    middleware: [{ type: String }],
    permissions: [{ type: String, enum: Object.keys({
      'database:read': true,
      'database:write': true,
      'api:create': true,
      'admin:access': true,
      'users:read': true,
      'users:write': true,
      'files:read': true,
      'files:write': true,
      'settings:read': true,
      'settings:write': true,
      'plugins:manage': true,
      'themes:manage': true,
    } as Record<PluginPermission, boolean>) }],
  }],
  adminPages: [{
    path: { type: String, required: true },
    title: { type: String, required: true },
    icon: { type: String, default: 'Package' },
    component: { type: String, required: true },
    permissions: [{ type: String }],
    order: { type: Number, default: 100 },
  }],
  dashboardWidgets: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    component: { type: String, required: true },
    size: { type: String, enum: ['small', 'medium', 'large', 'full'], default: 'medium' },
    permissions: [{ type: String }],
    configurable: { type: Boolean, default: false },
    defaultConfig: { type: Schema.Types.Mixed, default: {} },
  }],
  assets: {
    css: [{ type: String }],
    js: [{ type: String }],
    images: { type: Schema.Types.Mixed, default: {} },
    fonts: [{ type: String }],
  },
  dependencies: [{
    pluginId: { type: String, required: true },
    version: { type: String, required: true },
    required: { type: Boolean, default: true },
  }],
  database: {
    collections: [{
      name: { type: String, required: true },
      schema: { type: Schema.Types.Mixed, required: true },
      indexes: [{ type: Schema.Types.Mixed }],
    }],
    migrations: [{
      version: { type: String, required: true },
      script: { type: String, required: true },
      applied: { type: Boolean, default: false },
      appliedAt: { type: Date },
    }],
  },
  performance: {
    loadTime: { type: Number, default: 0 },
    memoryUsage: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 },
    lastMeasured: { type: Date, default: Date.now },
  },
  settings: {
    autoUpdate: { type: Boolean, default: false },
    priority: { type: Number, default: 10 },
    cacheEnabled: { type: Boolean, default: true },
    logLevel: { type: String, enum: ['debug', 'info', 'warn', 'error'], default: 'info' },
  },
  metadata: {
    downloadCount: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviews: { type: Number, default: 0 },
    lastChecked: { type: Date, default: Date.now },
    updateAvailable: { type: Boolean, default: false },
    updateVersion: { type: String },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Indexes for optimal performance
installedPluginSchema.index({ pluginId: 1 }, { unique: true })
installedPluginSchema.index({ status: 1 })
installedPluginSchema.index({ isActive: 1 })
installedPluginSchema.index({ 'manifest.category': 1 })
installedPluginSchema.index({ createdAt: -1 })
installedPluginSchema.index({ lastUsed: -1 })
installedPluginSchema.index({ 'performance.loadTime': 1 })

// Pre-save middleware
installedPluginSchema.pre('save', function(next) {
  // Update lastUsed when plugin is activated
  if (this.isModified('isActive') && this.isActive) {
    this.lastUsed = new Date()
    this.activatedAt = new Date()
  }
  
  // Reset activatedAt when deactivated
  if (this.isModified('isActive') && !this.isActive) {
    this.activatedAt = null
  }
  
  next()
})

// Virtual fields
installedPluginSchema.virtual('isOutdated').get(function() {
  return this.metadata.updateAvailable
})

installedPluginSchema.virtual('runtimeInfo').get(function() {
  return {
    isLoaded: this.isActive,
    hasErrors: this.errorLog.length > 0,
    lastError: this.errorLog[this.errorLog.length - 1] || null,
    routeCount: this.routes.length,
    hookCount: this.hooks.length,
  }
})

// Static methods
installedPluginSchema.statics.findByPluginId = function(pluginId: string) {
  return this.findOne({ pluginId })
}

installedPluginSchema.statics.findActivePlugins = function() {
  return this.find({ isActive: true, status: 'installed' }).sort({ 'settings.priority': 1 })
}

installedPluginSchema.statics.findByStatus = function(status: InstallationStatus) {
  return this.find({ status }).sort({ createdAt: -1 })
}

installedPluginSchema.statics.findByCategory = function(category: PluginCategory) {
  return this.find({ 'manifest.category': category }).sort({ name: 1 })
}

installedPluginSchema.statics.activatePlugin = async function(pluginId: string) {
  const plugin = await this.findOneAndUpdate(
    { pluginId, status: 'installed' },
    { 
      isActive: true,
      activatedAt: new Date(),
      lastUsed: new Date(),
    },
    { new: true }
  )
  
  if (plugin) {
    // Log activation
    await plugin.updateOne({
      $push: {
        errorLog: {
          level: 'info',
          message: `Plugin activated`,
          timestamp: new Date(),
        }
      }
    })
  }
  
  return plugin
}

installedPluginSchema.statics.deactivatePlugin = async function(pluginId: string) {
  const plugin = await this.findOneAndUpdate(
    { pluginId },
    { 
      isActive: false,
      activatedAt: null,
    },
    { new: true }
  )
  
  if (plugin) {
    // Log deactivation
    await plugin.updateOne({
      $push: {
        errorLog: {
          level: 'info',
          message: `Plugin deactivated`,
          timestamp: new Date(),
        }
      }
    })
  }
  
  return plugin
}

installedPluginSchema.statics.updatePluginConfig = function(pluginId: string, config: Record<string, any>) {
  return this.findOneAndUpdate(
    { pluginId },
    { config },
    { new: true }
  )
}

installedPluginSchema.statics.getPluginHooks = async function(pluginId: string) {
  const plugin = await this.findOne({ pluginId, isActive: true })
  return plugin ? plugin.hooks : []
}

installedPluginSchema.statics.getPluginRoutes = async function() {
  const plugins = await this.find({ isActive: true }, 'pluginId routes')
  return plugins.map((plugin: { pluginId: any; routes: any[] }) => ({
    pluginId: plugin.pluginId,
    routes: plugin.routes.map(route => route.path)
  }))
}

// Plugin Backup Schema
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
    required: [true, 'Plugin configuration is required'],
  },
  backupPath: {
    type: String,
    required: [true, 'Backup path is required'],
  },
  backupType: {
    type: String,
    enum: ['manual', 'auto', 'migration', 'update'],
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
  size: {
    type: Number,
    default: 0,
  },
  checksum: {
    type: String,
    required: [true, 'Backup checksum is required'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Indexes for PluginBackup
pluginBackupSchema.index({ pluginId: 1 })
pluginBackupSchema.index({ createdAt: -1 })
pluginBackupSchema.index({ backupType: 1 })

// Model creation with proper error handling
function createInstalledPluginModel(): IInstalledPluginModel {
  if (mongoose.models && mongoose.models.InstalledPlugin) {
    return mongoose.models.InstalledPlugin as IInstalledPluginModel
  }
  
  if (typeof mongoose?.model === 'function') {
    try {
      return mongoose.model<IInstalledPluginDocument, IInstalledPluginModel>('InstalledPlugin', installedPluginSchema)
    } catch (error) {
      if (mongoose.models && mongoose.models.InstalledPlugin) {
        return mongoose.models.InstalledPlugin as IInstalledPluginModel
      }
      throw error
    }
  }
  
  return new Proxy({} as IInstalledPluginModel, {
    get(target, prop) {
      throw new Error(`InstalledPluginModel.${String(prop)} is not available in this runtime environment. Use API routes instead.`)
    }
  })
}

export const InstalledPluginModel = createInstalledPluginModel()

export const PluginBackupModel = mongoose.models.PluginBackup || 
  mongoose.model<IPluginBackupDocument>('PluginBackup', pluginBackupSchema)

// Export schemas for testing
export { installedPluginSchema, pluginBackupSchema }