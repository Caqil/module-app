
import { pluginRegistry } from './registry';
import { pluginManager } from './manager';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// WordPress-like initialization function
export async function initializePluginSystem(): Promise<void> {
  if (isInitialized) {
    console.log('🔌 Plugin system already initialized');
    return;
  }

  if (initializationPromise) {
    console.log('🔌 Plugin system initialization already in progress...');
    return initializationPromise;
  }

  console.log('🚀 Initializing Plugin System...');

  initializationPromise = (async () => {
    try {
      // Initialize plugin registry (loads from database, activates plugins)
      await pluginRegistry.initialize();
      
      // Set up event listeners for real-time updates
      setupEventListeners();
      
      isInitialized = true;
      console.log('✅ Plugin System initialized successfully');
      
      // Log system stats
      const stats = pluginRegistry.getStats();
      console.log(`📊 Plugin System Stats:`, {
        totalPlugins: stats.totalPlugins,
        activePlugins: stats.activePlugins,
        errorCount: stats.errorCount,
        autoSyncEnabled: stats.autoSyncEnabled
      });

    } catch (error) {
      console.error('❌ Plugin System initialization failed:', error);
      throw error;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

// Set up event listeners for WordPress-like functionality
function setupEventListeners(): void {
  // Listen for plugin registry events
  pluginRegistry.on('pluginInstalled', (event) => {
    console.log(`🎉 Plugin installed: ${event.pluginId}`);
    broadcastUpdate('plugin:installed', event);
  });

  pluginRegistry.on('pluginActivated', (event) => {
    console.log(`✅ Plugin activated: ${event.pluginId}`);
    broadcastUpdate('plugin:activated', event);
  });

  pluginRegistry.on('pluginDeactivated', (event) => {
    console.log(`⏸️ Plugin deactivated: ${event.pluginId}`);
    broadcastUpdate('plugin:deactivated', event);
  });

  pluginRegistry.on('pluginConfigured', (event) => {
    console.log(`⚙️ Plugin configured: ${event.pluginId}`);
    broadcastUpdate('plugin:configured', event);
  });

  pluginRegistry.on('pluginUninstalled', (event) => {
    console.log(`🗑️ Plugin uninstalled: ${event.pluginId}`);
    broadcastUpdate('plugin:uninstalled', event);
  });

  pluginRegistry.on('pluginLoadError', (event) => {
    console.warn(`⚠️ Plugin load error: ${event.pluginId} - ${event.error}`);
    broadcastUpdate('plugin:error', event);
  });

  pluginRegistry.on('registrySynced', (event) => {
    console.log(`🔄 Registry synced: ${event.syncedCount} plugins`);
    if (event.syncedCount > 0) {
      broadcastUpdate('registry:synced', event);
    }
  });

  // Listen for process signals to gracefully shutdown
  if (typeof process !== 'undefined') {
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }

  console.log('👂 Plugin system event listeners set up');
}

// Broadcast updates for real-time UI updates
function broadcastUpdate(eventType: string, data: any): void {
  try {
    // Emit custom event for client-side updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pluginSystemUpdate', {
        detail: { eventType, data, timestamp: new Date() }
      }));
    }

    // Could also use WebSockets, Server-Sent Events, etc.
    // For now, just log the update
    console.log(`📡 Broadcasting update: ${eventType}`, data);

  } catch (error) {
    console.warn('Failed to broadcast update:', error);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`🛑 Received ${signal}, shutting down plugin system gracefully...`);
  
  try {
    // Stop auto-sync
    pluginRegistry.stopAutoSync();
    
    // Give time for any ongoing operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Plugin system shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during plugin system shutdown:', error);
    process.exit(1);
  }
}

// WordPress-like hook for checking if system is ready
export function isPluginSystemReady(): boolean {
  return isInitialized;
}

// WordPress-like hook for getting system stats
export function getPluginSystemStats() {
  const registryStats = pluginRegistry.getStats();
  return {
    systemInitialized: isInitialized,  // Renamed to avoid conflict
    ...registryStats
  };
}


// WordPress-like hook for waiting until system is ready
export async function waitForPluginSystem(timeoutMs = 30000): Promise<void> {
  if (isInitialized) return;
  
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkReady = () => {
      if (isInitialized) {
        resolve();
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error('Plugin system initialization timeout'));
      } else {
        setTimeout(checkReady, 100);
      }
    };
    
    checkReady();
  });
}

// Auto-initialize in Next.js API routes and pages
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  // Initialize when this module is imported
  setImmediate(() => {
    initializePluginSystem().catch(error => {
      console.error('Auto-initialization failed:', error);
    });
  });
}

// Export everything needed
export {
  pluginRegistry,
  pluginManager,
  isInitialized
};