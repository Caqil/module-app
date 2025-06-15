// Plugin Loader - Dynamic plugin loading system
// src/lib/plugins/loader.ts

import path from 'path'
import fs from 'fs/promises'
import { 
  PluginLoaderInterface, 
  LoadedPlugin, 
  InstalledPlugin, 
  PluginValidationResult 
} from '@/types/plugin'
import { PLUGIN_CONFIG } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

class PluginLoader implements PluginLoaderInterface {
  private loadedPlugins = new Map<string, LoadedPlugin>()
  private loadingPromises = new Map<string, Promise<LoadedPlugin>>()

  /**
   * Load a plugin and its components
   */
  async loadPlugin(plugin: InstalledPlugin): Promise<LoadedPlugin> {
    const { pluginId } = plugin

    // Return cached plugin if already loaded
    if (this.loadedPlugins.has(pluginId)) {
      return this.loadedPlugins.get(pluginId)!
    }

    // Return existing loading promise if plugin is being loaded
    if (this.loadingPromises.has(pluginId)) {
      return this.loadingPromises.get(pluginId)!
    }

    // Start loading process
    const loadingPromise = this.doLoadPlugin(plugin)
    this.loadingPromises.set(pluginId, loadingPromise)

    try {
      const loadedPlugin = await loadingPromise
      this.loadedPlugins.set(pluginId, loadedPlugin)
      return loadedPlugin
    } finally {
      this.loadingPromises.delete(pluginId)
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    try {
      const loadedPlugin = this.loadedPlugins.get(pluginId)
      if (!loadedPlugin) return

      // Call plugin's unload method if it exists
      if (loadedPlugin.instance && typeof loadedPlugin.instance.unload === 'function') {
        try {
          await loadedPlugin.instance.unload()
        } catch (error) {
          console.warn(`Plugin ${pluginId} unload method failed:`, error)
        }
      }

      // Clear from cache
      this.loadedPlugins.delete(pluginId)

      console.log(`✅ Plugin ${pluginId} unloaded successfully`)
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error)
      throw error
    }
  }

