// Plugin Type Definitions
// src/types/plugin.ts

import { InstallationStatus, FileUpload } from './global'

// Plugin Categories
export type PluginCategory =
  | 'analytics'
  | 'commerce'
  | 'communication'
  | 'content'
  | 'integration'
  | 'security'
  | 'utility'
  | 'dashboard'
  | 'reporting'
  | 'social'
  | 'marketing'
  | 'backup'
  | 'seo'
  | 'performance'
  | 'development'
  | 'other'

// Plugin Permissions
export type PluginPermission =
  | 'database:read'
  | 'database:write'
  | 'api:create'
  | 'admin:access'
  | 'users:read'
  | 'users:write'
  | 'files:read'
  | 'files:write'
  | 'settings:read'
  | 'settings:write'
  | 'plugins:manage'
  | 'themes:manage'
  | 'email:send'
  | 'webhooks:create'
  | 'cron:schedule'

// Plugin Manifest Structure
export interface PluginManifest {
  // Basic Information
  id: string
  name: string
  version: string
  description: string
  author: {
    name: string
    email?: string
    url?: string
  }
  license: string
  homepage?: string
  repository?: string
  keywords: string[]
  
  // Categorization
  category: PluginCategory
  tags: string[]
  
  // Requirements
  requirements: {
    nextjs?: string
    node?: string
    mongodb?: string
    plugins?: string[]
  }
  
  // Permissions
  permissions: PluginPermission[]
  
  // Entry Points
  entry: {
    main?: string
    admin?: string
    frontend?: string
    api?: string
  }
  
  // Routes Configuration
  routes?: PluginRoute[]
  
  // Admin Pages
  adminPages?: PluginAdminPage[]
  
  // Dashboard Widgets
  dashboardWidgets?: PluginDashboardWidget[]
  
  // Hooks and Filters
  hooks?: PluginHook[]
  
  // Database Schema
  database?: PluginDatabase
  
  // Assets
  assets?: {
    css?: string[]
    js?: string[]
    images?: Record<string, string>
    fonts?: string[]
  }
  
  // Configuration Schema
  settings?: {
    schema: Record<string, PluginConfigField>
    defaults: Record<string, any>
  }
  
  // Plugin Dependencies
  dependencies?: {
    plugins?: Record<string, string>
    packages?: Record<string, string>
  }
  
  // Lifecycle hooks
  lifecycle?: {
    install?: string
    activate?: string
    deactivate?: string
    uninstall?: string
    update?: string
  }
  
  // Security & Performance
  security?: {
    csp?: string[]
    sandbox?: boolean
    isolation?: boolean
  }
  
  // Compatibility
  compatibility?: {
    themes?: string[]
    plugins?: string[]
    versions?: string[]
  }
}

// Plugin Route Definition
export interface PluginRoute {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  handler: string
  middleware?: string[]
  permissions?: PluginPermission[]
  rateLimit?: {
    windowMs: number
    max: number
  }
  validation?: {
    query?: Record<string, any>
    body?: Record<string, any>
    params?: Record<string, any>
  }
}

// Plugin Admin Page
export interface PluginAdminPage {
  path: string
  title: string
  icon?: string
  component: string
  permissions?: PluginPermission[]
  order?: number
  parent?: string
  children?: PluginAdminPage[]
}

// Plugin Dashboard Widget
export interface PluginDashboardWidget {
  id: string
  title: string
  component: string
  size: 'small' | 'medium' | 'large' | 'full'
  permissions?: PluginPermission[]
  configurable?: boolean
  defaultConfig?: Record<string, any>
  refreshInterval?: number
  category?: string
}

// Plugin Hook Definition
export interface PluginHook {
  name: string
  callback: string
  priority?: number
  accepted?: number
  type?: 'action' | 'filter'
}

// Plugin Database Schema
export interface PluginDatabase {
  collections?: PluginCollection[]
  migrations?: PluginMigration[]
}

export interface PluginCollection {
  name: string
  schema: Record<string, any>
  indexes?: Array<{
    fields: Record<string, 1 | -1>
    options?: Record<string, any>
  }>
}

export interface PluginMigration {
  version: string
  description: string
  script: string
  rollback?: string
}

// Plugin Configuration Field
export interface PluginConfigField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'select' | 'multiselect' | 'textarea' | 'file'
  title: string
  description?: string
  default?: any
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    enum?: any[]
    custom?: string
  }
  options?: Array<{
    label: string
    value: any
  }>
  depends?: Record<string, any>
  group?: string
}

