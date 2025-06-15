// Plugin Hooks System - WordPress-like hooks and filters
// src/lib/plugins/hooks.ts

import { PluginHookSystem } from '@/types/plugin'

interface HookCallback {
  callback: Function
  priority: number
  accepted: number
  pluginId?: string
}

class PluginHooks implements PluginHookSystem {
  private actions = new Map<string, HookCallback[]>()
  private filters = new Map<string, HookCallback[]>()
  private currentFilter = new Map<string, any>()
  private runningHooks = new Set<string>()

  /**
   * Add an action hook
   */
  addAction(hookName: string, callback: Function, priority = 10, pluginId?: string): void {
    this.addHook('action', hookName, callback, priority, 1, pluginId)
  }

  /**
   * Add a filter hook
   */
  addFilter(hookName: string, callback: Function, priority = 10, pluginId?: string): void {
    this.addHook('filter', hookName, callback, priority, 1, pluginId)
  }

  /**
   * Execute all callbacks for an action hook
   */
  async doAction(hookName: string, ...args: any[]): Promise<void> {
    const callbacks = this.actions.get(hookName)
    if (!callbacks || callbacks.length === 0) return

    // Prevent infinite recursion
    if (this.runningHooks.has(hookName)) {
      console.warn(`Infinite recursion detected for action hook: ${hookName}`)
      return
    }

    this.runningHooks.add(hookName)

    try {
      // Sort by priority (lower number = higher priority)
      const sortedCallbacks = [...callbacks].sort((a, b) => a.priority - b.priority)

      for (const hookCallback of sortedCallbacks) {
        try {
          await this.executeCallback(hookCallback, args)
        } catch (error) {
          console.error(`Error in action hook ${hookName}:`, error)
          // Continue with other callbacks even if one fails
        }
      }
    } finally {
      this.runningHooks.delete(hookName)
    }
  }

  /**
   * Apply all callbacks for a filter hook
   */
  async applyFilters(hookName: string, value: any, ...args: any[]): Promise<any> {
    const callbacks = this.filters.get(hookName)
    if (!callbacks || callbacks.length === 0) return value

    // Prevent infinite recursion
    if (this.runningHooks.has(hookName)) {
      console.warn(`Infinite recursion detected for filter hook: ${hookName}`)
      return value
    }

    this.runningHooks.add(hookName)
    this.currentFilter.set(hookName, value)

    try {
      let filteredValue = value

      // Sort by priority (lower number = higher priority)
      const sortedCallbacks = [...callbacks].sort((a, b) => a.priority - b.priority)

      for (const hookCallback of sortedCallbacks) {
        try {
          const result = await this.executeCallback(hookCallback, [filteredValue, ...args])
          
          // Update filtered value if callback returned something
          if (result !== undefined) {
            filteredValue = result
            this.currentFilter.set(hookName, filteredValue)
          }
        } catch (error) {
          console.error(`Error in filter hook ${hookName}:`, error)
          // Continue with other callbacks even if one fails
        }
      }

      return filteredValue
    } finally {
      this.runningHooks.delete(hookName)
      this.currentFilter.delete(hookName)
    }
  }

  /**
   * Remove an action hook
   */
  removeAction(hookName: string, callback: Function): void {
    this.removeHook('action', hookName, callback)
  }

  /**
   * Remove a filter hook
   */
  removeFilter(hookName: string, callback: Function): void {
    this.removeHook('filter', hookName, callback)
  }

  /**
   * Check if an action hook exists
   */
  hasAction(hookName: string): boolean {
    const callbacks = this.actions.get(hookName)
    return !!(callbacks && callbacks.length > 0)
  }

  /**
   * Check if a filter hook exists
   */
  hasFilter(hookName: string): boolean {
    const callbacks = this.filters.get(hookName)
    return !!(callbacks && callbacks.length > 0)
  }

  /**
   * Get all hooks of a specific type
   */
  getHooks(type?: 'action' | 'filter'): Map<string, Function[]> {
    const result = new Map<string, Function[]>()

    if (!type || type === 'action') {
      for (const [hookName, callbacks] of this.actions) {
        result.set(`action:${hookName}`, callbacks.map(c => c.callback))
      }
    }

    if (!type || type === 'filter') {
      for (const [hookName, callbacks] of this.filters) {
        result.set(`filter:${hookName}`, callbacks.map(c => c.callback))
      }
    }

    return result
  }