  /**
   * Reload a plugin
   */
 async reloadPlugin(pluginId: string): Promise<LoadedPlugin> {
  try {
    // Unload first
    await this.unloadPlugin(pluginId)
    
    // Get plugin from database and reload
    const { InstalledPluginModel } = await import('@/lib/database/models/plugin')
    const plugin = await InstalledPluginModel.findByPluginId(pluginId)
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }
    
    // Convert MongoDB document to plain object with string _id
    const pluginData = {
      ...plugin.toObject(),
      _id: plugin._id.toString()
    }
    
    return await this.loadPlugin(pluginData)
  } catch (error) {
    console.error(`Failed to reload plugin ${pluginId}:`, error)
    throw error
  }
}

  /**
   * Load all active plugins
   */
  async loadAllActivePlugins(): Promise<LoadedPlugin[]> {
  try {
    const { InstalledPluginModel } = await import('@/lib/database/models/plugin')
    const activePlugins = await InstalledPluginModel.findActivePlugins()

    const loadedPlugins: LoadedPlugin[] = []
    for (const plugin of activePlugins) {
      try {
        // Convert MongoDB document to plain object with string _id
        const pluginData = {
          ...plugin.toObject(),
          _id: plugin._id.toString()
        }
        
        const loadedPlugin = await this.loadPlugin(pluginData)
        loadedPlugins.push(loadedPlugin)
      } catch (error) {
        console.error(`Failed to load plugin ${plugin.pluginId}:`, error)
        // Continue loading other plugins
      }
    }

    return loadedPlugins
  } catch (error) {
    console.error('Failed to load active plugins:', error)
    return []
  }
}
  /**
   * Validate plugin structure
   */
  async validatePluginStructure(pluginPath: string): Promise<PluginValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Check if plugin directory exists
      const pluginStat = await fs.stat(pluginPath)
      if (!pluginStat.isDirectory()) {
        errors.push('Plugin path is not a directory')
        return { isValid: false, errors, warnings }
      }

      // Check for manifest file
      const manifestPath = path.join(pluginPath, PLUGIN_CONFIG.MANIFEST_FILE)
      try {
        await fs.access(manifestPath)
      } catch {
        errors.push('Plugin manifest file not found')
        return { isValid: false, errors, warnings }
      }

      // Load and validate manifest
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      let manifest
      try {
        manifest = JSON.parse(manifestContent)
      } catch {
        errors.push('Invalid manifest JSON format')
        return { isValid: false, errors, warnings }
      }

      // Check for main entry file
      if (manifest.entry?.main) {
        const mainPath = path.join(pluginPath, manifest.entry.main)
        try {
          await fs.access(mainPath)
        } catch {
          warnings.push(`Main entry file not found: ${manifest.entry.main}`)
        }
      }

      // Check for admin entry file
      if (manifest.entry?.admin) {
        const adminPath = path.join(pluginPath, manifest.entry.admin)
        try {
          await fs.access(adminPath)
        } catch {
          warnings.push(`Admin entry file not found: ${manifest.entry.admin}`)
        }
      }

      // Check for API routes
      if (manifest.routes && manifest.routes.length > 0) {
        for (const route of manifest.routes) {
          const routePath = path.join(pluginPath, 'routes', route.handler)
          try {
            await fs.access(routePath)
          } catch {
            warnings.push(`Route handler not found: ${route.handler}`)
          }
        }
      }

      // Check for admin pages
      if (manifest.adminPages && manifest.adminPages.length > 0) {
        for (const page of manifest.adminPages) {
          const pagePath = path.join(pluginPath, 'components', page.component)
          try {
            await fs.access(pagePath)
          } catch {
            warnings.push(`Admin page component not found: ${page.component}`)
          }
        }
      }

      // Check for dashboard widgets
      if (manifest.dashboardWidgets && manifest.dashboardWidgets.length > 0) {
        for (const widget of manifest.dashboardWidgets) {
          const widgetPath = path.join(pluginPath, 'components', widget.component)
          try {
            await fs.access(widgetPath)
          } catch {
            warnings.push(`Dashboard widget component not found: ${widget.component}`)
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        manifest
      }

    } catch (error) {
      errors.push(getErrorMessage(error))
      return { isValid: false, errors, warnings }
    }
  }

  /**
   * Get loaded plugin
   */
  getLoadedPlugin(pluginId: string): LoadedPlugin | null {
    return this.loadedPlugins.get(pluginId) || null
  }

  /**
   * Check if plugin is loaded
   */
  isPluginLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId)
  }

  /**
   * Get all loaded plugins
   */
  getAllLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values())
  }

  /**
   * Clear all loaded plugins
   */
  async clearAll(): Promise<void> {
    const pluginIds = Array.from(this.loadedPlugins.keys())
    for (const pluginId of pluginIds) {
      await this.unloadPlugin(pluginId)
    }
  }

  // Private methods

  /**
   * Internal plugin loading logic
   */
  private async doLoadPlugin(plugin: InstalledPlugin): Promise<LoadedPlugin> {
    const startTime = Date.now()
    const { pluginId, installPath, manifest } = plugin

    try {
      console.log(`🔄 Loading plugin: ${pluginId}`)

      // Initialize loaded plugin structure
      const loadedPlugin: LoadedPlugin = {
        manifest,
        isActive: plugin.isActive,
        loadedAt: new Date(),
        components: {
          adminPages: new Map(),
          dashboardWidgets: new Map(),
          components: new Map()
        },
        api: {
          routes: new Map(),
          hooks: new Map(),
          middleware: new Map()
        },
        database: {
          models: new Map(),
          connections: new Map()
        }
      }

      // Load main plugin module
      if (manifest.entry?.main) {
        try {
          const mainModule = await this.loadModule(installPath, manifest.entry.main)
          loadedPlugin.instance = mainModule.default || mainModule
        } catch (error) {
          console.warn(`Failed to load main module for ${pluginId}:`, error)
        }
      }

      // Load React components
      await this.loadComponents(loadedPlugin, installPath, manifest)

      // Load API routes
      await this.loadApiRoutes(loadedPlugin, installPath, manifest)

      // Load middleware
      await this.loadMiddleware(loadedPlugin, installPath, manifest)

      // Load database models
      await this.loadDatabaseModels(loadedPlugin, installPath, manifest)

      // Initialize plugin instance
      if (loadedPlugin.instance && typeof loadedPlugin.instance.initialize === 'function') {
        try {
          const context = await this.createPluginContext(plugin)
          await loadedPlugin.instance.initialize(context)
        } catch (error) {
          console.error(`Plugin ${pluginId} initialization failed:`, error)
          loadedPlugin.error = error instanceof Error ? error : new Error(getErrorMessage(error))
        }
      }

      const loadTime = Date.now() - startTime
      console.log(`✅ Plugin ${pluginId} loaded successfully in ${loadTime}ms`)

      // Update performance metrics
      this.updatePerformanceMetrics(plugin, loadTime)

      return loadedPlugin

    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginId}:`, error)
      return {
        manifest,
        isActive: false,
        loadedAt: new Date(),
        error: error instanceof Error ? error : new Error(getErrorMessage(error))
      }
    }
  }

  /**
   * Load React components
   */
  private async loadComponents(loadedPlugin: LoadedPlugin, installPath: string, manifest: any): Promise<void> {
    // Load admin pages
    if (manifest.adminPages) {
      for (const page of manifest.adminPages) {
        try {
          const component = await this.loadReactComponent(installPath, page.component)
          loadedPlugin.components?.adminPages?.set(page.path, component)
        } catch (error) {
          console.warn(`Failed to load admin page ${page.component}:`, error)
        }
      }
    }

    // Load dashboard widgets
    if (manifest.dashboardWidgets) {
      for (const widget of manifest.dashboardWidgets) {
        try {
          const component = await this.loadReactComponent(installPath, widget.component)
          loadedPlugin.components?.dashboardWidgets?.set(widget.id, component)
        } catch (error) {
          console.warn(`Failed to load dashboard widget ${widget.component}:`, error)
        }
      }
    }
  }

  /**
   * Load API routes
   */
  private async loadApiRoutes(loadedPlugin: LoadedPlugin, installPath: string, manifest: any): Promise<void> {
    if (!manifest.routes) return

    for (const route of manifest.routes) {
      try {
        const routeHandler = await this.loadModule(installPath, `routes/${route.handler}`)
        const handler = routeHandler.default || routeHandler
        
        if (typeof handler === 'function') {
          loadedPlugin.api?.routes?.set(`${route.method}:${route.path}`, handler)
        }
      } catch (error) {
        console.warn(`Failed to load route ${route.path}:`, error)
      }
    }
  }

  /**
   * Load middleware
   */
  private async loadMiddleware(loadedPlugin: LoadedPlugin, installPath: string, manifest: any): Promise<void> {
    // Load custom middleware if specified
    try {
      const middlewarePath = path.join(installPath, 'middleware.js')
      await fs.access(middlewarePath)
      
      const middlewareModule = await this.loadModule(installPath, 'middleware.js')
      const middleware = middlewareModule.default || middlewareModule
      
      if (typeof middleware === 'function') {
        loadedPlugin.api?.middleware?.set('main', middleware)
      }
    } catch {
      // No middleware file, that's okay
    }
  }

  /**
   * Load database models
   */
  private async loadDatabaseModels(loadedPlugin: LoadedPlugin, installPath: string, manifest: any): Promise<void> {
    if (!manifest.database?.collections) return

    for (const collection of manifest.database.collections) {
      try {
        // For now, we'll store the schema definition
        // In a full implementation, this would create actual Mongoose models
        loadedPlugin.database?.models?.set(collection.name, collection.schema)
      } catch (error) {
        console.warn(`Failed to load database model ${collection.name}:`, error)
      }
    }
  }

  /**
   * Load a JavaScript/TypeScript module
   */
  private async loadModule(installPath: string, modulePath: string): Promise<any> {
    const fullPath = path.join(installPath, modulePath)
    
    // For security, we should validate the path
    if (!fullPath.startsWith(installPath)) {
      throw new Error('Invalid module path')
    }

    try {
      // In a browser environment, we need to handle this differently
      if (typeof window !== 'undefined') {
        // Client-side dynamic import
        return await import(/* webpackIgnore: true */ fullPath)
      } else {
        // Server-side dynamic import
        const moduleUrl = `file://${fullPath}`
        return await import(moduleUrl)
      }
    } catch (error) {
      // Fallback: try to load as raw JavaScript
      const moduleContent = await fs.readFile(fullPath, 'utf-8')
      
      // This is a simplified approach - in production, you'd want proper sandboxing
      const moduleFunction = new Function('module', 'exports', 'require', moduleContent)
      const moduleExports = {}
      const module = { exports: moduleExports }
      
      // Mock require function for basic dependencies
      const mockRequire = (dep: string) => {
        if (dep === 'react') return require('react')
        if (dep === 'next') return require('next')
        throw new Error(`Module ${dep} not available in plugin context`)
      }

      moduleFunction(module, moduleExports, mockRequire)
      return module.exports
    }
  }

  /**
   * Load a React component
   */
  private async loadReactComponent(installPath: string, componentPath: string): Promise<React.ComponentType<any>> {
    try {
      const module = await this.loadModule(installPath, `components/${componentPath}`)
      const component = module.default || module
      
      if (typeof component === 'function') {
        return component
      } else {
        throw new Error('Component is not a valid React component')
      }
    } catch (error) {
      console.warn(`Failed to load React component ${componentPath}:`, error)
      
      // Return error fallback component
      return () => {
        const React = require('react')
        return React.createElement('div', {
          className: 'p-4 border border-red-200 bg-red-50 rounded-md'
        }, `Failed to load component: ${componentPath}`)
      }
    }
  }

  /**
   * Create plugin context for initialization
   */
  private async createPluginContext(plugin: InstalledPlugin): Promise<any> {
    // Import dependencies dynamically to avoid circular imports
    const { connectToDatabase } = await import('@/lib/database/mongodb')
    
    await connectToDatabase()

    return {
      config: plugin.config,
      database: {
        // Provide access to database models
        // In production, this should be more restricted
      },
      api: {
        registerHook: (hook: any) => {
          // Register hook with plugin hooks system
        },
        registerRoute: (route: any) => {
          // Register route dynamically
        }
      },
      logger: {
        debug: (message: string, meta?: any) => console.debug(`[${plugin.pluginId}] ${message}`, meta),
        info: (message: string, meta?: any) => console.info(`[${plugin.pluginId}] ${message}`, meta),
        warn: (message: string, meta?: any) => console.warn(`[${plugin.pluginId}] ${message}`, meta),
        error: (message: string, meta?: any) => console.error(`[${plugin.pluginId}] ${message}`, meta),
      },
      utils: {
        hash: (data: string) => require('crypto').createHash('sha256').update(data).digest('hex'),
        slugify: (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        formatDate: (date: Date, format?: string) => date.toISOString(),
      }
    }
  }

  /**
   * Update plugin performance metrics
   */
  private async updatePerformanceMetrics(plugin: InstalledPlugin, loadTime: number): Promise<void> {
    try {
      const { InstalledPluginModel } = await import('@/lib/database/models/plugin')
      await InstalledPluginModel.findOneAndUpdate(
        { pluginId: plugin.pluginId },
        {
          'performance.loadTime': loadTime,
          'performance.lastMeasured': new Date()
        }
      )
    } catch (error) {
      // Ignore performance update errors
    }
  }
}

// Export singleton instance
export const pluginLoader = new PluginLoader()

// Export class for testing
export default PluginLoader