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
import { pluginRegistry } from "@/lib/plugins/registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart2Icon } from "lucide-react";

// Main navigation items
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/admin",
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

  // Load plugin admin pages
  React.useEffect(() => {
    loadPluginAdminPages();

    // Listen for plugin state changes
    const handlePluginStateChange = () => {
      console.log("🔄 Plugin state changed, refreshing sidebar...");
      loadPluginAdminPages();
    };

    window.addEventListener("pluginStateChanged", handlePluginStateChange);
    return () =>
      window.removeEventListener("pluginStateChanged", handlePluginStateChange);
  }, []);

  const loadPluginAdminPages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Wait for plugin registry to be ready
      await waitForPluginRegistry();

      // Get all active plugins with admin pages
      const activePlugins = pluginRegistry.getActivePlugins();
      const adminPages: Array<{
        title: string;
        url: string;
        icon: any;
        pluginId: string;
        pluginName: string;
        description?: string;
      }> = [];

      for (const plugin of activePlugins) {
        if (!plugin.adminPages || plugin.adminPages.size === 0) continue;

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

      console.log(
        `📋 Loaded ${adminPages.length} plugin admin pages:`,
        adminPages.map((p) => p.url)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to load plugin admin pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const waitForPluginRegistry = async (timeout = 10000) => {
    const startTime = Date.now();

    return new Promise<void>((resolve, reject) => {
      const checkReady = () => {
        if (
          pluginRegistry &&
          typeof pluginRegistry.getActivePlugins === "function"
        ) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Plugin registry timeout"));
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
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
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Plugins</span>
            {loading && <IconLoader className="w-3 h-3 animate-spin" />}
            {error && (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadPluginAdminPages}
                className="h-auto p-0 text-xs"
              >
                <IconRefresh className="w-3 h-3" />
              </Button>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading && (
                <SidebarMenuItem>
                  <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                    <IconLoader className="w-4 h-4 animate-spin" />
                    <span>Loading plugins...</span>
                  </div>
                </SidebarMenuItem>
              )}

              {error && (
                <SidebarMenuItem>
                  <div className="px-2 py-1">
                    <div className="text-xs text-red-500 mb-1">
                      Plugin load error
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPluginAdminPages}
                      className="h-6 text-xs"
                    >
                      <IconRefresh className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </SidebarMenuItem>
              )}

              {!loading && !error && pluginAdminPages.length === 0 && (
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No plugin admin pages
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
                        {/* Show plugin badge on hover */}
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

        {/* Help */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Help & Documentation">
                  <a href="/admin/help">
                    <IconHelpCircle />
                    <span>Help</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Plugin Debug Info (in development) */}
        {process.env.NODE_ENV === "development" && (
          <SidebarGroup>
            <SidebarGroupLabel>Debug</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-xs text-muted-foreground space-y-1">
                    <div>
                      Active Plugins:{" "}
                      {pluginAdminPages.length > 0
                        ? [...new Set(pluginAdminPages.map((p) => p.pluginId))]
                            .length
                        : 0}
                    </div>
                    <div>Admin Pages: {pluginAdminPages.length}</div>
                    {error && (
                      <div className="text-red-500">Error: {error}</div>
                    )}
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
