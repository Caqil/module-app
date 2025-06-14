
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/database/mongodb'
import { generateId } from '@/lib/utils'
import { clearSetupStatusCache } from '@/lib/middleware/setup'
import { ApiResponse, UserRole } from '@/types/global'
import mongoose from 'mongoose'
import { addSecurityHeaders, logMiddlewareAction } from '@/lib/middleware/utils'

// Database Models
const UserModel = mongoose.models.User || 
  mongoose.model('User', new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'moderator', 'user'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  }, { timestamps: true }))

const SystemSettingsModel = mongoose.models.SystemSettings ||
  mongoose.model('SystemSettings', new mongoose.Schema({
    siteName: { type: String, required: true },
    adminEmail: { type: String, required: true },
    isSetupComplete: { type: Boolean, default: false },
    allowUserRegistration: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    activeTheme: { type: String, default: null },
    seoSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    emailSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  }, { timestamps: true }))

const InstalledThemeModel = mongoose.models.InstalledTheme ||
  mongoose.model('InstalledTheme', new mongoose.Schema({
    themeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    status: { type: String, enum: ['installed', 'installing', 'failed', 'disabled'], default: 'installed' },
    customization: { type: mongoose.Schema.Types.Mixed, default: {} },
    installPath: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    manifest: { type: mongoose.Schema.Types.Mixed, required: true },
    installedBy: { type: String, required: true },
    activatedAt: { type: Date },
  }, { timestamps: true }))

// Validation Schemas
const databaseSchema = z.object({
  mongoUrl: z.string().min(1, 'MongoDB URL is required'),
})

const adminSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminFirstName: z.string().min(1, 'First name is required'),
  adminLastName: z.string().min(1, 'Last name is required'),
})

const themeSchema = z.object({
  selectedTheme: z.string().optional(),
  skipTheme: z.boolean().optional(),
  installDefault: z.boolean().optional(),
}).optional()

const completeSchema = z.object({
  siteName: z.string().min(1),
  adminEmail: z.string().email(),
  theme: themeSchema,
})

export async function GET() {
  try {
    await connectToDatabase()
    
    const settings = await SystemSettingsModel.findOne()
    const isComplete = settings?.isSetupComplete || false
    
    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: {
        isSetupComplete: isComplete,
        siteName: settings?.siteName,
        hasAdmin: isComplete,
      }
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Setup status check failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to check setup status'
    }, { status: 500 })

    return addSecurityHeaders(response)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { step, data } = body

    switch (step) {
      case 'database':
        return handleDatabaseStep(data)
      case 'admin':
        return handleAdminStep(data)
      case 'complete':
        return handleCompleteStep(data)
      default:
        const response = NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid setup step'
        }, { status: 400 })
        return addSecurityHeaders(response)
    }
  } catch (error) {
    console.error('Setup request failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: 'Setup request failed',
      data: {
        errorType: error instanceof Error ? error.name : 'Unknown'
      }
    }, { status: 500 })

    return addSecurityHeaders(response)
  }
}

async function handleDatabaseStep(data: any) {
  try {
    const validatedData = databaseSchema.parse(data)
    
    // Test database connection
    await mongoose.disconnect()
    await mongoose.connect(validatedData.mongoUrl)
    
    logMiddlewareAction('DATABASE_CONNECTED', 'setup', { 
      url: validatedData.mongoUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') 
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Database connection successful'
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Database setup failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof z.ZodError 
        ? error.errors[0].message 
        : 'Database connection failed'
    }, { status: 400 })

    return addSecurityHeaders(response)
  }
}

async function handleAdminStep(data: any) {
  try {
    await connectToDatabase()
    const validatedData = adminSchema.parse(data)

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ role: 'admin' })
    if (existingAdmin) {
      const response = NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin account already exists'
      }, { status: 400 })
      return addSecurityHeaders(response)
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(validatedData.adminPassword, 12)
    const adminUser = await UserModel.create({
      id: generateId(),
      email: validatedData.adminEmail,
      password: hashedPassword,
      firstName: validatedData.adminFirstName,
      lastName: validatedData.adminLastName,
      role: 'admin' as UserRole,
      isEmailVerified: true,
      preferences: {},
      metadata: {
        createdDuringSetup: true,
        setupVersion: '1.0.0'
      }
    })

    logMiddlewareAction('ADMIN_CREATED', 'setup', { 
      adminId: adminUser.id,
      email: adminUser.email 
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Admin account created successfully',
      data: {
        adminId: adminUser.id,
        email: adminUser.email
      }
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Admin setup failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof z.ZodError 
        ? error.errors[0].message 
        : 'Failed to create admin account'
    }, { status: 400 })

    return addSecurityHeaders(response)
  }
}

