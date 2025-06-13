
import path from 'path'
import fs from 'fs/promises'
import { pathToFileURL } from 'url'
import { THEME_CONFIG } from '@/lib/constants'
import { getErrorMessage, ensureDir } from '@/lib/utils'
import { themeManifestSchema } from '@/lib/validations'
import { 
  ThemeManifest, 
  ThemeInstance, 
  ThemeValidationResult,
  ThemeLoadOptions,
  LoadedTheme,
  ThemeAssets,
  ThemeComponentMap
} from '@/types/theme'

export class ThemeLoader {
  private cache = new Map<string, LoadedTheme>()
  private loadingPromises = new Map<string, Promise<LoadedTheme>>()

  async loadTheme(themeId: string, options: ThemeLoadOptions = {}): Promise<LoadedTheme> {
    const { force = false, skipCache = false } = options

    // Check cache first
    if (!force && !skipCache && this.cache.has(themeId)) {
      const cached = this.cache.get(themeId)!
      cached.lastUsed = new Date()
      return cached
    }

    // Check if already loading
    if (this.loadingPromises.has(themeId)) {
      return this.loadingPromises.get(themeId)!
    }

    // Start loading
    const loadPromise = this._loadThemeInternal(themeId, options)
    this.loadingPromises.set(themeId, loadPromise)

    try {
      const loadedTheme = await loadPromise
      this.cache.set(themeId, loadedTheme)
      return loadedTheme
    } finally {
      this.loadingPromises.delete(themeId)
    }
  }

  private async _loadThemeInternal(
    themeId: string, 
    options: ThemeLoadOptions
  ): Promise<LoadedTheme> {
    try {
      const themePath = path.join(process.cwd(), THEME_CONFIG.INSTALL_DIR, themeId)
      
      // Check if theme directory exists
      try {
        await fs.access(themePath)
      } catch {
        throw new Error(`Theme directory not found: ${themePath}`)
      }

      // Load and validate manifest
      const manifest = await this.loadManifest(themePath, options.validateManifest)
      
      // Load theme assets
      const assets = await this.loadAssets(themePath, manifest)
      
      // Load theme components
      const components = await this.loadComponents(themePath, manifest)
      
      // Load theme instance
      const instance = await this.loadThemeInstance(themePath, manifest)

      const loadedTheme: LoadedTheme = {
        manifest,
        instance,
        assets,
        components,
        customization: manifest.settings?.defaults || {
          colors: {},
          typography: {},
          spacing: {},
          layout: {},
          borderRadius: '0.5rem',
          shadows: {},
          animations: {},
        },
        isLoaded: true,
        isActive: false,
        loadedAt: new Date(),
        lastUsed: new Date(),
      }

      return loadedTheme
    } catch (error) {
      throw new Error(`Failed to load theme ${themeId}: ${getErrorMessage(error)}`)
    }
  }

