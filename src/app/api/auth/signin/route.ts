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

    const result = await auth.login(validation.data)

    if ('error' in result) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: result.error
      }, { status: 401 })
    }

    const { session, user } = result
    const { accessToken, refreshToken } = await sessionManager.createSession(user)

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { user: session.user, session },
      message: 'Login successful'
    })

    sessionManager.setSessionCookies(response, accessToken, refreshToken)
    return response

  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}