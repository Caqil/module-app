// Plugin Validation Utilities
// src/lib/plugins/validation.ts

import { z } from 'zod'
import { 
  PluginManifest, 
  PluginValidationResult, 
  PluginPermission, 
  PluginCategory 
} from '@/types/plugin'
import { PLUGIN_CONFIG } from '@/lib/constants'

// Plugin manifest validation schema
const pluginManifestSchema = z.object({
  // Basic information
  id: z.string()
    .min(1, 'Plugin ID is required')
    .max(50, 'Plugin ID must be 50 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Plugin ID must be lowercase alphanumeric with hyphens only'),
  
  name: z.string()
    .min(1, 'Plugin name is required')
    .max(100, 'Plugin name must be 100 characters or less'),
  
  version: z.string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  
  description: z.string()
    .min(1, 'Plugin description is required')
    .max(500, 'Description must be 500 characters or less'),
  
  author: z.object({
    name: z.string().min(1, 'Author name is required'),
    email: z.string().email().optional(),
    url: z.string().url().optional(),
  }),
  
  license: z.string().min(1, 'License is required'),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  keywords: z.array(z.string()).default([]),
  
  // Categorization
  category: z.enum([
    'analytics', 'commerce', 'communication', 'content', 'integration',
    'security', 'utility', 'dashboard', 'reporting', 'social', 'marketing',
    'backup', 'seo', 'performance', 'development', 'other'
  ] as const),
  
  tags: z.array(z.string()).default([]),
  
  // Requirements
  requirements: z.object({
    nextjs: z.string().optional(),
    node: z.string().optional(),
    mongodb: z.string().optional(),
    plugins: z.array(z.string()).optional(),
  }).optional(),
  
  // Permissions
  permissions: z.array(z.enum([
    'database:read', 'database:write', 'api:create', 'admin:access',
    'users:read', 'users:write', 'files:read', 'files:write',
    'settings:read', 'settings:write', 'plugins:manage', 'themes:manage',
    'email:send', 'webhooks:create', 'cron:schedule'
  ] as const)).default([]),
  
  // Entry points
  entry: z.object({
    main: z.string().optional(),
    admin: z.string().optional(),
    frontend: z.string().optional(),
    api: z.string().optional(),
  }).optional(),
  
  // Routes
  routes: z.array(z.object({
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    handler: z.string(),
    middleware: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
    rateLimit: z.object({
      windowMs: z.number(),
      max: z.number(),
    }).optional(),
    validation: z.object({
      query: z.record(z.any()).optional(),
      body: z.record(z.any()).optional(),
      params: z.record(z.any()).optional(),
    }).optional(),
  })).optional(),
  
  // Admin pages
  adminPages: z.array(z.object({
    path: z.string(),
    title: z.string(),
    icon: z.string().optional(),
    component: z.string(),
    permissions: z.array(z.string()).optional(),
    order: z.number().optional(),
    parent: z.string().optional(),
  })).optional(),
  
  // Dashboard widgets
  dashboardWidgets: z.array(z.object({
    id: z.string(),
    title: z.string(),
    component: z.string(),
    size: z.enum(['small', 'medium', 'large', 'full']),
    permissions: z.array(z.string()).optional(),
    configurable: z.boolean().optional(),
    defaultConfig: z.record(z.any()).optional(),
    refreshInterval: z.number().optional(),
    category: z.string().optional(),
  })).optional(),
  
  // Hooks
  hooks: z.array(z.object({
    name: z.string(),
    callback: z.string(),
    priority: z.number().optional(),
    accepted: z.number().optional(),
    type: z.enum(['action', 'filter']).optional(),
  })).optional(),
  
  // Database
  database: z.object({
    collections: z.array(z.object({
      name: z.string(),
      schema: z.record(z.any()),
      indexes: z.array(z.object({
        fields: z.record(z.number()),
        options: z.record(z.any()).optional(),
      })).optional(),
    })).optional(),
    migrations: z.array(z.object({
      version: z.string(),
      description: z.string(),
      script: z.string(),
      rollback: z.string().optional(),
    })).optional(),
  }).optional(),
  
  // Assets
  assets: z.object({
    css: z.array(z.string()).optional(),
    js: z.array(z.string()).optional(),
    images: z.record(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
  }).optional(),
  
  // Settings
  settings: z.object({
    schema: z.record(z.object({
      type: z.enum(['string', 'number', 'boolean', 'array', 'object', 'select', 'multiselect', 'textarea', 'file']),
      title: z.string(),
      description: z.string().optional(),
      default: z.any().optional(),
      required: z.boolean().optional(),
      validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
        enum: z.array(z.any()).optional(),
        custom: z.string().optional(),
      }).optional(),
      options: z.array(z.object({
        label: z.string(),
        value: z.any(),
      })).optional(),
      depends: z.record(z.any()).optional(),
      group: z.string().optional(),
    })),
    defaults: z.record(z.any()),
  }).optional(),
  
  // Dependencies
  dependencies: z.object({
    plugins: z.record(z.string()).optional(),
    packages: z.record(z.string()).optional(),
  }).optional(),
  
  // Lifecycle
  lifecycle: z.object({
    install: z.string().optional(),
    activate: z.string().optional(),
    deactivate: z.string().optional(),
    uninstall: z.string().optional(),
    update: z.string().optional(),
  }).optional(),
  
  // Security
  security: z.object({
    csp: z.array(z.string()).optional(),
    sandbox: z.boolean().optional(),
    isolation: z.boolean().optional(),
  }).optional(),
  
  // Compatibility
  compatibility: z.object({
    themes: z.array(z.string()).optional(),
    plugins: z.array(z.string()).optional(),
    versions: z.array(z.string()).optional(),
  }).optional(),
})

