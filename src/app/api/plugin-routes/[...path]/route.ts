
import { NextRequest, NextResponse } from 'next/server'
import { pathToFileURL } from 'url'
import path from 'path'
import fs from 'fs/promises'
import { pluginRegistry } from '@/lib/plugins/registry'
import { auth } from '@/lib/auth'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { UserModel } from '@/lib/database/models/user'
import { InstalledThemeModel } from '@/lib/database/models/theme'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { SystemSettingsModel } from '@/lib/database/models/settings'
import { generateId, getErrorMessage, hashPassword, verifyPassword } from '@/lib/utils'

interface RouteParams {
  params: { path: string[] }
}

// Real implementation for dynamic plugin route handler
async function handlePluginRoute(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase()

    const { method } = request
    const routePath = `/${params.path.join('/')}`
    const routeKey = `${method}:${routePath}`

    // Get all registered plugin routes
    const allRoutes = pluginRegistry.getAllRoutes()
    
    // Find matching route
    let matchedRoute = null
    let matchedPluginId = null

    for (const [fullRouteKey, route] of allRoutes) {
      const [pluginId, storedRouteKey] = fullRouteKey.split(':', 2)
      if (storedRouteKey === routeKey) {
        matchedRoute = route
        matchedPluginId = pluginId
        break
      }
    }

    if (!matchedRoute || !matchedPluginId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Route not found'
      }, { status: 404 })
    }

    // Check permissions
    if (matchedRoute.permissions && matchedRoute.permissions.length > 0) {
      const session = await auth.getSession(request)
      if (!session) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Authentication required'
        }, { status: 401 })
      }

      // Check if user has required permissions
      const isAdmin = auth.hasRole(session, 'admin')
      if (!isAdmin) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Insufficient permissions'
        }, { status: 403 })
      }
    }

    // Get the plugin instance
    const plugin = pluginRegistry.getPlugin(matchedPluginId)
    if (!plugin || !plugin.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin not active'
      }, { status: 503 })
    }

    try {
      // Build handler file path
      const handlerFilePath = path.join(
        process.cwd(), 
        'plugins/installed', 
        plugin.manifest.id, 
        matchedRoute.handler
      )

      // Check if handler file exists
      await fs.access(handlerFilePath)

      // Create plugin context
      const session = await auth.getSession(request)
      const pluginContext = {
        pluginId: plugin.manifest.id,
        config: plugin.config,
        request,
        method,
        path: routePath,
        user: session,
        database: {
          User: UserModel,
          Theme: InstalledThemeModel,
          Plugin: InstalledPluginModel,
          Settings: SystemSettingsModel,
        },
        utils: {
          generateId,
          getErrorMessage,
          hashPassword,
          verifyPassword,
        }
      }

      // Dynamic import the handler
      const handlerModule = await import(pathToFileURL(handlerFilePath).href)
      const handler = handlerModule.default || handlerModule[method.toLowerCase()] || handlerModule.handler

      if (!handler || typeof handler !== 'function') {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid plugin handler'
        }, { status: 500 })
      }

      // Execute the plugin handler
      const result = await handler(pluginContext)

      // Handle different return types
      if (result instanceof NextResponse) {
        return result
      }

      if (result && typeof result === 'object') {
        return NextResponse.json<ApiResponse>(result)
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: result
      })

    } catch (error: any) {
      // If file doesn't exist or import fails
      if (error.code === 'ENOENT') {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Plugin handler not found'
        }, { status: 404 })
      }

      console.error(`Plugin route error (${matchedPluginId}):`, error)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin route execution failed'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Plugin route handler error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Export handlers for all HTTP methods
export const GET = handlePluginRoute
export const POST = handlePluginRoute
export const PUT = handlePluginRoute
export const DELETE = handlePluginRoute
export const PATCH = handlePluginRoute