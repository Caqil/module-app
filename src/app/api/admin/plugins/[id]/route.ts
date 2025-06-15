// Admin Plugin by ID API Routes
// src/app/api/admin/plugins/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { pluginManager } from '@/lib/plugins/manager'
import { pluginRegistry } from '@/lib/plugins/registry'
import { reloadPlugin } from '@/lib/plugins/init'
import { getErrorMessage } from '@/lib/utils'

/**
 * GET /api/admin/plugins/[id] - Get specific plugin details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin permissions
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectToDatabase()

    const { id: pluginId } = params

    // Get plugin from database
    const plugin = await InstalledPluginModel.findByPluginId(pluginId)
    if (!plugin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin not found'
      }, { status: 404 })
    }

    // Get runtime information
    const loadedPlugin = pluginRegistry.getPlugin(pluginId)
    const runtimeInfo = {
      isLoaded: !!loadedPlugin,
      hasErrors: plugin.errorLog.length > 0,
      lastError: plugin.errorLog[plugin.errorLog.length - 1] || null,
      routeCount: plugin.routes.length,
      hookCount: plugin.hooks.length,
      loadedAt: loadedPlugin?.loadedAt || null,
      dependencies: plugin.dependencies,
      adminPages: plugin.adminPages,
      dashboardWidgets: plugin.dashboardWidgets
    }

    // Include configuration schema if available
    const configSchema = plugin.manifest.settings?.schema || null
    const configDefaults = plugin.manifest.settings?.defaults || {}

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        plugin: {
          ...plugin.toObject(),
          runtimeInfo,
          configSchema,
          configDefaults
        }
      }
    })

  } catch (error) {
    console.error('Get plugin details error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch plugin details'
    }, { status: 500 })
  }
}

/**
 * PUT /api/admin/plugins/[id] - Update plugin configuration or perform actions
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin permissions
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectToDatabase()

    const { id: pluginId } = params
    const body = await request.json()
    const { action, config, options } = body

    // Get plugin from database
    const plugin = await InstalledPluginModel.findByPluginId(pluginId)
    if (!plugin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin not found'
      }, { status: 404 })
    }

    switch (action) {
      case 'activate':
        const activateResult = await pluginManager.activatePlugin(pluginId, options)
        if (activateResult.success) {
          const updatedPlugin = await InstalledPluginModel.findByPluginId(pluginId)
          return NextResponse.json<ApiResponse>({
            success: true,
            data: { plugin: updatedPlugin },
            message: 'Plugin activated successfully'
          })
        } else {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: activateResult.error
          }, { status: 400 })
        }

      case 'deactivate':
        const deactivateResult = await pluginManager.deactivatePlugin(pluginId)
        if (deactivateResult.success) {
          const updatedPlugin = await InstalledPluginModel.findByPluginId(pluginId)
          return NextResponse.json<ApiResponse>({
            success: true,
            data: { plugin: updatedPlugin },
            message: 'Plugin deactivated successfully'
          })
        } else {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: deactivateResult.error
          }, { status: 400 })
        }

      case 'configure':
        if (!config) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Configuration data is required'
          }, { status: 400 })
        }

        const configResult = await pluginManager.updatePluginConfig(pluginId, config)
        if (configResult.success) {
          const updatedPlugin = await InstalledPluginModel.findByPluginId(pluginId)
          return NextResponse.json<ApiResponse>({
            success: true,
            data: { plugin: updatedPlugin },
            message: 'Plugin configuration updated successfully'
          })
        } else {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: configResult.error
          }, { status: 400 })
        }

      case 'reload':
        try {
          await reloadPlugin(pluginId)
          const updatedPlugin = await InstalledPluginModel.findByPluginId(pluginId)
          return NextResponse.json<ApiResponse>({
            success: true,
            data: { plugin: updatedPlugin },
            message: 'Plugin reloaded successfully'
          })
        } catch (error) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: `Failed to reload plugin: ${getErrorMessage(error)}`
          }, { status: 500 })
        }

      case 'backup':
        const backupResult = await pluginManager.backupPlugin(pluginId, 'manual')
        if (backupResult.success) {
          return NextResponse.json<ApiResponse>({
            success: true,
            data: { backupId: backupResult.backupId },
            message: 'Plugin backup created successfully'
          })
        } else {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: backupResult.error
          }, { status: 500 })
        }

      case 'clear_errors':
        await InstalledPluginModel.findOneAndUpdate(
          { pluginId },
          { errorLog: [] }
        )
        const clearedPlugin = await InstalledPluginModel.findByPluginId(pluginId)
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { plugin: clearedPlugin },
          message: 'Plugin error log cleared successfully'
        })

      case 'update_settings':
        const { settings } = body
        if (!settings) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Settings data is required'
          }, { status: 400 })
        }

        const updatedPlugin = await InstalledPluginModel.findOneAndUpdate(
          { pluginId },
          { settings },
          { new: true }
        )

        return NextResponse.json<ApiResponse>({
          success: true,
          data: { plugin: updatedPlugin },
          message: 'Plugin settings updated successfully'
        })

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Update plugin error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/plugins/[id] - Uninstall plugin
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin permissions
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectToDatabase()

    const { id: pluginId } = params

    // Parse query parameters for options
    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'
    const backup = url.searchParams.get('backup') !== 'false' // Default to true

    // Get plugin info before deletion
    const plugin = await InstalledPluginModel.findByPluginId(pluginId)
    if (!plugin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin not found'
      }, { status: 404 })
    }

    // Check if plugin is active and not forcing
    if (plugin.isActive && !force) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Cannot delete active plugin. Deactivate first or use force=true'
      }, { status: 400 })
    }

    // Create backup if requested
    if (backup) {
      const backupResult = await pluginManager.backupPlugin(pluginId, 'auto')
      if (!backupResult.success) {
        console.warn(`Failed to backup plugin ${pluginId} before deletion:`, backupResult.error)
      }
    }

    // Uninstall plugin
    const result = await pluginManager.uninstallPlugin(pluginId,  session.user.id,)
    
    if (result.success) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Plugin uninstalled successfully'
      })
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Delete plugin error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 })
  }
}