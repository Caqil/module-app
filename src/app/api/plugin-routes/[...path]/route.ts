// Plugin Routes API Handler - Dynamic route handling for plugins
// src/app/api/plugin-routes/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ApiResponse } from '@/types/global'
import { pluginRegistry } from '@/lib/plugins/registry'
import { pluginHooks, PLUGIN_HOOKS } from '@/lib/plugins/hooks'
import { PluginAPIContext } from '@/types/plugin'
import { connectToDatabase } from '@/lib/database/mongodb'
import { getErrorMessage } from '@/lib/utils'
import { AuthSession } from '@/types/auth'

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Handle dynamic plugin routes
 */

async function handlePluginRoute(
  request: NextRequest,
  { params }: { params: { path: string[] } }
): Promise<NextResponse> {
  try {
    // Extract path and method
    const path = `/${params.path.join('/')}`
    const method = request.method

    console.log(`🔄 Plugin route: ${method} ${path}`)

    // Execute API request start hook
    await pluginHooks.doAction(PLUGIN_HOOKS.API_REQUEST_START, {
      method,
      path,
      request
    })

    // Find plugin that owns this route
    const plugin = pluginRegistry.getPluginByRoute(method, path)
    if (!plugin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Route not found'
      }, { status: 404 })
    }

    // Check if plugin is active
    if (!plugin.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin is not active'
      }, { status: 503 })
    }

    // Get route configuration from manifest
    const routeConfig = plugin.manifest.routes?.find(r => 
      r.path === path && r.method === method
    )

    if (!routeConfig) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Route configuration not found'
      }, { status: 404 })
    }

    // Check authentication if required
    let session: AuthSession | null = null
    if (routeConfig.permissions && routeConfig.permissions.length > 0) {
      session = await auth.getSession(request)
      if (!session) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Authentication required'
        }, { status: 401 })
      }

      // Check permissions
      const hasPermission = routeConfig.permissions.some(permission => 
        hasUserPermission(session!.user, permission)
      )

      if (!hasPermission) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Insufficient permissions'
        }, { status: 403 })
      }
    }

    // Apply rate limiting if configured
    if (routeConfig.rateLimit) {
      const clientId = session?.user?.id || getClientIp(request) || 'anonymous'
      const rateLimitKey = `${plugin.manifest.id}:${path}:${clientId}`
      
      const isRateLimited = await applyRateLimit(
        rateLimitKey,
        routeConfig.rateLimit.max,
        routeConfig.rateLimit.windowMs
      )

      if (isRateLimited) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Rate limit exceeded'
        }, { status: 429 })
      }
    }

    // Get route handler from plugin
    const routeKey = `${method}:${path}`
    const handler = plugin.api?.routes?.get(routeKey)

    if (!handler || typeof handler !== 'function') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Route handler not found'
      }, { status: 500 })
    }

    // Create plugin context
    const context = await createPluginContext(plugin.manifest.id, request, session)

    // Execute middleware if defined
    if (routeConfig.middleware && routeConfig.middleware.length > 0) {
      for (const middlewareName of routeConfig.middleware) {
        const middleware = plugin.api?.middleware?.get(middlewareName)
        if (middleware && typeof middleware === 'function') {
          try {
            const middlewareResult = await middleware(request, context)
            if (middlewareResult instanceof NextResponse) {
              return middlewareResult
            }
          } catch (error) {
            console.error(`Middleware ${middlewareName} failed:`, error)
            return NextResponse.json<ApiResponse>({
              success: false,
              error: 'Middleware execution failed'
            }, { status: 500 })
          }
        }
      }
    }

    // Validate request if schema is defined
    if (routeConfig.validation) {
      const validationResult = await validateRequest(request, routeConfig.validation)
      if (!validationResult.isValid) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Validation failed',
        }, { status: 400 })
      }
    }

    // Execute the route handler
    let response: NextResponse
    try {
      const result = await handler(request, context)
      
      if (result instanceof NextResponse) {
        response = result
      } else {
        // Wrap result in standard API response format
        response = NextResponse.json<ApiResponse>({
          success: true,
          data: result
        })
      }
    } catch (error) {
      console.error(`Plugin route handler error (${plugin.manifest.id}):`, error)
      
      // Execute API error hook
      await pluginHooks.doAction(PLUGIN_HOOKS.API_ERROR, {
        plugin: plugin.manifest.id,
        method,
        path,
        error
      })

      response = NextResponse.json<ApiResponse>({
        success: false,
        error: getErrorMessage(error)
      }, { status: 500 })
    }

    // Apply response filters
    const filteredResponse = await pluginHooks.applyFilters(
      PLUGIN_HOOKS.API_RESPONSE_FILTER,
      response,
      {
        plugin: plugin.manifest.id,
        method,
        path,
        request
      }
    )

    // Execute API request end hook
    await pluginHooks.doAction(PLUGIN_HOOKS.API_REQUEST_END, {
      plugin: plugin.manifest.id,
      method,
      path,
      request,
      response: filteredResponse
    })

    return filteredResponse instanceof NextResponse ? filteredResponse : response

  } catch (error) {
    console.error('Plugin route handling error:', error)
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Helper function to check user permissions
function hasUserPermission(user: any, permission: string): boolean {
  // Implement your permission checking logic here
  // This could check user roles, specific permissions, etc.
  if (user.role === 'admin') return true
  return user.permissions?.includes(permission) || false
}

// Helper function to get client IP
function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIp || cfConnectingIp || null
}
/**
 * Create plugin API context
 */
