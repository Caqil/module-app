// Enhanced Plugin Dependency Manager
// src/lib/plugins/dependency-manager.ts

import { PluginManifest, InstalledPlugin, LoadedPlugin } from '@/types/plugin'
import { InstalledPluginModel } from '@/lib/database/models/plugin'
import { connectToDatabase } from '@/lib/database/mongodb'
import { pluginRegistry } from './registry'

export interface DependencyCheckResult {
  canInstall: boolean
  missingDependencies: string[]
  conflictingPlugins: string[]
  suggestedActions: string[]
  dependencyTree: Map<string, string[]>
}

export interface DependencyResolution {
  installOrder: string[]
  activationOrder: string[]
  warnings: string[]
}

export class PluginDependencyManager {
  private dependencyCache = new Map<string, string[]>()
  private conflictCache = new Map<string, string[]>()

  /**
   * Check if a plugin can be installed based on dependencies
   */
  async checkDependencies(manifest: PluginManifest): Promise<DependencyCheckResult> {
    await connectToDatabase()
    
    const result: DependencyCheckResult = {
      canInstall: true,
      missingDependencies: [],
      conflictingPlugins: [],
      suggestedActions: [],
      dependencyTree: new Map()
    }

    // Check plugin dependencies
    if (manifest.dependencies?.plugins) {
      for (const [pluginId, requiredVersion] of Object.entries(manifest.dependencies.plugins)) {
        const dependency = await this.checkPluginDependency(pluginId, requiredVersion)
        if (!dependency.satisfied) {
          result.canInstall = false
          result.missingDependencies.push(`${pluginId}@${requiredVersion}`)
          result.suggestedActions.push(`Install ${pluginId} version ${requiredVersion} first`)
        }
      }
    }

    // Check for conflicts
    const conflicts = await this.checkConflicts(manifest)
    if (conflicts.length > 0) {
      result.canInstall = false
      result.conflictingPlugins = conflicts
      result.suggestedActions.push(`Resolve conflicts with: ${conflicts.join(', ')}`)
    }

    // Build dependency tree
    result.dependencyTree = await this.buildDependencyTree(manifest.id)

    // Check for circular dependencies
    if (this.hasCircularDependencies(result.dependencyTree, manifest.id)) {
      result.canInstall = false
      result.suggestedActions.push('Circular dependency detected - cannot install')
    }

    return result
  }

  /**
   * Resolve installation order for multiple plugins
   */
  async resolveDependencies(pluginIds: string[]): Promise<DependencyResolution> {
    const resolution: DependencyResolution = {
      installOrder: [],
      activationOrder: [],
      warnings: []
    }

    // Get all plugin manifests
    const manifests = new Map<string, PluginManifest>()
    for (const pluginId of pluginIds) {
      const plugin = await InstalledPluginModel.findByPluginId(pluginId)
      if (plugin) {
        manifests.set(pluginId, plugin.manifest)
      }
    }

    // Build complete dependency graph
    const dependencyGraph = new Map<string, Set<string>>()
    for (const [pluginId, manifest] of manifests) {
      const deps = new Set<string>()
      if (manifest.dependencies?.plugins) {
        Object.keys(manifest.dependencies.plugins).forEach(dep => deps.add(dep))
      }
      dependencyGraph.set(pluginId, deps)
    }

    // Topological sort for installation order
    resolution.installOrder = this.topologicalSort(dependencyGraph)
    resolution.activationOrder = [...resolution.installOrder].reverse()

    // Add warnings for missing dependencies
    for (const [pluginId, deps] of dependencyGraph) {
      for (const dep of deps) {
        if (!manifests.has(dep)) {
          resolution.warnings.push(`${pluginId} depends on ${dep} which is not in the installation set`)
        }
      }
    }

    return resolution
  }

  /**
   * Check individual plugin dependency
   */
  private async checkPluginDependency(
    pluginId: string, 
    requiredVersion: string
  ): Promise<{ satisfied: boolean; installedVersion?: string }> {
    const plugin = await InstalledPluginModel.findByPluginId(pluginId)
    
    if (!plugin) {
      return { satisfied: false }
    }

    if (!plugin.isActive) {
      return { satisfied: false, installedVersion: plugin.version }
    }

    const satisfied = this.isVersionCompatible(plugin.version, requiredVersion)
    return { satisfied, installedVersion: plugin.version }
  }

  /**
   * Check for plugin conflicts
   */
  private async checkConflicts(manifest: PluginManifest): Promise<string[]> {
    const conflicts: string[] = []
    
    // Check compatibility constraints
    if (manifest.compatibility?.plugins) {
      for (const incompatiblePlugin of manifest.compatibility.plugins) {
        const existing = await InstalledPluginModel.findByPluginId(incompatiblePlugin)
        if (existing && existing.isActive) {
          conflicts.push(incompatiblePlugin)
        }
      }
    }

    // Check for resource conflicts (same routes, database collections, etc.)
    const activePlugins = await InstalledPluginModel.findActivePlugins()
    
    for (const activePlugin of activePlugins) {
      // Route conflicts
      if (manifest.routes && activePlugin.routes) {
        const routeConflicts = manifest.routes.some(route =>
          activePlugin.routes.some(existingRoute => existingRoute.path === route.path)
        )
        if (routeConflicts) {
          conflicts.push(activePlugin.pluginId)
        }
      }

      // Database collection conflicts
      if (manifest.database?.collections && activePlugin.database?.collections) {
        const dbConflicts = manifest.database.collections.some(collection =>
          activePlugin.database.collections.some(existing => existing.name === collection.name)
        )
        if (dbConflicts) {
          conflicts.push(activePlugin.pluginId)
        }
      }
    }

    return [...new Set(conflicts)]
  }

