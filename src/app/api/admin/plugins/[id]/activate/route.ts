
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { connectToDatabase } from '@/lib/database/mongodb'

// ✅ FIXED: Must export as POST (not POST_ACTIVATE)
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

    if (plugin.isActive) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin is already active' 
      }, { status: 400 })
    }

    // Activate plugin
    await plugin.updateOne({
      isActive: true,
      activatedAt: new Date(),
      $push: {
        errorLog: {
          level: 'info',
          message: 'Plugin activated',
          timestamp: new Date(),
          context: { activatedBy: session.user.email || session.user.name }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Plugin '${plugin.name}' activated successfully`
    })

  } catch (error) {
    console.error('Plugin activation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to activate plugin' 
    }, { status: 500 })
  }
}