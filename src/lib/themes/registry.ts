
import { EventEmitter } from 'events'
import { 
  ThemeCustomization,
  ActiveTheme,
  LoadedTheme,
  ThemeRegistryState,
  ThemeEvent,
  ThemeHooks,
  ThemeHook,
  ThemeHookContext
} from '@/types/theme'
import { themeLoader } from './loader'
import { deepMerge } from '@/lib/utils'

export class ThemeRegistry extends EventEmitter {
  private state: ThemeRegistryState = {
    themes: new Map(),
    activeTheme: null,
    loading: new Set(),
    errors: new Map(),
    lastUpdated: new Date(),
  }

  private hooks: ThemeHooks = {
    beforeInstall: [],
    afterInstall: [],
    beforeActivate: [],
    afterActivate: [],
    beforeDeactivate: [],
    afterDeactivate: [],
    beforeUninstall: [],
    afterUninstall: [],
    onCustomize: [],
  }

  async loadTheme(themeId: string): Promise<LoadedTheme> {
    if (this.state.loading.has(themeId)) {
      // Wait for existing load to complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Theme loading timeout: ${themeId}`))
        }, 30000) // 30 second timeout

        const checkComplete = () => {
          if (!this.state.loading.has(themeId)) {
            clearTimeout(timeout)
            const theme = this.state.themes.get(themeId)
            if (theme) {
              resolve(theme)
            } else {
              reject(new Error(`Theme ${themeId} failed to load`))
            }
          } else {
            setTimeout(checkComplete, 100)
          }
        }
        checkComplete()
      })
    }

    this.state.loading.add(themeId)
    this.state.errors.delete(themeId)

    try {
      const loadedTheme = await themeLoader.loadTheme(themeId)
      this.state.themes.set(themeId, loadedTheme)
      this.state.lastUpdated = new Date()
      
      this.emit('themeLoaded', { themeId, theme: loadedTheme })
      return loadedTheme
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.state.errors.set(themeId, errorMessage)
      this.emit('themeLoadError', { themeId, error: errorMessage })
      throw error
    } finally {
      this.state.loading.delete(themeId)
    }
  }

  async activateTheme(themeId: string, customization?: ThemeCustomization): Promise<void> {
    // Run before activate hooks
    await this.runHooks('beforeActivate', {
      type: 'activated',
      themeId,
      timestamp: new Date(),
    })

    // Load theme if not already loaded
    let theme = this.state.themes.get(themeId)
    if (!theme) {
      theme = await this.loadTheme(themeId)
    }

    // Deactivate current theme
    if (this.state.activeTheme && this.state.activeTheme !== themeId) {
      await this.deactivateTheme(this.state.activeTheme)
    }

    // Apply customization
    if (customization) {
      theme.customization = deepMerge(theme.customization, customization)
    }

    // Activate theme
    theme.isActive = true
    this.state.activeTheme = themeId
    this.state.lastUpdated = new Date()

    // Run after activate hooks
    await this.runHooks('afterActivate', {
      type: 'activated',
      themeId,
      timestamp: new Date(),
    })

    this.emit('themeActivated', { themeId, theme })
  }

  async deactivateTheme(themeId: string): Promise<void> {
    const theme = this.state.themes.get(themeId)
    if (!theme) return

    // Run before deactivate hooks
    await this.runHooks('beforeDeactivate', {
      type: 'deactivated',
      themeId,
      timestamp: new Date(),
    })

    theme.isActive = false
    if (this.state.activeTheme === themeId) {
      this.state.activeTheme = null
    }

    this.state.lastUpdated = new Date()

    // Run after deactivate hooks
    await this.runHooks('afterDeactivate', {
      type: 'deactivated',
      themeId,
      timestamp: new Date(),
    })

    this.emit('themeDeactivated', { themeId, theme })
  }

  unloadTheme(themeId: string): void {
    const theme = this.state.themes.get(themeId)
    if (theme && theme.isActive) {
      throw new Error('Cannot unload active theme')
    }

    this.state.themes.delete(themeId)
    this.state.errors.delete(themeId)
    this.state.loading.delete(themeId)
    this.state.lastUpdated = new Date()

    // Clear from loader cache
    themeLoader.unloadTheme(themeId)

    this.emit('themeUnloaded', { themeId })
  }

  async updateThemeCustomization(
    themeId: string,
    customization: Partial<ThemeCustomization>
  ): Promise<void> {
    const theme = this.state.themes.get(themeId)
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`)
    }

    const oldCustomization = { ...theme.customization }
    theme.customization = deepMerge(theme.customization, customization)
    this.state.lastUpdated = new Date()

    // Run customize hooks
    await this.runHooks('onCustomize', {
      type: 'customized',
      themeId,
      timestamp: new Date(),
      metadata: { 
        oldCustomization, 
        newCustomization: theme.customization 
      },
    })

    this.emit('themeCustomized', { themeId, theme, customization })
  }

  getTheme(themeId: string): LoadedTheme | undefined {
    return this.state.themes.get(themeId)
  }

  getActiveTheme(): LoadedTheme | null {
    if (!this.state.activeTheme) return null
    return this.state.themes.get(this.state.activeTheme) || null
  }

  getActiveThemeData(): ActiveTheme | null {
    const activeTheme = this.getActiveTheme()
    if (!activeTheme) return null

    return {
      id: activeTheme.manifest.id,
      name: activeTheme.manifest.name,
      version: activeTheme.manifest.version,
      customization: activeTheme.customization,
      components: activeTheme.components.components,
      pages: activeTheme.components.pages,
      layouts: activeTheme.components.layouts,
    }
  }

  getAllThemes(): LoadedTheme[] {
    return Array.from(this.state.themes.values())
  }

  getLoadedThemeIds(): string[] {
    return Array.from(this.state.themes.keys())
  }

  isThemeLoaded(themeId: string): boolean {
    return this.state.themes.has(themeId)
  }

  isThemeLoading(themeId: string): boolean {
    return this.state.loading.has(themeId)
  }

  isThemeActive(themeId: string): boolean {
    return this.state.activeTheme === themeId
  }

  getThemeError(themeId: string): string | undefined {
    return this.state.errors.get(themeId)
  }

  getRegistryState(): Readonly<ThemeRegistryState> {
    return { 
      themes: new Map(this.state.themes),
      activeTheme: this.state.activeTheme,
      loading: new Set(this.state.loading),
      errors: new Map(this.state.errors),
      lastUpdated: this.state.lastUpdated,
    }
  }

  // Hook management
  addHook(event: keyof ThemeHooks, hook: ThemeHook): void {
    this.hooks[event].push(hook)
  }

  removeHook(event: keyof ThemeHooks, hook: ThemeHook): void {
    const hooks = this.hooks[event]
    const index = hooks.indexOf(hook)
    if (index > -1) {
      hooks.splice(index, 1)
    }
  }

  clearHooks(event?: keyof ThemeHooks): void {
    if (event) {
      this.hooks[event] = []
    } else {
      Object.keys(this.hooks).forEach(key => {
        this.hooks[key as keyof ThemeHooks] = []
      })
    }
  }

  private async runHooks(
  event: keyof ThemeHooks, 
  eventData: {
    type: ThemeEvent['type']
    themeId: string
    timestamp: Date
    userId?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  const hooks = this.hooks[event]
  
  const themeEvent: ThemeEvent = {
    type: eventData.type,
    themeId: eventData.themeId,
    timestamp: eventData.timestamp,
    userId: eventData.userId,
    metadata: eventData.metadata,
  }
  
  const fullContext: ThemeHookContext = {
    themeId: eventData.themeId,
    event: themeEvent,
    currentTheme: this.getActiveTheme() || undefined,
    previousTheme: undefined,
  }

  const hookPromises = hooks.map(async (hook) => {
    try {
      await hook(fullContext)
    } catch (error) {
      console.error(`Theme hook error (${event}):`, error)
    }
  })

  await Promise.allSettled(hookPromises)
}

  // Clear all data
  clear(): void {
    this.state.themes.clear()
    this.state.loading.clear()
    this.state.errors.clear()
    this.state.activeTheme = null
    this.state.lastUpdated = new Date()
    
    themeLoader.clearCache()
    this.emit('registryCleared')
  }

  // Get statistics
  getStats() {
    return {
      totalThemes: this.state.themes.size,
      activeTheme: this.state.activeTheme,
      loadingThemes: this.state.loading.size,
      errorCount: this.state.errors.size,
      lastUpdated: this.state.lastUpdated,
      ...themeLoader.getCacheStats(),
    }
  }
}

// Singleton instance
export const themeRegistry = new ThemeRegistry()