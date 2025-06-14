// src/app/api/setup/route.ts
// FIXED: Properly import models instead of using inline schemas

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/database/mongodb'
import { clearSetupStatusCache } from '@/lib/middleware/setup'
import { ApiResponse, UserRole } from '@/types/global'
import mongoose from 'mongoose'
import { addSecurityHeaders, logMiddlewareAction } from '@/lib/middleware/utils'

// FIXED: Import proper models instead of defining inline schemas
import { UserModel } from '@/lib/database/models/user'
import { SystemSettingsModel } from '@/lib/database/models/settings'

// Validation Schemas
const databaseSchema = z.object({
  mongodbUri: z.string().min(1, 'MongoDB connection string is required')
    .refine(
      (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      'Invalid MongoDB connection string format'
    ),
  testConnection: z.boolean().optional(),
})

const adminSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminFirstName: z.string().min(1, 'First name is required'),
  adminLastName: z.string().min(1, 'Last name is required'),
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
        siteName: settings?.siteName || 'Modular App',
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
      case 'welcome':
        // Welcome step is handled on frontend, just return success
        const welcomeResponse = NextResponse.json<ApiResponse>({
          success: true,
          message: 'Welcome step acknowledged'
        })
        return addSecurityHeaders(welcomeResponse)
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
    await mongoose.connect(validatedData.mongodbUri)
    
    logMiddlewareAction('DATABASE_CONNECTED', 'setup', { 
      url: validatedData.mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') 
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
        ? `Validation error: ${error.errors.map(e => e.message).join(', ')}`
        : error instanceof Error
        ? `Database connection failed: ${error.message}`
        : 'Database setup failed'
    }, { status: 400 })

    return addSecurityHeaders(response)
  }
}

async function handleAdminStep(data: any) {
  try {
    const validatedData = adminSchema.parse(data)
    
    await connectToDatabase()
    
    // Check if admin already exists
    const existingAdmin = await UserModel.findByEmail(validatedData.adminEmail)
    
    if (existingAdmin) {
      const response = NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin user already exists'
      }, { status: 400 })
      return addSecurityHeaders(response)
    }
    
    // FIXED: Create admin user using proper UserModel.createUser method
    const adminUserData = {
      email: validatedData.adminEmail,
      password: validatedData.adminPassword, // Will be hashed by the model
      firstName: validatedData.adminFirstName,
      lastName: validatedData.adminLastName,
      role: 'admin' as UserRole,
      isEmailVerified: true,
      isActive: true,
    }
    
    const adminUser = await UserModel.createUser(adminUserData)
    
    // Create or update system settings
    await SystemSettingsModel.findOneAndUpdate(
      {},
      {
        siteName: validatedData.siteName,
        adminEmail: validatedData.adminEmail,
        isSetupComplete: false, // Will be set to true in complete step
      },
      { upsert: true }
    )
    
    logMiddlewareAction('ADMIN_CREATED', 'setup', { 
      adminEmail: validatedData.adminEmail,
      userId: adminUser._id.toString()
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Admin user created successfully',
      data: {
        userId: adminUser._id.toString(),
        email: adminUser.email
      }
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Admin setup failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof z.ZodError 
        ? `Validation error: ${error.errors.map(e => e.message).join(', ')}`
        : error instanceof Error
        ? `Admin creation failed: ${error.message}`
        : 'Admin setup failed'
    }, { status: 400 })

    return addSecurityHeaders(response)
  }
}

async function handleCompleteStep(data: any) {
  try {
    await connectToDatabase()
    
    // Mark setup as complete
    await SystemSettingsModel.findOneAndUpdate(
      {},
      {
        isSetupComplete: true,
        activeTheme: null, // No default theme since theme step was removed
      },
      { upsert: true }
    )
    
    // Clear setup status cache
    clearSetupStatusCache()
    
    logMiddlewareAction('SETUP_COMPLETED', 'setup', {
      timestamp: new Date().toISOString()
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Setup completed successfully',
      data: {
        redirectTo: '/signin',
        message: 'Setup completed successfully! Please sign in with your admin account.'
      }
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Setup completion failed:', error)
    
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error
        ? `Setup completion failed: ${error.message}`
        : 'Setup completion failed'
    }, { status: 500 })

    return addSecurityHeaders(response)
  }
}