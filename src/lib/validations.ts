// Validations

import { z } from 'zod'
import { REGEX_PATTERNS, USER_ROLES } from './constants'
import { UserRole } from '@/types/global'

// Common validations
export const idSchema = z.string().min(1, 'ID is required')
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    REGEX_PATTERNS.PASSWORD,
    'Password must contain uppercase, lowercase, number, and special character'
  )

export const slugSchema = z
  .string()
  .regex(REGEX_PATTERNS.SLUG, 'Invalid slug format')

export const versionSchema = z
  .string()
  .regex(REGEX_PATTERNS.VERSION, 'Version must be in format x.y.z')

export const hexColorSchema = z
  .string()
  .regex(REGEX_PATTERNS.HEX_COLOR, 'Invalid hex color format')

// Auth validations
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

// User validations
export const userRoleSchema = z.enum(Object.keys(USER_ROLES) as [UserRole, ...UserRole[]])

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: userRoleSchema.optional().default('user'),
})

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    }).optional(),
  }).optional(),
})

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().min(2).max(5),
  timezone: z.string(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
})

// Plugin validations
export const pluginCategorySchema = z.enum([
  'analytics', 'commerce', 'communication', 'content', 'integration',
  'security', 'utility', 'dashboard', 'reporting', 'other'
] as const)

export const pluginPermissionSchema = z.enum([
  'database:read', 'database:write', 'api:create', 'admin:access',
  'users:read', 'users:write', 'files:read', 'files:write',
  'settings:read', 'settings:write', 'plugins:manage', 'themes:manage'
] as const)

export const pluginMetadataSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  version: versionSchema,
  description: z.string().min(1).max(1000),
  author: z.object({
    name: z.string().min(1).max(100),
    email: emailSchema.optional(),
    url: z.string().url().optional(),
  }),
  license: z.string().min(1).max(50),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  keywords: z.array(z.string()).max(20),
  category: pluginCategorySchema,
  compatibility: z.object({
    nextjs: z.string(),
    app: z.string(),
  }),
  dependencies: z.record(z.string()),
  permissions: z.array(pluginPermissionSchema),
  screenshots: z.array(z.string().url()).optional(),
})

export const pluginRouteSchema = z.object({
  path: z.string().startsWith('/'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  handler: z.string(),
  middleware: z.array(z.string()).optional(),
  permissions: z.array(pluginPermissionSchema).optional(),
})

export const pluginAdminPageSchema = z.object({
  path: z.string().startsWith('/'),
  title: z.string().min(1).max(100),
  icon: z.string().optional(),
  component: z.string(),
  permissions: z.array(pluginPermissionSchema).optional(),
  order: z.number().optional(),
  parent: z.string().optional(),
})

export const pluginManifestSchema = pluginMetadataSchema.extend({
  main: z.string(),
  routes: z.array(pluginRouteSchema).optional(),
  adminPages: z.array(pluginAdminPageSchema).optional(),
  sidebarItems: z.array(z.any()).optional(), // Complex nested structure
  dashboardWidgets: z.array(z.any()).optional(),
  hooks: z.array(z.any()).optional(),
  assets: z.object({
    css: z.array(z.string()).optional(),
    js: z.array(z.string()).optional(),
  }).optional(),
  settings: z.object({
    schema: z.record(z.any()),
    defaults: z.record(z.any()),
  }).optional(),
})

export const pluginUploadSchema = z.object({
  overwrite: z.boolean().optional().default(false),
  activate: z.boolean().optional().default(true),
})

// Theme validations
export const themeCategorySchema = z.enum([
  'business', 'portfolio', 'blog', 'ecommerce', 'landing',
  'dashboard', 'minimal', 'creative', 'corporate', 'other'
] as const)

export const themeColorsSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  accent: hexColorSchema,
  background: hexColorSchema,
  foreground: hexColorSchema,
  muted: hexColorSchema,
  mutedForeground: hexColorSchema,
  border: hexColorSchema,
  input: hexColorSchema,
  ring: hexColorSchema,
  success: hexColorSchema,
  warning: hexColorSchema,
  error: hexColorSchema,
  info: hexColorSchema,
})

export const themeTypographySchema = z.object({
  fontFamily: z.object({
    sans: z.array(z.string()),
    serif: z.array(z.string()),
    mono: z.array(z.string()),
  }),
  fontSize: z.record(z.string()),
  fontWeight: z.record(z.number()),
  lineHeight: z.record(z.number()),
})

export const themeCustomizationSchema = z.object({
  colors: themeColorsSchema.partial().optional(),
  typography: themeTypographySchema.partial().optional(),
  spacing: z.record(z.string()).optional(),
  layout: z.object({
    container: z.object({
      maxWidth: z.string(),
      padding: z.string(),
    }),
    header: z.object({
      height: z.string(),
      sticky: z.boolean(),
    }),
    sidebar: z.object({
      width: z.string(),
      collapsible: z.boolean(),
    }),
    footer: z.object({
      height: z.string(),
      sticky: z.boolean(),
    }),
  }).partial().optional(),
  borderRadius: z.string().optional(),
  shadows: z.record(z.string()).optional(),
  animations: z.record(z.any()).optional(),
  customCSS: z.string().optional(),
  customJS: z.string().optional(),
})

export const themeMetadataSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  version: versionSchema,
  description: z.string().min(1).max(1000),
  author: z.object({
    name: z.string().min(1).max(100),
    email: emailSchema.optional(),
    url: z.string().url().optional(),
  }),
  license: z.string().min(1).max(50),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  tags: z.array(z.string()).max(20),
  category: themeCategorySchema,
  compatibility: z.object({
    nextjs: z.string(),
    app: z.string(),
  }),
  preview: z.object({
    thumbnail: z.string(),
    screenshots: z.array(z.string()).optional(),
    demo: z.string().url().optional(),
  }),
  features: z.array(z.string()),
})

export const themeManifestSchema = themeMetadataSchema.extend({
  main: z.string(),
  styles: z.array(z.string()).optional(),
  scripts: z.array(z.string()).optional(),
  components: z.array(z.any()).optional(),
  pages: z.array(z.any()).optional(),
  layouts: z.record(z.string()),
  settings: z.object({
    schema: z.record(z.any()),
    defaults: themeCustomizationSchema,
  }).optional(),
  assets: z.object({
    images: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    icons: z.array(z.string()).optional(),
  }).optional(),
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
  step: z.enum(['welcome', 'admin', 'database', 'theme']),
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