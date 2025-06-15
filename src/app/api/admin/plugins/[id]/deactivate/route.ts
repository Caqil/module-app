
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { connectToDatabase } from '@/lib/database/mongodb'

// ✅ FIXED: Must export as POST (not POST_DEACTIVATE)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const pluginId = params.id
    await connectToDatabase()

    const plugin = await InstalledPluginModel.findOne({ pluginId })
    if (!plugin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin not found' 
      }, { status: 404 })
    }

    if (!plugin.isActive) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin is already inactive' 
      }, { status: 400 })
    }

    // Deactivate plugin
    await plugin.updateOne({
      isActive: false,
      activatedAt: null,
      $push: {
        errorLog: {
          level: 'info',
          message: 'Plugin deactivated',
          timestamp: new Date(),
          context: { deactivatedBy: session.user.email || session.user.name }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Plugin '${plugin.name}' deactivated successfully`
    })

  } catch (error) {
    console.error('Plugin deactivation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to deactivate plugin' 
    }, { status: 500 })
  }
}
