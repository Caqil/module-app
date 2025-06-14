
import { NextRequest, NextResponse } from 'next/server'
import { sessionManager } from '@/lib/auth'
import { ApiResponse } from '@/types/global'

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 [LOGOUT API] Processing logout request')

    // Get current session for logging purposes
    const session = await sessionManager.getSession(request)
    if (session) {
      console.log('👤 [LOGOUT API] Logging out user:', session.user.email)
    } else {
      console.log('👤 [LOGOUT API] No session found, clearing cookies anyway')
    }

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear all authentication cookies using improved method
    sessionManager.clearSessionCookies(response)

    // Set cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    console.log('✅ [LOGOUT API] Logout successful, cookies cleared')
    return response

  } catch (error) {
    console.error('❌ [LOGOUT API] Logout error:', error)
    
    // Even if there's an error, still try to clear cookies
    const response = NextResponse.json<ApiResponse>({
      success: true, // Still return success to allow logout
      message: 'Logged out successfully'
    })

    sessionManager.clearSessionCookies(response)
    return response
  }
}

// Handle GET requests by redirecting to POST
export async function GET(request: NextRequest) {
  console.log('🚪 [LOGOUT API] GET request received, processing logout')
  
  try {
    const response = NextResponse.redirect(new URL('/signin?message=Logged out successfully', request.url))
    sessionManager.clearSessionCookies(response)
    return response
  } catch (error) {
    console.error('❌ [LOGOUT API] GET logout error:', error)
    return NextResponse.redirect(new URL('/signin', request.url))
  }
}