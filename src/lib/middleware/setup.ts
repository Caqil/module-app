
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/mongodb'
import { SystemSettingsModel } from '@/lib/database/models/settings'

interface SetupStatus {
  isComplete: boolean
  siteName?: string
  error?: string
}

// Cache setup status to avoid database calls on every request
let setupStatusCache: {
  status: SetupStatus | null
  timestamp: number
  ttl: number
} = {
  status: null,
  timestamp: 0,
  ttl: 60000, // 1 minute cache
}

// Routes that are allowed during setup
const SETUP_ALLOWED_ROUTES = [
  '/setup',
  '/api/setup',
  // Static files and assets
  '/_next',
  '/favicon.ico',
]

// Routes that should redirect to setup if not complete
const SETUP_REQUIRED_ROUTES = [
  '/admin',
  '/dashboard',
  '/profile',
  '/settings',
]

// Routes that should be accessible even during setup
const SETUP_BYPASS_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

async function getSetupStatus(): Promise<SetupStatus> {
  const now = Date.now()
  
  // Return cached status if still valid
  if (
    setupStatusCache.status && 
    (now - setupStatusCache.timestamp) < setupStatusCache.ttl
  ) {
    return setupStatusCache.status
  }

  try {
    // Connect to database and check setup status
    await connectToDatabase()
    const settings = await SystemSettingsModel.getSettings()
    
    const status: SetupStatus = {
      isComplete: settings.isSetupComplete,
      siteName: settings.siteName,
    }

    // Cache the result
    setupStatusCache = {
      status,
      timestamp: now,
      ttl: setupStatusCache.ttl,
    }

    return status
  } catch (error) {
    console.error('Setup status check failed:', error)
    
    // Return error status but don't cache it
    return {
      isComplete: false,
      error: 'Failed to check setup status',
    }
  }
}

function shouldAllowRoute(pathname: string, isSetupComplete: boolean): boolean {
  // Always allow setup-related routes
  if (SETUP_ALLOWED_ROUTES.some(route => pathname.startsWith(route))) {
    return true
  }

  // If setup is complete, allow all routes
  if (isSetupComplete) {
    return true
  }

  // During setup, only allow bypass routes
  return SETUP_BYPASS_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

function shouldRedirectToSetup(pathname: string, isSetupComplete: boolean): boolean {
  // Don't redirect if setup is complete
  if (isSetupComplete) {
    return false
  }

  // Don't redirect if already on setup or allowed routes
  if (shouldAllowRoute(pathname, false)) {
    return false
  }

  // Redirect protected routes to setup
  return SETUP_REQUIRED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

export async function setupMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Skip setup check for static files and Next.js internals
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return null
  }

  try {
    const setupStatus = await getSetupStatus()

    // If there's an error checking setup status, allow access to setup routes
    if (setupStatus.error) {
      if (pathname.startsWith('/setup') || pathname === '/api/setup') {
        return null // Allow setup routes
      }
      
      // For other routes, redirect to setup
      if (!shouldAllowRoute(pathname, false)) {
        return NextResponse.redirect(new URL('/setup', request.url))
      }
      
      return null
    }

    // Handle setup incomplete
    if (!setupStatus.isComplete) {
      // Redirect to setup if trying to access protected routes
      if (shouldRedirectToSetup(pathname, false)) {
        return NextResponse.redirect(new URL('/setup', request.url))
      }

      // Allow access to setup and bypass routes
      if (shouldAllowRoute(pathname, false)) {
        return null
      }

      // Block access to other routes
      return NextResponse.redirect(new URL('/setup', request.url))
    }

    // Setup is complete - handle special cases
    if (setupStatus.isComplete) {
      // Redirect from setup page to dashboard if setup is already complete
      if (pathname === '/setup') {
        return NextResponse.redirect(new URL('/signin?message=Setup already completed', request.url))
      }

      // Redirect from root to signin if no session (will be handled by auth middleware)
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/signin', request.url))
      }
    }

    // No setup-related action needed
    return null

  } catch (error) {
    console.error('Setup middleware error:', error)

    // On error, allow access to setup routes
    if (pathname.startsWith('/setup') || pathname === '/api/setup') {
      return null
    }

    // Redirect other routes to setup
    return NextResponse.redirect(new URL('/setup', request.url))
  }
}

// Utility to clear setup status cache (useful after setup completion)
export function clearSetupStatusCache(): void {
  setupStatusCache = {
    status: null,
    timestamp: 0,
    ttl: setupStatusCache.ttl,
  }
}

// Utility to force refresh setup status
export async function refreshSetupStatus(): Promise<SetupStatus> {
  clearSetupStatusCache()
  return getSetupStatus()
}

// Utility to check setup status without caching
export async function checkSetupStatusDirect(): Promise<SetupStatus> {
  try {
    await connectToDatabase()
    const settings = await SystemSettingsModel.getSettings()
    
    return {
      isComplete: settings.isSetupComplete,
      siteName: settings.siteName,
    }
  } catch (error) {
    console.error('Direct setup status check failed:', error)
    return {
      isComplete: false,
      error: 'Failed to check setup status',
    }
  }
}

// Middleware configuration helper
export const setupMiddlewareConfig = {
  allowedRoutes: SETUP_ALLOWED_ROUTES,
  requiredRoutes: SETUP_REQUIRED_ROUTES,
  bypassRoutes: SETUP_BYPASS_ROUTES,
  cacheSettings: {
    ttl: setupStatusCache.ttl,
    enabled: true,
  },
}