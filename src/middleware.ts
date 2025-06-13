import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// TEMPORARY BYPASS MIDDLEWARE FOR DEBUGGING
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

  // Log all requests for debugging
  console.log(`[DEBUG] Request: ${pathname}`)

  // Allow all routes temporarily
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}