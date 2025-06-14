
import { NextRequest, NextResponse } from 'next/server'
import { pathToFileURL } from 'url'
import path from 'path'
import fs from 'fs/promises'
import { ApiResponse } from '@/types/global'
// ✅ REMOVED: All MongoDB imports and connections

interface RouteParams {
  params: { path: string[] }
}

// ✅ Plugin route handler without MongoDB
async function handlePluginRoute(request: NextRequest, { params }: RouteParams) {
  try {
    // ✅ NO MongoDB connection needed!

    const { method } = request
    const routePath = `/${params.path.join('/')}`
    
    console.log(`🔌 Plugin route called: ${method} ${routePath}`);

    // ✅ Read plugins directly from file system
    const pluginsDir = path.join(process.cwd(), 'plugins', 'installed');
    const pluginFolders = await fs.readdir(pluginsDir, { withFileTypes: true });

    // Find which plugin handles this route
    let matchedPlugin = null;
    let matchedRoute = null;

    for (const folder of pluginFolders) {
      if (folder.isDirectory()) {
        try {
          // Read plugin manifest
          const manifestPath = path.join(pluginsDir, folder.name, 'plugin.json');
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(manifestContent);

          // Check if this plugin has routes that match
          if (manifest.routes) {
            for (const route of manifest.routes) {
              const routeKey = `${route.method}:${route.path}`;
              const requestKey = `${method}:${routePath}`;
              
              if (routeKey === requestKey) {
                matchedPlugin = { id: folder.name, manifest };
                matchedRoute = route;
                console.log(`✅ Found matching route in plugin: ${folder.name}`);
                break;
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to read plugin ${folder.name}:`, error);
        }
      }
      
      if (matchedPlugin) break;
    }

    if (!matchedPlugin || !matchedRoute) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Route not found'
      }, { status: 404 })
    }

    // ✅ Execute plugin route handler directly from file system
    const handlerPath = path.join(process.cwd(), 'plugins', 'installed', matchedPlugin.id, matchedRoute.handler);
    
    try {
      // Check if handler file exists
      await fs.access(handlerPath);
      
      // Dynamic import the handler
      const handlerUrl = pathToFileURL(handlerPath).href;
      const handlerModule = await import(handlerUrl);
      
      // Create context for plugin (simplified, no database)
      const context = {
        request,
        method,
        params: Object.fromEntries(new URL(request.url).searchParams),
        pluginId: matchedPlugin.id,
        // ✅ NO database connection in context
      };

      // Execute handler
      const handlerFunction = handlerModule.default || handlerModule[method.toLowerCase()];
      
      if (typeof handlerFunction === 'function') {
        const result = await handlerFunction(context);
        return result;
      } else {
        throw new Error(`No handler function found for ${method}`);
      }

    } catch (error) {
      console.error(`❌ Plugin handler error (${matchedPlugin.id}):`, error);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Plugin handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Plugin route error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Plugin route failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

// Export HTTP method handlers
export async function GET(request: NextRequest, context: RouteParams) {
  return handlePluginRoute(request, context);
}

export async function POST(request: NextRequest, context: RouteParams) {
  return handlePluginRoute(request, context);
}

export async function PUT(request: NextRequest, context: RouteParams) {
  return handlePluginRoute(request, context);
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  return handlePluginRoute(request, context);
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  return handlePluginRoute(request, context);
}