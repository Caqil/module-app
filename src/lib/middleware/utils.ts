// src/lib/middleware/utils.ts
import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/global'

// Route pattern matching utilities
export function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Handle wildcard patterns
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2)
      return pathname === basePath || pathname.startsWith(basePath + '/')
    }
    
    // Handle exact match or subdirectory match
    return pathname === pattern || pathname.startsWith(pattern + '/')
  })
}

export function isStaticFile(pathname: string): boolean {
  const staticPatterns = [
    '/_next/static',
    '/_next/image',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ]
  
  // Check for file extensions
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname)
  if (hasExtension) {
    const commonExtensions = [
      '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
      '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
      '.json', '.xml', '.txt'
    ]
    return commonExtensions.some(ext => pathname.endsWith(ext))
  }
  
  return matchesPattern(pathname, staticPatterns)
}

export function isAPIRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

export function isAuthRoute(pathname: string): boolean {
  const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password', '/verify-email']
  return matchesPattern(pathname, authRoutes)
}

export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/help',
  ]
  return matchesPattern(pathname, publicRoutes)
}

// Response utilities
export function createUnauthorizedResponse(message: string = 'Authentication required'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  )
}

export function createForbiddenResponse(message: string = 'Access forbidden'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  )
}

export function createRedirectResponse(request: NextRequest, destination: string, preserveQuery: boolean = false): NextResponse {
  const url = new URL(destination, request.url)
  
  if (preserveQuery) {
    // Preserve original query parameters
    const originalParams = request.nextUrl.searchParams
    originalParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
  }
  
  // Add 'from' parameter for post-login redirect
  if (destination.includes('/signin') || destination.includes('/signup')) {
    url.searchParams.set('from', request.nextUrl.pathname)
  }
  
  return NextResponse.redirect(url)
}

// Header utilities
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Remove sensitive headers
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')
  
  return response
}

export function addCORSHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean)
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}

// Role checking utilities
export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    moderator: 2,
    admin: 3,
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// URL utilities
export function getCleanPath(pathname: string): string {
  // Remove trailing slashes except for root
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function isExternalURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.origin !== process.env.NEXTAUTH_URL
  } catch {
    return false
  }
}

// Request validation utilities
export function validateContentType(request: NextRequest, expectedType: string = 'application/json'): boolean {
  const contentType = request.headers.get('content-type')
  return contentType?.includes(expectedType) || false
}

export function extractBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    return authorization.substring(7)
  }
  return null
}

export function getCookieValue(request: NextRequest, cookieName: string): string | undefined {
  return request.cookies.get(cookieName)?.value
}

// Rate limiting utilities (basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const current = rateLimitStore.get(identifier)
  
  // Reset if window has passed
  if (!current || now > current.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }
  
  // Increment count
  current.count++
  
  const remaining = Math.max(0, maxRequests - current.count)
  const allowed = current.count <= maxRequests
  
  return { allowed, remaining, resetTime: current.resetTime }
}

export function getRateLimitIdentifier(request: NextRequest): string {
   const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return ip
}

// Logging utilities
export function logMiddlewareAction(
  action: string,
  pathname: string,
  details?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${action}: ${pathname}`, details || '')
  }
}

export function logMiddlewareError(
  error: unknown,
  pathname: string,
  context?: string
): void {
  console.error(`[Middleware Error] ${context || 'Unknown'}: ${pathname}`, error)
}

// Cache utilities for middleware
export class MiddlewareCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl: number

  constructor(ttl: number = 60000) {
    this.ttl = ttl
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Configuration validation
export function validateMiddlewareConfig(config: any): boolean {
  // Add validation logic for middleware configuration
  return true
}

// Development utilities
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function shouldSkipMiddleware(pathname: string): boolean {
  // Skip middleware for certain paths in development
  if (isDevelopmentEnvironment()) {
    const devSkipPaths = ['/_next/webpack-hmr', '/__nextjs_original-stack-frame']
    return devSkipPaths.some(path => pathname.startsWith(path))
  }
  return false
}