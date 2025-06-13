// Plugin registry

import { EventEmitter } from 'events'
import { 
  PluginConfig,
  LoadedPlugin,
  PluginRegistryState,
  PluginEvent,
  PluginHooks,
  PluginHookFunction,
  PluginRoute,
  PluginAdminPage,
  PluginSidebarItem,
  PluginDashboardWidget,
  PluginHook
} from '@/types/plugin'
import { pluginLoader } from './loader'
import { deepMerge } from '@/lib/utils'

export class PluginRegistry extends EventEmitter {
  private state: PluginRegistryState = {
    plugins: new Map(),
    activePlugins: new Set(),
    loading: new Set(),
    errors: new Map(),
    lastUpdated: new Date(),
  }

  private hooks: PluginHooks = {
    beforeInstall: [],
    afterInstall: [],
    beforeActivate: [],
    afterActivate: [],
    beforeDeactivate: [],
    afterDeactivate: [],
    beforeUninstall: [],
    afterUninstall: [],
    onConfigure: [],
  }

  private globalRoutes = new Map<string, PluginRoute>()
  private globalAdminPages = new Map<string, PluginAdminPage>()
  private globalSidebarItems: PluginSidebarItem[] = []
  private globalDashboardWidgets = new Map<string, PluginDashboardWidget>()
  private globalHooks = new Map<string, PluginHook[]>()

  async loadPlugin(pluginId: string): Promise<LoadedPlugin> {
    if (this.state.loading.has(pluginId)) {
      // Wait for existing load to complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Plugin loading timeout: ${pluginId}`))
        }, 30000) // 30 second timeout

