// Enhanced sidebar fix with better state management
// Replace: src/components/admin/admin-sidebar.tsx
// This version handles cross-page persistence better

"use client";
import * as React from "react";
import {
  IconHome,
  IconUsers,
  IconPuzzle,
  IconPalette,
  IconSettings,
  IconShield,
  IconKey,
  IconCloud,
  IconBell,
  IconMail,
  IconDatabase,
  IconFileText,
  IconHelpCircle,
  IconLoader,
  IconRefresh,
  IconExternalLink,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart2Icon } from "lucide-react";

// Enhanced plugin fetcher with better state management
class EnhancedPluginFetcher {
  private cache = new Map<string, any>();
  private isLoaded = false;
  private loading = false;
  private lastFetch = 0;
  private cacheDuration = 30000; // 30 seconds cache
  private listeners = new Set<() => void>();

  // Add event listeners for state changes
  addListener(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Plugin fetcher listener error:", error);
      }
    });
  }

  async getPluginData(forceRefresh = false) {
    const now = Date.now();

    // Use cache if recent and not forcing refresh
    if (
      !forceRefresh &&
      this.isLoaded &&
      this.cache.size > 0 &&
      now - this.lastFetch < this.cacheDuration
    ) {
      console.log("📋 Using cached plugin data");
      return Array.from(this.cache.values());
    }

    // If already loading, wait for it
    if (this.loading) {
      console.log("⏳ Already loading, waiting...");
      while (this.loading && Date.now() - now < 10000) {
        // 10 second timeout
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return Array.from(this.cache.values());
    }

    return await this.fetchFromAPI();
  }

  private async fetchFromAPI() {
    this.loading = true;
    const startTime = Date.now();

    try {
      console.log("📡 Fetching plugin data from API...");

      const response = await fetch("/api/admin/plugins", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.success && data.data?.plugins) {
        this.cache.clear();

        // Process active plugins
        let processedCount = 0;
        for (const plugin of data.data.plugins) {
          if (
            plugin.isActive &&
            plugin.manifest &&
            plugin.manifest.adminPages
          ) {
            this.cache.set(plugin.pluginId, {
              manifest: plugin.manifest,
              isActive: true,
              adminPages: this.buildAdminPagesMap(plugin.manifest.adminPages),
            });
            processedCount++;
          }
        }

        this.isLoaded = true;
        this.lastFetch = Date.now();

        const fetchTime = Date.now() - startTime;
        console.log(
          `✅ Loaded ${processedCount} active plugins with admin pages in ${fetchTime}ms`
        );

        // Notify listeners
        this.notifyListeners();

        return Array.from(this.cache.values());
      } else {
        throw new Error(data.error || "Invalid API response");
      }
    } catch (error) {
      console.error("❌ Failed to fetch plugin data:", error);

      // If we have cached data, return it
      if (this.cache.size > 0) {
        console.log("📋 Returning stale cached data due to fetch error");
        return Array.from(this.cache.values());
      }

      throw error;
    } finally {
      this.loading = false;
    }
  }

  private buildAdminPagesMap(adminPages: any[]) {
    const map = new Map();
    if (adminPages) {
      for (const page of adminPages) {
        map.set(page.path, page);
      }
    }
    return map;
  }

  async refresh() {
    console.log("🔄 Force refreshing plugin data...");
    this.isLoaded = false;
    this.cache.clear();
    this.lastFetch = 0;
    return await this.getPluginData(true);
  }

  isLoading() {
    return this.loading;
  }

  getCacheInfo() {
    return {
      isLoaded: this.isLoaded,
      cacheSize: this.cache.size,
      lastFetch: new Date(this.lastFetch).toLocaleTimeString(),
      isStale: Date.now() - this.lastFetch > this.cacheDuration,
    };
  }
}

// Create enhanced global instance
const enhancedPluginFetcher = new EnhancedPluginFetcher();

// Make it globally available
if (typeof window !== "undefined") {
  (window as any).pluginFetcher = enhancedPluginFetcher;
  (window as any).enhancedPluginFetcher = enhancedPluginFetcher;
}

// Main navigation items
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: IconHome,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: IconUsers,
  },
  {
    title: "Plugins",
    url: "/admin/plugins",
    icon: IconPuzzle,
  },
  {
    title: "Themes",
    url: "/admin/themes",
    icon: IconPalette,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: IconSettings,
  },
];

// System navigation items
const systemNavItems = [
  {
    title: "API Keys",
    url: "/admin/api-keys",
    icon: IconKey,
  },
  {
    title: "Email Templates",
    url: "/admin/email-templates",
    icon: IconMail,
  },
  {
    title: "Notifications",
    url: "/admin/notifications",
    icon: IconBell,
  },
  {
    title: "Logs",
    url: "/admin/logs",
    icon: IconFileText,
  },
];

