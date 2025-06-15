// Fixed Admin Plugins API Route
// src/app/api/admin/plugins/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ApiResponse } from '@/types/global'
import { connectToDatabase, isHealthy } from '@/lib/database/mongodb'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { pluginManager } from '@/lib/plugins/manager'
import { pluginRegistry } from '@/lib/plugins/registry'
import { isPluginSystemReady, waitForPluginSystem } from '@/lib/plugins/init'
import { paginationSchema } from '@/lib/validations'
import { getErrorMessage } from '@/lib/utils'

/**
 * GET /api/admin/plugins - Get all plugins with pagination and filtering
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

    // Handle health check requests
    const url = new URL(request.url)
    if (url.searchParams.get('check') === 'true') {
      // Simple health check for plugin system readiness
      try {
        await connectToDatabase()
        const dbHealthy = await isHealthy()
        if (!dbHealthy) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Database not healthy'
          }, { status: 503 })
        }

        if (!isPluginSystemReady()) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Plugin system not ready'
          }, { status: 503 })
        }

        return NextResponse.json<ApiResponse>({
          success: true,
          data: { status: 'ready' }
        })
      } catch (error) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'System not ready'
        }, { status: 503 })
      }
    }

    // Wait for plugin system to be ready
    if (!isPluginSystemReady()) {
      try {
        await waitForPluginSystem(10000)
      } catch {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Plugin system not ready'
        }, { status: 503 })
      }
    }

    await connectToDatabase()

    // Parse query parameters with validation
    const queryParams = Object.fromEntries(url.searchParams)
    const validatedParams = paginationSchema.parse(queryParams)
    const { page, limit, sortBy, sortOrder, search } = validatedParams

    // Build filter query
    const filter: any = {}
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'manifest.description': { $regex: search, $options: 'i' } },
        { 'manifest.keywords': { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Filter by status if specified
    const status = url.searchParams.get('status')
    if (status) {
      filter.status = status
    }

    // Filter by category if specified
    const category = url.searchParams.get('category')
    if (category) {
      filter['manifest.category'] = category
    }

    // Filter by active state if specified
    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      filter.isActive = isActive === 'true'
    }

    // Build sort criteria
    const sort: any = {}
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort.createdAt = -1 // Default sort by creation date
    }

    // Execute query with pagination
    const skip = (page - 1) * limit
    
    const [plugins, totalCount] = await Promise.all([
      InstalledPluginModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      InstalledPluginModel.countDocuments(filter)
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Enhance plugins with runtime information (FIXED VERSION)
    const enhancedPlugins = plugins.map(plugin => {
      try {
        const loadedPlugin = pluginRegistry.getPlugin(plugin.pluginId)
        
        // Safe runtime info creation with proper null checks
        const runtimeInfo = {
          isLoaded: !!loadedPlugin,
          hasErrors: (plugin.errorLog?.length || 0) > 0,
          lastError: plugin.errorLog && plugin.errorLog.length > 0 
            ? plugin.errorLog[plugin.errorLog.length - 1] 
            : null,
          routeCount: plugin.routes?.length || 0,  // FIXED: Safe access
          hookCount: plugin.hooks?.length || 0,    // FIXED: Safe access
          loadedAt: loadedPlugin?.loadedAt || null,
          // Additional safe properties
          adminPageCount: plugin.adminPages?.length || 0,
          dashboardWidgetCount: plugin.dashboardWidgets?.length || 0,
          dependencyCount: plugin.dependencies?.length || 0,
          errorCount: plugin.errorLog?.length || 0
        }

        return {
          ...plugin,
          runtimeInfo
        }
      } catch (error) {
        console.error(`Error enhancing plugin ${plugin.pluginId}:`, error)
        
        // Return plugin with safe default runtime info
        return {
          ...plugin,
          runtimeInfo: {
            isLoaded: false,
            hasErrors: false,
            lastError: null,
            routeCount: 0,
            hookCount: 0,
            loadedAt: null,
            adminPageCount: 0,
            dashboardWidgetCount: 0,
            dependencyCount: 0,
            errorCount: 0,
            error: 'Failed to load runtime info'
          }
        }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        plugins: enhancedPlugins,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    })

  } catch (error) {
    console.error('Get plugins error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch plugins',
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/plugins - Create/Install a new plugin
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
          error: 'Plugin system not ready'
        }, { status: 503 })
      }
    }

    await connectToDatabase()

    // Handle different content types
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // File upload for plugin installation
      const formData = await request.formData()
      const file = formData.get('file') as File
      const overwrite = formData.get('overwrite') === 'true'
      const activate = formData.get('activate') === 'true'

      if (!file) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Plugin file is required'
        }, { status: 400 })
      }

      // Install plugin
      const result = await pluginManager.installPlugin(
        file as any,
        session.user.id,
        { overwrite, activate, backup: true }
      )

      if (result.success) {
        // Get the installed plugin data
        const plugin = await InstalledPluginModel.findByPluginId(result.pluginId!)
        
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { plugin },
          message: activate ? 'Plugin installed and activated successfully' : 'Plugin installed successfully'
        })
      } else {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: result.error
        }, { status: 400 })
      }

    } else if (contentType.includes('application/json')) {
      // JSON payload for plugin actions
      const body = await request.json()
      const { action, pluginId, config } = body

      if (!action || !pluginId) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Action and pluginId are required'
        }, { status: 400 })
      }

      switch (action) {
        case 'activate':
          const activateResult = await pluginManager.activatePlugin(pluginId)
          if (activateResult.success) {
            const plugin = await InstalledPluginModel.findByPluginId(pluginId)
            return NextResponse.json<ApiResponse>({
              success: true,
              data: { plugin },
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
            const plugin = await InstalledPluginModel.findByPluginId(pluginId)
            return NextResponse.json<ApiResponse>({
              success: true,
              data: { plugin },
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
            const plugin = await InstalledPluginModel.findByPluginId(pluginId)
            return NextResponse.json<ApiResponse>({
              success: true,
              data: { plugin },
              message: 'Plugin configuration updated successfully'
            })
          } else {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: configResult.error
            }, { status: 400 })
          }

        default:
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Invalid action'
          }, { status: 400 })
      }

    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unsupported content type'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Plugin action error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 })
  }
}