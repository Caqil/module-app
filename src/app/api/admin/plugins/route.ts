
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApiResponse } from '@/types/global';
import { pluginManager } from '@/lib/plugins/manager';
import { pluginRegistry } from '@/lib/plugins/registry';

// Get all plugins with real-time registry data
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Plugins list API called');

    // Authentication check
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status'); // 'active', 'inactive', 'all'
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    console.log(`📊 Query params: page=${page}, limit=${limit}, status=${status}, category=${category}, search=${search}`);

    // Get all plugins from database
    const allPlugins = await pluginManager.getInstalledPlugins();
    console.log(`📦 Found ${allPlugins.length} plugins in database`);

    // Enhance with registry data (WordPress-like real-time status)
    const enhancedPlugins = allPlugins.map(dbPlugin => {
      const registryPlugin = pluginRegistry.getPlugin(dbPlugin.pluginId);
      const isLoaded = pluginRegistry.isPluginLoaded(dbPlugin.pluginId);
      const isActive = pluginRegistry.isPluginActive(dbPlugin.pluginId);
      const error = pluginRegistry.getPluginError(dbPlugin.pluginId);
      const isLoading = pluginRegistry.isPluginLoading(dbPlugin.pluginId);

      return {
        ...dbPlugin,
        registry: {
          isLoaded,
          isActive,
          isLoading,
          error,
          loadedAt: registryPlugin?.loadedAt,
          lastUpdated: pluginRegistry.getRegistryState().lastUpdated
        },
        // Override database status with real-time registry status
        isActive: isActive,
        status: error ? 'failed' : (isLoading ? 'installing' : (isLoaded ? 'installed' : 'disabled'))
      };
    });

    // Apply filters
    let filteredPlugins = enhancedPlugins;

    // Status filter
    if (status && status !== 'all') {
      switch (status) {
        case 'active':
          filteredPlugins = filteredPlugins.filter(p => p.isActive);
          break;
        case 'inactive':
          filteredPlugins = filteredPlugins.filter(p => !p.isActive);
          break;
        case 'error':
          filteredPlugins = filteredPlugins.filter(p => p.registry.error);
          break;
        case 'loading':
          filteredPlugins = filteredPlugins.filter(p => p.registry.isLoading);
          break;
      }
    }

    // Category filter
    if (category && category !== 'all') {
      filteredPlugins = filteredPlugins.filter(p => 
        p.manifest?.category === category
      );
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlugins = filteredPlugins.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.manifest?.description?.toLowerCase().includes(searchLower) ||
        p.manifest?.author?.name?.toLowerCase().includes(searchLower) ||
        p.pluginId.toLowerCase().includes(searchLower)
      );
    }

    // Sort by installation date (newest first) and then by active status
    filteredPlugins.sort((a, b) => {
      // Active plugins first
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // Then by installation date
     const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
return bTime - aTime;
    });

    // Pagination
    const total = filteredPlugins.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedPlugins = filteredPlugins.slice(offset, offset + limit);

    // Get plugin statistics
    const stats = {
      total: allPlugins.length,
      active: enhancedPlugins.filter(p => p.isActive).length,
      inactive: enhancedPlugins.filter(p => !p.isActive).length,
      error: enhancedPlugins.filter(p => p.registry.error).length,
      loading: enhancedPlugins.filter(p => p.registry.isLoading).length,
      categories: [...new Set(allPlugins.map(p => p.manifest?.category).filter(Boolean))],
      registryStats: pluginRegistry.getStats()
    };

    console.log(`📊 Plugin stats:`, stats);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        plugins: paginatedPlugins,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats,
        filters: {
          status,
          category,
          search
        }
      },
      message: `Found ${total} plugins`
    });

  } catch (error) {
    console.error('❌ Plugins list API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Failed to fetch plugins: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

// Bulk plugin operations (WordPress-like)
export async function PATCH(request: NextRequest) {
  try {
    console.log('⚡ Bulk plugin operations API called');

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
    const { action, pluginIds } = body;

    if (!action || !Array.isArray(pluginIds) || pluginIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Action and plugin IDs are required'
      }, { status: 400 });
    }

    console.log(`⚡ Bulk ${action} for ${pluginIds.length} plugins:`, pluginIds);

    let result;

    switch (action) {
      case 'activate':
        result = await pluginManager.activateMultiplePlugins(pluginIds, session.user.id);
        break;

      case 'deactivate':
        result = await pluginManager.deactivateMultiplePlugins(pluginIds, session.user.id);
        break;

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Unknown bulk action: ${action}`
        }, { status: 400 });
    }

    console.log(`✅ Bulk ${action} completed: ${result.success} success, ${result.failed} failed`);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Bulk ${action} completed: ${result.success} success, ${result.failed} failed`,
      data: {
        action,
        summary: {
          total: pluginIds.length,
          success: result.success,
          failed: result.failed
        },
        results: result.results
      }
    });

  } catch (error) {
    console.error('❌ Bulk plugin operations API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Bulk operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

// Force refresh plugins from registry (WordPress-like)
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Plugin refresh API called');

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
    const { type = 'sync' } = body; // 'sync' or 'refreshAll'

    console.log(`🔄 Plugin refresh type: ${type}`);

    if (type === 'refreshAll') {
      // Full refresh - clear and reload everything
      await pluginRegistry.refreshAll();
      console.log('✅ Full plugin registry refresh completed');
    } else {
      // Sync with database
      await pluginRegistry.refresh();
      console.log('✅ Plugin registry sync completed');
    }

    // Get updated stats
    const stats = pluginRegistry.getStats();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Plugin registry ${type} completed successfully`,
      data: {
        type,
        stats,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Plugin refresh API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}