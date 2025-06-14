// Update: src/app/admin/[...plugin]/page.tsx
// Fix to use API calls instead of direct registry access

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { PluginAdminPage } from "@/components/dynamic/plugin-component";
import {
  IconAlertTriangle,
  IconLoader,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DynamicPluginAdminPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [pluginInfo, setPluginInfo] = React.useState<any>(null);
  const [adminPageInfo, setAdminPageInfo] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [availablePlugins, setAvailablePlugins] = React.useState<any[]>([]);

  // Parse the route params
  // Route structure: /admin/oauth-settings or /admin/plugin-name/page-name
  const pluginPath = Array.isArray(params.plugin)
    ? params.plugin
    : [params.plugin];

  React.useEffect(() => {
    findPluginAndPage();
  }, [pluginPath]);

  const findPluginAndPage = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Looking for plugin admin page: /${pluginPath.join("/")}`);

      // FIXED: Get plugin data from API instead of direct registry access
      const pluginData = await fetchPluginDataFromAPI();

      if (pluginData.length === 0) {
        throw new Error("No active plugins found");
      }

      setAvailablePlugins(pluginData);

      // Find the plugin and admin page that matches the route
      let foundPlugin = null;
      let foundAdminPage = null;

      const routeString = `/${pluginPath.join("/")}`;
      console.log(`🔎 Searching for route: ${routeString}`);

      // Check each active plugin for matching admin pages
      for (const plugin of pluginData) {
        if (!plugin.manifest.adminPages) continue;

        console.log(`🔍 Checking plugin: ${plugin.manifest.id}`);
        console.log(`   Admin pages:`, plugin.manifest.adminPages);

        for (const adminPage of plugin.manifest.adminPages) {
          const pagePath = adminPage.path;

          console.log(
            `   🔎 Checking page path: ${pagePath} vs ${routeString}`
          );

          // Check if the route matches this admin page
          if (
            pagePath === routeString ||
            pagePath === `/${pluginPath[0]}` ||
            (pluginPath.length === 1 && pagePath.endsWith(pluginPath[0]))
          ) {
            foundPlugin = plugin;
            foundAdminPage = adminPage;
            console.log(`✅ Found match: ${plugin.manifest.id} -> ${pagePath}`);
            break;
          }
        }

        if (foundPlugin) break;
      }

      // If no exact match, try fuzzy matching
      if (!foundPlugin) {
        console.log(`🔍 No exact match, trying fuzzy matching...`);

        const possiblePluginId = pluginPath[0];
        console.log(`   Possible plugin ID: ${possiblePluginId}`);

        foundPlugin = pluginData.find(
          (p) =>
            p.manifest.id === possiblePluginId ||
            p.manifest.id.includes(possiblePluginId) ||
            possiblePluginId.includes(p.manifest.id.split("-")[0])
        );

        if (foundPlugin && foundPlugin.manifest.adminPages) {
          console.log(
            `✅ Found plugin via fuzzy match: ${foundPlugin.manifest.id}`
          );

          // Use the first admin page or find matching page
          foundAdminPage = foundPlugin.manifest.adminPages[0];
          console.log(`   Using admin page: ${foundAdminPage.title}`);
        }
      }

      if (!foundPlugin) {
        throw new Error(`No plugin found for route: /${pluginPath.join("/")}`);
      }

      if (!foundAdminPage) {
        throw new Error(
          `No admin page found in plugin ${foundPlugin.manifest.id} for route: /${pluginPath.join("/")}`
        );
      }

      console.log(`🎉 Successfully found plugin admin page:`);
      console.log(`   Plugin: ${foundPlugin.manifest.name}`);
      console.log(`   Page: ${foundAdminPage.title}`);

      setPluginInfo(foundPlugin);
      setAdminPageInfo(foundAdminPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Plugin admin page routing error:", err);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Fetch plugin data from API instead of using registry
  const fetchPluginDataFromAPI = async () => {
    try {
      console.log("📡 Fetching plugin data from API...");

      const response = await fetch("/api/admin/plugins");

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.plugins) {
        // Filter for active plugins with admin pages
        const activePluginsWithAdminPages = data.data.plugins.filter(
          (plugin) =>
            plugin.isActive && plugin.manifest && plugin.manifest.adminPages
        );

        console.log(
          `✅ Found ${activePluginsWithAdminPages.length} active plugins with admin pages`
        );

        return activePluginsWithAdminPages;
      } else {
        throw new Error(data.error || "Invalid API response");
      }
    } catch (error) {
      console.error("❌ Failed to fetch plugin data:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AdminHeader />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <IconLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading plugin admin page...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                /{pluginPath.join("/")}
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !pluginInfo || !adminPageInfo) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AdminHeader />
          <div className="p-6">
            <div className="max-w-2xl">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4"
              >
                <IconArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              <Alert variant="destructive">
                <IconAlertTriangle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div>
                    <strong>Plugin Admin Page Not Found</strong>
                  </div>
                  <div className="text-sm">
                    {error ||
                      `No admin page found for route: /${pluginPath.join("/")}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Available routes are listed in the admin sidebar under
                    "Plugins" section.
                  </div>
                </AlertDescription>
              </Alert>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">
                  Available Plugin Admin Pages
                </h3>
                <div className="space-y-2">
                  {availablePlugins
                    .filter(
                      (p) =>
                        p.manifest.adminPages &&
                        p.manifest.adminPages.length > 0
                    )
                    .map((plugin) => (
                      <div
                        key={plugin.manifest.id}
                        className="border rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {plugin.manifest.name}
                          </span>
                          <Badge variant="outline">{plugin.manifest.id}</Badge>
                        </div>
                        <div className="space-y-1">
                          {plugin.manifest.adminPages.map((adminPage: any) => (
                            <div key={adminPage.path} className="text-sm">
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-left"
                                onClick={() =>
                                  router.push(`/admin${adminPage.path}`)
                                }
                              >
                                {adminPage.title} ({adminPage.path})
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Debug Information</h3>
                <div className="text-sm bg-muted p-3 rounded-lg">
                  <div>Requested route: /{pluginPath.join("/")}</div>
                  <div>Active plugins: {availablePlugins.length}</div>
                  <div>
                    Plugins with admin pages:{" "}
                    {
                      availablePlugins.filter(
                        (p) => p.manifest.adminPages?.length > 0
                      ).length
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-col">
          {/* Plugin Info Header */}
          <div className="border-b bg-muted/40 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/admin/plugins")}
                >
                  <IconArrowLeft className="w-4 h-4 mr-1" />
                  Plugins
                </Button>
                <div className="h-4 w-px bg-border"></div>
                <div>
                  <h1 className="text-lg font-semibold">
                    {adminPageInfo.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {pluginInfo.manifest.name} v{pluginInfo.manifest.version}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{pluginInfo.manifest.category}</Badge>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>

          {/* Plugin Admin Page Content */}
          <div className="flex-1">
            <PluginAdminPage
              pluginId={pluginInfo.manifest.id}
              pagePath={adminPageInfo.path}
              pageInfo={adminPageInfo}
              plugin={pluginInfo}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