// Installed Plugin Interface
export interface InstalledPlugin {
  _id: string
  pluginId: string
  name: string
  version: string
  status: InstallationStatus
  isActive: boolean
  manifest: PluginManifest
  config: Record<string, any>
  installPath: string
  uploadPath: string
  installedBy: string
  activatedAt?: Date | null | undefined;
  lastUsed?: Date
  errorLog: PluginError[]
  hooks: PluginHookInstance[]
  routes: PluginRouteInstance[]
  adminPages: PluginAdminPageInstance[]
  dashboardWidgets: PluginDashboardWidgetInstance[]
  assets: PluginAssets
  dependencies: PluginDependency[]
  database: PluginDatabaseInstance
  performance: PluginPerformance
  settings: PluginSettings
  metadata: PluginMetadata
  createdAt: Date
  updatedAt: Date
}

// Plugin Error Log
export interface PluginError {
  timestamp: Date
  level: 'error' | 'warning' | 'info'
  message: string
  stack?: string
  context?: Record<string, any>
}

// Plugin Hook Instance
export interface PluginHookInstance {
  name: string
  callback: string
  priority: number
  accepted: number
}

// Plugin Route Instance
export interface PluginRouteInstance {
  path: string
  method: string
  handler: string
  middleware: string[]
  permissions: PluginPermission[]
}

// Plugin Admin Page Instance
export interface PluginAdminPageInstance {
  path: string
  title: string
  icon: string
  component: string
  permissions: PluginPermission[]
  order: number
}

// Plugin Dashboard Widget Instance
export interface PluginDashboardWidgetInstance {
  id: string
  title: string
  component: string
  size: string
  permissions: PluginPermission[]
  configurable: boolean
  defaultConfig: Record<string, any>
}

// Plugin Assets
export interface PluginAssets {
  css: string[]
  js: string[]
  images: Record<string, string>
  fonts: string[]
}

// Plugin Dependency
export interface PluginDependency {
  pluginId: string
  version: string
  required: boolean
}

// Plugin Database Instance
export interface PluginDatabaseInstance {
  collections: Array<{
    name: string
    schema: Record<string, any>
    indexes: Array<Record<string, any>>
  }>
  migrations: Array<{
    version: string
    script: string
    applied: boolean
    appliedAt?: Date
  }>
}

// Plugin Performance Metrics
export interface PluginPerformance {
  loadTime: number
  memoryUsage: number
  apiCalls: number
  lastMeasured: Date
}

// Plugin Settings
export interface PluginSettings {
  autoUpdate: boolean
  priority: number
  cacheEnabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

// Plugin Metadata
export interface PluginMetadata {
  downloadCount: number
  rating: number
  reviews: number
  lastChecked: Date
  updateAvailable: boolean
  updateVersion?: string
}

// Plugin Backup
export interface PluginBackup {
  _id: string
  pluginId: string
  pluginName: string
  version: string
  config: Record<string, any>
  backupPath: string
  backupType: 'manual' | 'auto' | 'migration' | 'update'
  createdBy: string
  restorable: boolean
  size: number
  checksum: string
  createdAt: Date
  updatedAt: Date
}

// Plugin Installation Options
export interface PluginInstallOptions {
  overwrite?: boolean
  activate?: boolean
  skipValidation?: boolean
  backup?: boolean
  migrate?: boolean
}

// Plugin Activation Options
export interface PluginActivationOptions {
  skipDependencyCheck?: boolean
  forceActivate?: boolean
}

// Plugin Validation Result
export interface PluginValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  manifest?: PluginManifest
  security?: {
    hasUnsafePermissions: boolean
    riskLevel: 'low' | 'medium' | 'high'
    recommendations: string[]
  }
}

// Loaded Plugin (runtime representation)
export interface LoadedPlugin {
  manifest: PluginManifest
  isActive: boolean
  loadedAt: Date
  instance?: any
  components?: {
    adminPages?: Map<string, React.ComponentType<any>>
    dashboardWidgets?: Map<string, React.ComponentType<any>>
    components?: Map<string, React.ComponentType<any>>
  }
  api?: {
    routes?: Map<string, Function>
    hooks?: Map<string, Function>
    middleware?: Map<string, Function>
  }
  database?: {
    models?: Map<string, any>
    connections?: Map<string, any>
  }
  error?: Error
}