  async loadManifest(themePath: string, validate = true): Promise<ThemeManifest> {
  const manifestPath = path.join(themePath, THEME_CONFIG.MANIFEST_FILE)
  
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8')
    const manifestData = JSON.parse(manifestContent)
    
    if (validate) {
      const validation = themeManifestSchema.safeParse(manifestData)
      if (!validation.success) {
        throw new Error(`Invalid manifest: ${validation.error.issues.map(i => i.message).join(', ')}`)
      }
      return validation.data as ThemeManifest
    }
    
    return manifestData as ThemeManifest
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in theme manifest')
    }
    throw new Error(`Failed to load manifest: ${getErrorMessage(error)}`)
  }
}

  async loadAssets(themePath: string, manifest: ThemeManifest): Promise<ThemeAssets> {
    const assets: ThemeAssets = {
      images: new Map(),
      fonts: new Map(),
      icons: new Map(),
      styles: new Map(),
      scripts: new Map(),
    }

    if (manifest.assets) {
      // Load images
      if (manifest.assets.images) {
        for (const imagePath of manifest.assets.images) {
          const fullPath = path.join(themePath, imagePath)
          try {
            await fs.access(fullPath)
            const publicPath = `/themes/${manifest.id}/${imagePath}`
            assets.images.set(path.basename(imagePath), publicPath)
          } catch {
            // Asset not found, skip silently
          }
        }
      }

      // Load fonts
      if (manifest.assets.fonts) {
        for (const fontPath of manifest.assets.fonts) {
          const fullPath = path.join(themePath, fontPath)
          try {
            await fs.access(fullPath)
            const publicPath = `/themes/${manifest.id}/${fontPath}`
            assets.fonts.set(path.basename(fontPath), publicPath)
          } catch {
            // Asset not found, skip silently
          }
        }
      }

      // Load icons
      if (manifest.assets.icons) {
        for (const iconPath of manifest.assets.icons) {
          const fullPath = path.join(themePath, iconPath)
          try {
            await fs.access(fullPath)
            const publicPath = `/themes/${manifest.id}/${iconPath}`
            assets.icons.set(path.basename(iconPath), publicPath)
          } catch {
            // Asset not found, skip silently
          }
        }
      }
    }

    // Load styles
    if (manifest.styles) {
      for (const stylePath of manifest.styles) {
        const fullPath = path.join(themePath, stylePath)
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          assets.styles.set(path.basename(stylePath), content)
        } catch {
          // Style not found, skip silently
        }
      }
    }

    // Load scripts
    if (manifest.scripts) {
      for (const scriptPath of manifest.scripts) {
        const fullPath = path.join(themePath, scriptPath)
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          assets.scripts.set(path.basename(scriptPath), content)
        } catch {
          // Script not found, skip silently
        }
      }
    }

    return assets
  }

  async loadComponents(themePath: string, manifest: ThemeManifest): Promise<ThemeComponentMap> {
    const components: ThemeComponentMap = {
      layouts: new Map(),
      pages: new Map(),
      components: new Map(),
    }

    try {
      // Load layouts
      if (manifest.layouts) {
        for (const [layoutName, layoutPath] of Object.entries(manifest.layouts)) {
          try {
            const fullPath = path.join(themePath, layoutPath)
            await fs.access(fullPath)
            
            const component = await this.dynamicImport(fullPath)
            components.layouts.set(layoutName, component.default || component)
          } catch (error) {
            // Component failed to load, skip
          }
        }
      }

      // Load pages
      if (manifest.pages) {
        for (const page of manifest.pages) {
          try {
            const fullPath = path.join(themePath, page.component)
            await fs.access(fullPath)
            
            const component = await this.dynamicImport(fullPath)
            components.pages.set(page.path, component.default || component)
          } catch (error) {
            // Component failed to load, skip
          }
        }
      }

      // Load components
      if (manifest.components) {
        for (const comp of manifest.components) {
          try {
            const fullPath = path.join(themePath, comp.component)
            await fs.access(fullPath)
            
            const component = await this.dynamicImport(fullPath)
            components.components.set(comp.name, component.default || component)
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

  async loadThemeInstance(themePath: string, manifest: ThemeManifest): Promise<any> {
    try {
      const mainPath = path.join(themePath, manifest.main)
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

  async validateTheme(themePath: string): Promise<ThemeValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    let manifest: ThemeManifest | undefined

    try {
      // Check if directory exists
      await fs.access(themePath)
    } catch {
      errors.push('Theme directory not found')
      return { isValid: false, errors, warnings }
    }

    try {
      // Check manifest exists and is valid
      manifest = await this.loadManifest(themePath, true)
    } catch (error) {
      errors.push(`Invalid manifest: ${getErrorMessage(error)}`)
      return { isValid: false, errors, warnings }
    }

    // Validate main entry point
    const mainPath = path.join(themePath, manifest.main)
    try {
      await fs.access(mainPath)
    } catch {
      errors.push(`Main entry point not found: ${manifest.main}`)
    }

    // Validate layouts
    if (manifest.layouts) {
      for (const [layoutName, layoutPath] of Object.entries(manifest.layouts)) {
        const fullPath = path.join(themePath, layoutPath)
        try {
          await fs.access(fullPath)
        } catch {
          warnings.push(`Layout file not found: ${layoutPath} (${layoutName})`)
        }
      }
    }

    // Validate assets
    if (manifest.assets) {
      const allAssets = [
        ...(manifest.assets.images || []),
        ...(manifest.assets.fonts || []),
        ...(manifest.assets.icons || []),
      ]

      for (const assetPath of allAssets) {
        const fullPath = path.join(themePath, assetPath)
        try {
          await fs.access(fullPath)
        } catch {
          warnings.push(`Asset file not found: ${assetPath}`)
        }
      }
    }

    // Validate styles
    if (manifest.styles) {
      for (const stylePath of manifest.styles) {
        const fullPath = path.join(themePath, stylePath)
        try {
          await fs.access(fullPath)
        } catch {
          warnings.push(`Style file not found: ${stylePath}`)
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

  unloadTheme(themeId: string): void {
    this.cache.delete(themeId)
    this.loadingPromises.delete(themeId)
  }

  clearCache(): void {
    this.cache.clear()
    this.loadingPromises.clear()
  }

  getCachedTheme(themeId: string): LoadedTheme | undefined {
    return this.cache.get(themeId)
  }

  getCacheStats() {
    return {
      cached: this.cache.size,
      loading: this.loadingPromises.size,
      themes: Array.from(this.cache.keys()),
    }
  }
}

// Singleton instance
export const themeLoader = new ThemeLoader()