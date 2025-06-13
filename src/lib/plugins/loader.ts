// Plugin loader
import path from 'path'
import fs from 'fs/promises'
import { pathToFileURL } from 'url'
import { PLUGIN_CONFIG } from '@/lib/constants'
import { getErrorMessage, ensureDir } from '@/lib/utils'
import { pluginManifestSchema } from '@/lib/validations'
import { 
  PluginManifest,
  PluginValidationResult,
  PluginLoadOptions,
  LoadedPlugin,
  PluginAssets,
  PluginComponentMap,
  PluginRoute,
  PluginAdminPage,
  PluginSidebarItem,
  PluginDashboardWidget,
  PluginHook
} from '@/types/plugin'

export class PluginLoader {
  private cache = new Map<string, LoadedPlugin>()
  private loadingPromises = new Map<string, Promise<LoadedPlugin>>()

  async loadPlugin(pluginId: string, options: PluginLoadOptions = {}): Promise<LoadedPlugin> {
    const { force = false, skipCache = false } = options

    // Check cache first
    if (!force && !skipCache && this.cache.has(pluginId)) {
      const cached = this.cache.get(pluginId)!
      cached.lastUsed = new Date()
      return cached
    }

    // Check if already loading
    if (this.loadingPromises.has(pluginId)) {
      return this.loadingPromises.get(pluginId)!
    }

    // Start loading
    const loadPromise = this._loadPluginInternal(pluginId, options)
    this.loadingPromises.set(pluginId, loadPromise)

    try {
      const loadedPlugin = await loadPromise
      this.cache.set(pluginId, loadedPlugin)
      return loadedPlugin
    } finally {
      this.loadingPromises.delete(pluginId)
    }
  }

  private async _loadPluginInternal(
    pluginId: string, 
    options: PluginLoadOptions
  ): Promise<LoadedPlugin> {
    try {
      const pluginPath = path.join(process.cwd(), PLUGIN_CONFIG.INSTALL_DIR, pluginId)
      
      // Check if plugin directory exists
      try {
        await fs.access(pluginPath)
      } catch {
        throw new Error(`Plugin directory not found: ${pluginPath}`)
      }

      // Load and validate manifest
      const manifest = await this.loadManifest(pluginPath, options.validateManifest)
      
      // Load plugin assets
      const assets = await this.loadAssets(pluginPath, manifest)
      
      // Load plugin components
      const components = await this.loadComponents(pluginPath, manifest)
      
      // Load plugin routes
      const routes = await this.loadRoutes(manifest)
      
      // Load admin pages
      const adminPages = await this.loadAdminPages(manifest)
      
      // Load sidebar items
      const sidebarItems = this.loadSidebarItems(manifest)
      
      // Load dashboard widgets
      const dashboardWidgets = await this.loadDashboardWidgets(manifest)
      
      // Load hooks
      const hooks = this.loadHooks(manifest)
      
      // Load plugin instance
      const instance = await this.loadPluginInstance(pluginPath, manifest)

      const loadedPlugin: LoadedPlugin = {
        manifest,
        instance,
        assets,
        components,
        config: manifest.settings?.defaults || {},
        routes,
        adminPages,
        sidebarItems,
        dashboardWidgets,
        hooks,
        isLoaded: true,
        isActive: false,
        loadedAt: new Date(),
        lastUsed: new Date(),
      }

      return loadedPlugin
    } catch (error) {
      throw new Error(`Failed to load plugin ${pluginId}: ${getErrorMessage(error)}`)
    }
  }

