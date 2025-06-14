
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApiResponse } from '@/types/global';
import { pluginManager } from '@/lib/plugins/manager';
import { pluginRegistry } from '@/lib/plugins/registry';

interface RouteParams {
  params: { pluginId: string };
}

// Plugin activation, deactivation, and configuration
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { pluginId } = params;
    console.log(`🔧 Plugin action API called for: ${pluginId}`);

    // Authentication check
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { action, config } = body;

    console.log(`🎯 Action: ${action} for plugin: ${pluginId}`);

    let result;

    switch (action) {
      case 'activate':
        result = await pluginManager.activatePlugin(pluginId, session.user.id);
        break;

      case 'deactivate':
        result = await pluginManager.deactivatePlugin(pluginId, session.user.id);
        break;

      case 'configure':
        if (!config) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Configuration data is required'
          }, { status: 400 });
        }
        result = await pluginManager.configurePlugin(pluginId, config, session.user.id);
        break;

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

    if (result.success) {
      console.log(`✅ Plugin ${action} successful: ${pluginId}`);

      // Get updated plugin data for response
      const updatedPlugin = await pluginManager.getPlugin(pluginId);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: result.message,
        data: {
          pluginId,
          plugin: updatedPlugin,
          action
        }
      });
    } else {
      console.error(`❌ Plugin ${action} failed: ${pluginId} - ${result.message}`);

      return NextResponse.json<ApiResponse>({
        success: false,
        error: result.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Plugin action API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

// Plugin uninstallation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { pluginId } = params;
    console.log(`🗑️ Plugin uninstall API called for: ${pluginId}`);

    // Authentication check
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Use enhanced plugin manager
    const result = await pluginManager.uninstallPlugin(pluginId, session.user.id);

    if (result.success) {
      console.log(`✅ Plugin uninstallation successful: ${pluginId}`);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: result.message,
        data: { pluginId }
      });
    } else {
      console.error(`❌ Plugin uninstallation failed: ${pluginId} - ${result.message}`);

      return NextResponse.json<ApiResponse>({
        success: false,
        error: result.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Plugin uninstall API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Uninstallation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

// Get plugin information
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { pluginId } = params;
    console.log(`📋 Plugin info API called for: ${pluginId}`);

    // Authentication check
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Get plugin from database
    const plugin = await pluginManager.getPlugin(pluginId);
    
    if (!plugin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin not found'
      }, { status: 404 });
    }

    // Get registry information if plugin is loaded
    const registryPlugin = pluginRegistry.getPlugin(pluginId);
    const isActive = pluginRegistry.isPluginActive(pluginId);
    const isLoaded = pluginRegistry.isPluginLoaded(pluginId);
    const error = pluginRegistry.getPluginError(pluginId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        plugin,
        registry: {
          isLoaded,
          isActive,
          error,
          loadedAt: registryPlugin?.loadedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Plugin info API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Failed to get plugin info: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}