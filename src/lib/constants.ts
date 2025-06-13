// Constants
// ========================================
// src/lib/constants.ts
// ========================================

import { InstallationStatus, UserRole } from "@/types/global"
import { PluginCategory, PluginPermission } from "@/types/plugin"
import { ThemeCategory } from "@/types/theme"


// Application Constants
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Modular App'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'A modular web application built with Next.js 15'

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SIGNIN: '/api/auth/signin',
    SIGNUP: '/api/auth/signup',
    SIGNOUT: '/api/auth/signout',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    PROFILE: '/api/auth/profile',
  },
  // Admin
  ADMIN: {
    USERS: '/api/admin/users',
    PLUGINS: '/api/admin/plugins',
    THEMES: '/api/admin/themes',
    SETTINGS: '/api/admin/settings',
    DASHBOARD: '/api/admin/dashboard',
  },
  // Setup
  SETUP: '/api/setup',
  // Plugin Routes
  PLUGIN_ROUTES: '/api/plugin-routes',
} as const

// Database Configuration
export const DB_CONFIG = {
  CONNECTION_TIMEOUT: 10000,
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 5,
  RETRY_WRITES: true,
  RETRY_READS: true,
} as const

// Authentication Configuration
export const AUTH_CONFIG = {
  JWT_EXPIRES_IN: '7d',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
  PASSWORD_RESET_EXPIRES_IN: '1h',
  EMAIL_VERIFICATION_EXPIRES_IN: '24h',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME: 2 * 60 * 60 * 1000, // 2 hours
  BCRYPT_ROUNDS: 12,
  SESSION_COOKIE_NAME: 'session-token',
  REFRESH_COOKIE_NAME: 'refresh-token',
} as const

// User Roles and Permissions
export const USER_ROLES: Record<UserRole, { label: string; level: number }> = {
  admin: { label: 'Administrator', level: 100 },
  moderator: { label: 'Moderator', level: 50 },
  user: { label: 'User', level: 10 },
} as const

export const DEFAULT_USER_PREFERENCES = {
  theme: 'system' as const,
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
}

// Plugin System Constants
export const PLUGIN_CONFIG = {
  UPLOAD_DIR: 'public/uploads/plugins',
  INSTALL_DIR: 'plugins/installed',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_EXTENSIONS: ['.zip'],
  MANIFEST_FILE: 'plugin.json',
  ENTRY_POINT: 'index.js',
  CACHE_TTL: 300000, // 5 minutes
} as const

export const PLUGIN_CATEGORIES: Record<PluginCategory, { label: string; icon: string }> = {
  analytics: { label: 'Analytics', icon: 'BarChart3' },
  commerce: { label: 'E-Commerce', icon: 'ShoppingCart' },
  communication: { label: 'Communication', icon: 'MessageSquare' },
  content: { label: 'Content Management', icon: 'FileText' },
  integration: { label: 'Integrations', icon: 'Zap' },
  security: { label: 'Security', icon: 'Shield' },
  utility: { label: 'Utilities', icon: 'Tool' },
  dashboard: { label: 'Dashboard', icon: 'Layout' },
  reporting: { label: 'Reporting', icon: 'FileBarChart' },
  other: { label: 'Other', icon: 'Package' },
} as const

export const PLUGIN_PERMISSIONS: Record<PluginPermission, { label: string; description: string; risk: 'low' | 'medium' | 'high' }> = {
  'database:read': { label: 'Database Read', description: 'Read data from the database', risk: 'medium' },
  'database:write': { label: 'Database Write', description: 'Write data to the database', risk: 'high' },
  'api:create': { label: 'API Creation', description: 'Create new API endpoints', risk: 'high' },
  'admin:access': { label: 'Admin Access', description: 'Access admin panel areas', risk: 'high' },
  'users:read': { label: 'Users Read', description: 'Read user information', risk: 'medium' },
  'users:write': { label: 'Users Write', description: 'Modify user information', risk: 'high' },
  'files:read': { label: 'Files Read', description: 'Read files from the system', risk: 'low' },
  'files:write': { label: 'Files Write', description: 'Write files to the system', risk: 'medium' },
  'settings:read': { label: 'Settings Read', description: 'Read system settings', risk: 'low' },
  'settings:write': { label: 'Settings Write', description: 'Modify system settings', risk: 'high' },
  'plugins:manage': { label: 'Plugin Management', description: 'Install/remove plugins', risk: 'high' },
  'themes:manage': { label: 'Theme Management', description: 'Install/remove themes', risk: 'medium' },
} as const

// Theme System Constants
export const THEME_CONFIG = {
  UPLOAD_DIR: 'public/uploads/themes',
  INSTALL_DIR: 'themes/installed',
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_EXTENSIONS: ['.zip'],
  MANIFEST_FILE: 'theme.json',
  ENTRY_POINT: 'index.js',
  DEFAULT_THEME: 'default',
  CACHE_TTL: 300000, // 5 minutes
} as const

export const THEME_CATEGORIES: Record<ThemeCategory, { label: string; icon: string }> = {
  business: { label: 'Business', icon: 'Briefcase' },
  portfolio: { label: 'Portfolio', icon: 'User' },
  blog: { label: 'Blog', icon: 'BookOpen' },
  ecommerce: { label: 'E-Commerce', icon: 'ShoppingBag' },
  landing: { label: 'Landing Page', icon: 'Rocket' },
  dashboard: { label: 'Dashboard', icon: 'LayoutDashboard' },
  minimal: { label: 'Minimal', icon: 'Minus' },
  creative: { label: 'Creative', icon: 'Palette' },
  corporate: { label: 'Corporate', icon: 'Building' },
  other: { label: 'Other', icon: 'Layers' },
} as const

export const DEFAULT_THEME_COLORS = {
  primary: '#0066cc',
  secondary: '#6b7280',
  accent: '#f59e0b',
  background: '#ffffff',
  foreground: '#111827',
  muted: '#f9fafb',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  input: '#ffffff',
  ring: '#0066cc',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const

// File Upload Constants
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: {
    PLUGIN: 50 * 1024 * 1024, // 50MB
    THEME: 100 * 1024 * 1024, // 100MB
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
  },
  ALLOWED_MIME_TYPES: {
    ARCHIVE: ['application/zip', 'application/x-zip-compressed'],
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    DOCUMENT: ['application/pdf', 'text/plain', 'application/msword'],
  },
  UPLOAD_DIRS: {
    PLUGINS: 'public/uploads/plugins',
    THEMES: 'public/uploads/themes',
    IMAGES: 'public/uploads/images',
    TEMP: 'public/uploads/temp',
  },
} as const

// System Status
export const INSTALLATION_STATUS: Record<InstallationStatus, { label: string; color: string; icon: string }> = {
  installed: { label: 'Installed', color: 'green', icon: 'CheckCircle' },
  installing: { label: 'Installing', color: 'yellow', icon: 'Loader' },
  failed: { label: 'Failed', color: 'red', icon: 'XCircle' },
  disabled: { label: 'Disabled', color: 'gray', icon: 'Pause' },
} as const

// Pagination
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  VERSION: /^\d+\.\d+\.\d+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed login attempts',
  INVALID_TOKEN: 'Invalid or expired token',
  PERMISSION_DENIED: 'Permission denied',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  PLUGIN_NOT_FOUND: 'Plugin not found',
  THEME_NOT_FOUND: 'Theme not found',
  INSTALLATION_FAILED: 'Installation failed',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
} as const
