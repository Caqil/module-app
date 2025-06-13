// src/lib/auth/middleware.ts - Enhanced version
import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/global'
import { sessionManager } from './session'
import { 
  createRedirectResponse, 
  createUnauthorizedResponse, 
  createForbiddenResponse,
  addSecurityHeaders,
  hasRequiredRole,
  logMiddlewareAction,
  logMiddlewareError,
  checkRateLimit,
  getRateLimitIdentifier
} from '@/lib/middleware/utils'

export interface AuthMiddlewareOptions {
  requiredRole?: UserRole
  requireEmailVerification?: boolean
  redirectTo?: string
  allowedPaths?: string[]
  excludedPaths?: string[]
  enableRateLimit?: boolean
  maxRequests?: number
  windowMs?: number
}

export class AuthMiddleware {
  private static instance: AuthMiddleware
  
  private constructor() {}
  
  static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware()
    }
    return AuthMiddleware.instance
  }

  // Main middleware function for protecting routes
  async protect(
    request: NextRequest,
    options: AuthMiddlewareOptions = {}
  ): Promise<NextResponse> {
    const { 
      requiredRole,
      requireEmailVerification = false,
      redirectTo = '/signin',
      allowedPaths = [],
      excludedPaths = [],
      enableRateLimit = false,
      maxRequests = 100,
      windowMs = 60000
    } = options

    const { pathname } = request.nextUrl

    try {
      // Skip excluded paths
      if (this.isPathExcluded(pathname, excludedPaths)) {
        logMiddlewareAction('SKIP_EXCLUDED', pathname)
        return this.addHeaders(NextResponse.next())
      }

      // Allow specific paths without authentication
      if (this.isPathAllowed(pathname, allowedPaths)) {
        logMiddlewareAction('ALLOW_PATH', pathname)
        return this.addHeaders(NextResponse.next())
      }

      // Rate limiting check
      if (enableRateLimit) {
        const identifier = getRateLimitIdentifier(request)
        const rateLimitResult = checkRateLimit(identifier, maxRequests, windowMs)
        
        if (!rateLimitResult.allowed) {
          logMiddlewareAction('RATE_LIMIT_EXCEEDED', pathname, { identifier })
          return this.createRateLimitResponse(rateLimitResult.resetTime)
        }
      }

      // Get session from request
      const session = await sessionManager.getSession(request)
      
      if (!session) {
        logMiddlewareAction('NO_SESSION', pathname)
        return createRedirectResponse(request, redirectTo, true)
      }

      // Check if user is active
      if (!session.user.isActive) {
        logMiddlewareAction('INACTIVE_USER', pathname, { userId: session.user.id })
        return this.createAccountDisabledResponse()
      }

      // Check email verification requirement
      if (requireEmailVerification && !(session.user as any).isEmailVerified) {
        logMiddlewareAction('EMAIL_NOT_VERIFIED', pathname, { userId: session.user.id })
        return createRedirectResponse(request, '/verify-email', true)
      }

      // Check role requirement
      if (requiredRole && !hasRequiredRole(session.user.role, requiredRole)) {
        logMiddlewareAction('INSUFFICIENT_ROLE', pathname, { 
          userRole: session.user.role, 
          requiredRole,
          userId: session.user.id 
        })
        return createRedirectResponse(request, '/access-denied', true)
      }

      // Add user info to request headers for use in API routes
      const response = NextResponse.next()
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email)
      response.headers.set('x-user-role', session.user.role)
      response.headers.set('x-user-active', session.user.isActive.toString())

      logMiddlewareAction('AUTH_SUCCESS', pathname, { 
        userId: session.user.id,
        userRole: session.user.role 
      })

      return this.addHeaders(response)

    } catch (error) {
      logMiddlewareError(error, pathname, 'AUTH_PROTECT')
      return createRedirectResponse(request, redirectTo)
    }
  }

  // Middleware specifically for admin routes
  async protectAdmin(request: NextRequest): Promise<NextResponse> {
    return this.protect(request, {
      requiredRole: 'admin',
      redirectTo: '/signin',
      excludedPaths: ['/api/auth/*'],
      enableRateLimit: true,
      maxRequests: 200,
      windowMs: 60000,
    })
  }

  // Middleware for API routes
  async protectAPI(
    request: NextRequest,
    options: AuthMiddlewareOptions = {}
  ): Promise<NextResponse> {
    const { 
      requiredRole, 
      requireEmailVerification = false,
      enableRateLimit = true,
      maxRequests = 300,
      windowMs = 60000
    } = options

    const { pathname } = request.nextUrl

    try {
      // Rate limiting for API routes
      if (enableRateLimit) {
        const identifier = getRateLimitIdentifier(request)
        const rateLimitResult = checkRateLimit(identifier, maxRequests, windowMs)
        
        if (!rateLimitResult.allowed) {
          logMiddlewareAction('API_RATE_LIMIT_EXCEEDED', pathname, { identifier })
          return this.createRateLimitResponse(rateLimitResult.resetTime)
        }
      }

      // Handle OPTIONS requests for CORS
      if (request.method === 'OPTIONS') {
        return this.handleCORSPreflight(request)
      }

      const session = await sessionManager.getSession(request)
      
      if (!session) {
        logMiddlewareAction('API_NO_SESSION', pathname)
        return createUnauthorizedResponse('Authentication required')
      }

      if (!session.user.isActive) {
        logMiddlewareAction('API_INACTIVE_USER', pathname, { userId: session.user.id })
        return createUnauthorizedResponse('Account is disabled')
      }

      if (requireEmailVerification && !(session.user as any).isEmailVerified) {
        logMiddlewareAction('API_EMAIL_NOT_VERIFIED', pathname, { userId: session.user.id })
        return createUnauthorizedResponse('Email verification required')
      }

      if (requiredRole && !hasRequiredRole(session.user.role, requiredRole)) {
        logMiddlewareAction('API_INSUFFICIENT_ROLE', pathname, { 
          userRole: session.user.role, 
          requiredRole,
          userId: session.user.id 
        })
        return createForbiddenResponse('Insufficient permissions')
      }

      // Add user context to headers
      const response = NextResponse.next()
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email)
      response.headers.set('x-user-role', session.user.role)
      response.headers.set('x-user-active', session.user.isActive.toString())

      logMiddlewareAction('API_AUTH_SUCCESS', pathname, { 
        userId: session.user.id,
        userRole: session.user.role 
      })

      return this.addHeaders(response)

    } catch (error) {
      logMiddlewareError(error, pathname, 'API_AUTH_PROTECT')
      return createUnauthorizedResponse('Authentication failed')
    }
  }

  // Check if user has required role
  private hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return hasRequiredRole(userRole, requiredRole)
  }

  // Check if path is allowed without authentication
  private isPathAllowed(pathname: string, allowedPaths: string[]): boolean {
    return allowedPaths.some(path => this.matchPath(pathname, path))
  }

  // Check if path is excluded from authentication
  private isPathExcluded(pathname: string, excludedPaths: string[]): boolean {
    return excludedPaths.some(path => this.matchPath(pathname, path))
  }

  // Match path with wildcard support
  private matchPath(pathname: string, pattern: string): boolean {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1))
    }
    return pathname === pattern
  }

  // Create rate limit response
  private createRateLimitResponse(resetTime: number): NextResponse {
    const response = NextResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    )
    
    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString())
    response.headers.set('X-RateLimit-Reset', resetTime.toString())
    
    return this.addHeaders(response)
  }

  // Create account disabled response
  private createAccountDisabledResponse(): NextResponse {
    return NextResponse.json(
      { success: false, error: 'Account is disabled' },
      { status: 403 }
    )
  }

  // Handle CORS preflight requests
  private handleCORSPreflight(request: NextRequest): NextResponse {
    const response = new NextResponse(null, { status: 200 })
    
    const origin = request.headers.get('origin')
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }

  // Add security headers to response
  private addHeaders(response: NextResponse): NextResponse {
    return addSecurityHeaders(response)
  }
}

