
import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/global'
import { sessionManager } from './session'

export interface AuthMiddlewareOptions {
  requiredRole?: UserRole
  requireEmailVerification?: boolean
  redirectTo?: string
  allowedPaths?: string[]
  excludedPaths?: string[]
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
      excludedPaths = []
    } = options

    const { pathname } = request.nextUrl

    // Skip excluded paths
    if (this.isPathExcluded(pathname, excludedPaths)) {
      return NextResponse.next()
    }

    // Allow specific paths without authentication
    if (this.isPathAllowed(pathname, allowedPaths)) {
      return NextResponse.next()
    }

    try {
      // Get session from request
      const session = await sessionManager.getSession(request)
      
      if (!session) {
        return this.redirectToAuth(request, redirectTo)
      }

      // Check if user is active
      if (!session.user.isActive) {
        return this.createUnauthorizedResponse('Account is disabled')
      }

      // Check email verification requirement
      if (requireEmailVerification && !session.user) {
        // Would need to check isEmailVerified from database
        // For now, assume verified if session exists
      }

      // Check role requirement
      if (requiredRole && !this.hasRequiredRole(session.user.role, requiredRole)) {
        return this.createForbiddenResponse('Insufficient permissions')
      }

      // Add user info to request headers for use in API routes
      const response = NextResponse.next()
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email)
      response.headers.set('x-user-role', session.user.role)

      return response
    } catch (error) {
      console.error('Auth middleware error:', error)
      return this.redirectToAuth(request, redirectTo)
    }
  }

  // Middleware specifically for admin routes
  async protectAdmin(request: NextRequest): Promise<NextResponse> {
    return this.protect(request, {
      requiredRole: 'admin',
      redirectTo: '/signin',
      excludedPaths: ['/api/auth/*'],
    })
  }

  // Middleware for API routes
  async protectAPI(
    request: NextRequest,
    options: AuthMiddlewareOptions = {}
  ): Promise<NextResponse> {
    const { requiredRole, requireEmailVerification = false } = options

    try {
      const session = await sessionManager.getSession(request)
      
      if (!session) {
        return this.createUnauthorizedResponse('Authentication required')
      }

      if (!session.user.isActive) {
        return this.createUnauthorizedResponse('Account is disabled')
      }

      if (requiredRole && !this.hasRequiredRole(session.user.role, requiredRole)) {
        return this.createForbiddenResponse('Insufficient permissions')
      }

      // Add user context to headers
      const response = NextResponse.next()
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email)
      response.headers.set('x-user-role', session.user.role)

      return response
    } catch (error) {
      console.error('API auth middleware error:', error)
      return this.createUnauthorizedResponse('Authentication failed')
    }
  }

  // Check if user has required role
  private hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      moderator: 2,
      admin: 3,
    }

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
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

  // Redirect to authentication page
  private redirectToAuth(request: NextRequest, redirectTo: string): NextResponse {
    const url = request.nextUrl.clone()
    url.pathname = redirectTo
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Create unauthorized response for API routes
  private createUnauthorizedResponse(message: string): NextResponse {
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    )
  }

  // Create forbidden response for API routes
  private createForbiddenResponse(message: string): NextResponse {
    return NextResponse.json(
      { success: false, error: message },
      { status: 403 }
    )
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