// Plugin Event Types
export type PluginEvent = 
  | 'plugin:installed'
  | 'plugin:activated'
  | 'plugin:deactivated'
  | 'plugin:updated'
  | 'plugin:uninstalled'
  | 'plugin:error'
  | 'plugin:loaded'
  | 'plugin:config_changed'

// Plugin Event Data
export interface PluginEventData {
  pluginId: string
  pluginName: string
  version: string
  timestamp: Date
  userId?: string
  data?: Record<string, any>
  error?: Error
}

// Plugin Manager Interface
export interface PluginManagerInterface {
  // Installation
  installPlugin(file: FileUpload, userId: string, options?: PluginInstallOptions): Promise<{ success: boolean; pluginId?: string; error?: string }>
  uninstallPlugin(pluginId: string, userId: string): Promise<{ success: boolean; error?: string }>
  
  // Activation
  activatePlugin(pluginId: string, options?: PluginActivationOptions): Promise<{ success: boolean; error?: string }>
  deactivatePlugin(pluginId: string): Promise<{ success: boolean; error?: string }>
  
  // Configuration
  updatePluginConfig(pluginId: string, config: Record<string, any>): Promise<{ success: boolean; error?: string }>
  getPluginConfig(pluginId: string): Promise<Record<string, any> | null>
  
  // Query
  getPlugin(pluginId: string): Promise<InstalledPlugin | null>
  getActivePlugins(): Promise<InstalledPlugin[]>
  getAllPlugins(): Promise<InstalledPlugin[]>
  
  // Validation
  validatePlugin(file: FileUpload): Promise<PluginValidationResult>
  validateManifest(manifest: any): Promise<PluginValidationResult>
  
  // Backup & Restore
  backupPlugin(pluginId: string, type: 'manual' | 'auto'): Promise<{ success: boolean; backupId?: string; error?: string }>
  restorePlugin(backupId: string): Promise<{ success: boolean; error?: string }>
  
  // Events
  on(event: PluginEvent, listener: (data: PluginEventData) => void): void
  emit(event: PluginEvent, data: PluginEventData): void
}

// Plugin Registry Interface
export interface PluginRegistryInterface {
  registerPlugin(plugin: LoadedPlugin): void
  unregisterPlugin(pluginId: string): void
  getPlugin(pluginId: string): LoadedPlugin | null
  getActivePlugins(): LoadedPlugin[]
  getAllPlugins(): LoadedPlugin[]
  isPluginLoaded(pluginId: string): boolean
  getPluginRoutes(): Map<string, LoadedPlugin>
  getPluginHooks(): Map<string, LoadedPlugin[]>
  clearRegistry(): void
}

// Plugin Loader Interface
export interface PluginLoaderInterface {
  loadPlugin(plugin: InstalledPlugin): Promise<LoadedPlugin>
  unloadPlugin(pluginId: string): Promise<void>
  reloadPlugin(pluginId: string): Promise<LoadedPlugin>
  loadAllActivePlugins(): Promise<LoadedPlugin[]>
  validatePluginStructure(pluginPath: string): Promise<PluginValidationResult>
}

// Plugin Hook System
export interface PluginHookSystem {
  addAction(hookName: string, callback: Function, priority?: number): void
  addFilter(hookName: string, callback: Function, priority?: number): void
  doAction(hookName: string, ...args: any[]): Promise<void>
  applyFilters(hookName: string, value: any, ...args: any[]): Promise<any>
  removeAction(hookName: string, callback: Function): void
  removeFilter(hookName: string, callback: Function): void
  hasAction(hookName: string): boolean
  hasFilter(hookName: string): boolean
  getHooks(type?: 'action' | 'filter'): Map<string, Function[]>
}

// Plugin API Context
export interface PluginAPIContext {
  database: any
  user?: any
  request?: any
  response?: any
  config: Record<string, any>
  logger: {
    debug: (message: string, meta?: any) => void
    info: (message: string, meta?: any) => void
    warn: (message: string, meta?: any) => void
    error: (message: string, meta?: any) => void
  }
  hooks: PluginHookSystem
  registry: PluginRegistryInterface
  utils: {
    hash: (data: string) => string
    encrypt: (data: string) => string
    decrypt: (data: string) => string
    validateEmail: (email: string) => boolean
    slugify: (text: string) => string
    formatDate: (date: Date, format?: string) => string
  }
}

export default PluginManifest