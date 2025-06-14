// Dynamic Plugin Admin Route
// src/app/admin/[...plugin]/page.tsx

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { PluginAdminPage } from "@/components/dynamic/plugin-component";
import { pluginRegistry } from "@/lib/plugins/registry";
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

      // Wait for plugin registry to be ready
      await waitForPluginRegistry();

      // Get all active plugins
      const activePlugins = pluginRegistry.getActivePlugins();

      if (activePlugins.length === 0) {
        throw new Error("No active plugins found");
      }

      // Find the plugin and admin page that matches the route
      let foundPlugin = null;
      let foundAdminPage = null;

      // Check each active plugin for matching admin pages
      for (const plugin of activePlugins) {
        if (!plugin.adminPages) continue;

        for (const [pagePath, pageInfo] of plugin.adminPages) {
          // Check if the route matches this admin page
          // Routes can be: /oauth-settings, /plugin-name/page-name, etc.
          const routeString = `/${pluginPath.join("/")}`;

          if (
            pagePath === routeString ||
            pagePath === `/${pluginPath[0]}` ||
            (pluginPath.length === 1 && pagePath.endsWith(pluginPath[0]))
          ) {
            foundPlugin = plugin;
            foundAdminPage = pageInfo;
            break;
          }
        }

        if (foundPlugin) break;
      }

      if (!foundPlugin || !foundAdminPage) {
        // Try to find by plugin ID if direct match fails
        const possiblePluginId = pluginPath[0];
        const possiblePagePath = pluginPath.slice(1).join("/") || "index";

        foundPlugin = activePlugins.find(
          (p) =>
            p.manifest.id === possiblePluginId ||
            p.manifest.id.includes(possiblePluginId) ||
            possiblePluginId.includes(p.manifest.id.split("-")[0])
        );

        if (foundPlugin && foundPlugin.adminPages) {
          // Look for the specific page or default page
          for (const [pagePath, pageInfo] of foundPlugin.adminPages) {
            if (
              pagePath.includes(possiblePagePath) ||
              pagePath.includes(pluginPath[0])
            ) {
              foundAdminPage = pageInfo;
              break;
            }
          }

          // If no specific page found, use the first admin page
          if (!foundAdminPage && foundPlugin.adminPages.size > 0) {
            foundAdminPage = Array.from(foundPlugin.adminPages.values())[0];
          }
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

      setPluginInfo(foundPlugin);
      setAdminPageInfo(foundAdminPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Plugin admin page routing error:", err);
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
                  {pluginRegistry
                    .getActivePlugins()
                    .filter((p) => p.adminPages && p.adminPages.size > 0)
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
                          {Array.from(plugin.adminPages!.entries()).map(
                            ([pagePath, pageInfo]) => (
                              <div key={pagePath} className="text-sm">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-left"
                                  onClick={() =>
                                    router.push(`/admin${pagePath}`)
                                  }
                                >
                                  {pageInfo.title} ({pagePath})
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
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
              pagePath={
                Object.keys(Object.fromEntries(pluginInfo.adminPages)).find(
                  (path) =>
                    Array.from(pluginInfo.adminPages.values()).includes(
                      adminPageInfo
                    )
                ) || "/"
              }
              pageInfo={adminPageInfo}
              plugin={pluginInfo}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
