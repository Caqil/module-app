// src/app/api/admin/settings/route.ts
// Type-safe version that properly handles Mongoose documents

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { SystemSettingsModel, ISystemSettingsDocument } from '@/lib/database/models/settings'
import { SystemSettings } from '@/types/global'

// Transform database settings to frontend format
function transformSettingsToFrontend(dbSettings: ISystemSettingsDocument | null) {
  // Convert Mongoose document to plain object if it exists
  const settings = dbSettings ? dbSettings.toObject() : null

  if (!settings) {
    // Return default structure when no settings exist
    return {
      site: {
        siteName: 'Modular App',
        siteDescription: 'A modular web application built with Next.js',
        siteLogo: null,
        adminEmail: 'admin@example.com',
      },
      users: {
        allowUserRegistration: true,
        requireEmailVerification: true,
        defaultRole: 'user',
        maxUsers: 1000,
      },
      email: {
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        fromEmail: '',
        fromName: 'Modular App',
      },
      security: {
        jwtSecret: '',
        jwtExpiry: '7d',
        passwordMinLength: 8,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
      },
      appearance: {
        defaultTheme: 'default',
        allowThemeSelection: true,
        customCss: '',
        customJs: '',
      },
      advanced: {
        maintenanceMode: false,
        maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
        debugMode: false,
        logLevel: 'info',
        cacheEnabled: true,
        cacheTtl: 3600,
      },
    }
  }

  return {
    site: {
      siteName: settings.siteName || 'Modular App',
      siteDescription: settings.siteDescription || 'A modular web application built with Next.js',
      siteLogo: settings.siteLogo || null,
      adminEmail: settings.adminEmail || 'admin@example.com',
    },
    users: {
      allowUserRegistration: settings.allowUserRegistration ?? true,
      requireEmailVerification: true, // Add default for missing fields
      defaultRole: 'user',
      maxUsers: 1000,
    },
    email: {
      smtpHost: settings.emailSettings?.smtpHost || '',
      smtpPort: settings.emailSettings?.smtpPort || 587,
      smtpUser: settings.emailSettings?.smtpUser || '',
      smtpPass: '', // Never return password
      fromEmail: settings.emailSettings?.fromEmail || '',
      fromName: settings.emailSettings?.fromName || 'Modular App',
    },
    security: {
      jwtSecret: '', // Never return secret
      jwtExpiry: '7d',
      passwordMinLength: 8,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
    },
    appearance: {
      defaultTheme: settings.activeTheme || 'default',
      allowThemeSelection: true,
      customCss: settings.customCSS || '',
      customJs: settings.customJS || '',
    },
    advanced: {
      maintenanceMode: settings.maintenanceMode || false,
      maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
      debugMode: false,
      logLevel: 'info' as const,
      cacheEnabled: true,
      cacheTtl: 3600,
    },
  }
}

// Transform frontend data back to database format
function transformSettingsToDatabase(frontendSettings: any): Partial<SystemSettings> {
  const dbSettings: Partial<SystemSettings> = {}

  if (frontendSettings.site) {
    dbSettings.siteName = frontendSettings.site.siteName
    dbSettings.siteDescription = frontendSettings.site.siteDescription
    dbSettings.siteLogo = frontendSettings.site.siteLogo
    dbSettings.adminEmail = frontendSettings.site.adminEmail
  }

  if (frontendSettings.users) {
    dbSettings.allowUserRegistration = frontendSettings.users.allowUserRegistration
  }

  if (frontendSettings.email) {
    dbSettings.emailSettings = {
      smtpHost: frontendSettings.email.smtpHost,
      smtpPort: frontendSettings.email.smtpPort,
      smtpUser: frontendSettings.email.smtpUser,
      // Only update password if provided
      ...(frontendSettings.email.smtpPass && { smtpPass: frontendSettings.email.smtpPass }),
      fromEmail: frontendSettings.email.fromEmail,
      fromName: frontendSettings.email.fromName,
    }
  }

  if (frontendSettings.appearance) {
    dbSettings.activeTheme = frontendSettings.appearance.defaultTheme
    dbSettings.customCSS = frontendSettings.appearance.customCss
    dbSettings.customJS = frontendSettings.appearance.customJs
  }

  if (frontendSettings.advanced) {
    dbSettings.maintenanceMode = frontendSettings.advanced.maintenanceMode
  }

  return dbSettings
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectToDatabase()
    const dbSettings = await SystemSettingsModel.getSettings()
    
    // Transform database settings to frontend format
    const settings = transformSettingsToFrontend(dbSettings)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { settings }
    })

  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    console.log('Received settings update:', body)

    await connectToDatabase()
    
    // Transform frontend data to database format
    const dbUpdates = transformSettingsToDatabase(body)
    console.log('Database updates:', dbUpdates)

    // Update settings in database
    const updatedDbSettings = await SystemSettingsModel.updateSettings(dbUpdates)
    
    // Transform back to frontend format for response
    const settings = transformSettingsToFrontend(updatedDbSettings)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { settings },
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}