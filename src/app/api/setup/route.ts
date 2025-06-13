
import { NextRequest, NextResponse } from 'next/server'
import { setupAdminSchema, setupDatabaseSchema } from '@/lib/validations'
import { ApiResponse } from '@/types/global'
import { connectToDatabase, isHealthy } from '@/lib/database/mongodb'
import { SystemSettingsModel } from '@/lib/database/models/settings'
import { UserModel } from '@/lib/database/models/user'
import { InstalledThemeModel } from '@/lib/database/models/theme'
import { clearSetupStatusCache } from '@/lib/middleware/setup'
import { logMiddlewareAction, addSecurityHeaders } from '@/lib/middleware/utils'

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      return false
    }
    
    // Just test the connection, don't create any data
    const mongoose = require('mongoose')
    const testConnection = await mongoose.createConnection(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    })
    
    await testConnection.close()
    return true
  } catch (error) {
    return false
  }
}
export async function GET() {
  try {
    // First check if database is even accessible
    const canConnect = await checkDatabaseConnection()
    if (!canConnect) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { 
          isSetupComplete: false,
          siteName: 'Modular App',
          needsSetup: true,
          dbConnection: false
        }
      })
    }

    await connectToDatabase()
    const { settings, isDefault } = await SystemSettingsModel.getSettingsOrDefault()

    // If settings is null (no database record), setup is not complete
    const isSetupComplete = settings ? settings.isSetupComplete : false

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        isSetupComplete,
        siteName: settings?.siteName || 'Modular App',
        allowUserRegistration: settings?.allowUserRegistration ?? true,
        maintenanceMode: settings?.maintenanceMode ?? false,
        needsSetup: !isSetupComplete,
        dbConnection: true,
        hasSettings: !isDefault
      }
    })

    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Get setup status error:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
      data: {
        isSetupComplete: false,
        siteName: 'Modular App',
        needsSetup: true,
        dbConnection: false
      }
    }, { status: 500 })

    return addSecurityHeaders(response)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { step, data } = body

    logMiddlewareAction('SETUP_STEP_REQUEST', step, { hasData: !!data })

    switch (step) {
      case 'database':
        return await handleDatabaseStep(data)
      case 'admin':
        return await handleAdminStep(data)
      case 'complete':
        return await handleCompleteStep(data)
      default:
        const response = NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid setup step',
          data: { availableSteps: ['database', 'admin', 'complete'] }
        }, { status: 400 })
        return addSecurityHeaders(response)
    }

  } catch (error) {
    console.error('Setup error:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })

    return addSecurityHeaders(response)
  }
}

async function handleDatabaseStep(data: any) {
  const validation = setupDatabaseSchema.safeParse(data)
  
  if (!validation.success) {
    const response = NextResponse.json<ApiResponse>({
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: 'Database configuration validation failed'
    }, { status: 400 })
    return addSecurityHeaders(response)
  }

  try {
    // Test database connection
    await connectToDatabase()
    const healthy = await isHealthy()

    if (!healthy) {
      const response = NextResponse.json<ApiResponse>({
        success: false,
        error: 'Database connection test failed',
        data: { 
          connectionString: validation.data.mongodbUri ? 'Provided' : 'Missing',
          healthCheck: false 
        }
      }, { status: 400 })
      return addSecurityHeaders(response)
    }

    logMiddlewareAction('DATABASE_TEST_SUCCESS', 'setup', { 
      hasUri: !!validation.data.mongodbUri 
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Database connection successful',
      data: { 
        connectionString: 'Valid',
        healthCheck: true,
        testTimestamp: new Date().toISOString()
      }
    })

    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Database connection test failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: 'Database connection failed',
      data: { 
        connectionString: validation.data.mongodbUri ? 'Provided' : 'Missing',
        healthCheck: false,
        errorType: error instanceof Error ? error.name : 'Unknown'
      }
    }, { status: 500 })

    return addSecurityHeaders(response)
  }
}

async function handleAdminStep(data: any) {
  const validation = setupAdminSchema.safeParse(data)
  
  if (!validation.success) {
    const response = NextResponse.json<ApiResponse>({
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: 'Admin account validation failed'
    }, { status: 400 })
    return addSecurityHeaders(response)
  }

  try {
    await connectToDatabase()

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ role: 'admin' })
    if (existingAdmin) {
      logMiddlewareAction('ADMIN_EXISTS', 'setup', { 
        existingAdminId: existingAdmin._id 
      })
      
      const response = NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin user already exists',
        data: { 
          existingAdmin: true,
          adminEmail: existingAdmin.email 
        }
      }, { status: 400 })
      return addSecurityHeaders(response)
    }

    // Create admin user
    const adminUser = await UserModel.createUser({
      email: validation.data.adminEmail,
      password: validation.data.adminPassword,
      firstName: validation.data.adminFirstName,
      lastName: validation.data.adminLastName,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    })

    // Update system settings
    await SystemSettingsModel.updateSettings({
      siteName: validation.data.siteName,
      adminEmail: validation.data.adminEmail,
    })

    logMiddlewareAction('ADMIN_CREATED', 'setup', { 
      adminId: adminUser._id,
      siteName: validation.data.siteName 
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        adminId: adminUser._id,
        adminEmail: adminUser.email,
        siteName: validation.data.siteName,
        createdAt: adminUser.createdAt
      },
      message: 'Admin user created successfully'
    })

    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Admin creation failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create admin user',
      data: { 
        step: 'admin_creation',
        errorType: error instanceof Error ? error.name : 'Unknown'
      }
    }, { status: 500 })

    return addSecurityHeaders(response)
  }
}

