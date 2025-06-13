import { NextRequest, NextResponse } from 'next/server'
import { sessionManager } from '@/lib/auth'
import { ApiResponse } from '@/types/global'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Logged out successfully'
    })

    sessionManager.clearSessionCookies(response)
    return response

  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}