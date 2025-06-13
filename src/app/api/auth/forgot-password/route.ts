import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { forgotPasswordSchema } from '@/lib/validations'
import { ApiResponse } from '@/types/global'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        errors: validation.error.flatten().fieldErrors,
        message: 'Validation failed'
      }, { status: 400 })
    }

    const result = await auth.requestPasswordReset(validation.data.email)

    return NextResponse.json<ApiResponse>({
      success: result.success,
      message: result.message
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
