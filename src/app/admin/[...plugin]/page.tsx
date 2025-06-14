// Complete DynamicPluginAdminPage with file system reading via API
// src/app/admin/[...plugin]/page.tsx

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

      // Get plugin data from API (which now reads from file system)
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

      // Method 1: Search through returned plugin data
      for (const plugin of pluginData) {
        if (!plugin.manifest.adminPages) continue;

        console.log(`🔍 Checking plugin: ${plugin.manifest.id}`);
        console.log(`   Admin pages:`, plugin.manifest.adminPages);

        for (const adminPage of plugin.manifest.adminPages) {
          if (adminPage.path === routeString) {
            foundPlugin = plugin;
            foundAdminPage = adminPage;
            console.log(
              `✅ Found matching admin page in plugin: ${plugin.manifest.id}`
            );
            break;
          }
        }

        if (foundPlugin) break;
      }

      // Method 2: Use route resolution API if not found
      if (!foundPlugin) {
        console.log(`🔍 Trying route resolution API for: ${routeString}`);
        const routeResult = await findPluginByRouteAPI(routeString);

        if (routeResult) {
          foundPlugin = routeResult.plugin;
          foundAdminPage = routeResult.adminPage;
          console.log(`✅ Found via route API: ${foundPlugin.manifest?.name}`);
        }
      }

      if (!foundPlugin || !foundAdminPage) {
        throw new Error(`No plugin found for admin page route: ${routeString}`);
      }

      setPluginInfo(foundPlugin);
      setAdminPageInfo(foundAdminPage);

      console.log(
        `✅ Successfully found plugin: ${foundPlugin.manifest?.name}`
      );
      console.log(`✅ Admin page: ${foundAdminPage.title}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Plugin admin page routing error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Updated to use API that reads from file system
  const fetchPluginDataFromAPI = async () => {
    try {
      console.log(
        "📡 Fetching plugin data from API (reads from file system)..."
      );

      const response = await fetch("/api/admin/plugins");

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.plugins) {
        // Filter for active plugins with admin pages
        const activePluginsWithAdminPages = data.data.plugins.filter(
          (plugin: { isActive: any; manifest: { adminPages: any } }) =>
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

  // ✅ New function to resolve routes via API
  const findPluginByRouteAPI = async (routePath: string) => {
    console.log(`🔍 Resolving route via API: ${routePath}`);

    try {
      const response = await fetch(
        `/api/plugins/resolve-route?route=${encodeURIComponent(routePath)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            plugin: data.data.plugin,
            adminPage: data.data.adminPage,
          };
        } else {
          console.log(`❌ Route not found: ${routePath} - ${data.error}`);
        }
      } else {
        console.log(`❌ Route API failed: ${response.status}`);
      }
    } catch (error) {
      console.warn("Route resolution failed:", error);
    }

    return null;
  };

  // Debug helper - run this in browser console
  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      (window as any).debugPluginRoutes = async () => {
        console.log("🔍 Debug: Available plugin admin routes");

        try {
          const plugins = await fetchPluginDataFromAPI();
          const routes: any[] = [];

          for (const plugin of plugins) {
            if (plugin.manifest.adminPages) {
              for (const adminPage of plugin.manifest.adminPages) {
                routes.push({
                  route: adminPage.path,
                  pluginId: plugin.pluginId,
                  pluginName: plugin.manifest.name,
                  pageTitle: adminPage.title,
                  isActive: plugin.isActive,
                });
                console.log(
                  `   ${adminPage.path} → ${plugin.manifest.name} (${adminPage.title})`
                );
              }
            }
          }

          console.log("📊 Total routes found:", routes.length);
          console.log("📋 Routes:", routes);

          return routes;
        } catch (error) {
          console.error("❌ Debug failed:", error);
          return [];
        }
      };

      // Test specific route
      (window as any).testOAuthRoute = async () => {
        console.log("🧪 Testing OAuth route...");
        const result = await findPluginByRouteAPI("/oauth-settings");
        console.log("Result:", result);
        return result;
      };
    }
  }, []);

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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <IconAlertTriangle className="w-12 h-12 mx-auto text-destructive" />
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                  Plugin Admin Page Not Found
                </h2>
                <p className="text-sm text-muted-foreground">
                  {error ||
                    `Admin page "/${pluginPath.join("/")}" could not be found`}
                </p>
              </div>

              <div className="flex items-center space-x-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin")}
                >
                  <IconArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => findPluginAndPage()}
                >
                  Try Again
                </Button>
              </div>

              {/* Available plugins info */}
              {availablePlugins.length > 0 && (
                <div className="text-xs text-muted-foreground p-4 bg-muted rounded max-w-md">
                  <p className="font-medium mb-2">Available plugin routes:</p>
                  {availablePlugins.slice(0, 3).map((plugin) => (
                    <div key={plugin.pluginId} className="mb-1">
                      <strong>{plugin.manifest?.name}:</strong>
                      <ul className="ml-2">
                        {plugin.manifest?.adminPages?.map((page: any) => (
                          <li key={page.path}>
                            <a
                              href={`/admin${page.path}`}
                              className="text-blue-600 hover:underline"
                            >
                              {page.path} → {page.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Debug info in development */}
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted rounded">
                  <p>
                    <strong>Route:</strong> /{pluginPath.join("/")}
                  </p>
                  <p>
                    <strong>Error:</strong> {error}
                  </p>
                  <p>
                    <strong>Available Plugins:</strong>{" "}
                    {availablePlugins.length}
                  </p>
                  <div className="pt-2">
                    <p>
                      <strong>Debug Commands:</strong>
                    </p>
                    <p>Run in console:</p>
                    <code className="block bg-gray-100 p-1 mt-1">
                      window.debugPluginRoutes()
                    </code>
                    <code className="block bg-gray-100 p-1 mt-1">
                      window.testOAuthRoute()
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // ✅ Render plugin admin page
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Plugin page header */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin")}
            >
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{pluginInfo.manifest?.name}</Badge>
              <span className="text-sm text-muted-foreground">
                {adminPageInfo.title}
              </span>
            </div>
          </div>

          {/* ✅ Render plugin admin page component */}
          <PluginAdminPage
            pluginId={pluginInfo.manifest?.id || pluginInfo.pluginId}
            pagePath={adminPageInfo.path}
            adminPageInfo={adminPageInfo}
            pluginInfo={pluginInfo}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
