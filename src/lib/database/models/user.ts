
import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'
import { UserRole } from '@/types/global'
import type { User } from '@/types/auth'
import { AUTH_CONFIG } from '@/lib/constants'

export interface IUserDocument extends Omit<User, '_id'>, Document {
  _id: mongoose.Types.ObjectId
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>
  generateResetToken(): string
  generateEmailVerificationToken(): string
  isAccountLocked(): boolean
  incrementLoginAttempts(): Promise<void>
  resetLoginAttempts(): Promise<void>
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
    unique: true, // This automatically creates an index - no need for separate index creation
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
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
    enum: ['user', 'moderator', 'admin'],
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
    required: true,
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
    notifications: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      default: 'en',
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
      return ret
    }
  },
  toObject: { virtuals: true },
})

// FIXED: Only create additional indexes that are actually needed
// Remove any duplicate index creation - unique: true already creates the email index

// Only create indexes for fields that will be queried frequently
// and don't already have indexes from unique: true or other constraints
userSchema.index({ role: 1 }) // For role-based queries
userSchema.index({ isActive: 1 }) // For active user queries
userSchema.index({ createdAt: -1 }) // For chronological sorting
userSchema.index({ lastLogin: -1 }) // For login activity queries
userSchema.index({ isEmailVerified: 1 }) // For verification queries

// Compound indexes for common query patterns
userSchema.index({ isActive: 1, role: 1 }) // For active users by role
userSchema.index({ isEmailVerified: 1, isActive: 1 }) // For verified active users

// Virtual for fullName
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`
})

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.generateResetToken = function(): string {
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15)
  
  this.resetPasswordToken = resetToken
  this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  
  return resetToken
}

userSchema.methods.generateEmailVerificationToken = function(): string {
  const verificationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15)
  
  this.emailVerificationToken = verificationToken
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  return verificationToken
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

// FIXED: Safe model creation that handles both Edge Runtime and regular Node.js
function createUserModel(): IUserModel {
  // Check if model already exists to prevent re-compilation
  if (mongoose.models && mongoose.models.User) {
    return mongoose.models.User as IUserModel
  }
  
  // Only create model if we have mongoose.model function (Node.js runtime)
  if (typeof mongoose?.model === 'function') {
    try {
      return mongoose.model<IUserDocument, IUserModel>('User', userSchema)
    } catch (error) {
      // If model creation fails, check if it already exists
      if (mongoose.models && mongoose.models.User) {
        return mongoose.models.User as IUserModel
      }
      throw error
    }
  }
  
  // Fallback for Edge Runtime or other environments
  return new Proxy({} as IUserModel, {
    get(target, prop) {
      throw new Error(`UserModel.${String(prop)} is not available in this runtime environment. Use API routes instead.`)
    }
  })
}

export const UserModel = createUserModel()

// Export the schema for testing or other uses
export { userSchema }