
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
      console.log('🛡️ [AUTH MIDDLEWARE] Protecting route:', pathname)

      // Skip excluded paths
      if (this.isPathExcluded(pathname, excludedPaths)) {
        console.log('⏭️ [AUTH MIDDLEWARE] Skipping excluded path:', pathname)
        return this.addHeaders(NextResponse.next())
      }

      // Allow specific paths without authentication
      if (this.isPathAllowed(pathname, allowedPaths)) {
        console.log('✅ [AUTH MIDDLEWARE] Allowing allowed path:', pathname)
        return this.addHeaders(NextResponse.next())
      }

      // Rate limiting check
      if (enableRateLimit) {
        const identifier = getRateLimitIdentifier(request)
        const rateLimitResult = checkRateLimit(identifier, maxRequests, windowMs)
        
        if (!rateLimitResult.allowed) {
          console.log('🚫 [AUTH MIDDLEWARE] Rate limit exceeded for:', identifier)
          return this.createRateLimitResponse(rateLimitResult.resetTime)
        }
      }

      // Debug: Check what cookies are present
      const cookies = request.cookies.getAll()
      console.log('🍪 [AUTH MIDDLEWARE] All cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`))
      
      const sessionCookie = request.cookies.get('session-token')
      console.log('🔑 [AUTH MIDDLEWARE] Session cookie present:', !!sessionCookie)
      console.log('🔑 [AUTH MIDDLEWARE] Session cookie value length:', sessionCookie?.value.length || 0)

      // Get session from request
      console.log('📋 [AUTH MIDDLEWARE] Getting session from request...')
      const session = await sessionManager.getSession(request)
      
      console.log('📋 [AUTH MIDDLEWARE] Session result:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        userRole: session?.user?.role,
        isActive: session?.user?.isActive,
        expires: session?.expires
      })
      
      if (!session) {
        console.log('❌ [AUTH MIDDLEWARE] No session found, redirecting to:', redirectTo)
        return createRedirectResponse(request, redirectTo, true)
      }

      // Check if user is active
      if (!session.user.isActive) {
        console.log('❌ [AUTH MIDDLEWARE] User inactive:', session.user.email)
        return this.createAccountDisabledResponse()
      }

      // Check email verification requirement
      if (requireEmailVerification && !(session.user as any).isEmailVerified) {
        console.log('📧 [AUTH MIDDLEWARE] Email not verified for:', session.user.email)
        return createRedirectResponse(request, '/verify-email', true)
      }

      // Check role requirement
      if (requiredRole && !hasRequiredRole(session.user.role, requiredRole)) {
        console.log('🚫 [AUTH MIDDLEWARE] Insufficient role. User:', session.user.role, 'Required:', requiredRole)
        return createRedirectResponse(request, '/access-denied', true)
      }

      // Add user info to request headers for use in API routes
      const response = NextResponse.next()
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email)
      response.headers.set('x-user-role', session.user.role)
      response.headers.set('x-user-active', session.user.isActive.toString())

      console.log('✅ [AUTH MIDDLEWARE] Authentication successful for:', session.user.email)

      return this.addHeaders(response)

    } catch (error) {
      console.error('❌ [AUTH MIDDLEWARE] Error in protect:', error)
      return createRedirectResponse(request, redirectTo)
    }
  }

  // Helper methods
  private isPathExcluded(pathname: string, excludedPaths: string[]): boolean {
    return excludedPaths.some(path => pathname.startsWith(path))
  }

  private isPathAllowed(pathname: string, allowedPaths: string[]): boolean {
    return allowedPaths.some(path => pathname.startsWith(path))
  }

  // Middleware specifically for admin routes
  async protectAdmin(request: NextRequest): Promise<NextResponse> {
    console.log('🔐 [AUTH MIDDLEWARE] Protecting admin route')
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
    console.log('🔌 [AUTH MIDDLEWARE] Protecting API route')
    
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
          return this.createRateLimitResponse(rateLimitResult.resetTime)
        }
      }

      // Handle OPTIONS requests for CORS
      if (request.method === 'OPTIONS') {
        return this.handleCORSPreflight(request)
      }

      const session = await sessionManager.getSession(request)
      
      if (!session) {
        return createUnauthorizedResponse('Authentication required')
      }

      if (!session.user.isActive) {
        return createUnauthorizedResponse('Account is disabled')
      }

      if (requireEmailVerification && !(session.user as any).isEmailVerified) {
        return createUnauthorizedResponse('Email verification required')
      }

      if (requiredRole && !hasRequiredRole(session.user.role, requiredRole)) {
        return createForbiddenResponse('Insufficient permissions')
      }

      // Add user info to request headers
      const response = NextResponse.next()
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email)
      response.headers.set('x-user-role', session.user.role)

      return this.addHeaders(response)

    } catch (error) {
      console.error('API auth middleware error:', error)
      return createUnauthorizedResponse('Authentication error')
    }
  }

  // Create rate limit response
  private createRateLimitResponse(resetTime: number): NextResponse {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
        }
      }
    )
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