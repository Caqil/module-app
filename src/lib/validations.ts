// src/lib/validations.ts
// FIXED: Updated plugin validation schema to match type definitions

import { z } from 'zod'

// Basic validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  )

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')

// User validations
export const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(['admin', 'moderator', 'user']).default('user'),
})

export const createUserSchema = userSchema.extend({
  id: z.string().optional(),
  isEmailVerified: z.boolean().default(false),
  preferences: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
})

export const updateUserSchema = userSchema.partial().extend({
  id: z.string(),
})

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})
export const loginSchema = signinSchema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
})

export const registerSchema = signupSchema

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
})

// System validations
export const systemSettingsSchema = z.object({
  siteName: z.string().min(1).max(200),
  siteDescription: z.string().max(1000).optional(),
  siteLogo: z.string().url().optional(),
  adminEmail: emailSchema,
  isSetupComplete: z.boolean(),
  activeTheme: z.string().optional(),
  allowUserRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
  customCSS: z.string().optional(),
  customJS: z.string().optional(),
  seoSettings: z.object({
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    metaKeywords: z.string().max(200).optional(),
    ogImage: z.string().url().optional(),
  }),
  emailSettings: z.object({
    smtpHost: z.string().optional(),
    smtpPort: z.number().min(1).max(65535).optional(),
    smtpUser: z.string().optional(),
    smtpPass: z.string().optional(),
    fromEmail: emailSchema.optional(),
    fromName: z.string().optional(),
  }),
})

// Setup wizard validations
export const setupWizardSchema = z.object({
  step: z.enum(['welcome', 'admin', 'database']),
  data: z.record(z.any()),
})

export const setupAdminSchema = z.object({
  siteName: z.string().min(1).max(200),
  adminEmail: emailSchema,
  adminPassword: passwordSchema,
  adminFirstName: z.string().min(1).max(50),
  adminLastName: z.string().min(1).max(50),
})

export const setupDatabaseSchema = z.object({
  mongodbUri: z.string().optional(),
  testConnection: z.boolean().optional(),
})

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
})

// File upload validation
export const fileUploadSchema = z.object({
  maxSize: z.number().positive(),
  allowedTypes: z.array(z.string()),
  allowedExtensions: z.array(z.string()),
})

// FIXED: Plugin validations - Updated to match type definitions exactly
export const pluginManifestSchema = z.object({
  id: z.string().min(1, 'Plugin ID is required'),
  name: z.string().min(1, 'Plugin name is required').max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
  
  // FIXED: Author should be an object, not a string
  author: z.object({
    name: z.string().min(1, 'Author name is required'),
    email: z.string().email().optional(),
    url: z.string().url().optional(),
  }),
  
  license: z.string().min(1, 'License is required'),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  keywords: z.array(z.string()).default([]),
  
  // FIXED: Category should match the enum from types
  category: z.enum([
    'analytics',
    'commerce', 
    'communication',
    'content',
    'integration',
    'security',
    'utility',
    'dashboard',
    'reporting',
    'other'
  ]),
  
  // FIXED: Compatibility object with required fields
  compatibility: z.object({
    nextjs: z.string().min(1, 'Next.js compatibility is required'),
    app: z.string().min(1, 'App compatibility is required'),
  }),
  
  dependencies: z.record(z.string()).default({}),
  
  // FIXED: Permissions array
  permissions: z.array(z.enum([
    'database:read',
    'database:write',
    'api:create',
    'admin:access',
    'users:read',
    'users:write',
    'files:read',
    'files:write',
    'settings:read',
    'settings:write',
    'plugins:manage',
    'themes:manage'
  ])).default([]),
  
  screenshots: z.array(z.string()).optional(),
  changelog: z.array(z.object({
    version: z.string(),
    date: z.string(),
    changes: z.array(z.string()),
    breaking: z.boolean().optional(),
  })).optional(),
  
  // Required main entry point
  main: z.string().min(1, 'Main entry point is required'),
  
  // Optional plugin features
  routes: z.array(z.object({
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    handler: z.string(),
    middleware: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
  })).optional(),
  
  adminPages: z.array(z.object({
    path: z.string(),
    title: z.string(),
    icon: z.string().optional(),
    component: z.string(),
    permissions: z.array(z.string()).optional(),
    order: z.number().optional(),
    parent: z.string().optional(),
  })).optional(),
  
  sidebarItems: z.array(z.object({
    id: z.string(),
    title: z.string(),
    icon: z.string().optional(),
    href: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    order: z.number().optional(),
    children: z.array(z.object({
      id: z.string(),
      title: z.string(),
      href: z.string(),
      permissions: z.array(z.string()).optional(),
    })).optional(),
  })).optional(),
  
  dashboardWidgets: z.array(z.object({
    id: z.string(),
    title: z.string(),
    component: z.string(),
    size: z.enum(['small', 'medium', 'large', 'full']),
    permissions: z.array(z.string()).optional(),
    order: z.number().optional(),
    refreshInterval: z.number().optional(),
  })).optional(),
  
  hooks: z.array(z.object({
    name: z.string(),
    handler: z.string(),
    priority: z.number().optional(),
  })).optional(),
  
  assets: z.object({
    css: z.array(z.string()).optional(),
    js: z.array(z.string()).optional(),
  }).optional(),
  
  settings: z.object({
    schema: z.record(z.any()).optional(),
    defaults: z.record(z.any()).optional(),
  }).optional(),
})

export const pluginConfigurationSchema = z.object({
  enabled: z.boolean().default(true),
  settings: z.record(z.any()).default({}),
})

// Theme validations (for future implementation)
export const themeManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500),
  
  // FIXED: Theme author should also be an object for consistency
  author: z.object({
    name: z.string().min(1, 'Author name is required'),
    email: z.string().email().optional(),
    url: z.string().url().optional(),
  }),
  
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().max(50).optional(),
  keywords: z.array(z.string()).max(10).optional(),
  compatibility: z.object({
    minVersion: z.string().optional(),
    maxVersion: z.string().optional(),
  }).optional(),
  layouts: z.object({
    default: z.string().optional(),
    admin: z.string().optional(),
    auth: z.string().optional(),
  }).optional(),
  components: z.record(z.string()).optional(),
  customization: z.object({
    colors: z.record(z.string()).optional(),
    fonts: z.record(z.string()).optional(),
    spacing: z.record(z.string()).optional(),
    borders: z.record(z.string()).optional(),
    shadows: z.record(z.string()).optional(),
  }).optional(),
  assets: z.object({
    images: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    icons: z.array(z.string()).optional(),
  }).optional(),
})