        const checkComplete = () => {
          if (!this.state.loading.has(pluginId)) {
            clearTimeout(timeout)
            const plugin = this.state.plugins.get(pluginId)
            if (plugin) {
              resolve(plugin)
            } else {
              reject(new Error(`Plugin ${pluginId} failed to load`))
            }
          } else {
            setTimeout(checkComplete, 100)
          }
        }
        checkComplete()
      })
    }

    this.state.loading.add(pluginId)
    this.state.errors.delete(pluginId)

    try {
      const loadedPlugin = await pluginLoader.loadPlugin(pluginId)
      this.state.plugins.set(pluginId, loadedPlugin)
      this.state.lastUpdated = new Date()
      
      this.emit('pluginLoaded', { pluginId, plugin: loadedPlugin })
      return loadedPlugin
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.state.errors.set(pluginId, errorMessage)
      this.emit('pluginLoadError', { pluginId, error: errorMessage })
      throw error
    } finally {
      this.state.loading.delete(pluginId)
    }
  }

  async activatePlugin(pluginId: string, config?: PluginConfig): Promise<void> {
    // Run before activate hooks
    await this.runHooks('beforeActivate', {
      type: 'activated',
      pluginId,
      timestamp: new Date(),
    })

    // Load plugin if not already loaded
    let plugin = this.state.plugins.get(pluginId)
    if (!plugin) {
      plugin = await this.loadPlugin(pluginId)
    }

    // Apply configuration
    if (config) {
      plugin.config = deepMerge(plugin.config, config)
    }

    // Activate plugin
    plugin.isActive = true
    this.state.activePlugins.add(pluginId)
    this.state.lastUpdated = new Date()

    // Register plugin resources globally
    this.registerPluginRoutes(plugin)
    this.registerPluginAdminPages(plugin)
    this.registerPluginSidebarItems(plugin)
    this.registerPluginDashboardWidgets(plugin)
    this.registerPluginHooks(plugin)

    // Run after activate hooks
    await this.runHooks('afterActivate', {
      type: 'activated',
      pluginId,
      timestamp: new Date(),
    })

    this.emit('pluginActivated', { pluginId, plugin })
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.state.plugins.get(pluginId)
    if (!plugin) return

    // Run before deactivate hooks
    await this.runHooks('beforeDeactivate', {
      type: 'deactivated',
      pluginId,
      timestamp: new Date(),
    })

    plugin.isActive = false
    this.state.activePlugins.delete(pluginId)
    this.state.lastUpdated = new Date()

    // Unregister plugin resources globally
    this.unregisterPluginRoutes(plugin)
    this.unregisterPluginAdminPages(plugin)
    this.unregisterPluginSidebarItems(plugin)
    this.unregisterPluginDashboardWidgets(plugin)
    this.unregisterPluginHooks(plugin)

    // Run after deactivate hooks
    await this.runHooks('afterDeactivate', {
      type: 'deactivated',
      pluginId,
      timestamp: new Date(),
    })

    this.emit('pluginDeactivated', { pluginId, plugin })
  }

  unloadPlugin(pluginId: string): void {
    const plugin = this.state.plugins.get(pluginId)
    if (plugin && plugin.isActive) {
      throw new Error('Cannot unload active plugin')
    }

    this.state.plugins.delete(pluginId)
    this.state.activePlugins.delete(pluginId)
    this.state.errors.delete(pluginId)
    this.state.loading.delete(pluginId)
    this.state.lastUpdated = new Date()

    // Clear from loader cache
    pluginLoader.unloadPlugin(pluginId)

    this.emit('pluginUnloaded', { pluginId })
  }

  async updatePluginConfig(
    pluginId: string,
    config: Partial<PluginConfig>
  ): Promise<void> {
    const plugin = this.state.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    const oldConfig = { ...plugin.config }
    plugin.config = deepMerge(plugin.config, config)
    this.state.lastUpdated = new Date()

    // Run configure hooks
    await this.runHooks('onConfigure', {
      type: 'configured',
      pluginId,
      timestamp: new Date(),
      metadata: { 
        oldConfig, 
        newConfig: plugin.config 
      },
    })

    this.emit('pluginConfigured', { pluginId, plugin, config })
  }

  // Resource registration methods
  private registerPluginRoutes(plugin: LoadedPlugin): void {
    for (const [routeKey, route] of plugin.routes) {
      this.globalRoutes.set(`${plugin.manifest.id}:${routeKey}`, route)
    }
  }

  private unregisterPluginRoutes(plugin: LoadedPlugin): void {
    for (const [routeKey] of plugin.routes) {
      this.globalRoutes.delete(`${plugin.manifest.id}:${routeKey}`)
    }
  }

  private registerPluginAdminPages(plugin: LoadedPlugin): void {
    for (const [pagePath, page] of plugin.adminPages) {
      this.globalAdminPages.set(`${plugin.manifest.id}:${pagePath}`, page)
    }
  }

  private unregisterPluginAdminPages(plugin: LoadedPlugin): void {
    for (const [pagePath] of plugin.adminPages) {
      this.globalAdminPages.delete(`${plugin.manifest.id}:${pagePath}`)
    }
  }

  private registerPluginSidebarItems(plugin: LoadedPlugin): void {
    for (const item of plugin.sidebarItems) {
      this.globalSidebarItems.push({
        ...item,
        id: `${plugin.manifest.id}:${item.id}`,
      })
    }
    // Sort by order
    this.globalSidebarItems.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  private unregisterPluginSidebarItems(plugin: LoadedPlugin): void {
    this.globalSidebarItems = this.globalSidebarItems.filter(
      item => !item.id.startsWith(`${plugin.manifest.id}:`)
    )
  }

  private registerPluginDashboardWidgets(plugin: LoadedPlugin): void {
    for (const [widgetId, widget] of plugin.dashboardWidgets) {
      this.globalDashboardWidgets.set(`${plugin.manifest.id}:${widgetId}`, widget)
    }
  }

  private unregisterPluginDashboardWidgets(plugin: LoadedPlugin): void {
    for (const [widgetId] of plugin.dashboardWidgets) {
      this.globalDashboardWidgets.delete(`${plugin.manifest.id}:${widgetId}`)
    }
  }

  private registerPluginHooks(plugin: LoadedPlugin): void {
    for (const [hookName, hooks] of plugin.hooks) {
      const existing = this.globalHooks.get(hookName) || []
      existing.push(...hooks)
      existing.sort((a, b) => (a.priority || 0) - (b.priority || 0))
      this.globalHooks.set(hookName, existing)
    }
  }

  private unregisterPluginHooks(plugin: LoadedPlugin): void {
    for (const [hookName, hooks] of plugin.hooks) {
      const existing = this.globalHooks.get(hookName) || []
      const filtered = existing.filter(hook => 
        !hooks.some(pluginHook => pluginHook.handler === hook.handler)
      )
      if (filtered.length > 0) {
        this.globalHooks.set(hookName, filtered)
      } else {
        this.globalHooks.delete(hookName)
      }
    }
  }

  // Getter methods
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.state.plugins.get(pluginId)
  }

  getActivePlugins(): LoadedPlugin[] {
    return Array.from(this.state.plugins.values()).filter(plugin => plugin.isActive)
  }

  getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.state.plugins.values())
  }

  getLoadedPluginIds(): string[] {
    return Array.from(this.state.plugins.keys())
  }

  getActivePluginIds(): string[] {
    return Array.from(this.state.activePlugins)
  }

  isPluginLoaded(pluginId: string): boolean {
    return this.state.plugins.has(pluginId)
  }

  isPluginLoading(pluginId: string): boolean {
    return this.state.loading.has(pluginId)
  }

  isPluginActive(pluginId: string): boolean {
    return this.state.activePlugins.has(pluginId)
  }

  getPluginError(pluginId: string): string | undefined {
    return this.state.errors.get(pluginId)
  }

  // Global resource getters
  getAllRoutes(): Map<string, PluginRoute> {
    return new Map(this.globalRoutes)
  }

  getAllAdminPages(): Map<string, PluginAdminPage> {
    return new Map(this.globalAdminPages)
  }

  getAllSidebarItems(): PluginSidebarItem[] {
    return [...this.globalSidebarItems]
  }

  getAllDashboardWidgets(): Map<string, PluginDashboardWidget> {
    return new Map(this.globalDashboardWidgets)
  }

  getAllHooks(): Map<string, PluginHook[]> {
    return new Map(this.globalHooks)
  }

  getRegistryState(): Readonly<PluginRegistryState> {
    return { 
      plugins: new Map(this.state.plugins),
      activePlugins: new Set(this.state.activePlugins),
      loading: new Set(this.state.loading),
      errors: new Map(this.state.errors),
      lastUpdated: this.state.lastUpdated,
    }
  }

  // Hook management
  addHook(event: keyof PluginHooks, hook: PluginHookFunction): void {
    this.hooks[event].push(hook)
  }

  removeHook(event: keyof PluginHooks, hook: PluginHookFunction): void {
    const hooks = this.hooks[event]
    const index = hooks.indexOf(hook)
    if (index > -1) {
      hooks.splice(index, 1)
    }
  }

  clearHooks(event?: keyof PluginHooks): void {
    if (event) {
      this.hooks[event] = []
    } else {
      Object.keys(this.hooks).forEach(key => {
        this.hooks[key as keyof PluginHooks] = []
      })
    }
  }

  private async runHooks(
    event: keyof PluginHooks, 
    eventData: {
      type: PluginEvent['type']
      pluginId: string
      timestamp: Date
      userId?: string
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    const hooks = this.hooks[event]
    
    const pluginEvent: PluginEvent = {
      type: eventData.type,
      pluginId: eventData.pluginId,
      timestamp: eventData.timestamp,
      userId: eventData.userId,
      metadata: eventData.metadata,
    }
    
    const fullContext = {
      pluginId: eventData.pluginId,
      event: pluginEvent,
      currentPlugin: this.getPlugin(eventData.pluginId) || undefined,
      previousPlugin: undefined,
    }

    const hookPromises = hooks.map(async (hook) => {
      try {
        await hook(fullContext)
      } catch (error) {
        console.error(`Plugin hook error (${event}):`, error)
      }
    })

    await Promise.allSettled(hookPromises)
  }

  // Clear all data
  clear(): void {
    this.state.plugins.clear()
    this.state.activePlugins.clear()
    this.state.loading.clear()
    this.state.errors.clear()
    this.state.lastUpdated = new Date()
    
    this.globalRoutes.clear()
    this.globalAdminPages.clear()
    this.globalSidebarItems = []
    this.globalDashboardWidgets.clear()
    this.globalHooks.clear()
    
    pluginLoader.clearCache()
    this.emit('registryCleared')
  }

  // Get statistics
  getStats() {
    return {
      totalPlugins: this.state.plugins.size,
      activePlugins: this.state.activePlugins.size,
      loadingPlugins: this.state.loading.size,
      errorCount: this.state.errors.size,
      lastUpdated: this.state.lastUpdated,
      globalRoutes: this.globalRoutes.size,
      globalAdminPages: this.globalAdminPages.size,
      globalSidebarItems: this.globalSidebarItems.length,
      globalDashboardWidgets: this.globalDashboardWidgets.size,
      globalHooks: this.globalHooks.size,
      ...pluginLoader.getCacheStats(),
    }
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry()