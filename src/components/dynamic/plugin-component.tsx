// Dynamic Plugin Component Renderer
// src/components/dynamic/plugin-component.tsx

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { pluginRegistry } from "@/lib/plugins/registry";
import { LoadedPlugin } from "@/types/plugin";
import {
  IconLoader,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface PluginComponentProps {
  pluginId: string;
  componentPath: string;
  componentType: "adminPage" | "dashboardWidget" | "component";
  fallback?: React.ComponentType<any>;
  [key: string]: any;
}

export function PluginComponent({
  pluginId,
  componentPath,
  componentType,
  fallback: Fallback,
  ...props
}: PluginComponentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [component, setComponent] = useState<React.ComponentType<any> | null>(
    null
  );
  const [plugin, setPlugin] = useState<LoadedPlugin | null>(null);

  useEffect(() => {
    loadComponent();

    // Listen for plugin state changes
    const handlePluginChange = () => {
      loadComponent();
    };

    window.addEventListener("pluginStateChanged", handlePluginChange);
    return () =>
      window.removeEventListener("pluginStateChanged", handlePluginChange);
  }, [pluginId, componentPath, componentType]);

  const loadComponent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Wait for plugin system to be ready
      await waitForPluginSystem();

      // Get plugin from registry
      const loadedPlugin = pluginRegistry.getPlugin(pluginId);
      if (!loadedPlugin) {
        throw new Error(`Plugin ${pluginId} not found in registry`);
      }

      if (!loadedPlugin.isActive) {
        throw new Error(`Plugin ${pluginId} is not active`);
      }

      setPlugin(loadedPlugin);

      // Get component based on type
      let componentInstance = null;

      switch (componentType) {
        case "adminPage":
          componentInstance =
            loadedPlugin.components?.adminPages?.get(componentPath);
          break;
        case "dashboardWidget":
          componentInstance =
            loadedPlugin.components?.dashboardWidgets?.get(componentPath);
          break;
        case "component":
          componentInstance =
            loadedPlugin.components?.components?.get(componentPath);
          break;
      }

      if (!componentInstance) {
        // Try to dynamically import the component
        componentInstance = await dynamicImportComponent(
          pluginId,
          componentPath
        );
      }

      if (!componentInstance) {
        throw new Error(
          `Component ${componentPath} not found in plugin ${pluginId}`
        );
      }

      setComponent(() => componentInstance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error(
        `Plugin component loading error (${pluginId}/${componentPath}):`,
        err
      );
    } finally {
      setLoading(false);
    }
  };

  const dynamicImportComponent = async (
    pluginId: string,
    componentPath: string
  ) => {
    try {
      // Build the component path
      const fullPath = `/plugins/installed/${pluginId}/${componentPath}`;

      // Try dynamic import (this works if component is bundled)
      const componentModule = await import(fullPath);
      return componentModule.default || componentModule;
    } catch (importError) {
      console.warn(`Dynamic import failed for :`, importError);

      // Try loading from plugin files system
      try {
        const response = await fetch(
          `/api/plugin-routes/${pluginId}/component?path=${encodeURIComponent(componentPath)}`
        );
        if (!response.ok) throw new Error("Component fetch failed");

        const componentCode = await response.text();

        // Create a dynamic component from the code
        // This is a simplified approach - in production you might want more security
        const componentFunction = new Function(
          "React",
          "return " + componentCode
        );
        return componentFunction(React);
      } catch (fetchError) {
        console.warn(`Component fetch failed:`, fetchError);
        return null;
      }
    }
  };

  const waitForPluginSystem = async (timeout = 10000) => {
    const startTime = Date.now();

    return new Promise<void>((resolve, reject) => {
      const checkReady = () => {
        if (pluginRegistry && typeof pluginRegistry.getPlugin === "function") {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Plugin system timeout"));
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <IconLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading plugin component...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {pluginId}/{componentPath}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div>
              <strong>Plugin Component Error</strong>
            </div>
            <div className="text-sm">{error}</div>
            <div className="text-xs text-muted-foreground">
              Plugin: {pluginId} | Component: {componentPath}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadComponent}
              className="mt-2"
            >
              <IconRefresh className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>

        {Fallback && (
          <div className="mt-4 p-4 border border-dashed border-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Fallback component:
            </p>
            <Fallback {...props} />
          </div>
        )}
      </div>
    );
  }

  if (!component) {
    if (Fallback) {
      return <Fallback {...props} />;
    }

    return (
      <div className="p-4 border border-dashed border-muted rounded-lg bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Component "{componentPath}" not found in plugin "{pluginId}"
        </p>
      </div>
    );
  }

  // Render the plugin component
  const ComponentToRender = component;

  return (
    <div
      className="plugin-component-wrapper"
      data-plugin={pluginId}
      data-component={componentPath}
    >
      <ComponentToRender {...props} pluginId={pluginId} plugin={plugin} />
    </div>
  );
}

// Hook for using plugin components
export function usePluginComponent(
  pluginId: string,
  componentPath: string,
  componentType: "adminPage" | "dashboardWidget" | "component"
) {
  const [component, setComponent] = useState<React.ComponentType<any> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        const plugin = pluginRegistry.getPlugin(pluginId);
        if (!plugin || !plugin.isActive) {
          throw new Error(`Plugin ${pluginId} not found or not active`);
        }

        let componentInstance = null;

        switch (componentType) {
          case "adminPage":
            componentInstance =
              plugin.components?.adminPages?.get(componentPath);
            break;
          case "dashboardWidget":
            componentInstance =
              plugin.components?.dashboardWidgets?.get(componentPath);
            break;
          case "component":
            componentInstance =
              plugin.components?.components?.get(componentPath);
            break;
        }

        if (componentInstance) {
          setComponent(() => componentInstance);
        } else {
          throw new Error(`Component ${componentPath} not found`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [pluginId, componentPath, componentType]);

  return { component, loading, error };
}

// Component for rendering plugin admin pages specifically
export function PluginAdminPage({
  pluginId,
  pagePath,
  ...props
}: {
  pluginId: string;
  pagePath: string;
  [key: string]: any;
}) {
  // Get the admin page info from registry
  const [pageInfo, setPageInfo] = useState<any>(null);

  useEffect(() => {
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (plugin && plugin.isActive) {
      const adminPage = plugin.adminPages?.get(pagePath);
      setPageInfo(adminPage);
    }
  }, [pluginId, pagePath]);

  if (!pageInfo) {
    return (
      <div className="p-4">
        <Alert>
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Admin page "{pagePath}" not found in plugin "{pluginId}"
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <PluginComponent
      pluginId={pluginId}
      componentPath={pageInfo.component}
      componentType="adminPage"
      {...props}
    />
  );
}

// Component for rendering plugin dashboard widgets
export function PluginDashboardWidget({
  pluginId,
  widgetId,
  ...props
}: {
  pluginId: string;
  widgetId: string;
  [key: string]: any;
}) {
  const [widgetInfo, setWidgetInfo] = useState<any>(null);

  useEffect(() => {
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (plugin && plugin.isActive) {
      const widget = plugin.dashboardWidgets?.get(widgetId);
      setWidgetInfo(widget);
    }
  }, [pluginId, widgetId]);

  if (!widgetInfo) {
    return (
      <div className="p-4 border border-dashed border-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Widget "{widgetId}" not found in plugin "{pluginId}"
        </p>
      </div>
    );
  }

  return (
    <PluginComponent
      pluginId={pluginId}
      componentPath={widgetInfo.component}
      componentType="dashboardWidget"
      {...props}
    />
  );
}