  /**
   * Build dependency tree for a plugin
   */
  private async buildDependencyTree(pluginId: string): Promise<Map<string, string[]>> {
    const tree = new Map<string, string[]>()
    const visited = new Set<string>()

    const buildTree = async (id: string): Promise<void> => {
      if (visited.has(id)) return
      visited.add(id)

      const plugin = await InstalledPluginModel.findByPluginId(id)
      if (!plugin) {
        tree.set(id, [])
        return
      }

      const dependencies: string[] = []
      if (plugin.manifest.dependencies?.plugins) {
        dependencies.push(...Object.keys(plugin.manifest.dependencies.plugins))
        
        // Recursively build tree for dependencies
        for (const dep of dependencies) {
          await buildTree(dep)
        }
      }

      tree.set(id, dependencies)
    }

    await buildTree(pluginId)
    return tree
  }

  /**
   * Check for circular dependencies in the tree
   */
  private hasCircularDependencies(tree: Map<string, string[]>, startId: string): boolean {
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

    return hasCycle(startId)
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(graph: Map<string, Set<string>>): string[] {
    const result: string[] = []
    const visited = new Set<string>()
    const temp = new Set<string>()

    const visit = (node: string): void => {
      if (temp.has(node)) {
        throw new Error(`Circular dependency detected involving ${node}`)
      }
      if (visited.has(node)) return

      temp.add(node)
      const dependencies = graph.get(node) || new Set()
      for (const dep of dependencies) {
        visit(dep)
      }
      temp.delete(node)
      visited.add(node)
      result.push(node)
    }

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        visit(node)
      }
    }

    return result
  }

  /**
   * Check if installed version satisfies required version
   */
  private isVersionCompatible(installed: string, required: string): boolean {
    // Simple version comparison - in production, use semver library
    if (required.startsWith('>=')) {
      const requiredVersion = required.substring(2)
      return this.compareVersions(installed, requiredVersion) >= 0
    }
    if (required.startsWith('>')) {
      const requiredVersion = required.substring(1)
      return this.compareVersions(installed, requiredVersion) > 0
    }
    if (required.startsWith('<=')) {
      const requiredVersion = required.substring(2)
      return this.compareVersions(installed, requiredVersion) <= 0
    }
    if (required.startsWith('<')) {
      const requiredVersion = required.substring(1)
      return this.compareVersions(installed, requiredVersion) < 0
    }
    if (required.startsWith('^')) {
      // Compatible version (major version must match)
      const requiredVersion = required.substring(1)
      const installedParts = installed.split('.').map(Number)
      const requiredParts = requiredVersion.split('.').map(Number)
      return installedParts[0] === requiredParts[0] && 
             this.compareVersions(installed, requiredVersion) >= 0
    }
    if (required.startsWith('~')) {
      // Approximately equivalent (major.minor must match)
      const requiredVersion = required.substring(1)
      const installedParts = installed.split('.').map(Number)
      const requiredParts = requiredVersion.split('.').map(Number)
      return installedParts[0] === requiredParts[0] && 
             installedParts[1] === requiredParts[1] &&
             this.compareVersions(installed, requiredVersion) >= 0
    }
    
    // Exact match
    return installed === required
  }

  /**
   * Compare two version strings
   */
  private compareVersions(version1: string, version2: string): number {
    const parts1 = version1.split('.').map(Number)
    const parts2 = version2.split('.').map(Number)
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0
      const part2 = parts2[i] || 0
      
      if (part1 > part2) return 1
      if (part1 < part2) return -1
    }
    
    return 0
  }

  /**
   * Auto-resolve dependencies by suggesting installation order
   */
  async autoResolveDependencies(manifest: PluginManifest): Promise<{
    canAutoResolve: boolean
    missingPlugins: Array<{ id: string; version: string; source?: string }>
    installationPlan: string[]
    warnings: string[]
  }> {
    const result = {
      canAutoResolve: true,
      missingPlugins: [] as Array<{ id: string; version: string; source?: string }>,
      installationPlan: [] as string[],
      warnings: [] as string[]
    }

    if (!manifest.dependencies?.plugins) {
      return result
    }

    // Check each dependency
    for (const [pluginId, requiredVersion] of Object.entries(manifest.dependencies.plugins)) {
      const dependency = await this.checkPluginDependency(pluginId, requiredVersion)
      
      if (!dependency.satisfied) {
        result.missingPlugins.push({
          id: pluginId,
          version: requiredVersion,
          source: manifest.compatibility?.plugins?.includes(pluginId) ? 'marketplace' : undefined
        })
        
        if (!dependency.installedVersion) {
          result.warnings.push(`${pluginId} needs to be installed`)
        } else {
          result.warnings.push(`${pluginId} version ${dependency.installedVersion} is incompatible with required ${requiredVersion}`)
        }
      }
    }

    if (result.missingPlugins.length > 0) {
      result.canAutoResolve = false
    }

    return result
  }
}

// Export singleton instance
export const dependencyManager = new PluginDependencyManager()