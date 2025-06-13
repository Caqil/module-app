// ========================================
// src/types/theme.ts - UPDATED WITH MERGED TYPES
// ========================================

import { BaseEntity, FileUpload, InstallationStatus } from "./global"

export interface ThemeMetadata {
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
  tags: string[]
  category: ThemeCategory
  compatibility: {
    nextjs: string
    app: string
  }
  preview: {
    thumbnail: string
    screenshots?: string[]
    demo?: string
  }
  features: string[]
  changelog?: ThemeChangelog[]
}

export type ThemeCategory = 
  | 'business'
  | 'portfolio'
  | 'blog'
  | 'ecommerce'
  | 'landing'
  | 'dashboard'
  | 'minimal'
  | 'creative'
  | 'corporate'
  | 'other'

export interface ThemeChangelog {
  version: string
  date: string
  changes: string[]
  breaking?: boolean
}

export interface ThemeConfig {
  [key: string]: any
}

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  ring: string
  success: string
  warning: string
  error: string
  info: string
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[]
    serif: string[]
    mono: string[]
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
    '6xl': string
  }
  fontWeight: {
    thin: number
    light: number
    normal: number
    medium: number
    semibold: number
    bold: number
    extrabold: number
  }
  lineHeight: {
    tight: number
    normal: number
    relaxed: number
    loose: number
  }
}

export interface ThemeSpacing {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  '3xl': string
  '4xl': string
  '5xl': string
  '6xl': string
}

export interface ThemeLayout {
  container: {
    maxWidth: string
    padding: string
  }
  header: {
    height: string
    sticky: boolean
  }
  sidebar: {
    width: string
    collapsible: boolean
  }
  footer: {
    height: string
    sticky: boolean
  }
}

export interface ThemeCustomization {
  colors: Partial<ThemeColors>
  typography: Partial<ThemeTypography>
  spacing: Partial<ThemeSpacing>
  layout: Partial<ThemeLayout>
  borderRadius: string
  shadows: Record<string, string>
  animations: Record<string, any>
  customCSS?: string
  customJS?: string
}

export interface ThemeComponent {
  name: string
  component: string
  props?: Record<string, any>
  slots?: string[]
}

export interface ThemePage {
  path: string
  component: string
  layout?: string
  title?: string
  meta?: Record<string, any>
}

export interface ThemeManifest extends ThemeMetadata {
  main: string
  styles?: string[]
  scripts?: string[]
  components?: ThemeComponent[]
  pages?: ThemePage[]
  layouts?: {
    default: string
    admin: string
    auth: string
    [key: string]: string
  }
  settings?: {
    schema: Record<string, any>
    defaults: ThemeCustomization
  }
  assets?: {
    images?: string[]
    fonts?: string[]
    icons?: string[]
  }
}

export interface InstalledTheme extends BaseEntity {
  themeId: string
  name: string
  version: string
  status: InstallationStatus
  customization: ThemeCustomization
  installPath: string
  isActive: boolean
  manifest: ThemeManifest
  installedBy: string
  activatedAt?: Date
  errorLog?: string[]
}

export interface ThemeUpload {
  file: FileUpload
  overwrite?: boolean
  activate?: boolean
}

export interface ThemeInstance {
  manifest: ThemeManifest
  instance: any
  isLoaded: boolean
  loadedAt?: Date
  error?: string
}

export interface ThemeRegistry {
  [themeId: string]: ThemeInstance
}

export interface ThemeContext {
  themeId: string
  config: ThemeConfig
  customization: ThemeCustomization
  assets: {
    getImageUrl: (path: string) => string
    getFontUrl: (path: string) => string
    getIconUrl: (path: string) => string
  }
  api: {
    addComponent: (component: ThemeComponent) => void
    addPage: (page: ThemePage) => void
    setLayout: (name: string, component: string) => void
  }
}

export interface ActiveTheme {
  id: string
  name: string
  version: string
  customization: ThemeCustomization
  components: Map<string, any>
  pages: Map<string, any>
  layouts: Map<string, any>
}

// ========================================
// MERGED TYPES FROM THEME SYSTEM
// ========================================

// Theme System Options
export interface ThemeLoadOptions {
  force?: boolean
  skipCache?: boolean
  validateManifest?: boolean
}

export interface ThemeInstallOptions {
  overwrite?: boolean
  activate?: boolean
  skipValidation?: boolean
  backup?: boolean
}

export interface ThemeActivationOptions {
  preserveCustomization?: boolean
  migrateSettings?: boolean
  backup?: boolean
}

export interface ThemeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  manifest?: ThemeManifest
}

export interface ThemeBackup extends BaseEntity {
  themeId: string
  themeName: string
  version: string
  customization: ThemeCustomization
  backupPath: string
  backupType: 'manual' | 'auto' | 'migration'
  createdBy: string
  restorable: boolean
}

// Theme Runtime Types
export interface ThemeAssets {
  images: Map<string, string>
  fonts: Map<string, string>
  icons: Map<string, string>
  styles: Map<string, string>
  scripts: Map<string, string>
}

export interface ThemeComponentMap {
  layouts: Map<string, React.ComponentType<any>>
  pages: Map<string, React.ComponentType<any>>
  components: Map<string, React.ComponentType<any>>
}

export interface LoadedTheme extends ThemeInstance {
  assets: ThemeAssets
  components: ThemeComponentMap
  customization: ThemeCustomization
  isActive: boolean
  lastUsed?: Date
}

export interface ThemeRegistryState {
  themes: Map<string, LoadedTheme>
  activeTheme: string | null
  loading: Set<string>
  errors: Map<string, string>
  lastUpdated: Date
}

// Theme Events and Hooks
export interface ThemeEvent {
  type: 'installed' | 'activated' | 'deactivated' | 'uninstalled' | 'updated' | 'customized'
  themeId: string
  timestamp: Date
  userId?: string
  metadata?: Record<string, any>
}

export interface ThemeHookContext {
  themeId: string
  event: ThemeEvent
  currentTheme?: LoadedTheme
  previousTheme?: LoadedTheme
}

export type ThemeHook = (context: ThemeHookContext) => Promise<void> | void

export interface ThemeHooks {
  beforeInstall: ThemeHook[]
  afterInstall: ThemeHook[]
  beforeActivate: ThemeHook[]
  afterActivate: ThemeHook[]
  beforeDeactivate: ThemeHook[]
  afterDeactivate: ThemeHook[]
  beforeUninstall: ThemeHook[]
  afterUninstall: ThemeHook[]
  onCustomize: ThemeHook[]
}