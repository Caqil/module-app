// Plugin System Initialization
// src/lib/plugins/init.ts

import { pluginManager } from './manager'
import { pluginRegistry } from './registry'
import { pluginLoader } from './loader'
import { pluginHooks, PLUGIN_HOOKS } from './hooks'
import { getErrorMessage } from '@/lib/utils'

// Global state
let isInitialized = false
let isInitializing = false
let initializationPromise: Promise<void> | null = null

/**
 * Initialize the entire plugin system
 */
export async function initializePluginSystem(): Promise<void> {
  if (isInitialized) {
    return
  }

  if (isInitializing && initializationPromise) {
    return initializationPromise
  }

  isInitializing = true
  initializationPromise = doInitializePluginSystem()

  try {
    await initializationPromise
    isInitialized = true
    console.log('✅ Plugin system fully initialized')
  } catch (error) {
    console.error('❌ Plugin system initialization failed:', error)
    throw error
  } finally {
    isInitializing = false
  }
}

/**
 * Internal initialization logic
 */
async function doInitializePluginSystem(): Promise<void> {
  try {
    console.log('🚀 Initializing Plugin System...')

    // Step 1: Initialize core components
    console.log('📋 Step 1: Initializing core components...')
    pluginRegistry.initialize()
    
    // Step 2: Initialize plugin manager
    console.log('📋 Step 2: Initializing plugin manager...')
    await pluginManager.initialize()

    // Step 3: Setup core hooks
    console.log('📋 Step 3: Setting up core hooks...')
    setupCoreHooks()

    // Step 4: Load active plugins
    console.log('📋 Step 4: Loading active plugins...')
    await loadActivePlugins()

    // Step 5: Execute system ready hooks
    console.log('📋 Step 5: Executing system ready hooks...')
    await pluginHooks.doAction(PLUGIN_HOOKS.SYSTEM_READY)

    console.log('✅ Plugin system initialization complete')

  } catch (error) {
    console.error('❌ Plugin system initialization error:', error)
    throw new Error(`Plugin system initialization failed: ${getErrorMessage(error)}`)
  }
}

/**
 * Load all active plugins from database
 */
async function loadActivePlugins(): Promise<void> {
  try {
    const loadedPlugins = await pluginLoader.loadAllActivePlugins()
    
    console.log(`📦 Loaded ${loadedPlugins.length} active plugins`)

    // Register loaded plugins
    for (const plugin of loadedPlugins) {
      if (!plugin.error) {
        pluginRegistry.registerPlugin(plugin)
        console.log(`✅ Registered plugin: ${plugin.manifest.name}`)
      } else {
        console.error(`❌ Failed to register plugin ${plugin.manifest.name}:`, plugin.error)
      }
    }

    // Execute plugins loaded hook
    await pluginHooks.doAction(PLUGIN_HOOKS.PLUGIN_LOADED, { plugins: loadedPlugins })

  } catch (error) {
    console.error('Failed to load active plugins:', error)
    throw error
  }
}

/**
 * Setup core system hooks
 */
function setupCoreHooks(): void {
  // Plugin lifecycle hooks
  pluginHooks.addAction(PLUGIN_HOOKS.PLUGIN_ACTIVATED, async (data) => {
    console.log(`🔌 Plugin activated: ${data.pluginName}`)
    
    // Emit event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pluginStateChanged', { detail: data }))
    }
  })

  pluginHooks.addAction(PLUGIN_HOOKS.PLUGIN_DEACTIVATED, async (data) => {
    console.log(`🔌 Plugin deactivated: ${data.pluginName}`)
    
    // Emit event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pluginStateChanged', { detail: data }))
    }
  })

  pluginHooks.addAction(PLUGIN_HOOKS.PLUGIN_INSTALLED, async (data) => {
    console.log(`📦 Plugin installed: ${data.pluginName}`)
    
    // Emit event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pluginInstalled', { detail: data }))
    }
  })

  pluginHooks.addAction(PLUGIN_HOOKS.PLUGIN_UNINSTALLED, async (data) => {
    console.log(`🗑️ Plugin uninstalled: ${data.pluginName}`)
    
    // Emit event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pluginUninstalled', { detail: data }))
    }
  })

  // Error handling hooks
  pluginHooks.addAction(PLUGIN_HOOKS.API_ERROR, async (data) => {
    console.error(`🚨 Plugin API error in ${data.plugin}:`, data.error)
    
    // Log error to plugin's error log
    try {
      const { InstalledPluginModel } = await import('@/lib/database/models/plugin')
      await InstalledPluginModel.findOneAndUpdate(
        { pluginId: data.plugin },
        {
          $push: {
            errorLog: {
              level: 'error',
              message: `API error: ${getErrorMessage(data.error)}`,
              stack: data.error?.stack,
              context: { method: data.method, path: data.path },
              timestamp: new Date()
            }
          }
        }
      )
    } catch (logError) {
      console.error('Failed to log plugin error:', logError)
    }
  })

  // Performance monitoring hooks
  pluginHooks.addAction(PLUGIN_HOOKS.API_REQUEST_END, async (data) => {
    // Update plugin API call statistics
    try {
      const { InstalledPluginModel } = await import('@/lib/database/models/plugin')
      await InstalledPluginModel.findOneAndUpdate(
        { pluginId: data.plugin },
        {
          $inc: { 'performance.apiCalls': 1 },
          $set: { 'performance.lastMeasured': new Date() }
        }
      )
    } catch (error) {
      // Ignore performance update errors
    }
  })
}