  /**
   * Get current filter value (only available during filter execution)
   */
  getCurrentFilter(hookName: string): any {
    return this.currentFilter.get(hookName)
  }

  /**
   * Remove all hooks for a specific plugin
   */
  removePluginHooks(pluginId: string): void {
    // Remove from actions
    for (const [hookName, callbacks] of this.actions) {
      const filtered = callbacks.filter(c => c.pluginId !== pluginId)
      if (filtered.length > 0) {
        this.actions.set(hookName, filtered)
      } else {
        this.actions.delete(hookName)
      }
    }

    // Remove from filters
    for (const [hookName, callbacks] of this.filters) {
      const filtered = callbacks.filter(c => c.pluginId !== pluginId)
      if (filtered.length > 0) {
        this.filters.set(hookName, filtered)
      } else {
        this.filters.delete(hookName)
      }
    }
  }

  /**
   * Get all hooks for a specific plugin
   */
  getPluginHooks(pluginId: string): { actions: string[], filters: string[] } {
    const actions: string[] = []
    const filters: string[] = []

    for (const [hookName, callbacks] of this.actions) {
      if (callbacks.some(c => c.pluginId === pluginId)) {
        actions.push(hookName)
      }
    }

    for (const [hookName, callbacks] of this.filters) {
      if (callbacks.some(c => c.pluginId === pluginId)) {
        filters.push(hookName)
      }
    }

    return { actions, filters }
  }

  /**
   * Get hook statistics
   */
  getStats(): {
    totalActions: number
    totalFilters: number
    totalCallbacks: number
    hooksByPlugin: Map<string, { actions: number, filters: number }>
  } {
    let totalCallbacks = 0
    const hooksByPlugin = new Map<string, { actions: number, filters: number }>()

    // Count action callbacks
    for (const callbacks of this.actions.values()) {
      totalCallbacks += callbacks.length
      for (const callback of callbacks) {
        if (callback.pluginId) {
          const stats = hooksByPlugin.get(callback.pluginId) || { actions: 0, filters: 0 }
          stats.actions++
          hooksByPlugin.set(callback.pluginId, stats)
        }
      }
    }

    // Count filter callbacks
    for (const callbacks of this.filters.values()) {
      totalCallbacks += callbacks.length
      for (const callback of callbacks) {
        if (callback.pluginId) {
          const stats = hooksByPlugin.get(callback.pluginId) || { actions: 0, filters: 0 }
          stats.filters++
          hooksByPlugin.set(callback.pluginId, stats)
        }
      }
    }

    return {
      totalActions: this.actions.size,
      totalFilters: this.filters.size,
      totalCallbacks,
      hooksByPlugin
    }
  }

  /**
   * Clear all hooks
   */
  clearAll(): void {
    this.actions.clear()
    this.filters.clear()
    this.currentFilter.clear()
    this.runningHooks.clear()
  }

  /**
   * Debug: Log all hooks
   */
  debugHooks(): void {
    console.group('🔧 Plugin Hooks Debug')
    
    console.group('Actions:')
    for (const [hookName, callbacks] of this.actions) {
      console.log(`${hookName}: ${callbacks.length} callbacks`)
      callbacks.forEach((callback, index) => {
        console.log(`  ${index + 1}. Priority: ${callback.priority}, Plugin: ${callback.pluginId || 'core'}`)
      })
    }
    console.groupEnd()

    console.group('Filters:')
    for (const [hookName, callbacks] of this.filters) {
      console.log(`${hookName}: ${callbacks.length} callbacks`)
      callbacks.forEach((callback, index) => {
        console.log(`  ${index + 1}. Priority: ${callback.priority}, Plugin: ${callback.pluginId || 'core'}`)
      })
    }
    console.groupEnd()

    console.groupEnd()
  }

  // Private methods

  /**
   * Add a hook (internal method)
   */
  private addHook(
    type: 'action' | 'filter',
    hookName: string,
    callback: Function,
    priority: number,
    accepted: number,
    pluginId?: string
  ): void {
    const hookMap = type === 'action' ? this.actions : this.filters
    const callbacks = hookMap.get(hookName) || []

    // Check if callback already exists (prevent duplicates)
    const existingIndex = callbacks.findIndex(c => 
      c.callback === callback && c.pluginId === pluginId
    )

    const hookCallback: HookCallback = {
      callback,
      priority,
      accepted,
      pluginId
    }

    if (existingIndex >= 0) {
      // Update existing callback
      callbacks[existingIndex] = hookCallback
    } else {
      // Add new callback
      callbacks.push(hookCallback)
    }

    // Sort by priority (lower number = higher priority)
    callbacks.sort((a, b) => a.priority - b.priority)

    hookMap.set(hookName, callbacks)
  }

