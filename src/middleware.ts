
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware } from '@/lib/auth/middleware'
import { setupMiddleware } from './lib/middleware/setup'

// Define route patterns
const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup', 
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

const SETUP_ROUTES = [
  '/setup',
]

const API_ROUTES = [
  '/api/setup',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/signout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
]

const ADMIN_ROUTES = [
  '/admin',
]

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
]

// Helper function to check if path matches pattern
function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1))
    }
    return pathname === pattern || pathname.startsWith(pattern + '/')
  })
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  try {
    // 1. Setup Check - Always run first
    const setupResponse = await setupMiddleware(request)
    if (setupResponse) {
      return setupResponse
    }

    // 2. API Routes - Handle API authentication
    if (pathname.startsWith('/api/')) {
      // Allow setup and auth APIs without authentication
      if (matchesPattern(pathname, API_ROUTES)) {
        return NextResponse.next()
      }

      // All other API routes require authentication
      return authMiddleware.protectAPI(request)
    }

    // 3. Admin Routes - Require admin authentication
    if (matchesPattern(pathname, ADMIN_ROUTES)) {
      return authMiddleware.protectAdmin(request)
    }

    // 4. Protected Routes - Require user authentication
    if (matchesPattern(pathname, PROTECTED_ROUTES)) {
      return authMiddleware.protect(request, {
        requiredRole: 'user',
        redirectTo: '/signin',
      })
    }

    // 5. Public Routes - No authentication required
    if (matchesPattern(pathname, PUBLIC_ROUTES) || matchesPattern(pathname, SETUP_ROUTES)) {
      return NextResponse.next()
    }

    // 6. Default - Allow all other routes
    return NextResponse.next()

  } catch (error) {
    console.error('Middleware error:', error)
    
    // On error, redirect to appropriate page based on route type
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Middleware error' },
        { status: 500 }
      )
    }
    
    return NextResponse.redirect(new URL('/signin', request.url))
  }
}

// Configure which paths the middleware should run on
export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public files with extensions (images, etc.)
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}