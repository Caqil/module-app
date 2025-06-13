
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ApiResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { UserModel } from '@/lib/database/models/user'
import { InstalledThemeModel } from '@/lib/database/models/theme'
import { InstalledPluginModel } from '@/lib/database/models/plugin'

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

    const [
      totalUsers,
      activeUsers,
      totalThemes,
      activeTheme,
      totalPlugins,
      activePlugins,
      recentUsers,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ isActive: true }),
      InstalledThemeModel.countDocuments(),
      InstalledThemeModel.findActiveTheme(),
      InstalledPluginModel.countDocuments(),
      InstalledPluginModel.countDocuments({ isActive: true }),
      UserModel.find().sort({ createdAt: -1 }).limit(5),
    ])

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        recent: recentUsers,
      },
      themes: {
        total: totalThemes,
        active: activeTheme?.name || 'None',
      },
      plugins: {
        total: totalPlugins,
        active: activePlugins,
      },
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { stats }
    })

  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
