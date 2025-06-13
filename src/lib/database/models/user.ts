// User model - Fixed duplicate index issue
// src/lib/database/models/user.ts

import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'
import { AUTH_CONFIG, DEFAULT_USER_PREFERENCES, USER_ROLES } from '@/lib/constants'
import { UserRole } from '@/types/global'
import { User } from '@/types/auth'

export interface IUserDocument extends Omit<User, '_id'>, Document {
  _id: mongoose.Types.ObjectId
  comparePassword(candidatePassword: string): Promise<boolean>
  generateResetToken(): string
  generateEmailVerificationToken(): string
  isAccountLocked(): boolean
  incrementLoginAttempts(): Promise<void>
  resetLoginAttempts(): Promise<void>
  toJSON(): any
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>
  findActiveUsers(): Promise<IUserDocument[]>
  findByRole(role: UserRole): Promise<IUserDocument[]>
  createUser(userData: Partial<User>): Promise<IUserDocument>
}

const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // This already creates an index
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  avatar: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: Object.keys(USER_ROLES) as UserRole[],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
    select: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    default: null,
    select: false,
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: DEFAULT_USER_PREFERENCES.theme,
    },
    language: {
      type: String,
      default: DEFAULT_USER_PREFERENCES.language,
    },
    timezone: {
      type: String,
      default: DEFAULT_USER_PREFERENCES.timezone,
    },
    notifications: {
      email: {
        type: Boolean,
        default: DEFAULT_USER_PREFERENCES.notifications.email,
      },
      push: {
        type: Boolean,
        default: DEFAULT_USER_PREFERENCES.notifications.push,
      },
      sms: {
        type: Boolean,
        default: DEFAULT_USER_PREFERENCES.notifications.sms,
      },
    },
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password
      delete ret.resetPasswordToken
      delete ret.resetPasswordExpires
      delete ret.emailVerificationToken
      delete ret.emailVerificationExpires
      delete ret.__v
      return ret
    }
  },
  toObject: { virtuals: true },
})

// Indexes - Remove the duplicate email index since unique: true already creates one
// userSchema.index({ email: 1 }) // ← REMOVED - This was causing the duplicate index warning
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ lastLogin: -1 })

// Virtual for full name
userSchema.virtual('fullName').get(function(this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`
})

// Virtual for account locked status
userSchema.virtual('isLocked').get(function(this: IUserDocument) {
  return this.lockUntil ? this.lockUntil > new Date() : false
})

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    this.password = await bcrypt.hash(this.password, AUTH_CONFIG.BCRYPT_ROUNDS)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Password comparison failed')
  }
}

userSchema.methods.generateResetToken = function(): string {
  const crypto = require('crypto')
  const token = crypto.randomBytes(32).toString('hex')
  this.resetPasswordToken = token
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  return token
}

userSchema.methods.generateEmailVerificationToken = function(): string {
  const crypto = require('crypto')
  const token = crypto.randomBytes(32).toString('hex')
  this.emailVerificationToken = token
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  return token
}

userSchema.methods.isAccountLocked = function(): boolean {
  return this.lockUntil ? this.lockUntil > new Date() : false
}

userSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    })
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } }
  
  if (this.loginAttempts + 1 >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS && !this.isAccountLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + AUTH_CONFIG.LOCK_TIME) }
  }
  
  return this.updateOne(updates)
}

userSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  })
}

// Static methods
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() })
}

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 })
}

userSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role }).sort({ createdAt: -1 })
}

userSchema.statics.createUser = async function(userData: Partial<User>) {
  const user = new this(userData)
  return user.save()
}

export const UserModel = (mongoose.models.User as IUserModel) || 
  mongoose.model<IUserDocument, IUserModel>('User', userSchema)