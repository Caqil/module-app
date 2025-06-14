// Enhanced Plugin Registry with WordPress-like functionality
// src/lib/plugins/registry.ts

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
import { connectToDatabase } from '@/lib/database/mongodb'
import { InstalledPluginModel } from '@/lib/database/models/plugin'

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

  // WordPress-like features
  private isInitialized = false
  private autoSyncEnabled = true
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.setMaxListeners(50) // Support many plugins
  }

  // WordPress-like initialization
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('🔄 Initializing Plugin Registry...')
      await connectToDatabase()
      
      // Auto-sync with database
      await this.syncWithDatabase()
      
      // Auto-activate plugins marked as active
      await this.autoActivatePlugins()
      
      // Start auto-sync if enabled
      if (this.autoSyncEnabled) {
        this.startAutoSync()
      }
      
      this.isInitialized = true
      console.log(`✅ Plugin Registry initialized with ${this.state.plugins.size} plugins (${this.state.activePlugins.size} active)`)
      
      this.emit('registryInitialized', {
        totalPlugins: this.state.plugins.size,
        activePlugins: this.state.activePlugins.size
      })

    } catch (error) {
      console.error('❌ Failed to initialize Plugin Registry:', error)
      throw error
    }
  }

  // WordPress-like database sync
  async syncWithDatabase(): Promise<void> {
    try {
      console.log('📡 Syncing registry with database...')
      
      const dbPlugins = await InstalledPluginModel.find({})
      let syncedCount = 0
      let errorCount = 0

      for (const dbPlugin of dbPlugins) {
        try {
          // Only load if not already loaded or if database is newer
          const existingPlugin = this.state.plugins.get(dbPlugin.pluginId)
          const shouldReload = !existingPlugin || 
            (dbPlugin.updatedAt ? new Date(dbPlugin.updatedAt).getTime() : 0) > (existingPlugin.loadedAt?.getTime() || 0)

          if (shouldReload) {
            await this.loadPluginFromDatabase(dbPlugin)
            syncedCount++
          }
        } catch (error) {
          console.warn(`⚠️ Failed to sync plugin ${dbPlugin.pluginId}:`, error)
          errorCount++
        }
      }

      // Remove plugins that no longer exist in database
      const dbPluginIds = new Set(dbPlugins.map(p => p.pluginId))
      const registryPluginIds = Array.from(this.state.plugins.keys())
      
      for (const pluginId of registryPluginIds) {
        if (!dbPluginIds.has(pluginId)) {
          console.log(`🗑️ Removing deleted plugin from registry: ${pluginId}`)
          await this.unloadPluginInternal(pluginId)
        }
      }

      console.log(`✅ Registry sync complete: ${syncedCount} synced, ${errorCount} errors`)
      this.emit('registrySynced', { syncedCount, errorCount })

    } catch (error) {
      console.error('❌ Registry sync failed:', error)
      throw error
    }
  }

  // Load plugin from database record
  private async loadPluginFromDatabase(dbPlugin: any): Promise<void> {
    try {
      const loadedPlugin = await pluginLoader.loadPlugin(dbPlugin.pluginId)
      
      // Update with database info
      loadedPlugin.config = dbPlugin.config || loadedPlugin.manifest.settings?.defaults || {}
      loadedPlugin.isActive = dbPlugin.isActive
      
      // Store in registry
      this.state.plugins.set(dbPlugin.pluginId, loadedPlugin)
      
      // Auto-activate if marked as active in database
      if (dbPlugin.isActive && !this.state.activePlugins.has(dbPlugin.pluginId)) {
        try {
          await this.activatePluginInRegistry(dbPlugin.pluginId, loadedPlugin)
        } catch (activationError) {
          console.warn(`⚠️ Failed to auto-activate plugin ${dbPlugin.pluginId}:`, activationError)
          // Mark as inactive in database if activation fails
          await InstalledPluginModel.findByIdAndUpdate(dbPlugin._id, { 
            isActive: false,
            $push: { errorLog: `Auto-activation failed: ${activationError}` }
          })
        }
      }

      this.emit('pluginSynced', { pluginId: dbPlugin.pluginId, plugin: loadedPlugin })

    } catch (error) {
      console.error(`Failed to load plugin ${dbPlugin.pluginId} from database:`, error)
      throw error
    }
  }

  // Auto-activate plugins marked as active
  private async autoActivatePlugins(): Promise<void> {
    const pluginsToActivate = Array.from(this.state.plugins.entries())
      .filter(([pluginId, plugin]) => plugin.isActive && !this.state.activePlugins.has(pluginId))

    console.log(`🔌 Auto-activating ${pluginsToActivate.length} plugins...`)

    for (const [pluginId, plugin] of pluginsToActivate) {
      try {
        await this.activatePluginInRegistry(pluginId, plugin)
        console.log(`✅ Auto-activated: ${pluginId}`)
      } catch (error) {
        console.warn(`⚠️ Failed to auto-activate ${pluginId}:`, error)
      }
    }
  }

  // Start auto-sync timer
  private startAutoSync(): void {
    if (this.syncInterval) return

    // Sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncWithDatabase()
      } catch (error) {
        console.warn('Auto-sync failed:', error)
      }
    }, 30000)

    console.log('🔄 Auto-sync started (30s interval)')
  }

  // Stop auto-sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('⏹️ Auto-sync stopped')
    }
  }

  // WordPress-like plugin installation notification
  async onPluginInstalled(pluginId: string, dbPlugin: any): Promise<void> {
    try {
      console.log(`📦 Plugin installed notification: ${pluginId}`)
      
      // Load the plugin into registry
      await this.loadPluginFromDatabase(dbPlugin)
      
      // Emit event for real-time updates
      this.emit('pluginInstalled', { 
        pluginId, 
        plugin: this.state.plugins.get(pluginId),
        dbData: dbPlugin 
      })

      // Trigger UI updates
      this.notifyUIUpdate('installed', pluginId)

    } catch (error) {
      console.error(`Failed to handle plugin installation: ${pluginId}`, error)
    }
  }

  // WordPress-like plugin activation
  async onPluginActivated(pluginId: string, config?: PluginConfig): Promise<void> {
    try {
      console.log(`🔌 Plugin activation notification: ${pluginId}`)
      
      const plugin = this.state.plugins.get(pluginId)
      if (!plugin) {
        // Load from database if not in registry
        const dbPlugin = await InstalledPluginModel.findOne({ pluginId })
        if (dbPlugin) {
          await this.loadPluginFromDatabase(dbPlugin)
        } else {
          throw new Error(`Plugin ${pluginId} not found`)
        }
      }

      // Activate in registry
      await this.activatePluginInRegistry(pluginId, this.state.plugins.get(pluginId)!, config)
      
      // Emit event
      this.emit('pluginActivated', { 
        pluginId, 
        plugin: this.state.plugins.get(pluginId) 
      })

      // Trigger UI updates
      this.notifyUIUpdate('activated', pluginId)

    } catch (error) {
      console.error(`Failed to handle plugin activation: ${pluginId}`, error)
      throw error
    }
  }

  // WordPress-like plugin deactivation
  async onPluginDeactivated(pluginId: string): Promise<void> {
    try {
      console.log(`🔌 Plugin deactivation notification: ${pluginId}`)
      
      const plugin = this.state.plugins.get(pluginId)
      if (plugin) {
        await this.deactivatePluginInRegistry(pluginId, plugin)
      }
      
      // Emit event
      this.emit('pluginDeactivated', { pluginId, plugin })

      // Trigger UI updates
      this.notifyUIUpdate('deactivated', pluginId)

    } catch (error) {
      console.error(`Failed to handle plugin deactivation: ${pluginId}`, error)
    }
  }

  // WordPress-like plugin configuration update
  async onPluginConfigured(pluginId: string, newConfig: PluginConfig): Promise<void> {
    try {
      console.log(`⚙️ Plugin configuration notification: ${pluginId}`)
      
      const plugin = this.state.plugins.get(pluginId)
      if (plugin) {
        // Update config in registry
        plugin.config = { ...plugin.config, ...newConfig }
        
        // If plugin is active, apply new config
        if (this.state.activePlugins.has(pluginId)) {
          await this.updatePluginConfig(pluginId, newConfig)
        }
      }
      
      // Emit event
      this.emit('pluginConfigured', { pluginId, plugin, config: newConfig })

      // Trigger UI updates
      this.notifyUIUpdate('configured', pluginId)

    } catch (error) {
      console.error(`Failed to handle plugin configuration: ${pluginId}`, error)
    }
  }

  // WordPress-like plugin uninstallation
  async onPluginUninstalled(pluginId: string): Promise<void> {
    try {
      console.log(`🗑️ Plugin uninstallation notification: ${pluginId}`)
      
      // Remove from registry
      await this.unloadPluginInternal(pluginId)
      
      // Emit event
      this.emit('pluginUninstalled', { pluginId })

      // Trigger UI updates
      this.notifyUIUpdate('uninstalled', pluginId)

    } catch (error) {
      console.error(`Failed to handle plugin uninstallation: ${pluginId}`, error)
    }
  }

  // Internal registry activation (without database update)
  private async activatePluginInRegistry(pluginId: string, plugin: LoadedPlugin, config?: PluginConfig): Promise<void> {
    // Run before activate hooks
    await this.runHooks('beforeActivate', {
      type: 'activated',
      pluginId,
      timestamp: new Date(),
    })

    // Apply configuration
    if (config) {
      plugin.config = deepMerge(plugin.config, config)
    }

    // Mark as active
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
  }

  // Internal registry deactivation (without database update)
  private async deactivatePluginInRegistry(pluginId: string, plugin: LoadedPlugin): Promise<void> {
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
  }

  // Public method for manual plugin unloading (if needed)
  async unloadPlugin(pluginId: string): Promise<void> {
    await this.unloadPluginInternal(pluginId)
  }

  // Unload plugin from registry
  private async unloadPluginInternal(pluginId: string): Promise<void> {
    const plugin = this.state.plugins.get(pluginId)
    if (!plugin) return

    // Deactivate if active
    if (this.state.activePlugins.has(pluginId)) {
      await this.deactivatePluginInRegistry(pluginId, plugin)
    }

    // Remove from registry
    this.state.plugins.delete(pluginId)
    this.state.errors.delete(pluginId)
    this.state.lastUpdated = new Date()

    console.log(`🗑️ Plugin unloaded from registry: ${pluginId}`)
  }

  // Notify UI of changes (for real-time updates)
  private notifyUIUpdate(action: string, pluginId: string): void {
    try {
      // Broadcast to all connected clients (if using WebSockets)
      // For now, use custom events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pluginStateChanged', {
          detail: { action, pluginId, timestamp: new Date() }
        }))
      }

      // Server-side event emission for API consumers
      this.emit('uiUpdateRequired', { action, pluginId, timestamp: new Date() })
      
    } catch (error) {
      console.warn('Failed to notify UI update:', error)
    }
  }

  // Force refresh from database
  async refresh(): Promise<void> {
    console.log('🔄 Force refreshing registry...')
    await this.syncWithDatabase()
    this.emit('registryRefreshed')
  }

  // WordPress-like refresh all
  async refreshAll(): Promise<void> {
    console.log('🔄 Refreshing all plugins...')
    
    // Clear current state
    this.state.plugins.clear()
    this.state.activePlugins.clear()
    this.state.errors.clear()
    
    // Clear global resources
    this.globalRoutes.clear()
    this.globalAdminPages.clear()
    this.globalSidebarItems = []
    this.globalDashboardWidgets.clear()
    this.globalHooks.clear()
    
    // Reload everything
    await this.syncWithDatabase()
    
    this.emit('registryRefreshedAll')
  }

  // Check if plugin exists in database
  async pluginExistsInDatabase(pluginId: string): Promise<boolean> {
    try {
      const plugin = await InstalledPluginModel.findOne({ pluginId })
      return !!plugin
    } catch (error) {
      return false
    }
  }

  // Get plugin from database
  async getPluginFromDatabase(pluginId: string): Promise<any | null> {
    try {
      return await InstalledPluginModel.findOne({ pluginId })
    } catch (error) {
      return null
    }
  }

  // Original methods (preserved)
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
    await this.onPluginActivated(pluginId, config)
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    await this.onPluginDeactivated(pluginId)
  }

  async updatePluginConfig(pluginId: string, config: Partial<PluginConfig>): Promise<void> {
    const plugin = this.state.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    plugin.config = deepMerge(plugin.config, config)
    this.state.lastUpdated = new Date()

    this.emit('pluginConfigUpdated', { pluginId, config, plugin })
  }

  // All existing methods preserved...
  // (keeping original implementation for registerPluginRoutes, unregisterPluginRoutes, etc.)
  
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
      isInitialized: this.isInitialized,
      autoSyncEnabled: this.autoSyncEnabled,
      ...pluginLoader.getCacheStats(),
    }
  }
}

// Enhanced singleton instance with auto-initialization
export const pluginRegistry = new PluginRegistry()

// Auto-initialize when imported (WordPress-like)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  // Initialize in next tick to allow other modules to set up first
  process.nextTick(async () => {
    try {
      await pluginRegistry.initialize()
    } catch (error) {
      console.error('Failed to auto-initialize plugin registry:', error)
    }
  })
}