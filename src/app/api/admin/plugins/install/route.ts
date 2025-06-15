
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApiResponse, FileUpload } from '@/types/global';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { generateId } from '@/lib/utils';
import { pluginManager } from '@/lib/plugins/manager';

export async function POST(request: NextRequest) {
  try {
    console.log('📦 Plugin Installation API: Starting...');
    
    // Authentication check
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const overwrite = formData.get('overwrite') === 'true';
    const activate = formData.get('activate') === 'true';

    if (!file) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No plugin file provided'
      }, { status: 400 });
    }

    // Validate file
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin must be a ZIP file'
      }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plugin file too large (max 50MB)'
      }, { status: 400 });
    }

    console.log(`📦 Processing plugin: ${file.name} (${file.size} bytes)`);

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public/uploads/plugins');
    await mkdir(uploadDir, { recursive: true });

    // Save uploaded file temporarily
    const fileName = `${generateId()}_${file.name}`;
    const filePath = join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    console.log(`💾 Plugin file saved: ${filePath}`);

    // Create FileUpload object for plugin manager
    const fileUpload: FileUpload = {
      filename: fileName,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      path: filePath,
      buffer
    };

    console.log(`🔧 Installing plugin using enhanced manager...`);

    // Use enhanced plugin manager (WordPress-like)
    const result = await pluginManager.installPlugin(fileUpload, session.user.id, {
      overwrite,
      activate,
      skipValidation: false,
      backup: true
    });

    if (result.success) {
      console.log(`✅ Plugin installation successful: ${result.pluginId}`);

      // Return complete plugin data for immediate UI update
      let pluginData = result.plugin;
  if (!pluginData && result.pluginId) {
    pluginData = await pluginManager.getPlugin(result.pluginId);
  }

  return NextResponse.json<ApiResponse>({
    success: true,
    message: result.message,
    data: {
      pluginId: result.pluginId,
      plugin: pluginData,
      activated: activate && pluginData?.isActive
    }
  });
    } else {
      console.error(`❌ Plugin installation failed: ${result.message}`);

      return NextResponse.json<ApiResponse>({
        success: false,
        error: result.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Plugin installation API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: `Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}