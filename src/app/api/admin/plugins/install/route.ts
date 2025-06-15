// Modified Plugin Install API Route - Bypasses Security for Admin Users
// src/app/api/admin/plugins/install/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ApiResponse, FileUpload } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { pluginManager } from '@/lib/plugins/manager'
import { isPluginSystemReady, waitForPluginSystem } from '@/lib/plugins/init'
import { PLUGIN_CONFIG } from '@/lib/constants'
import { getErrorMessage, getFileExtension, generateId } from '@/lib/utils'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * POST /api/admin/plugins/install - Install a plugin from uploaded ZIP file
 * ADMIN BYPASS: Security validation is disabled for admin users
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Wait for plugin system to be ready
    if (!isPluginSystemReady()) {
      try {
        await waitForPluginSystem(10000)
      } catch {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Plugin system not ready. Please try again.'
        }, { status: 503 })
      }
    }

    await connectToDatabase()

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const overwrite = formData.get('overwrite') === 'true'
    const activate = formData.get('activate') === 'true'
    const skipValidation = formData.get('skipValidation') === 'true'
    const backup = formData.get('backup') !== 'false' // Default to true

    // Validate file presence
    if (!file) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin file is required'
      }, { status: 400 })
    }

    if (!file.name || !file.size) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid file provided'
      }, { status: 400 })
    }

    // Check file extension
    const fileExtension = getFileExtension(file.name)
    if (!PLUGIN_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension as any)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Invalid file type. Only ${PLUGIN_CONFIG.ALLOWED_EXTENSIONS.join(', ')} files are allowed`
      }, { status: 400 })
    }

    // Check file size
    if (file.size > PLUGIN_CONFIG.MAX_FILE_SIZE) {
      const maxSizeMB = PLUGIN_CONFIG.MAX_FILE_SIZE / (1024 * 1024)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `File size exceeds maximum limit of ${maxSizeMB}MB`
      }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public/uploads/plugins')
    await mkdir(uploadDir, { recursive: true })

    // Save uploaded file temporarily with unique name
    const fileName = `${generateId()}_${file.name}`
    const filePath = join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Convert browser File to FileUpload format
    const fileUpload: FileUpload = {
      filename: file.name,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      path: filePath,
      buffer
    }

    console.log(`🔄 Installing plugin: ${file.name}`, {
      fileSize: file.size,
      fileName: file.name,
      mimetype: file.type,
      overwrite,
      activate,
      skipValidation,
      adminBypass: true // Log that admin bypass is active
    })

    // 🔓 ADMIN BYPASS: Only basic validation for admin users
    if (!skipValidation) {
      console.log('🔍 Performing basic validation (admin bypass enabled)...')
      const validation = await pluginManager.validatePlugin(fileUpload)
      
      // Only check for critical errors, ignore security warnings
      if (!validation.isValid && validation.errors.length > 0) {
        // Filter out security-related errors for admin users
        const criticalErrors = validation.errors.filter(error => 
          !error.toLowerCase().includes('permission') &&
          !error.toLowerCase().includes('security') &&
          !error.toLowerCase().includes('risk')
        )
        
        if (criticalErrors.length > 0) {
          // Clean up temp file
          try {
            const fs = require('fs').promises
            await fs.unlink(filePath)
          } catch (cleanupError) {
            console.error('Failed to cleanup temp file:', cleanupError)
          }

          return NextResponse.json<ApiResponse>({
            success: false,
            error: `Plugin validation failed: ${criticalErrors.join(', ')}`
          }, { status: 400 })
        }
      }

      // 🚨 REMOVED: High-risk permission check for admin users
      // Admin users can install any plugin they want
      if (validation.security?.riskLevel === 'high') {
        console.log('⚠️ High-risk plugin detected, but allowing admin installation')
      }
    } else {
      console.log('⏭️ Skipping all validation (admin bypass + skipValidation enabled)')
    }

    // Install plugin with admin bypass
    console.log('📦 Installing plugin with admin privileges...')
    const installResult = await pluginManager.installPlugin(
      fileUpload,
      session.user.id,
      {
        overwrite,
        activate,
        skipValidation: true, // Always skip validation for admin users
        backup,
        migrate: true
      }
    )

    // Clean up temp file after installation attempt
    try {
      const fs = require('fs').promises
      await fs.unlink(filePath)
    } catch (cleanupError) {
      console.error('Failed to cleanup temp file:', cleanupError)
    }

    if (!installResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: installResult.error || 'Installation failed'
      }, { status: 400 })
    }

    // Get the installed plugin details
    const installedPlugin = await InstalledPluginModel.findByPluginId(installResult.pluginId!)
    
    if (!installedPlugin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin installed but could not retrieve details'
      }, { status: 500 })
    }

    // Prepare response data
    const responseData = {
      plugin: {
        ...installedPlugin.toObject(),
        installationInfo: {
          installedAt: installedPlugin.createdAt,
          installedBy: session.user?.email || session.user.id,
          fileSize: file.size,
          fileName: file.name,
          activated: activate && installedPlugin.isActive,
          adminBypass: true, // Indicate admin bypass was used
          securityLevel: 'admin-trusted' // Custom security level for admin installs
        }
      }
    }

    const message = activate
      ? 'Plugin installed and activated successfully (admin bypass)'
      : 'Plugin installed successfully (admin bypass)'

    console.log(`✅ Plugin installed with admin bypass: ${installedPlugin.name} (${installedPlugin.pluginId})`)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: responseData,
      message
    })

  } catch (error) {
    console.error('Plugin installation error:', error)
    
    // Provide more specific error messages
    let errorMessage = getErrorMessage(error)
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        errorMessage = 'Plugin already exists. Enable overwrite to replace.'
        statusCode = 409
      } else if (error.message.includes('invalid manifest')) {
        errorMessage = 'Invalid plugin manifest. Please check the plugin file.'
        statusCode = 400
      } else if (error.message.includes('permission denied')) {
        errorMessage = 'Permission denied. Unable to install plugin files.'
        statusCode = 403
      } else if (error.message.includes('disk space')) {
        errorMessage = 'Insufficient disk space for plugin installation.'
        statusCode = 507
      }
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: errorMessage
    }, { status: statusCode })
  }
}