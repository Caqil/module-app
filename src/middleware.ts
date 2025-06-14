import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Simple setup check - if MONGODB_URI is not set, redirect to setup
  if (!process.env.MONGODB_URI) {
    if (pathname.startsWith('/setup') || pathname === '/api/setup') {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // Allow auth routes
  if (pathname.startsWith('/signin') || 
      pathname.startsWith('/signup') || 
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/setup')) {
    return NextResponse.next()
  }

  // For now, allow all API routes (you can add auth later)
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // REMOVED: The automatic redirect from '/' to '/signin'
  // Let the client-side page.tsx handle the routing logic
  
  // Allow all other routes for now (you can add auth protection later)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}