/**
 * Shutdown the plugin system gracefully
 */
export async function shutdownPluginSystem(): Promise<void> {
  if (!isInitialized) return

  try {
    console.log('🔄 Shutting down plugin system...')

    // Execute shutdown hooks
    await pluginHooks.doAction(PLUGIN_HOOKS.SYSTEM_SHUTDOWN)

    // Unload all plugins
    await pluginLoader.clearAll()

    // Clear registry
    pluginRegistry.clearRegistry()

    // Clear hooks
    pluginHooks.clearAll()

    isInitialized = false
    initializationPromise = null

    console.log('✅ Plugin system shutdown complete')

  } catch (error) {
    console.error('❌ Plugin system shutdown error:', error)
    throw error
  }
}

/**
 * Check if plugin system is ready
 */
export function isPluginSystemReady(): boolean {
  return isInitialized
}

/**
 * Check if plugin system is currently initializing
 */
export function isPluginSystemInitializing(): boolean {
  return isInitializing
}

/**
 * Wait for plugin system to be ready
 */
export async function waitForPluginSystem(timeout: number = 30000): Promise<void> {
  if (isInitialized) return

  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const checkReady = () => {
      if (isInitialized) {
        resolve()
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Plugin system initialization timeout'))
      } else {
        setTimeout(checkReady, 100)
      }
    }

    checkReady()
  })
}

/**
 * Get plugin system status
 */
export function getPluginSystemStatus(): {
  isInitialized: boolean
  isInitializing: boolean
  stats: {
    totalPlugins: number
    activePlugins: number
    totalRoutes: number
    totalHooks: number
    totalAdminPages: number
    totalDashboardWidgets: number
  }
} {
  const stats = isInitialized ? pluginRegistry.getStats() : {
    totalPlugins: 0,
    activePlugins: 0,
    inactivePlugins: 0,
    totalRoutes: 0,
    totalHooks: 0,
    totalAdminPages: 0,
    totalDashboardWidgets: 0,
    categories: {}
  }

  return {
    isInitialized,
    isInitializing,
    stats: {
      totalPlugins: stats.totalPlugins,
      activePlugins: stats.activePlugins,
      totalRoutes: stats.totalRoutes,
      totalHooks: stats.totalHooks,
      totalAdminPages: stats.totalAdminPages,
      totalDashboardWidgets: stats.totalDashboardWidgets
    }
  }
}

/**
 * Restart the plugin system
 */
export async function restartPluginSystem(): Promise<void> {
  try {
    console.log('🔄 Restarting plugin system...')
    
    // Shutdown current system
    await shutdownPluginSystem()
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reinitialize
    await initializePluginSystem()
    
    console.log('✅ Plugin system restarted successfully')
  } catch (error) {
    console.error('❌ Plugin system restart failed:', error)
    throw error
  }
}

/**
 * Reload a specific plugin
 */
export async function reloadPlugin(pluginId: string): Promise<void> {
  try {
    console.log(`🔄 Reloading plugin: ${pluginId}`)

    // Get current plugin state
    const plugin = pluginRegistry.getPlugin(pluginId)
    const wasActive = plugin?.isActive || false

    // Unregister plugin
    pluginRegistry.unregisterPlugin(pluginId)

    // Reload plugin
    const reloadedPlugin = await pluginLoader.reloadPlugin(pluginId)

    // Re-register if it was active
    if (wasActive && !reloadedPlugin.error) {
      pluginRegistry.registerPlugin(reloadedPlugin)
    }

    console.log(`✅ Plugin ${pluginId} reloaded successfully`)

    // Emit reload event
    await pluginHooks.doAction(PLUGIN_HOOKS.PLUGIN_RELOADED, {
      pluginId,
      pluginName: reloadedPlugin.manifest.name,
      version: reloadedPlugin.manifest.version,
      timestamp: new Date()
    })

  } catch (error) {
    console.error(`❌ Failed to reload plugin ${pluginId}:`, error)
    throw error
  }
}

/**
 * Health check for plugin system
 */
export async function healthCheck(): Promise<{
  healthy: boolean
  issues: string[]
  stats: any
}> {
  const issues: string[] = []

  try {
    // Check if system is initialized
    if (!isInitialized) {
      issues.push('Plugin system not initialized')
    }

    // Check for plugins with errors
    const plugins = pluginRegistry.getAllPlugins()
    const pluginsWithErrors = plugins.filter(p => p.error)
    
    if (pluginsWithErrors.length > 0) {
      issues.push(`${pluginsWithErrors.length} plugins have errors`)
    }

    // Check for circular dependencies
    if (pluginRegistry.hasCircularDependencies()) {
      issues.push('Circular dependencies detected')
    }

    // Get system stats
    const stats = pluginRegistry.getStats()

    return {
      healthy: issues.length === 0,
      issues,
      stats
    }

  } catch (error) {
    issues.push(`Health check failed: ${getErrorMessage(error)}`)
    return {
      healthy: false,
      issues,
      stats: null
    }
  }
}

// Auto-initialize in server environment
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Initialize on server startup, but don't block
  setImmediate(() => {
    initializePluginSystem().catch(error => {
      console.error('Auto-initialization failed:', error)
    })
  })
}