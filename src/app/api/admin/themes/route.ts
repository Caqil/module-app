
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { themeManager } from '@/lib/themes/manager'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectToDatabase()
    const themes = await themeManager.getInstalledThemes()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { themes }
    })

  } catch (error) {
    console.error('Get themes error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