/**
 * Validate plugin manifest structure
 */
export function validatePluginManifest(manifest: any): PluginValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Basic schema validation
    const validated = pluginManifestSchema.parse(manifest)
    
    // Additional business logic validation
    const additionalValidation = performAdditionalValidation(validated as any)
    errors.push(...additionalValidation.errors)
    warnings.push(...additionalValidation.warnings)
    
    // Security assessment
    const security = assessPluginSecurity(validated as any)
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      manifest: validated as any, // Let caller handle type conversion
      security
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodErrors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      errors.push(...zodErrors)
    } else {
      errors.push('Unknown validation error')
    }
    
    return {
      isValid: false,
      errors,
      warnings,
      security: {
        hasUnsafePermissions: true,
        riskLevel: 'high',
        recommendations: ['Manual security review required']
      }
    }
  }
}

/**
 * Perform additional business logic validation
 */
function performAdditionalValidation(manifest: PluginManifest): {
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate plugin ID uniqueness (this would check against database in real implementation)
  if (isReservedPluginId(manifest.id)) {
    errors.push(`Plugin ID '${manifest.id}' is reserved and cannot be used`)
  }

  // Validate route paths
  if (manifest.routes) {
    for (const route of manifest.routes) {
      if (!route.path.startsWith('/')) {
        errors.push(`Route path '${route.path}' must start with '/'`)
      }
      
      if (route.path.includes('..')) {
        errors.push(`Route path '${route.path}' contains invalid path traversal`)
      }
      
      // Check for reserved paths
      if (isReservedRoutePath(route.path)) {
        errors.push(`Route path '${route.path}' conflicts with system routes`)
      }
    }
  }

  // Validate admin pages
  if (manifest.adminPages) {
    const pagePaths = new Set<string>()
    for (const page of manifest.adminPages) {
      if (pagePaths.has(page.path)) {
        errors.push(`Duplicate admin page path: ${page.path}`)
      }
      pagePaths.add(page.path)
      
      if (isReservedAdminPath(page.path)) {
        errors.push(`Admin page path '${page.path}' conflicts with system pages`)
      }
    }
  }

  // Validate dashboard widgets
  if (manifest.dashboardWidgets) {
    const widgetIds = new Set<string>()
    for (const widget of manifest.dashboardWidgets) {
      if (widgetIds.has(widget.id)) {
        errors.push(`Duplicate dashboard widget ID: ${widget.id}`)
      }
      widgetIds.add(widget.id)
    }
  }

  // Validate database collections
  if (manifest.database?.collections) {
    const collectionNames = new Set<string>()
    for (const collection of manifest.database.collections) {
      if (collectionNames.has(collection.name)) {
        errors.push(`Duplicate database collection name: ${collection.name}`)
      }
      collectionNames.add(collection.name)
      
      if (isReservedCollectionName(collection.name)) {
        warnings.push(`Collection name '${collection.name}' may conflict with system collections`)
      }
    }
  }

  // Validate file paths
  if (manifest.entry) {
    for (const [key, path] of Object.entries(manifest.entry)) {
      if (path && (path.includes('..') || path.startsWith('/'))) {
        errors.push(`Entry point '${key}' has invalid path: ${path}`)
      }
    }
  }

  // Validate assets
  if (manifest.assets) {
    const validateAssetPaths = (paths: string[], type: string) => {
      for (const path of paths) {
        if (path.includes('..') || path.startsWith('/')) {
          errors.push(`Asset path in ${type} has invalid path: ${path}`)
        }
      }
    }
    
    if (manifest.assets.css) validateAssetPaths(manifest.assets.css, 'CSS')
    if (manifest.assets.js) validateAssetPaths(manifest.assets.js, 'JavaScript')
    if (manifest.assets.fonts) validateAssetPaths(manifest.assets.fonts, 'fonts')
  }

  // Check for excessive permissions
  if (manifest.permissions && manifest.permissions.length > 8) {
    warnings.push('Plugin requests a large number of permissions, consider reducing scope')
  }

  // Validate version requirements
  if (manifest.requirements?.nextjs) {
    if (!isValidVersionRange(manifest.requirements.nextjs)) {
      warnings.push(`Invalid Next.js version requirement: ${manifest.requirements.nextjs}`)
    }
  }

  // Check for missing essential information
  if (!manifest.homepage && !manifest.repository) {
    warnings.push('Consider adding homepage or repository URL for better plugin discovery')
  }

  if (manifest.keywords.length === 0) {
    warnings.push('Adding keywords will improve plugin searchability')
  }

  return { errors, warnings }
}

