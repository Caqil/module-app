
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyEmailSchema } from '@/lib/validations'
import { ApiResponse } from '@/types/global'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = verifyEmailSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        errors: validation.error.flatten().fieldErrors,
        message: 'Validation failed'
      }, { status: 400 })
    }

    const result = await auth.verifyEmail(validation.data.token)

    return NextResponse.json<ApiResponse>({
      success: result.success,
      message: result.message
    }, result.success ? { status: 200 } : { status: 400 })

  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
