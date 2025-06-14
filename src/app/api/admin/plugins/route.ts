import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types/global';
import fs from 'fs/promises';
import path from 'path';
import { Dirent } from 'fs';

// ✅ Read plugins directly from file system in API
export async function GET(request: NextRequest) {
  try {
    console.log('📁 Reading plugins from file system...');

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    // ✅ Read directly from plugins folder
    const pluginsDir = path.join(process.cwd(), 'plugins', 'installed');
    
    let pluginFolders: Dirent<string>[];
    try {
      pluginFolders = await fs.readdir(pluginsDir, { withFileTypes: true });
    } catch (error) {
      // If plugins directory doesn't exist, return empty array
      console.warn('⚠️ Plugins directory not found, creating it...');
      await fs.mkdir(pluginsDir, { recursive: true });
      pluginFolders = [];
    }
    
    const allPlugins = [];
    
    for (const folder of pluginFolders) {
      if (folder.isDirectory()) {
        try {
          // Read plugin.json manifest
          const manifestPath = path.join(pluginsDir, folder.name, 'plugin.json');
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(manifestContent);
          
          // Create plugin object similar to database structure
          allPlugins.push({
            _id: folder.name,
            pluginId: folder.name,
            name: manifest.name,
            version: manifest.version,
            status: 'installed',
            isActive: true, // Assume active if installed
            manifest,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Add registry info for compatibility
            registry: {
              isLoaded: true,
              isActive: true,
              isLoading: false,
              error: null
            }
          });
        } catch (error) {
          console.warn(`⚠️ Failed to read plugin ${folder.name}:`, error);
        }
      }
    }

    console.log(`📦 Found ${allPlugins.length} plugins in file system`);

    // Apply filters (keep existing logic)
    let filteredPlugins = allPlugins;

    if (status && status !== 'all') {
      switch (status) {
        case 'active':
          filteredPlugins = filteredPlugins.filter(p => p.isActive);
          break;
        case 'inactive':
          filteredPlugins = filteredPlugins.filter(p => !p.isActive);
          break;
      }
    }

    if (category && category !== 'all') {
      filteredPlugins = filteredPlugins.filter(p => 
        p.manifest?.category === category
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlugins = filteredPlugins.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.manifest?.description?.toLowerCase().includes(searchLower) ||
        p.manifest?.author?.name?.toLowerCase().includes(searchLower) ||
        p.pluginId.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlugins = filteredPlugins.slice(startIndex, endIndex);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        plugins: paginatedPlugins,
        pagination: {
          page,
          limit,
          total: filteredPlugins.length,
          pages: Math.ceil(filteredPlugins.length / limit)
        },
        filters: { status, category, search },
        source: 'filesystem'
      }
    });

  } catch (error) {
    console.error('❌ Plugins API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Failed to read plugins: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}