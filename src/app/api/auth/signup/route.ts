import { NextRequest, NextResponse } from 'next/server'
import { auth, sessionManager } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { SystemSettingsModel } from '@/lib/database/models/settings'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    // Check if user registration is allowed
    const settings = await SystemSettingsModel.getSettings()
    if (!settings.allowUserRegistration) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User registration is currently disabled'
      }, { status: 403 })
    }

    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        errors: validation.error.flatten().fieldErrors,
        message: 'Validation failed'
      }, { status: 400 })
    }

    const result = await auth.register(validation.data)

    if ('error' in result) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    const { session, user } = result
    const { accessToken, refreshToken } = await sessionManager.createSession(user)

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { user: session.user, session },
      message: 'Registration successful'
    })

    sessionManager.setSessionCookies(response, accessToken, refreshToken)
    return response

  } catch (error) {
    console.error('Sign up error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}