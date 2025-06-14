// Plugin Component API Endpoint
// src/app/api/plugin-routes/[pluginId]/component/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApiResponse } from '@/types/global';
import { pluginRegistry } from '@/lib/plugins/registry';
import fs from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: { pluginId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { pluginId } = params;
    const url = new URL(request.url);
    const componentPath = url.searchParams.get('path');

    console.log(`📦 Component API called: ${pluginId}/${componentPath}`);

    // Authentication check
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    if (!componentPath) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Component path is required'
      }, { status: 400 });
    }

    // Get plugin from registry
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (!plugin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Plugin ${pluginId} not found`
      }, { status: 404 });
    }

    if (!plugin.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Plugin ${pluginId} is not active`
      }, { status: 403 });
    }

    // Build the full component file path
    const fullComponentPath = path.join(
      process.cwd(),
      'plugins/installed',
      pluginId,
      componentPath
    );

    // Security check - ensure path is within plugin directory
    const pluginDir = path.join(process.cwd(), 'plugins/installed', pluginId);
    if (!fullComponentPath.startsWith(pluginDir)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid component path'
      }, { status: 400 });
    }

    try {
      // Check if component file exists
      await fs.access(fullComponentPath);
      
      // Read component file
      const componentContent = await fs.readFile(fullComponentPath, 'utf-8');
      
      // Return component content as JSON response for dynamic loading
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          content: componentContent,
          path: componentPath,
          pluginId,
          type: getComponentType(componentPath)
        }
      });

    } catch (fileError) {
      console.error(`Component file not found: ${fullComponentPath}`);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Component file not found: ${componentPath}`
      }, { status: 404 });
    }

  } catch (error) {
    console.error('❌ Plugin component API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Failed to load component: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

function getComponentType(componentPath: string): string {
  if (componentPath.includes('/admin/')) return 'adminPage';
  if (componentPath.includes('/widgets/')) return 'dashboardWidget';
  if (componentPath.includes('/components/')) return 'component';
  return 'unknown';
}