
import { InstallationStatus } from '@/types/global'
import { InstalledTheme, ThemeBackup } from '@/types/theme'
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IInstalledThemeDocument extends Omit<InstalledTheme, '_id'>, Document {
  _id: mongoose.Types.ObjectId
}

export interface IThemeBackupDocument extends Omit<ThemeBackup, '_id'>, Document {
  _id: mongoose.Types.ObjectId
}

export interface IInstalledThemeModel extends Model<IInstalledThemeDocument> {
  findByThemeId(themeId: string): Promise<IInstalledThemeDocument | null>
  findActiveTheme(): Promise<IInstalledThemeDocument | null>
  findByStatus(status: InstallationStatus): Promise<IInstalledThemeDocument[]>
  activateTheme(themeId: string): Promise<IInstalledThemeDocument | null>
  deactivateAll(): Promise<void>
}

const installedThemeSchema = new Schema<IInstalledThemeDocument>({
  themeId: {
    type: String,
    required: [true, 'Theme ID is required'],
    unique: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Theme name is required'],
    trim: true,
    maxlength: [200, 'Theme name cannot exceed 200 characters'],
  },
  version: {
    type: String,
    required: [true, 'Theme version is required'],
    match: [/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'],
  },
  status: {
    type: String,
    enum: ['installed', 'installing', 'failed', 'disabled'],
    default: 'installing',
    index: true,
  },
  customization: {
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
    required: [true, 'Theme manifest is required'],
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
  errorLog: [{
    type: String,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Indexes
installedThemeSchema.index({ themeId: 1 })
installedThemeSchema.index({ status: 1 })
installedThemeSchema.index({ isActive: 1 })
installedThemeSchema.index({ createdAt: -1 })

// Ensure only one theme can be active at a time
installedThemeSchema.pre('save', async function(next) {
  if (this.isModified('isActive') && this.isActive) {
    // Deactivate all other themes
    await this.model('InstalledTheme').updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    )
  }
  next()
})

// Static methods
installedThemeSchema.statics.findByThemeId = function(themeId: string) {
  return this.findOne({ themeId })
}

installedThemeSchema.statics.findActiveTheme = function() {
  return this.findOne({ isActive: true })
}

installedThemeSchema.statics.findByStatus = function(status: InstallationStatus) {
  return this.find({ status }).sort({ createdAt: -1 })
}

installedThemeSchema.statics.activateTheme = async function(themeId: string) {
  // Deactivate all themes first
  await this.updateMany({}, { isActive: false })
  
  // Activate the specified theme
  return this.findOneAndUpdate(
    { themeId },
    { 
      isActive: true, 
      activatedAt: new Date(),
      status: 'installed'
    },
    { new: true }
  )
}

installedThemeSchema.statics.deactivateAll = async function() {
  await this.updateMany({}, { isActive: false })
}

const themeBackupSchema = new Schema<IThemeBackupDocument>({
  themeId: {
    type: String,
    required: [true, 'Theme ID is required'],
    index: true,
  },
  themeName: {
    type: String,
    required: [true, 'Theme name is required'],
  },
  version: {
    type: String,
    required: [true, 'Theme version is required'],
  },
  customization: {
    type: Schema.Types.Mixed,
    required: [true, 'Theme customization is required'],
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
themeBackupSchema.index({ themeId: 1 })
themeBackupSchema.index({ createdAt: -1 })

export const InstalledThemeModel = (mongoose.models.InstalledTheme as IInstalledThemeModel) || 
  mongoose.model<IInstalledThemeDocument, IInstalledThemeModel>('InstalledTheme', installedThemeSchema)

export const ThemeBackupModel = mongoose.models.ThemeBackup || 
  mongoose.model<IThemeBackupDocument>('ThemeBackup', themeBackupSchema)