async function createPluginContext(
  pluginId: string,
  request: NextRequest,
  session: any
): Promise<PluginAPIContext> {
  await connectToDatabase()

  return {
    database: {
      // Provide access to database models
      // In production, this should be more restricted based on plugin permissions
    },
    user: session?.user || null,
    request,
    config: {}, // Plugin configuration would be loaded here
    logger: {
      debug: (message: string, meta?: any) => console.debug(`[${pluginId}] ${message}`, meta),
      info: (message: string, meta?: any) => console.info(`[${pluginId}] ${message}`, meta),
      warn: (message: string, meta?: any) => console.warn(`[${pluginId}] ${message}`, meta),
      error: (message: string, meta?: any) => console.error(`[${pluginId}] ${message}`, meta),
    },
    hooks: pluginHooks,
    registry: pluginRegistry,
    utils: {
      hash: (data: string) => {
        const crypto = require('crypto')
        return crypto.createHash('sha256').update(data).digest('hex')
      },
      encrypt: (data: string) => {
        // Implement encryption based on your security requirements
        return Buffer.from(data).toString('base64')
      },
      decrypt: (data: string) => {
        // Implement decryption based on your security requirements
        return Buffer.from(data, 'base64').toString('utf-8')
      },
      validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      slugify: (text: string) => text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      formatDate: (date: Date, format?: string) => {
        // Implement date formatting based on your requirements
        return date.toISOString()
      }
    }
  }
}

/**
 * Apply rate limiting
 */
async function applyRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    // Reset window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return false
  }

  if (entry.count >= maxRequests) {
    return true // Rate limited
  }

  entry.count++
  return false
}

/**
 * Validate request data
 */
async function validateRequest(
  request: NextRequest,
  validation: any
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = []

  try {
    // Parse request data
    const url = new URL(request.url)
    const query = Object.fromEntries(url.searchParams)
    let body = {}

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const contentType = request.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          body = await request.json()
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          body = Object.fromEntries(formData)
        }
      } catch {
        // Ignore parsing errors for now
      }
    }

    // Basic validation (in production, use a proper schema validator like Zod)
    if (validation.query) {
      for (const [field, rules] of Object.entries(validation.query as any)) {
        const validationRules = rules as any
        if (validationRules.required && !query[field]) {
          errors.push(`Query parameter '${field}' is required`)
        }
      }
    }

    if (validation.body) {
      for (const [field, rules] of Object.entries(validation.body as any)) {
        const validationRules = rules as any
        if (validationRules.required && !body[field]) {
          errors.push(`Body field '${field}' is required`)
        }
      }
    }

    return { isValid: errors.length === 0, errors }
  } catch (error) {
    return { isValid: false, errors: ['Request validation failed'] }
  }
}

// Export handlers for all HTTP methods
export async function GET(request: NextRequest, context: any) {
  return handlePluginRoute(request, context)
}

export async function POST(request: NextRequest, context: any) {
  return handlePluginRoute(request, context)
}

export async function PUT(request: NextRequest, context: any) {
  return handlePluginRoute(request, context)
}

export async function DELETE(request: NextRequest, context: any) {
  return handlePluginRoute(request, context)
}

export async function PATCH(request: NextRequest, context: any) {
  return handlePluginRoute(request, context)
}

export async function OPTIONS(request: NextRequest, context: any) {
  return handlePluginRoute(request, context)
}