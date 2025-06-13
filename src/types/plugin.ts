// ========================================
// src/types/plugin.ts - UPDATED WITH MERGED TYPES
// ========================================

import { BaseEntity, FileUpload, InstallationStatus } from "./global"

export interface PluginMetadata {
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
  category: PluginCategory
  compatibility: {
    nextjs: string
    app: string
  }
  dependencies: Record<string, string>
  permissions: PluginPermission[]
  screenshots?: string[]
  changelog?: PluginChangelog[]
}

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
  | 'other'

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

export interface PluginChangelog {
  version: string
  date: string
  changes: string[]
  breaking?: boolean
}

export interface PluginConfig {
  [key: string]: any
}

export interface PluginRoute {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  handler: string
  middleware?: string[]
  permissions?: PluginPermission[]
}

export interface PluginAdminPage {
  path: string
  title: string
  icon?: string
  component: string
  permissions?: PluginPermission[]
  order?: number
  parent?: string
}

export interface PluginSidebarItem {
  id: string
  title: string
  icon?: string
  href?: string
  permissions?: PluginPermission[]
  order?: number
  children?: PluginSidebarItem[]
}

export interface PluginDashboardWidget {
  id: string
  title: string
  component: string
  size: 'small' | 'medium' | 'large' | 'full'
  permissions?: PluginPermission[]
  order?: number
  refreshInterval?: number
}

export interface PluginHook {
  name: string
  handler: string
  priority?: number
}

export interface PluginManifest extends PluginMetadata {
  main: string
  routes?: PluginRoute[]
  adminPages?: PluginAdminPage[]
  sidebarItems?: PluginSidebarItem[]
  dashboardWidgets?: PluginDashboardWidget[]
  hooks?: PluginHook[]
  assets?: {
    css?: string[]
    js?: string[]
  }
  settings?: {
    schema: Record<string, any>
    defaults: PluginConfig
  }
}

export interface InstalledPlugin extends BaseEntity {
  pluginId: string
  name: string
  version: string
  status: InstallationStatus
  config: PluginConfig
  installPath: string
  isActive: boolean
  manifest: PluginManifest
  installedBy: string
  lastActivated?: Date
  lastDeactivated?: Date
  errorLog?: string[]
}

export interface PluginUpload {
  file: FileUpload
  overwrite?: boolean
  activate?: boolean
}

export interface PluginInstance {
  manifest: PluginManifest
  instance: any
  isLoaded: boolean
  loadedAt?: Date
  error?: string
}

export interface PluginRegistry {
  [pluginId: string]: PluginInstance
}

export interface PluginContext {
  pluginId: string
  config: PluginConfig
  database: any
  logger: any
  events: any
  api: {
    createRoute: (route: PluginRoute) => void
    addAdminPage: (page: PluginAdminPage) => void
    addSidebarItem: (item: PluginSidebarItem) => void
    addDashboardWidget: (widget: PluginDashboardWidget) => void
    registerHook: (hook: PluginHook) => void
  }
}

// ========================================
// MERGED TYPES FROM PLUGIN SYSTEM
// ========================================

// Plugin System Options
export interface PluginLoadOptions {
  force?: boolean
  skipCache?: boolean
  validateManifest?: boolean
}

export interface PluginInstallOptions {
  overwrite?: boolean
  activate?: boolean
  skipValidation?: boolean
  backup?: boolean
}

export interface PluginActivationOptions {
  preserveConfig?: boolean
  migrateSettings?: boolean
  backup?: boolean
}

export interface PluginValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  manifest?: PluginManifest
}

export interface PluginBackup extends BaseEntity {
  pluginId: string
  pluginName: string
  version: string
  config: PluginConfig
  backupPath: string
  backupType: 'manual' | 'auto' | 'migration'
  createdBy: string
  restorable: boolean
}

// Plugin Runtime Types
export interface PluginAssets {
  css: Map<string, string>
  js: Map<string, string>
  files: Map<string, string>
}

export interface PluginComponentMap {
  adminPages: Map<string, React.ComponentType<any>>
  dashboardWidgets: Map<string, React.ComponentType<any>>
  components: Map<string, React.ComponentType<any>>
}

export interface LoadedPlugin extends PluginInstance {
  assets: PluginAssets
  components: PluginComponentMap
  config: PluginConfig
  routes: Map<string, PluginRoute>
  adminPages: Map<string, PluginAdminPage>
  sidebarItems: PluginSidebarItem[]
  dashboardWidgets: Map<string, PluginDashboardWidget>
  hooks: Map<string, PluginHook[]>
  isActive: boolean
  lastUsed?: Date
  context?: PluginContext
}

export interface PluginRegistryState {
  plugins: Map<string, LoadedPlugin>
  activePlugins: Set<string>
  loading: Set<string>
  errors: Map<string, string>
  lastUpdated: Date
}

// Plugin Events and Hooks
export interface PluginEvent {
  type: 'installed' | 'activated' | 'deactivated' | 'uninstalled' | 'updated' | 'configured'
  pluginId: string
  timestamp: Date
  userId?: string
  metadata?: Record<string, any>
}

export interface PluginHookContext {
  pluginId: string
  event: PluginEvent
  currentPlugin?: LoadedPlugin
  previousPlugin?: LoadedPlugin
}

export type PluginHookFunction = (context: PluginHookContext) => Promise<void> | void

export interface PluginHooks {
  beforeInstall: PluginHookFunction[]
  afterInstall: PluginHookFunction[]
  beforeActivate: PluginHookFunction[]
  afterActivate: PluginHookFunction[]
  beforeDeactivate: PluginHookFunction[]
  afterDeactivate: PluginHookFunction[]
  beforeUninstall: PluginHookFunction[]
  afterUninstall: PluginHookFunction[]
  onConfigure: PluginHookFunction[]
}