

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import { AUTH_CONFIG, REGEX_PATTERNS } from './constants'
import { JWTPayload } from '@/types/auth'

// Tailwind CSS utility function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// String utilities
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

export function generateId(prefix?: string): string {
  const id = crypto.randomBytes(16).toString('hex')
  return prefix ? `${prefix}_${id}` : id
}

export function generateSlug(): string {
  return crypto.randomBytes(8).toString('hex')
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH_CONFIG.BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateStrongPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '@$!%*?&'
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// JWT utilities
export function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN,
  })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
  } catch {
    return null
  }
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Date utilities
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
}

// File utilities
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase()
}

export function getFileName(filepath: string): string {
  return path.basename(filepath, path.extname(filepath))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

export async function deleteFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath)
  } catch {
    // File might not exist, ignore error
  }
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email)
}

export function isValidPassword(password: string): boolean {
  return REGEX_PATTERNS.PASSWORD.test(password)
}

export function isValidSlug(slug: string): boolean {
  return REGEX_PATTERNS.SLUG.test(slug)
}

export function isValidVersion(version: string): boolean {
  return REGEX_PATTERNS.VERSION.test(version)
}

export function isValidHexColor(color: string): boolean {
  return REGEX_PATTERNS.HEX_COLOR.test(color)
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Object utilities
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target } as T
  
  for (const key in source) {
    if (key in target || key in source) {
      const sourceValue = source[key]
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        const targetValue = result[key as keyof T]
        
        if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          (result as any)[key] = deepMerge(
            targetValue as Record<string, any>, 
            sourceValue as Record<string, any>
          )
        } else {
          (result as any)[key] = deepMerge(
            {} as Record<string, any>, 
            sourceValue as Record<string, any>
          )
        }
      } else if (sourceValue !== undefined) {
        (result as any)[key] = sourceValue
      }
    }
  }
  
  return result
}

// URL utilities
export function buildUrl(base: string, params: Record<string, any>): string {
  const url = new URL(base, process.env.NEXTAUTH_URL || 'http://localhost:3000')
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

// Error utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}

export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}