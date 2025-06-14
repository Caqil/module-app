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

    // Clear all authentication cookies
    sessionManager.clearSessionCookies(response)

    // Also clear any other potential auth-related cookies
    response.cookies.delete('session')
    response.cookies.delete('auth-token')
    response.cookies.delete('refresh-token')
    response.cookies.delete('user-session')

    // Set additional headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

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

// Handle GET requests by redirecting to POST (some logout links might use GET)
export async function GET(request: NextRequest) {
  console.log('🚪 [LOGOUT API] GET request received, processing logout')
  
  try {
    const response = NextResponse.redirect(new URL('/signin?message=Logged out successfully', request.url))
    
    // Clear cookies on GET as well
    sessionManager.clearSessionCookies(response)
    response.cookies.delete('session')
    response.cookies.delete('auth-token')
    response.cookies.delete('refresh-token')
    response.cookies.delete('user-session')

    return response
  } catch (error) {
    console.error('❌ [LOGOUT API] GET logout error:', error)
    return NextResponse.redirect(new URL('/signin', request.url))
  }
}