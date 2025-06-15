// Admin Plugins Install API Route
// src/app/api/admin/plugins/install/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { pluginManager } from '@/lib/plugins/manager'
import { isPluginSystemReady, waitForPluginSystem } from '@/lib/plugins/init'
import { PLUGIN_CONFIG } from '@/lib/constants'
import { getErrorMessage, getFileExtension } from '@/lib/utils'

/**
 * POST /api/admin/plugins/install - Install a plugin from uploaded ZIP file
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

    // Validate file
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
    if (!PLUGIN_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
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

    // Validate plugin file if not skipped
    if (!skipValidation) {
      const validation = await pluginManager.validatePlugin(file as any)
      if (!validation.isValid) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Plugin validation failed: ${validation.errors.join(', ')}`,
         
        }, { status: 400 })
      }

      // Check security warnings
      if (validation.security?.riskLevel === 'high') {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Plugin contains high-risk permissions and cannot be installed automatically',
         
        }, { status: 400 })
      }
    }

    // Install plugin
    console.log(`🔄 Installing plugin: ${file.name}`)
    
    const installResult = await pluginManager.installPlugin(
      file as any,
      session.user.id,
      {
        overwrite,
        activate,
        skipValidation,
        backup,
        migrate: true
      }
    )

    if (!installResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: installResult.error
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
          installedBy: session.user?.email ||  session.user.id,
          fileSize: file.size,
          fileName: file.name,
          activated: activate && installedPlugin.isActive
        }
      }
    }

    const message = activate
      ? 'Plugin installed and activated successfully'
      : 'Plugin installed successfully'

    console.log(`✅ Plugin installed: ${installedPlugin.name} (${installedPlugin.pluginId})`)

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
        errorMessage = 'Plugin already exists. Use overwrite option to replace it.'
        statusCode = 409
      } else if (error.message.includes('validation')) {
        errorMessage = 'Plugin validation failed. Check the plugin format and try again.'
        statusCode = 400
      } else if (error.message.includes('permission')) {
        errorMessage = 'Insufficient permissions to install plugin.'
        statusCode = 403
      } else if (error.message.includes('space') || error.message.includes('disk')) {
        errorMessage = 'Insufficient disk space to install plugin.'
        statusCode = 507
      }
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: errorMessage
    }, { status: statusCode })
  }
}

/**
 * GET /api/admin/plugins/install - Get installation requirements and info
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const installationInfo = {
      maxFileSize: PLUGIN_CONFIG.MAX_FILE_SIZE,
      maxFileSizeMB: PLUGIN_CONFIG.MAX_FILE_SIZE / (1024 * 1024),
      allowedExtensions: PLUGIN_CONFIG.ALLOWED_EXTENSIONS,
      manifestFile: PLUGIN_CONFIG.MANIFEST_FILE,
      entryPoint: PLUGIN_CONFIG.ENTRY_POINT,
      requirements: {
        nodeVersion: process.version,
        nextjsVersion: '15.x',
        mongodbRequired: true,
        permissions: [
          'Admin access required for installation',
          'File system write permissions required',
          'Database write permissions required'
        ]
      },
      guidelines: [
        'Plugin must contain a valid plugin.json manifest file',
        'Plugin ID must be unique and follow naming conventions',
        'All required permissions must be declared in manifest',
        'Plugin structure must follow the documented format',
        'Security review may be required for high-risk plugins'
      ],
      securityLevels: {
        low: 'Basic read permissions, safe operations',
        medium: 'Database read, user access, moderate risk operations',
        high: 'Database write, system settings, file system access'
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: installationInfo
    })

  } catch (error) {
    console.error('Get installation info error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to get installation information'
    }, { status: 500 })
  }
}