async function handleCompleteStep(data: any) {
  try {
    await connectToDatabase()

    // Check if setup is already complete
    const existingSettings = await SystemSettingsModel.findOne()
    if (existingSettings?.isSetupComplete) {
      logMiddlewareAction('SETUP_ALREADY_COMPLETE', 'setup')
      
      const response = NextResponse.json<ApiResponse>({
        success: true,
        message: 'Setup was already completed',
        data: { 
          isSetupComplete: true,
          siteName: existingSettings.siteName,
        }
      })
      return addSecurityHeaders(response)
    }

    // Verify admin user exists
    const adminUser = await UserModel.findOne({ role: 'admin' })
    if (!adminUser) {
      const response = NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin user not found. Please complete the admin setup step first.',
      }, { status: 400 })
      return addSecurityHeaders(response)
    }

    // Install default theme if requested
    let activeTheme = null
    if (data?.theme?.installDefault || data?.theme?.selectedTheme === 'default') {
      try {
        activeTheme = await installDefaultTheme(adminUser.id)
        logMiddlewareAction('DEFAULT_THEME_INSTALLED', 'setup', { 
          themeId: activeTheme 
        })
      } catch (error) {
        console.warn('Failed to install default theme:', error)
      }
    }

    // Create system settings
    const settingsData = {
      siteName: data.siteName || 'Modular App',
      adminEmail: adminUser.email,
      isSetupComplete: true,
      allowUserRegistration: true,
      maintenanceMode: false,
      activeTheme,
      seoSettings: {
        title: data.siteName || 'Modular App',
        description: 'A powerful modular web application',
        keywords: 'modular, app, nextjs, typescript',
      },
      emailSettings: {
        fromName: data.siteName || 'Modular App',
        fromEmail: adminUser.email,
      },
    }

    const settings = await SystemSettingsModel.create(settingsData)

    // Clear setup status cache
    clearSetupStatusCache()

    logMiddlewareAction('SETUP_COMPLETED', 'setup', { 
      siteName: settings.siteName,
      adminEmail: settings.adminEmail,
      themeInstalled: !!activeTheme,
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Setup completed successfully',
      data: { 
        isSetupComplete: true,
        siteName: settings.siteName,
        adminEmail: settings.adminEmail,
        activeTheme,
        redirectTo: '/signin?message=Setup completed successfully',
      }
    })

    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Setup completion failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to complete setup',
    }, { status: 500 })

    return addSecurityHeaders(response)
  }
}

async function installDefaultTheme(userId: string): Promise<string> {
  try {
    const themeId = 'default'
    
    // Check if theme already exists
    const existingTheme = await InstalledThemeModel.findOne({ themeId })
    if (existingTheme) {
      // Just activate it
      await InstalledThemeModel.findByIdAndUpdate(existingTheme._id, {
        isActive: true,
        activatedAt: new Date(),
      })
      return themeId
    }

    // Create default theme record
    const defaultTheme = await InstalledThemeModel.create({
      themeId,
      name: 'Default Theme',
      version: '1.0.0',
      status: 'installed',
      customization: {
        colors: {
          primary: '#0066cc',
          secondary: '#6b7280',
          accent: '#f59e0b',
          background: '#ffffff',
          foreground: '#111827',
        },
        typography: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            serif: ['Merriweather', 'serif'],
            mono: ['Fira Code', 'monospace'],
          },
        },
        borderRadius: '0.5rem',
      },
      installPath: '/themes/default',
      isActive: true,
      manifest: {
        id: themeId,
        name: 'Default Theme',
        version: '1.0.0',
        description: 'Default theme for Modular App',
        author: {
          name: 'Modular App Team',
          email: 'team@modularapp.com',
        },
        license: 'MIT',
        category: 'minimal',
        components: {
          homepage: 'components/homepage.tsx',
          layout: 'layouts/default.tsx',
          header: 'components/header.tsx',
          footer: 'components/footer.tsx',
        },
        features: [
          'Responsive design',
          'Dark mode support',
          'Customizable colors',
          'Modern components',
        ],
      },
      installedBy: userId,
      activatedAt: new Date(),
    })

    console.log('Default theme installed successfully:', defaultTheme.themeId)
    return themeId

  } catch (error) {
    console.error('Failed to install default theme:', error)
    throw error
  }
}