async function handleCompleteStep(data: any) {
  try {
    await connectToDatabase()

    // Check if setup is already complete by looking for actual database record
    const existingSettings = await SystemSettingsModel.findOne()
    if (existingSettings && existingSettings.isSetupComplete) {
      logMiddlewareAction('SETUP_ALREADY_COMPLETE', 'setup')
      
      const response = NextResponse.json<ApiResponse>({
        success: true,
        message: 'Setup was already completed',
        data: { 
          isSetupComplete: true,
          siteName: existingSettings.siteName,
          completedAt: existingSettings.updatedAt
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
        data: { 
          missingStep: 'admin',
          currentStep: 'complete'
        }
      }, { status: 400 })
      return addSecurityHeaders(response)
    }

    // NOW create the actual settings record in database
    const settingsData = {
      siteName: data.siteName || 'Modular App',
      adminEmail: adminUser.email,
      isSetupComplete: true,
      allowUserRegistration: data.allowUserRegistration ?? true,
      maintenanceMode: false,
      activeTheme: data.theme?.selectedTheme || null
    }

    // Initialize settings in database for the first time
    const settings = await SystemSettingsModel.initializeSettings(settingsData)

    // Activate default theme if specified
    if (data?.theme?.selectedTheme) {
      try {
        await activateDefaultTheme(data.theme.selectedTheme)
        logMiddlewareAction('DEFAULT_THEME_ACTIVATED', 'setup', { 
          themeId: data.theme.selectedTheme 
        })
      } catch (error) {
        console.warn('Failed to activate default theme:', error)
      }
    }

    // Clear the setup status cache
    clearSetupStatusCache()

    logMiddlewareAction('SETUP_COMPLETED', 'setup', { 
      siteName: settings.siteName,
      adminEmail: settings.adminEmail
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Setup completed successfully',
      data: { 
        isSetupComplete: true,
        siteName: settings.siteName,
        adminEmail: settings.adminEmail,
        completedAt: new Date().toISOString(),
        cacheCleared: true
      }
    })

    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Setup completion failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to complete setup',
      data: { 
        step: 'completion',
        errorType: error instanceof Error ? error.name : 'Unknown'
      }
    }, { status: 500 })

    return addSecurityHeaders(response)
  }
}

async function activateDefaultTheme(themeId: string) {
  try {
    // Create default theme entry if it doesn't exist
    const existingTheme = await InstalledThemeModel.findByThemeId(themeId)
    
    if (!existingTheme) {
      // Create default theme record
      await InstalledThemeModel.create({
        themeId,
        name: getThemeName(themeId),
        version: '1.0.0',
        status: 'installed',
        customization: getDefaultThemeCustomization(themeId),
        installPath: `/themes/${themeId}`,
        isActive: true,
        manifest: getDefaultThemeManifest(themeId),
        installedBy: 'system',
        activatedAt: new Date(),
      })
    } else {
      // Activate existing theme
      await InstalledThemeModel.activateTheme(themeId)
    }

    // Update system settings
    await SystemSettingsModel.updateSettings({
      activeTheme: themeId,
    })

  } catch (error) {
    console.error('Theme activation failed:', error)
    throw error
  }
}

function getThemeName(themeId: string): string {
  const themeNames: Record<string, string> = {
    default: 'Default Theme',
    minimal: 'Minimal Theme',
    business: 'Business Theme',
    dark: 'Dark Theme',
  }
  return themeNames[themeId] || 'Unknown Theme'
}

function getDefaultThemeCustomization(themeId: string) {
  return {
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
  }
}

function getDefaultThemeManifest(themeId: string) {
  return {
    id: themeId,
    name: getThemeName(themeId),
    version: '1.0.0',
    description: `Default ${themeId} theme for Modular App`,
    author: {
      name: 'Modular App Team',
      email: 'team@modularapp.com',
    },
    license: 'MIT',
    category: 'minimal',
    compatibility: {
      nextjs: '^15.0.0',
      app: '^1.0.0',
    },
    features: ['Responsive design', 'Dark mode support', 'Customizable'],
    main: 'index.js',
    layouts: {
      default: 'layouts/default.tsx',
      admin: 'layouts/admin.tsx',
      auth: 'layouts/auth.tsx',
    },
  }
}