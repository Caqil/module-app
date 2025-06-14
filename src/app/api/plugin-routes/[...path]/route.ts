// src/app/api/plugins/render/[pluginId]/[...path]/route.ts
// API to render plugin components in iframe (fallback method)

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: {
    pluginId: string;
    path: string[];
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { pluginId, path: filePath } = params;
    const componentPath = filePath.join('/');

    console.log(`🖼️ Rendering plugin component: ${pluginId}/${componentPath}`);

    // Security: Admin access required
    const session = await auth.getSession(request);
    if (!session || !auth.hasRole(session, 'admin')) {
      return new NextResponse(`
        <html>
          <body>
            <div style="padding: 20px; color: red; font-family: Arial;">
              ❌ Admin access required to view plugin components
            </div>
          </body>
        </html>
      `, {
        status: 403,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Read plugin manifest
    const manifestPath = path.join(process.cwd(), 'plugins', 'installed', pluginId, 'plugin.json');
    let manifest;
    
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);
    } catch {
      return new NextResponse(`
        <html>
          <body>
            <div style="padding: 20px; color: red; font-family: Arial;">
              ❌ Plugin manifest not found: ${pluginId}
            </div>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Read component file
    const fullComponentPath = path.join(process.cwd(), 'plugins', 'installed', pluginId, componentPath);
    let componentCode;
    
    try {
      componentCode = await fs.readFile(fullComponentPath, 'utf-8');
    } catch {
      return new NextResponse(`
        <html>
          <body>
            <div style="padding: 20px; color: red; font-family: Arial;">
              ❌ Component file not found: ${componentPath}
            </div>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Create iframe HTML that renders the plugin component
    const iframeHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${manifest.name} - ${componentPath}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f9fafb;
    }
    .plugin-container {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .plugin-header {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .plugin-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .plugin-description {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }
    .component-info {
      background: #f3f4f6;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 20px;
      font-family: monospace;
      font-size: 12px;
    }
    .code-preview {
      background: #1f2937;
      color: #f9fafb;
      border-radius: 6px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow: auto;
      max-height: 300px;
    }
    .warning {
      background: #fef3c7;
      border: 1px solid #d97706;
      color: #92400e;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="plugin-container">
    <div class="plugin-header">
      <h1 class="plugin-title">${manifest.name}</h1>
      <p class="plugin-description">${manifest.description || 'No description available'}</p>
    </div>
    
    <div class="component-info">
      <strong>Plugin ID:</strong> ${pluginId}<br>
      <strong>Component:</strong> ${componentPath}<br>
      <strong>Version:</strong> ${manifest.version}<br>
      <strong>Author:</strong> ${manifest.author?.name || 'Unknown'}
    </div>

    <div class="warning">
      ⚠️ <strong>Development Mode:</strong> This component is being rendered in an iframe for security. 
      In production, components would be properly transpiled and rendered natively.
    </div>

    <h3>Component Source Code:</h3>
    <div class="code-preview">${escapeHtml(componentCode)}</div>

    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        💡 <strong>Next Step:</strong> Implement proper JSX transpilation for dynamic rendering.
      </p>
    </div>
  </div>

  <script>
    // Basic plugin component simulation
    console.log('Plugin component loaded:', {
      pluginId: '${pluginId}',
      component: '${componentPath}',
      manifest: ${JSON.stringify(manifest, null, 2)}
    });

    // Simulate plugin functionality
    if ('${pluginId}' === 'oauth-plugin') {
      console.log('OAuth plugin detected - would initialize OAuth handlers');
    }

    // Send message to parent frame
    window.parent.postMessage({
      type: 'plugin-loaded',
      pluginId: '${pluginId}',
      component: '${componentPath}',
      status: 'success'
    }, '*');
  </script>
</body>
</html>
    `;

    return new NextResponse(iframeHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Plugin-Id': pluginId,
        'X-Component': componentPath,
      },
    });

  } catch (error) {
    console.error('❌ Plugin render error:', error);
    
    const errorHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Plugin Render Error</title>
  <style>
    body { font-family: Arial; padding: 20px; color: #dc2626; }
    .error { background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="error">
    <h2>❌ Plugin Render Error</h2>
    <p><strong>Plugin:</strong> ${params.pluginId}</p>
    <p><strong>Component:</strong> ${params.path.join('/')}</p>
    <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
  </div>
</body>
</html>
    `;

    return new NextResponse(errorHTML, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = { innerHTML: '' };
  const textNode = { textContent: text };
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}