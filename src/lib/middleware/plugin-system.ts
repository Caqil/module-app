
import { NextRequest, NextResponse } from 'next/server';
import { initializePluginSystem, isPluginSystemReady, waitForPluginSystem } from '@/lib/plugins/init';

// WordPress-like middleware that ensures plugin system is ready
export async function withPluginSystem<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: {
    timeout?: number;
    requireReady?: boolean;
  } = {}
) {
  const { timeout = 10000, requireReady = true } = options;

  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // For plugin-related routes, ensure system is ready
      const isPluginRoute = request.url.includes('/api/admin/plugins') || 
                           request.url.includes('/api/plugin-routes');

      if (isPluginRoute || requireReady) {
        if (!isPluginSystemReady()) {
          console.log('🔄 Plugin system not ready, waiting...');
          
          try {
            await waitForPluginSystem(timeout);
            console.log('✅ Plugin system ready, proceeding with request');
          } catch (error) {
            console.error('❌ Plugin system initialization timeout');
            return NextResponse.json({
              success: false,
              error: 'Plugin system not ready. Please try again.'
            }, { status: 503 });
          }
        }
      }

      // Call the original handler
      return await handler(request, ...args);

    } catch (error) {
      console.error('❌ Plugin system middleware error:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal server error'
      }, { status: 500 });
    }
  };
}

// Wrapper for API route handlers
export function withPlugins(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    timeout?: number;
    requireReady?: boolean;
  } = {}
) {
  return withPluginSystem(handler, options);
}

// WordPress-like plugin loading middleware for app initialization
export async function initializePluginsMiddleware(): Promise<void> {
  try {
    console.log('🚀 Initializing plugins middleware...');
    await initializePluginSystem();
    console.log('✅ Plugins middleware ready');
  } catch (error) {
    console.error('❌ Plugins middleware initialization failed:', error);
    throw error;
  }
}

// Enhanced route wrapper for Next.js API routes
export function createPluginAwareRoute(handlers: {
  GET?: (request: NextRequest, context?: any) => Promise<NextResponse>;
  POST?: (request: NextRequest, context?: any) => Promise<NextResponse>;
  PUT?: (request: NextRequest, context?: any) => Promise<NextResponse>;
  DELETE?: (request: NextRequest, context?: any) => Promise<NextResponse>;
  PATCH?: (request: NextRequest, context?: any) => Promise<NextResponse>;
}) {
  const wrappedHandlers: any = {};

  Object.entries(handlers).forEach(([method, handler]) => {
    if (handler) {
      wrappedHandlers[method] = withPlugins(handler);
    }
  });

  return wrappedHandlers;
}

// Example usage in API routes:
// 
// import { createPluginAwareRoute } from '@/middleware/plugin-system';
// 
// export const { GET, POST } = createPluginAwareRoute({
//   GET: async (request) => {
//     // Your handler code here
//     // Plugin system is guaranteed to be ready
//   },
//   POST: async (request) => {
//     // Your handler code here
//   }
// });

// WordPress-like hook for plugin routes
export async function handlePluginRoute(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Ensure plugin system is ready
  if (!isPluginSystemReady()) {
    try {
      await waitForPluginSystem(5000); // 5 second timeout for plugin routes
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Plugin system not available'
      }, { status: 503 });
    }
  }

  return await handler();
}