/**
 * Assess plugin security risks
 */
function assessPluginSecurity(manifest: PluginManifest): {
  hasUnsafePermissions: boolean
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
} {
  const recommendations: string[] = []
  const permissions = manifest.permissions || []
  
  // High-risk permissions
  const highRiskPermissions = [
    'database:write',
    'files:write', 
    'settings:write',
    'plugins:manage',
    'themes:manage',
    'cron:schedule'
  ]
  
  // Medium-risk permissions
  const mediumRiskPermissions = [
    'database:read',
    'admin:access',
    'users:write',
    'api:create',
    'webhooks:create'
  ]

  const hasHighRisk = permissions.some(p => highRiskPermissions.includes(p))
  const hasMediumRisk = permissions.some(p => mediumRiskPermissions.includes(p))
  const hasUnsafePermissions = hasHighRisk || hasMediumRisk

  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  
  if (hasHighRisk) {
    riskLevel = 'high'
    recommendations.push('Plugin requires high-risk permissions - thorough security review recommended')
    
    if (permissions.includes('database:write')) {
      recommendations.push('Ensure database operations are properly validated and sanitized')
    }
    
    if (permissions.includes('files:write')) {
      recommendations.push('Verify file operations are restricted to allowed directories')
    }
    
    if (permissions.includes('settings:write')) {
      recommendations.push('Monitor system settings changes carefully')
    }
  } else if (hasMediumRisk) {
    riskLevel = 'medium'
    recommendations.push('Plugin requires moderate permissions - review security implications')
    
    if (permissions.includes('admin:access')) {
      recommendations.push('Ensure admin functionality is properly protected')
    }
  }

  // Check for security configurations
  if (manifest.security?.csp) {
    recommendations.push('Plugin defines Content Security Policy - verify CSP rules are appropriate')
  }
  
  if (manifest.security?.sandbox === false) {
    recommendations.push('Plugin disables sandboxing - additional security review required')
  }

  // Check for external dependencies
  if (manifest.dependencies?.packages && Object.keys(manifest.dependencies.packages).length > 0) {
    recommendations.push('Review external package dependencies for security vulnerabilities')
  }

  // Check for file uploads
  if (manifest.settings?.schema) {
    const hasFileFields = Object.values(manifest.settings.schema).some(
      field => field.type === 'file'
    )
    if (hasFileFields) {
      recommendations.push('Plugin handles file uploads - ensure proper validation and sanitization')
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Plugin appears to follow security best practices')
  }

  return {
    hasUnsafePermissions,
    riskLevel,
    recommendations
  }
}

/**
 * Validate plugin configuration
 */
export function validatePluginConfig(
  config: Record<string, any>,
  schema: Record<string, any>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [key, fieldSchema] of Object.entries(schema)) {
    const value = config[key]
    
    // Check required fields
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldSchema.title || key} is required`)
      continue
    }
    
    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) continue
    
    // Type validation
    switch (fieldSchema.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldSchema.title || key} must be a string`)
        } else if (fieldSchema.validation?.pattern) {
          const regex = new RegExp(fieldSchema.validation.pattern)
          if (!regex.test(value)) {
            errors.push(`${fieldSchema.title || key} format is invalid`)
          }
        }
        break
        
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${fieldSchema.title || key} must be a number`)
        } else {
          if (fieldSchema.validation?.min !== undefined && value < fieldSchema.validation.min) {
            errors.push(`${fieldSchema.title || key} must be at least ${fieldSchema.validation.min}`)
          }
          if (fieldSchema.validation?.max !== undefined && value > fieldSchema.validation.max) {
            errors.push(`${fieldSchema.title || key} must be at most ${fieldSchema.validation.max}`)
          }
        }
        break
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${fieldSchema.title || key} must be true or false`)
        }
        break
        
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldSchema.title || key} must be an array`)
        }
        break
        
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${fieldSchema.title || key} must be an object`)
        }
        break
        
      case 'select':
        if (fieldSchema.options) {
          const validValues = fieldSchema.options.map((opt: any) => opt.value)
          if (!validValues.includes(value)) {
            errors.push(`${fieldSchema.title || key} must be one of: ${validValues.join(', ')}`)
          }
        }
        break
        
      case 'multiselect':
        if (!Array.isArray(value)) {
          errors.push(`${fieldSchema.title || key} must be an array`)
        } else if (fieldSchema.options) {
          const validValues = fieldSchema.options.map((opt: any) => opt.value)
          const invalidValues = value.filter(v => !validValues.includes(v))
          if (invalidValues.length > 0) {
            errors.push(`${fieldSchema.title || key} contains invalid values: ${invalidValues.join(', ')}`)
          }
        }
        break
    }
  }

  return { isValid: errors.length === 0, errors }
}

