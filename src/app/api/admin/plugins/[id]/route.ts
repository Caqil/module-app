// src/app/api/admin/plugins/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApiResponse } from '@/types/global';
import { connectToDatabase } from '@/lib/database/mongodb';
import { pluginManager } from '@/lib/plugins/manager';

interface RouteParams {
  params: { id: string };
}

// GET - Get plugin details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    await connectToDatabase();
    const plugin = await pluginManager.getPlugin(params.id);

    if (!plugin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin not found'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: plugin
    });

  } catch (error) {
    console.error('Get plugin details error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Plugin actions (activate, deactivate, configure)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const body = await request.json();
    const { action, config } = body;

    if (!action) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Action is required'
      }, { status: 400 });
    }

    await connectToDatabase();
    let result;

    switch (action) {
      case 'activate':
        result = await pluginManager.activatePlugin(params.id, session.user.id, config);
        break;
      
      case 'deactivate':
        result = await pluginManager.deactivatePlugin(params.id, session.user.id);
        break;
      
      case 'configure':
        if (!config) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Configuration data is required'
          }, { status: 400 });
        }
        result = await pluginManager.configurePlugin(params.id, config, session.user.id);
        break;
      
      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

    return NextResponse.json<ApiResponse>({
      success: result.success,
      data: result.success ? { 
        backupId: result.success 
      } : undefined,
      message: result.message
    }, result.success ? { status: 200 } : { status: 400 });

  } catch (error) {
    console.error('Plugin action error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Uninstall plugin
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    await connectToDatabase();
    const result = await pluginManager.uninstallPlugin(params.id, session.user.id);

    return NextResponse.json<ApiResponse>({
      success: result.success,
      message: result.message
    }, result.success ? { status: 200 } : { status: 400 });

  } catch (error) {
    console.error('Uninstall plugin error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}