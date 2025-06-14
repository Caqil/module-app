
import { NextRequest, NextResponse } from 'next/server'
import { auth, sessionManager } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        errors: validation.error.flatten().fieldErrors,
        message: 'Validation failed'
      }, { status: 400 })
    }

    console.log('🔍 [SIGNIN API] Attempting login for:', validation.data.email)

    const result = await auth.login(validation.data)

    if ('error' in result) {
      console.log('❌ [SIGNIN API] Login failed:', result.error)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: result.error
      }, { status: 401 })
    }

    console.log('✅ [SIGNIN API] Login successful for:', result.user.email)

    // Use the session that was already created by auth.login()
    const { session, user } = result

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        user: session.user, 
        session: session
      },
      message: 'Login successful'
    })

    // Set the session cookies using the tokens from the existing session
    sessionManager.setSessionCookies(response, session.accessToken, session.refreshToken)

    console.log('🍪 [SIGNIN API] Session cookies set successfully')
    console.log('🔑 [SIGNIN API] Access token length:', session.accessToken?.length || 0)

    return response

  } catch (error) {
    console.error('❌ [SIGNIN API] Sign in error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}