// Icon mapping for plugin admin pages
const getPluginIcon = (iconName?: string) => {
  const iconMap: Record<string, any> = {
    Shield: IconShield,
    BarChart2Icon: BarChart2Icon,
    Database: IconDatabase,
    Key: IconKey,
    Settings: IconSettings,
    Mail: IconMail,
    Bell: IconBell,
    Users: IconUsers,
    FileText: IconFileText,
    Cloud: IconCloud,
    Puzzle: IconPuzzle,
    Palette: IconPalette,
  };

  return iconMap[iconName || ""] || IconSettings;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [pluginAdminPages, setPluginAdminPages] = React.useState<
    Array<{
      title: string;
      url: string;
      icon: any;
      pluginId: string;
      pluginName: string;
      description?: string;
    }>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = React.useState<string>("");

  // Load plugin admin pages on mount and when page changes
  React.useEffect(() => {
    console.log(`🏃‍♂️ Sidebar mounting on ${window.location.pathname}`);
    loadPluginAdminPages();

    // Listen for plugin state changes
    const handlePluginStateChange = () => {
      console.log("🔄 Plugin state changed, refreshing sidebar...");
      loadPluginAdminPages();
    };

    // Listen for page navigation (if using client-side routing)
    const handlePopState = () => {
      console.log(`🧭 Navigation detected to ${window.location.pathname}`);
      // Small delay to ensure page is ready
      setTimeout(loadPluginAdminPages, 100);
    };

    // Set up event listeners
    window.addEventListener("pluginStateChanged", handlePluginStateChange);
    window.addEventListener("popstate", handlePopState);

    // Listen to fetcher state changes
    const unsubscribe = enhancedPluginFetcher.addListener(() => {
      console.log("🔔 Plugin fetcher state changed");
      loadPluginAdminPages();
    });

    return () => {
      window.removeEventListener("pluginStateChanged", handlePluginStateChange);
      window.removeEventListener("popstate", handlePopState);
      unsubscribe();
    };
  }, []);

  // Also trigger on route changes (for Next.js navigation)
  React.useEffect(() => {
    console.log(`📍 Page changed to: ${window.location.pathname}`);
    // Small delay to ensure the page has rendered
    const timer = setTimeout(loadPluginAdminPages, 200);
    return () => clearTimeout(timer);
  }, [window.location.pathname]);

  const loadPluginAdminPages = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`📡 Loading plugins for ${window.location.pathname}...`);

      // Get plugin data from enhanced fetcher
      const activePlugins = await enhancedPluginFetcher.getPluginData();
      const adminPages: Array<{
        title: string;
        url: string;
        icon: any;
        pluginId: string;
        pluginName: string;
        description?: string;
      }> = [];

      console.log(`🔍 Processing ${activePlugins.length} active plugins`);

      for (const plugin of activePlugins) {
        if (!plugin.adminPages || plugin.adminPages.size === 0) {
          console.log(`⚠️ Plugin ${plugin.manifest.id} has no admin pages`);
          continue;
        }

        console.log(
          `✅ Plugin ${plugin.manifest.id} has ${plugin.adminPages.size} admin pages`
        );

        for (const [pagePath, pageInfo] of plugin.adminPages) {
          adminPages.push({
            title: pageInfo.title,
            url: `/admin${pagePath}`,
            icon: getPluginIcon(pageInfo.icon),
            pluginId: plugin.manifest.id,
            pluginName: plugin.manifest.name,
            description: plugin.manifest.description,
          });
        }
      }

      // Sort by plugin name, then by title
      adminPages.sort((a, b) => {
        if (a.pluginName !== b.pluginName) {
          return a.pluginName.localeCompare(b.pluginName);
        }
        return a.title.localeCompare(b.title);
      });

      setPluginAdminPages(adminPages);
      setLastLoadTime(new Date().toLocaleTimeString());

      console.log(
        `📋 Successfully loaded ${adminPages.length} plugin admin pages at ${new Date().toLocaleTimeString()}`
      );

      // Log each page for debugging
      adminPages.forEach((page) => {
        console.log(`   - ${page.title} → ${page.url}`);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Failed to load plugin admin pages:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Plugin Navigation - Dynamic */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Plugins
            {lastLoadTime && (
              <span className="text-xs text-muted-foreground ml-2">
                {lastLoadTime}
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading && (
                <SidebarMenuItem>
                  <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                    <IconLoader className="w-4 h-4 animate-spin" />
                    Loading plugins...
                  </div>
                </SidebarMenuItem>
              )}

              {error && (
                <SidebarMenuItem>
                  <div className="px-2 py-1">
                    <div className="text-sm text-red-600 mb-1">
                      Plugin load error
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadPluginAdminPages}
                      className="h-6 px-2 text-xs"
                    >
                      <IconRefresh className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </SidebarMenuItem>
              )}

              {!loading && !error && pluginAdminPages.length === 0 && (
                <SidebarMenuItem>
                  <div className="px-2 py-1">
                    <div className="text-sm text-muted-foreground mb-1">
                      No plugin admin pages
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadPluginAdminPages()}
                      className="h-6 px-2 text-xs"
                    >
                      <IconRefresh className="w-3 h-3 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </SidebarMenuItem>
              )}

              {!loading &&
                !error &&
                pluginAdminPages.map((page) => (
                  <SidebarMenuItem key={`${page.pluginId}-${page.url}`}>
                    <SidebarMenuButton
                      asChild
                      tooltip={page.description || page.title}
                    >
                      <a href={page.url} className="flex items-center gap-2">
                        <page.icon className="w-4 h-4" />
                        <span className="flex-1">{page.title}</span>
                        <IconExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
