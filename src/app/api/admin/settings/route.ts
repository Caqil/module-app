
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { systemSettingsSchema } from '@/lib/validations'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { SystemSettingsModel } from '@/lib/database/models/settings'

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
    const settings = await SystemSettingsModel.getSettings()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { settings }
    })

  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const validation = systemSettingsSchema.partial().safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        errors: validation.error.flatten().fieldErrors,
        message: 'Validation failed'
      }, { status: 400 })
    }

    await connectToDatabase()
    const settings = await SystemSettingsModel.updateSettings(validation.data)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { settings },
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
