
import { ObjectId } from 'mongoose'

export interface BaseEntity {
  _id?: ObjectId | string
  createdAt?: Date
  updatedAt?: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    current: number
    total: number
    pages: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface FileUpload {
  filename: string
  originalName: string
  mimetype: string
  size: number
  path: string
  buffer?: Buffer
}

export interface SystemSettings extends BaseEntity {
  siteName: string
  siteDescription?: string
  siteLogo?: string
  adminEmail: string
  isSetupComplete: boolean
  activeTheme?: string
  allowUserRegistration: boolean
  maintenanceMode: boolean
  customCSS?: string
  customJS?: string
  seoSettings: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
    ogImage?: string
  }
  emailSettings: {
    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
    smtpPass?: string
    fromEmail?: string
    fromName?: string
  }
}

export type UserRole = 'admin' | 'user' | 'moderator'
export type SystemStatus = 'active' | 'inactive' | 'maintenance'
export type InstallationStatus = 'installed' | 'installing' | 'failed' | 'disabled'
