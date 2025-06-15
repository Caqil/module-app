
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { connectToDatabase } from '@/lib/database/mongodb'

// GET - Get plugin details
export async function GET(
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

    return NextResponse.json({
      success: true,
      plugin: {
        id: plugin.pluginId,
        name: plugin.name,
        version: plugin.version,
        description: plugin.manifest.description,
        author: plugin.manifest.author,
        category: plugin.manifest.category,
        isActive: plugin.isActive,
        status: plugin.status,
        manifest: plugin.manifest,
        config: plugin.config,
        errorLog: plugin.errorLog.slice(-10),
        runtimeInfo: {
          isLoaded: true,
          hasErrors: plugin.errorLog.some(log => log.level === 'error'),
          routeCount: plugin.routes?.length || 0,
          hookCount: plugin.hooks?.length || 0,
          loadedAt: plugin.activatedAt,
          adminPageCount: plugin.manifest.adminPages?.length || 0,
          dashboardWidgetCount: plugin.manifest.dashboardWidgets?.length || 0,
          dependencyCount: Object.keys(plugin.manifest.dependencies?.plugins || {}).length,
          errorCount: plugin.errorLog.filter(log => log.level === 'error').length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching plugin details:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch plugin details' 
    }, { status: 500 })
  }
}

// DELETE - Uninstall plugin
export async function DELETE(
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
        error: 'Cannot delete active plugin. Deactivate it first.' 
      }, { status: 400 })
    }

    // Delete plugin files
    if (plugin.installPath) {
      try {
        const fs = require('fs/promises')
        await fs.rm(plugin.installPath, { recursive: true, force: true })
      } catch (error) {
        console.warn('Failed to delete plugin files:', error)
      }
    }

    // Delete from database
    await plugin.deleteOne()

    return NextResponse.json({
      success: true,
      message: `Plugin '${plugin.name}' deleted successfully`
    })

  } catch (error) {
    console.error('Plugin deletion error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete plugin' 
    }, { status: 500 })
  }
}