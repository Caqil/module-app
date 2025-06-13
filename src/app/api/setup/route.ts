
import { NextRequest, NextResponse } from 'next/server'
import { setupAdminSchema, setupDatabaseSchema } from '@/lib/validations'
import { ApiResponse } from '@/types/global'
import { connectToDatabase, isHealthy } from '@/lib/database/mongodb'
import { SystemSettingsModel } from '@/lib/database/models/settings'
import { UserModel } from '@/lib/database/models/user'

export async function GET() {
  try {
    await connectToDatabase()
    const settings = await SystemSettingsModel.getSettings()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        isSetupComplete: settings.isSetupComplete,
        siteName: settings.siteName 
      }
    })

  } catch (error) {
    console.error('Get setup status error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { step, data } = body

    switch (step) {
      case 'database':
        return await handleDatabaseStep(data)
      case 'admin':
        return await handleAdminStep(data)
      case 'complete':
        return await handleCompleteStep()
      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid setup step'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

async function handleDatabaseStep(data: any) {
  const validation = setupDatabaseSchema.safeParse(data)
  
  if (!validation.success) {
    return NextResponse.json<ApiResponse>({
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: 'Validation failed'
    }, { status: 400 })
  }

  try {
    await connectToDatabase()
    const healthy = await isHealthy()

    return NextResponse.json<ApiResponse>({
      success: healthy,
      message: healthy ? 'Database connection successful' : 'Database connection failed'
    })

  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Database connection failed'
    }, { status: 500 })
  }
}

async function handleAdminStep(data: any) {
  const validation = setupAdminSchema.safeParse(data)
  
  if (!validation.success) {
    return NextResponse.json<ApiResponse>({
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: 'Validation failed'
    }, { status: 400 })
  }

  try {
    await connectToDatabase()

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ role: 'admin' })
    if (existingAdmin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin user already exists'
      }, { status: 400 })
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

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { adminId: adminUser._id },
      message: 'Admin user created successfully'
    })

  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create admin user'
    }, { status: 500 })
  }
}

async function handleCompleteStep() {
  try {
    await connectToDatabase()

    await SystemSettingsModel.updateSettings({
      isSetupComplete: true,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Setup completed successfully'
    })

  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to complete setup'
    }, { status: 500 })
  }
}