  async loadManifest(pluginPath: string, validate = true): Promise<PluginManifest> {
    const manifestPath = path.join(pluginPath, PLUGIN_CONFIG.MANIFEST_FILE)
    
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      const manifestData = JSON.parse(manifestContent)
      
      if (validate) {
        const validation = pluginManifestSchema.safeParse(manifestData)
        if (!validation.success) {
          throw new Error(`Invalid manifest: ${validation.error.issues.map(i => i.message).join(', ')}`)
        }
        return validation.data as PluginManifest
      }
      
      return manifestData as PluginManifest
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON in plugin manifest')
      }
      throw new Error(`Failed to load manifest: ${getErrorMessage(error)}`)
    }
  }

  async loadAssets(pluginPath: string, manifest: PluginManifest): Promise<PluginAssets> {
    const assets: PluginAssets = {
      css: new Map(),
      js: new Map(),
      files: new Map(),
    }

    if (manifest.assets) {
      // Load CSS files
      if (manifest.assets.css) {
        for (const cssPath of manifest.assets.css) {
          const fullPath = path.join(pluginPath, cssPath)
          try {
            const content = await fs.readFile(fullPath, 'utf-8')
            assets.css.set(path.basename(cssPath), content)
          } catch {
            // CSS file not found, skip silently
          }
        }
      }

      // Load JS files
      if (manifest.assets.js) {
        for (const jsPath of manifest.assets.js) {
          const fullPath = path.join(pluginPath, jsPath)
          try {
            const content = await fs.readFile(fullPath, 'utf-8')
            assets.js.set(path.basename(jsPath), content)
          } catch {
            // JS file not found, skip silently
          }
        }
      }
    }

    return assets
  }

  async loadComponents(pluginPath: string, manifest: PluginManifest): Promise<PluginComponentMap> {
    const components: PluginComponentMap = {
      adminPages: new Map(),
      dashboardWidgets: new Map(),
      components: new Map(),
    }

    try {
      // Load admin page components
      if (manifest.adminPages) {
        for (const page of manifest.adminPages) {
          try {
            const fullPath = path.join(pluginPath, page.component)
            await fs.access(fullPath)
            
            const component = await this.dynamicImport(fullPath)
            components.adminPages.set(page.path, component.default || component)
          } catch (error) {
            // Component failed to load, skip
          }
        }
      }

      // Load dashboard widget components
      if (manifest.dashboardWidgets) {
        for (const widget of manifest.dashboardWidgets) {
          try {
            const fullPath = path.join(pluginPath, widget.component)
            await fs.access(fullPath)
            
            const component = await this.dynamicImport(fullPath)
            components.dashboardWidgets.set(widget.id, component.default || component)
          } catch (error) {
            // Component failed to load, skip
          }
        }
      }
    } catch (error) {
      // Non-critical error, return partial components
    }

    return components
  }

  async loadRoutes(manifest: PluginManifest): Promise<Map<string, PluginRoute>> {
    const routes = new Map<string, PluginRoute>()
    
    if (manifest.routes) {
      for (const route of manifest.routes) {
        const routeKey = `${route.method}:${route.path}`
        routes.set(routeKey, route)
      }
    }
    
    return routes
  }

  async loadAdminPages(manifest: PluginManifest): Promise<Map<string, PluginAdminPage>> {
    const adminPages = new Map<string, PluginAdminPage>()
    
    if (manifest.adminPages) {
      for (const page of manifest.adminPages) {
        adminPages.set(page.path, page)
      }
    }
    
    return adminPages
  }

  loadSidebarItems(manifest: PluginManifest): PluginSidebarItem[] {
    return manifest.sidebarItems || []
  }

  async loadDashboardWidgets(manifest: PluginManifest): Promise<Map<string, PluginDashboardWidget>> {
    const widgets = new Map<string, PluginDashboardWidget>()
    
    if (manifest.dashboardWidgets) {
      for (const widget of manifest.dashboardWidgets) {
        widgets.set(widget.id, widget)
      }
    }
    
    return widgets
  }

  loadHooks(manifest: PluginManifest): Map<string, PluginHook[]> {
    const hooks = new Map<string, PluginHook[]>()
    
    if (manifest.hooks) {
      for (const hook of manifest.hooks) {
        const existing = hooks.get(hook.name) || []
        existing.push(hook)
        existing.sort((a, b) => (a.priority || 0) - (b.priority || 0))
        hooks.set(hook.name, existing)
      }
    }
    
    return hooks
  }

  async loadPluginInstance(pluginPath: string, manifest: PluginManifest): Promise<any> {
    try {
      const mainPath = path.join(pluginPath, manifest.main)
      await fs.access(mainPath)
      
      const instance = await this.dynamicImport(mainPath)
      return instance.default || instance
    } catch (error) {
      // Return null if main file can't be loaded
      return null
    }
  }

  private async dynamicImport(filePath: string): Promise<any> {
    const absolutePath = path.resolve(filePath)
    
    if (typeof window !== 'undefined') {
      // Browser environment - use dynamic import with file URL
      const fileUrl = pathToFileURL(absolutePath).href
      return import(fileUrl)
    } else {
      // Node.js environment
      // Clear require cache to ensure fresh import
      delete require.cache[absolutePath]
      
      // Handle different file extensions
      const ext = path.extname(absolutePath).toLowerCase()
      
      if (ext === '.mjs' || ext === '.js') {
        return import(pathToFileURL(absolutePath).href)
      } else {
        // For .ts files or other extensions, use require
        return require(absolutePath)
      }
    }
  }

  async validatePlugin(pluginPath: string): Promise<PluginValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    let manifest: PluginManifest | undefined

    try {
      // Check if directory exists
      await fs.access(pluginPath)
    } catch {
      errors.push('Plugin directory not found')
      return { isValid: false, errors, warnings }
    }

    try {
      // Check manifest exists and is valid
      manifest = await this.loadManifest(pluginPath, true)
    } catch (error) {
      errors.push(`Invalid manifest: ${getErrorMessage(error)}`)
      return { isValid: false, errors, warnings }
    }

    // Validate main entry point
    const mainPath = path.join(pluginPath, manifest.main)
    try {
      await fs.access(mainPath)
    } catch {
      errors.push(`Main entry point not found: ${manifest.main}`)
    }

    // Validate route handlers
    if (manifest.routes) {
      for (const route of manifest.routes) {
        const handlerPath = path.join(pluginPath, route.handler)
        try {
          await fs.access(handlerPath)
        } catch {
          warnings.push(`Route handler not found: ${route.handler} (${route.method} ${route.path})`)
        }
      }
    }

    // Validate admin page components
    if (manifest.adminPages) {
      for (const page of manifest.adminPages) {
        const componentPath = path.join(pluginPath, page.component)
        try {
          await fs.access(componentPath)
        } catch {
          warnings.push(`Admin page component not found: ${page.component} (${page.path})`)
        }
      }
    }

    // Validate dashboard widget components
    if (manifest.dashboardWidgets) {
      for (const widget of manifest.dashboardWidgets) {
        const componentPath = path.join(pluginPath, widget.component)
        try {
          await fs.access(componentPath)
        } catch {
          warnings.push(`Dashboard widget component not found: ${widget.component} (${widget.id})`)
        }
      }
    }

    // Validate hook handlers
    if (manifest.hooks) {
      for (const hook of manifest.hooks) {
        const handlerPath = path.join(pluginPath, hook.handler)
        try {
          await fs.access(handlerPath)
        } catch {
          warnings.push(`Hook handler not found: ${hook.handler} (${hook.name})`)
        }
      }
    }

    // Validate assets
    if (manifest.assets) {
      const allAssets = [
        ...(manifest.assets.css || []),
        ...(manifest.assets.js || []),
      ]

      for (const assetPath of allAssets) {
        const fullPath = path.join(pluginPath, assetPath)
        try {
          await fs.access(fullPath)
        } catch {
          warnings.push(`Asset file not found: ${assetPath}`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      manifest,
    }
  }

  unloadPlugin(pluginId: string): void {
    this.cache.delete(pluginId)
    this.loadingPromises.delete(pluginId)
  }

  clearCache(): void {
    this.cache.clear()
    this.loadingPromises.clear()
  }

  getCachedPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.cache.get(pluginId)
  }

  getCacheStats() {
    return {
      cached: this.cache.size,
      loading: this.loadingPromises.size,
      plugins: Array.from(this.cache.keys()),
    }
  }
}

// Singleton instance
export const pluginLoader = new PluginLoader()