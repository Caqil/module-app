// src/lib/database/models/settings.ts
// Fixed version that handles undefined mongoose.models (Edge Runtime compatible)

import { SystemSettings } from '@/types/global'
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISystemSettingsDocument extends Omit<SystemSettings, '_id'>, Document {
  _id: mongoose.Types.ObjectId
}

export interface ISystemSettingsModel extends Model<ISystemSettingsDocument> {
  getSettings(): Promise<ISystemSettingsDocument>
  updateSettings(updates: Partial<SystemSettings>): Promise<ISystemSettingsDocument>
  getSettingsOrDefault(): Promise<{ settings: ISystemSettingsDocument | null; isDefault: boolean }>
  initializeSettings(setupData: any): Promise<ISystemSettingsDocument>
  getSetting(key: keyof SystemSettings): Promise<any>
  setSetting(key: keyof SystemSettings, value: any): Promise<ISystemSettingsDocument>
}

const systemSettingsSchema = new Schema<ISystemSettingsDocument>({
  siteName: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true,
    maxlength: [200, 'Site name cannot exceed 200 characters'],
    default: 'Modular App',
  },
  siteDescription: {
    type: String,
    trim: true,
    maxlength: [1000, 'Site description cannot exceed 1000 characters'],
    default: 'A modular web application built with Next.js',
  },
  siteLogo: {
    type: String,
    default: null,
  },
  adminEmail: {
    type: String,
    required: [true, 'Admin email is required'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid admin email'],
  },
  isSetupComplete: {
    type: Boolean,
    default: false,
  },
  activeTheme: {
    type: String,
    default: null,
    ref: 'InstalledTheme',
  },
  allowUserRegistration: {
    type: Boolean,
    default: true,
  },
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  customCSS: {
    type: String,
    default: null,
  },
  customJS: {
    type: String,
    default: null,
  },
  seoSettings: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    metaKeywords: {
      type: String,
      maxlength: [200, 'Meta keywords cannot exceed 200 characters'],
    },
    ogImage: {
      type: String,
    },
  },
  emailSettings: {
    smtpHost: {
      type: String,
    },
    smtpPort: {
      type: Number,
      min: [1, 'SMTP port must be between 1 and 65535'],
      max: [65535, 'SMTP port must be between 1 and 65535'],
    },
    smtpUser: {
      type: String,
    },
    smtpPass: {
      type: String,
      select: false, // Don't include password in queries
    },
    fromEmail: {
      type: String,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid from email'],
    },
    fromName: {
      type: String,
    },
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v
      return ret
    }
  },
  toObject: { virtuals: true },
})

// Ensure only one settings document exists
systemSettingsSchema.index({}, { unique: true })

systemSettingsSchema.statics.getSettings = async function() {
  // Simply find and return, don't auto-create
  return await this.findOne()
}

systemSettingsSchema.statics.getSettingsOrDefault = async function() {
  const settings = await this.findOne()
  if (!settings) {
    // Return default data without creating database record
    return {
      settings: null,
      isDefault: true
    }
  }
  return {
    settings,
    isDefault: false
  }
}

// Add a new method for creating settings after setup
systemSettingsSchema.statics.initializeSettings = async function(setupData: any) {
  // Only create database record when setup is actually completed
  const settings = await this.create({
    siteName: setupData.siteName || 'Modular App',
    adminEmail: setupData.adminEmail,
    isSetupComplete: true,
    allowUserRegistration: setupData.allowUserRegistration ?? true,
    maintenanceMode: false,
    ...setupData
  })
  return settings
}

systemSettingsSchema.statics.updateSettings = async function(updates: Partial<SystemSettings>) {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create(updates)
  } else {
    Object.assign(settings, updates)
    await settings.save()
  }
  return settings
}

systemSettingsSchema.statics.getSetting = async function(key: keyof SystemSettings) {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({
      siteName: 'Modular App',
      adminEmail: 'admin@example.com',
      isSetupComplete: false,
    })
  }
  return settings[key]
}

systemSettingsSchema.statics.setSetting = async function(key: keyof SystemSettings, value: any) {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({ [key]: value })
  } else {
    settings[key] = value
    await settings.save()
  }
  return settings
}

// Safe model creation that handles Edge Runtime
function createSystemSettingsModel(): ISystemSettingsModel {
  // Check if we're in an environment where mongoose.models exists
  if (typeof mongoose?.models === 'object' && mongoose.models.SystemSettings) {
    return mongoose.models.SystemSettings as ISystemSettingsModel
  }
  
  // Create new model if possible (Node.js runtime)
  if (typeof mongoose?.model === 'function') {
    return mongoose.model<ISystemSettingsDocument, ISystemSettingsModel>('SystemSettings', systemSettingsSchema)
  }
  
  // If we can't create the model (Edge Runtime), return a proxy that throws meaningful errors
  return new Proxy({} as ISystemSettingsModel, {
    get(target, prop) {
      throw new Error(`SystemSettingsModel is not available in Edge Runtime. Use API routes instead.`)
    }
  })
}

export const SystemSettingsModel = createSystemSettingsModel()