// Singleton instance
export const authMiddleware = AuthMiddleware.getInstance()

// Convenience functions for common use cases
export const protectRoute = (options?: AuthMiddlewareOptions) => 
  (request: NextRequest) => authMiddleware.protect(request, options)

export const protectAdminRoute = (request: NextRequest) => 
  authMiddleware.protectAdmin(request)

export const protectAPIRoute = (options?: AuthMiddlewareOptions) => 
  (request: NextRequest) => authMiddleware.protectAPI(request, options)

// Middleware configuration presets
export const middlewarePresets = {
  public: {
    excludedPaths: ['*'],
  },
  user: {
    requiredRole: 'user' as UserRole,
    enableRateLimit: true,
  },
  moderator: {
    requiredRole: 'moderator' as UserRole,
    enableRateLimit: true,
    maxRequests: 500,
  },
  admin: {
    requiredRole: 'admin' as UserRole,
    enableRateLimit: true,
    maxRequests: 1000,
    requireEmailVerification: true,
  },
  api: {
    enableRateLimit: true,
    maxRequests: 100,
    windowMs: 60000,
  },
  apiAdmin: {
    requiredRole: 'admin' as UserRole,
    enableRateLimit: true,
    maxRequests: 500,
    requireEmailVerification: true,
  },
} as const