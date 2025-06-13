
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { themeManager } from '@/lib/themes/manager'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectToDatabase()
    const theme = await themeManager.getTheme(params.id)

    if (!theme) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Theme not found'
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { theme }
    })

  } catch (error) {
    console.error('Get theme error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { action, ...options } = body

    await connectToDatabase()
    let result

    switch (action) {
      case 'activate':
        result = await themeManager.activateTheme(params.id, session.user.id, options)
        break
      case 'deactivate':
        result = await themeManager.deactivateTheme(params.id, session.user.id)
        break
      case 'customize':
        result = await themeManager.customizeTheme(params.id, options.customization, session.user.id)
        break
      case 'backup':
        result = await themeManager.backupTheme(params.id, session.user.id, options.backupType)
        break
      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

    return NextResponse.json<ApiResponse>({
      success: result.success,
      data: 'backupId' in result ? { backupId: result.backupId } : undefined,
      message: result.message
    }, result.success ? { status: 200 } : { status: 400 })

  } catch (error) {
    console.error('Theme action error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectToDatabase()
    const result = await themeManager.uninstallTheme(params.id, session.user.id)

    return NextResponse.json<ApiResponse>({
      success: result.success,
      message: result.message
    }, result.success ? { status: 200 } : { status: 400 })

  } catch (error) {
    console.error('Uninstall theme error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