// Helper functions

function isReservedPluginId(id: string): boolean {
  const reservedIds = ['admin', 'api', 'auth', 'setup', 'system', 'core', 'default']
  return reservedIds.includes(id)
}

function isReservedRoutePath(path: string): boolean {
  const reservedPaths = ['/admin', '/api', '/auth', '/setup', '/_next']
  return reservedPaths.some(reserved => path.startsWith(reserved))
}

function isReservedAdminPath(path: string): boolean {
  const reservedPaths = ['dashboard', 'users', 'settings', 'plugins', 'themes']
  return reservedPaths.includes(path)
}

function isReservedCollectionName(name: string): boolean {
  const reservedNames = ['users', 'settings', 'sessions', 'installedplugins', 'installedthemes']
  return reservedNames.includes(name.toLowerCase())
}

function isValidVersionRange(version: string): boolean {
  // Simplified version validation - in production, use a proper semver library
  const versionRegex = /^[\d\.\>\<\=\^\~\s\-\|]+$/
  return versionRegex.test(version)
}

/**
 * Validate plugin file structure
 */
export function validatePluginStructure(files: string[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for required manifest file
  if (!files.includes(PLUGIN_CONFIG.MANIFEST_FILE)) {
    errors.push(`Missing required ${PLUGIN_CONFIG.MANIFEST_FILE} file`)
  }

  // Check for suspicious files
  const suspiciousFiles = ['.env', '.git', 'node_modules', '.DS_Store', 'Thumbs.db']
  const foundSuspicious = files.filter(file => 
    suspiciousFiles.some(suspicious => file.includes(suspicious))
  )
  
  if (foundSuspicious.length > 0) {
    warnings.push(`Suspicious files found: ${foundSuspicious.join(', ')}`)
  }

  // Check for executable files
  const executableExtensions = ['.exe', '.bat', '.sh', '.cmd', '.ps1']
  const executableFiles = files.filter(file =>
    executableExtensions.some(ext => file.toLowerCase().endsWith(ext))
  )
  
  if (executableFiles.length > 0) {
    errors.push(`Executable files not allowed: ${executableFiles.join(', ')}`)
  }

  // Check for oversized structure
  if (files.length > 1000) {
    warnings.push('Plugin contains a large number of files - consider optimizing')
  }

  // Check for deep nesting
  const maxDepth = Math.max(...files.map(file => file.split('/').length))
  if (maxDepth > 10) {
    warnings.push('Plugin has deeply nested directory structure')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export default {
  validatePluginManifest,
  validatePluginConfig,
  validatePluginStructure
}