  /**
   * Remove a hook (internal method)
   */
  private removeHook(type: 'action' | 'filter', hookName: string, callback: Function): void {
    const hookMap = type === 'action' ? this.actions : this.filters
    const callbacks = hookMap.get(hookName)

    if (!callbacks) return

    const filtered = callbacks.filter(c => c.callback !== callback)
    
    if (filtered.length > 0) {
      hookMap.set(hookName, filtered)
    } else {
      hookMap.delete(hookName)
    }
  }

  /**
   * Execute a callback safely
   */
  private async executeCallback(hookCallback: HookCallback, args: any[]): Promise<any> {
    const { callback, accepted } = hookCallback

    try {
      // Limit arguments to what the callback accepts
      const limitedArgs = args.slice(0, accepted)

      // Execute callback (support both sync and async)
      const result = callback(...limitedArgs)
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return await result
      }
      
      return result
    } catch (error) {
      console.error('Hook callback execution error:', error)
      throw error
    }
  }
}

// Predefined hook names for type safety and consistency
export const PLUGIN_HOOKS = {
  SYSTEM_READY: 'plugin:ready',
  SYSTEM_SHUTDOWN: 'plugin:shutdown',
  PLUGIN_LOADED: 'plugin:loaded',
  PLUGIN_RELOADED: 'plugin:reloaded',
  PLUGIN_ACTIVATED: 'plugin:activated',
  PLUGIN_DEACTIVATED: 'plugin:deactivated',
  PLUGIN_INSTALLED: 'plugin:installed',
  PLUGIN_UNINSTALLED: 'plugin:uninstalled',
  PLUGIN_UPDATED: 'plugin:updated',
  
  // Authentication hooks
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_REGISTER: 'user:register',
  USER_PROFILE_UPDATE: 'user:profile_update',
  AUTH_TOKEN_REFRESH: 'auth:token_refresh',
  
  // Content hooks
  CONTENT_BEFORE_SAVE: 'content:before_save',
  CONTENT_AFTER_SAVE: 'content:after_save',
  CONTENT_BEFORE_DELETE: 'content:before_delete',
  CONTENT_AFTER_DELETE: 'content:after_delete',
  
  // API hooks
  API_REQUEST_START: 'api:request_start',
  API_REQUEST_END: 'api:request_end',
  API_RESPONSE_FILTER: 'api:response_filter',
  API_ERROR: 'api:error',
  
  // Admin hooks
  ADMIN_MENU_RENDER: 'admin:menu_render',
  ADMIN_PAGE_RENDER: 'admin:page_render',
  ADMIN_DASHBOARD_WIDGETS: 'admin:dashboard_widgets',
  
  // Theme hooks
  THEME_ACTIVATED: 'theme:activated',
  THEME_DEACTIVATED: 'theme:deactivated',
  THEME_CUSTOMIZATION_SAVE: 'theme:customization_save',
  
  // Email hooks
  EMAIL_BEFORE_SEND: 'email:before_send',
  EMAIL_AFTER_SEND: 'email:after_send',
  EMAIL_TEMPLATE_RENDER: 'email:template_render',
  
  // Database hooks
  DB_BEFORE_SAVE: 'db:before_save',
  DB_AFTER_SAVE: 'db:after_save',
  DB_BEFORE_DELETE: 'db:before_delete',
  DB_AFTER_DELETE: 'db:after_delete',
  
  // File hooks
  FILE_UPLOAD_START: 'file:upload_start',
  FILE_UPLOAD_COMPLETE: 'file:upload_complete',
  FILE_DELETE: 'file:delete',
  
  // Search hooks
  SEARCH_QUERY: 'search:query',
  SEARCH_RESULTS: 'search:results',
  
  // Cache hooks
  CACHE_CLEAR: 'cache:clear',
  CACHE_WARM: 'cache:warm',
  
  // System hooks
  SYSTEM_MAINTENANCE_START: 'system:maintenance_start',
  SYSTEM_MAINTENANCE_END: 'system:maintenance_end',
  SYSTEM_BACKUP_START: 'system:backup_start',
  SYSTEM_BACKUP_COMPLETE: 'system:backup_complete',
} as const

// Export singleton instance
export const pluginHooks = new PluginHooks()

// Export class for testing
export default PluginHooks