// Plugin Registry - Central registry for loaded plugins
// src/lib/plugins/registry.ts

import { 
  PluginRegistryInterface, 
  LoadedPlugin, 
  PluginEvent, 
  PluginEventData 
} from '@/types/plugin'
import { EventEmitter } from 'events'

class PluginRegistry extends EventEmitter implements PluginRegistryInterface {
  private plugins = new Map<string, LoadedPlugin>()
  private routeMap = new Map<string, LoadedPlugin>()
  private hookMap = new Map<string, LoadedPlugin[]>()
  private adminPageMap = new Map<string, LoadedPlugin>()
  private dashboardWidgetMap = new Map<string, LoadedPlugin>()
  private initialized = false

  constructor() {
    super()
    this.setMaxListeners(100) // Allow many listeners for plugins
  }

  /**
   * Initialize the registry
   */
  initialize(): void {
    if (this.initialized) return

    console.log('🔄 Initializing Plugin Registry...')
    this.initialized = true
    console.log('✅ Plugin Registry initialized')
  }

  /**
   * Register a loaded plugin
   */
  registerPlugin(plugin: LoadedPlugin): void {
    const pluginId = plugin.manifest.id

    try {
      // Store plugin
      this.plugins.set(pluginId, plugin)

      // Register routes
      this.registerPluginRoutes(plugin)

      // Register hooks
      this.registerPluginHooks(plugin)

      // Register admin pages
      this.registerPluginAdminPages(plugin)

      // Register dashboard widgets
      this.registerPluginDashboardWidgets(plugin)

      console.log(`✅ Plugin ${pluginId} registered in registry`)

      // Emit registration event
      this.emit('plugin:registered', {
        pluginId,
        pluginName: plugin.manifest.name,
        version: plugin.manifest.version,
        timestamp: new Date()
      })

    } catch (error) {
      console.error(`Failed to register plugin ${pluginId}:`, error)
      throw error
    }
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(pluginId: string): void {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) return

      // Remove from main registry
      this.plugins.delete(pluginId)

      // Remove routes
      this.unregisterPluginRoutes(plugin)

      // Remove hooks
      this.unregisterPluginHooks(plugin)

      // Remove admin pages
      this.unregisterPluginAdminPages(plugin)

      // Remove dashboard widgets
      this.unregisterPluginDashboardWidgets(plugin)

      console.log(`✅ Plugin ${pluginId} unregistered from registry`)

      // Emit unregistration event
      this.emit('plugin:unregistered', {
        pluginId,
        pluginName: plugin.manifest.name,
        version: plugin.manifest.version,
        timestamp: new Date()
      })

    } catch (error) {
      console.error(`Failed to unregister plugin ${pluginId}:`, error)
    }
  }

  /**
   * Get a specific plugin
   */
  getPlugin(pluginId: string): LoadedPlugin | null {
    return this.plugins.get(pluginId) || null
  }

  /**
   * Get all active plugins
   */
  getActivePlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.isActive)
  }

  /**
   * Get all plugins (active and inactive)
   */
  getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Check if plugin is loaded in registry
   */
  isPluginLoaded(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  /**
   * Get plugin routes mapping
   */
  getPluginRoutes(): Map<string, LoadedPlugin> {
    return new Map(this.routeMap)
  }

  /**
   * Get plugin hooks mapping
   */
  getPluginHooks(): Map<string, LoadedPlugin[]> {
    return new Map(this.hookMap)
  }

  /**
   * Get plugin admin pages
   */
  getPluginAdminPages(): Map<string, LoadedPlugin> {
    return new Map(this.adminPageMap)
  }

  /**
   * Get plugin dashboard widgets
   */
  getPluginDashboardWidgets(): Map<string, LoadedPlugin> {
    return new Map(this.dashboardWidgetMap)
  }

  /**
   * Get plugin by route
   */
  getPluginByRoute(method: string, path: string): LoadedPlugin | null {
    const routeKey = `${method.toUpperCase()}:${path}`
    return this.routeMap.get(routeKey) || null
  }

  /**
   * Get plugins by hook name
   */
  getPluginsByHook(hookName: string): LoadedPlugin[] {
    return this.hookMap.get(hookName) || []
  }

  /**
   * Get plugin by admin page path
   */
  getPluginByAdminPage(path: string): LoadedPlugin | null {
    return this.adminPageMap.get(path) || null
  }

  /**
   * Get plugin by dashboard widget ID
   */
  getPluginByDashboardWidget(widgetId: string): LoadedPlugin | null {
    return this.dashboardWidgetMap.get(widgetId) || null
  }

  /**
   * Get all routes from all plugins
   */
  getAllRoutes(): Array<{ method: string; path: string; plugin: LoadedPlugin }> {
    const routes: Array<{ method: string; path: string; plugin: LoadedPlugin }> = []
    
    for (const [routeKey, plugin] of this.routeMap) {
      const [method, path] = routeKey.split(':')
      routes.push({ method, path, plugin })
    }
    
    return routes
  }

  /**
   * Get all hooks from all plugins
   */
  getAllHooks(): Array<{ hookName: string; plugins: LoadedPlugin[] }> {
    const hooks: Array<{ hookName: string; plugins: LoadedPlugin[] }> = []
    
    for (const [hookName, plugins] of this.hookMap) {
      hooks.push({ hookName, plugins })
    }
    
    return hooks
  }

  /**
   * Get all admin pages from all plugins
   */
  getAllAdminPages(): Array<{ path: string; title: string; plugin: LoadedPlugin; order: number }> {
    const pages: Array<{ path: string; title: string; plugin: LoadedPlugin; order: number }> = []
    
    for (const plugin of this.plugins.values()) {
      if (plugin.manifest.adminPages) {
        for (const page of plugin.manifest.adminPages) {
          pages.push({
            path: page.path,
            title: page.title,
            plugin,
            order: page.order || 100
          })
        }
      }
    }
    
    // Sort by order
    return pages.sort((a, b) => a.order - b.order)
  }

  /**
   * Get all dashboard widgets from all plugins
   */
  getAllDashboardWidgets(): Array<{ 
    id: string; 
    title: string; 
    size: string; 
    plugin: LoadedPlugin;
    category?: string;
  }> {
    const widgets: Array<{ 
      id: string; 
      title: string; 
      size: string; 
      plugin: LoadedPlugin;
      category?: string;
    }> = []
    
    for (const plugin of this.plugins.values()) {
      if (plugin.manifest.dashboardWidgets) {
        for (const widget of plugin.manifest.dashboardWidgets) {
          widgets.push({
            id: widget.id,
            title: widget.title,
            size: widget.size,
            plugin,
            category: widget.category
          })
        }
      }
    }
    
    return widgets
  }

  /**
   * Find plugins by category
   */
  getPluginsByCategory(category: string): LoadedPlugin[] {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.manifest.category === category)
  }

  /**
   * Find plugins by permission
   */
  getPluginsByPermission(permission: string): LoadedPlugin[] {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.manifest.permissions?.includes(permission as any))
  }

  /**
   * Get plugin statistics
   */
  getStats(): {
    totalPlugins: number;
    activePlugins: number;
    inactivePlugins: number;
    totalRoutes: number;
    totalHooks: number;
    totalAdminPages: number;
    totalDashboardWidgets: number;
    categories: Record<string, number>;
  } {
    const plugins = Array.from(this.plugins.values())
    const activePlugins = plugins.filter(p => p.isActive)
    
    const categories: Record<string, number> = {}
    for (const plugin of plugins) {
      const category = plugin.manifest.category || 'other'
      categories[category] = (categories[category] || 0) + 1
    }

    return {
      totalPlugins: plugins.length,
      activePlugins: activePlugins.length,
      inactivePlugins: plugins.length - activePlugins.length,
      totalRoutes: this.routeMap.size,
      totalHooks: this.hookMap.size,
      totalAdminPages: this.adminPageMap.size,
      totalDashboardWidgets: this.dashboardWidgetMap.size,
      categories
    }
  }

  /**
   * Clear all plugins from registry
   */
  clearRegistry(): void {
    console.log('🗑️ Clearing plugin registry...')
    
    // Clear all maps
    this.plugins.clear()
    this.routeMap.clear()
    this.hookMap.clear()
    this.adminPageMap.clear()
    this.dashboardWidgetMap.clear()
    
    // Emit clear event
    this.emit('registry:cleared', { timestamp: new Date() })
    
    console.log('✅ Plugin registry cleared')
  }

  /**
   * Search plugins
   */
  searchPlugins(query: string): LoadedPlugin[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.plugins.values()).filter(plugin => {
      const manifest = plugin.manifest
      return (
        manifest.name.toLowerCase().includes(lowerQuery) ||
        manifest.description.toLowerCase().includes(lowerQuery) ||
        manifest.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery)) ||
        manifest.category.toLowerCase().includes(lowerQuery)
      )
    })
  }

  /**
   * Get plugin dependency tree
   */
  getDependencyTree(): Map<string, string[]> {
    const tree = new Map<string, string[]>()
    
    for (const plugin of this.plugins.values()) {
      const dependencies = plugin.manifest.dependencies?.plugins
      if (dependencies) {
        tree.set(plugin.manifest.id, Object.keys(dependencies))
      } else {
        tree.set(plugin.manifest.id, [])
      }
    }
    
    return tree
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependencies(): boolean {
    const tree = this.getDependencyTree()
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (pluginId: string): boolean => {
      if (recursionStack.has(pluginId)) return true
      if (visited.has(pluginId)) return false

      visited.add(pluginId)
      recursionStack.add(pluginId)

      const dependencies = tree.get(pluginId) || []
      for (const dep of dependencies) {
        if (hasCycle(dep)) return true
      }

      recursionStack.delete(pluginId)
      return false
    }

    for (const pluginId of tree.keys()) {
      if (!visited.has(pluginId)) {
        if (hasCycle(pluginId)) return true
      }
    }

    return false
  }

  // Private methods

  /**
   * Register plugin routes
   */
  private registerPluginRoutes(plugin: LoadedPlugin): void {
    if (!plugin.manifest.routes) return

    for (const route of plugin.manifest.routes) {
      const routeKey = `${route.method.toUpperCase()}:${route.path}`
      this.routeMap.set(routeKey, plugin)
    }
  }

  /**
   * Unregister plugin routes
   */
  private unregisterPluginRoutes(plugin: LoadedPlugin): void {
    if (!plugin.manifest.routes) return

    for (const route of plugin.manifest.routes) {
      const routeKey = `${route.method.toUpperCase()}:${route.path}`
      this.routeMap.delete(routeKey)
    }
  }

  /**
   * Register plugin hooks
   */
  private registerPluginHooks(plugin: LoadedPlugin): void {
    if (!plugin.manifest.hooks) return

    for (const hook of plugin.manifest.hooks) {
      const hookPlugins = this.hookMap.get(hook.name) || []
      hookPlugins.push(plugin)
      
      // Sort by priority (lower number = higher priority)
      hookPlugins.sort((a, b) => {
        const aPriority = a.manifest.hooks?.find(h => h.name === hook.name)?.priority || 10
        const bPriority = b.manifest.hooks?.find(h => h.name === hook.name)?.priority || 10
        return aPriority - bPriority
      })
      
      this.hookMap.set(hook.name, hookPlugins)
    }
  }

  /**
   * Unregister plugin hooks
   */
  private unregisterPluginHooks(plugin: LoadedPlugin): void {
    if (!plugin.manifest.hooks) return

    for (const hook of plugin.manifest.hooks) {
      const hookPlugins = this.hookMap.get(hook.name) || []
      const filtered = hookPlugins.filter(p => p.manifest.id !== plugin.manifest.id)
      
      if (filtered.length > 0) {
        this.hookMap.set(hook.name, filtered)
      } else {
        this.hookMap.delete(hook.name)
      }
    }
  }

  /**
   * Register plugin admin pages
   */
  private registerPluginAdminPages(plugin: LoadedPlugin): void {
    if (!plugin.manifest.adminPages) return

    for (const page of plugin.manifest.adminPages) {
      this.adminPageMap.set(page.path, plugin)
    }
  }

  /**
   * Unregister plugin admin pages
   */
  private unregisterPluginAdminPages(plugin: LoadedPlugin): void {
    if (!plugin.manifest.adminPages) return

    for (const page of plugin.manifest.adminPages) {
      this.adminPageMap.delete(page.path)
    }
  }

  /**
   * Register plugin dashboard widgets
   */
  private registerPluginDashboardWidgets(plugin: LoadedPlugin): void {
    if (!plugin.manifest.dashboardWidgets) return

    for (const widget of plugin.manifest.dashboardWidgets) {
      this.dashboardWidgetMap.set(widget.id, plugin)
    }
  }

  /**
   * Unregister plugin dashboard widgets
   */
  private unregisterPluginDashboardWidgets(plugin: LoadedPlugin): void {
    if (!plugin.manifest.dashboardWidgets) return

    for (const widget of plugin.manifest.dashboardWidgets) {
      this.dashboardWidgetMap.delete(widget.id)
    }
  }
}

// Export singleton instance
export const pluginRegistry = new PluginRegistry()

// Export class for testing
export default PluginRegistry