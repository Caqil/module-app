// Plugin Dashboard Widget Component
// src/components/dynamic/plugin-dashboard-widgets.tsx

"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  Settings,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { PluginComponent } from "./plugin-component";
import { pluginRegistry } from "@/lib/plugins/registry";
import { LoadedPlugin } from "@/types/plugin";

interface PluginDashboardWidgetsProps {
  className?: string;
  layout?: "grid" | "masonry";
  columns?: number;
  allowResize?: boolean;
  allowReorder?: boolean;
}

interface WidgetInstance {
  id: string;
  pluginId: string;
  widgetId: string;
  title: string;
  size: "small" | "medium" | "large" | "full";
  component: string;
  plugin: LoadedPlugin;
  config?: Record<string, any>;
  isExpanded?: boolean;
  position?: { x: number; y: number; w: number; h: number };
}

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  widgetId: string;
  onError: (error: Error) => void;
}

const PluginDashboardWidgets: React.FC<PluginDashboardWidgetsProps> = ({
  className = "",
  layout = "grid",
  columns = 3,
  allowResize = false,
  allowReorder = false,
}) => {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgetErrors, setWidgetErrors] = useState<Map<string, Error>>(
    new Map()
  );

  // Load dashboard widgets from active plugins
  const loadDashboardWidgets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all active plugins with dashboard widgets
      const activePlugins = pluginRegistry.getActivePlugins();
      const widgetInstances: WidgetInstance[] = [];

      for (const plugin of activePlugins) {
        if (plugin.manifest.dashboardWidgets) {
          for (const widget of plugin.manifest.dashboardWidgets) {
            // Check permissions
            if (widget.permissions && widget.permissions.length > 0) {
              // In a real implementation, check user permissions here
              const hasPermission = true; // Placeholder
              if (!hasPermission) continue;
            }

            const widgetInstance: WidgetInstance = {
              id: `${plugin.manifest.id}-${widget.id}`,
              pluginId: plugin.manifest.id,
              widgetId: widget.id,
              title: widget.title,
              size: widget.size,
              component: widget.component,
              plugin,
              config: widget.defaultConfig || {},
              isExpanded: false,
            };

            widgetInstances.push(widgetInstance);
          }
        }
      }

      setWidgets(widgetInstances);
    } catch (err) {
      console.error("Failed to load dashboard widgets:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard widgets"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle widget error
  const handleWidgetError = (widgetId: string, error: Error) => {
    console.error(`Widget ${widgetId} error:`, error);
    setWidgetErrors((prev) => new Map(prev.set(widgetId, error)));
  };

  // Handle widget refresh
  const handleWidgetRefresh = (widgetId: string) => {
    setWidgetErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(widgetId);
      return newMap;
    });

    // Force re-render of the widget
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId
          ? { ...w, config: { ...w.config, _refreshKey: Date.now() } }
          : w
      )
    );
  };

  // Handle widget resize
  const handleWidgetResize = (
    widgetId: string,
    newSize: "small" | "medium" | "large" | "full"
  ) => {
    if (!allowResize) return;

    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, size: newSize } : w))
    );
  };

  // Handle widget toggle expand
  const handleWidgetToggleExpand = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId ? { ...w, isExpanded: !w.isExpanded } : w
      )
    );
  };

  // Handle widget remove
  const handleWidgetRemove = (widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  };

  // Get grid class for widget size
  const getWidgetGridClass = (size: string, isExpanded?: boolean) => {
    if (isExpanded) return "col-span-full row-span-2";

    switch (size) {
      case "small":
        return "col-span-1";
      case "medium":
        return "col-span-2";
      case "large":
        return "col-span-2 row-span-2";
      case "full":
        return "col-span-full";
      default:
        return "col-span-1";
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardWidgets();

    // Listen for plugin state changes
    const handlePluginStateChange = () => {
      loadDashboardWidgets();
    };

    window.addEventListener("pluginStateChanged", handlePluginStateChange);

    return () => {
      window.removeEventListener("pluginStateChanged", handlePluginStateChange);
    };
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Dashboard Widgets</h2>
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>

        <div className={`grid grid-cols-${columns} gap-6`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-4">
                <div className="h-5 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-24 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Dashboard Widgets</h2>
          <Button onClick={loadDashboardWidgets} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Dashboard Widgets</h2>
          <Button onClick={loadDashboardWidgets} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No Dashboard Widgets
              </h3>
              <p className="text-muted-foreground">
                Install plugins with dashboard widgets to customize your
                dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard Widgets</h2>
        <Button onClick={loadDashboardWidgets} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className={`grid grid-cols-${columns} gap-6 auto-rows-min`}>
        {widgets.map((widget) => (
          <Card
            key={widget.id}
            className={`${getWidgetGridClass(widget.size, widget.isExpanded)} transition-all duration-200`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {widget.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {widget.plugin.manifest.name}
                    </Badge>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {widget.size}
                    </Badge>
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1">
                  {allowResize && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleWidgetToggleExpand(widget.id)}
                      title={widget.isExpanded ? "Minimize" : "Maximize"}
                    >
                      {widget.isExpanded ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleWidgetRefresh(widget.id)}
                    title="Refresh widget"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleWidgetRemove(widget.id)}
                    title="Remove widget"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <WidgetErrorBoundary
                widgetId={widget.id}
                onError={(error) => handleWidgetError(widget.id, error)}
              >
                {widgetErrors.has(widget.id) ? (
                  <WidgetErrorDisplay
                    error={widgetErrors.get(widget.id)!}
                    onRetry={() => handleWidgetRefresh(widget.id)}
                  />
                ) : (
                  <Suspense fallback={<WidgetLoadingFallback />}>
                    <PluginComponent
                      pluginId={widget.pluginId}
                      componentPath={widget.component}
                      componentType="dashboardWidget"
                      config={widget.config}
                      widgetId={widget.widgetId}
                      size={widget.size}
                      isExpanded={widget.isExpanded}
                      onConfigChange={(newConfig) => {
                        setWidgets((prev) =>
                          prev.map((w) =>
                            w.id === widget.id
                              ? { ...w, config: { ...w.config, ...newConfig } }
                              : w
                          )
                        );
                      }}
                      fallback={() => (
                        <WidgetErrorDisplay
                          error={new Error("Widget component not found")}
                          onRetry={() => handleWidgetRefresh(widget.id)}
                        />
                      )}
                    />
                  </Suspense>
                )}
              </WidgetErrorBoundary>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Widget Error Boundary Component
class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Widget ${this.props.widgetId} crashed:`, error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <WidgetErrorDisplay
          error={this.state.error || new Error("Unknown error")}
          onRetry={() => {
            this.setState({ hasError: false, error: undefined });
          }}
        />
      );
    }

    return this.props.children;
  }
}

// Widget Error Display Component
const WidgetErrorDisplay: React.FC<{
  error: Error;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div className="text-center py-8">
    <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-4" />
    <h4 className="font-medium text-destructive mb-2">Widget Error</h4>
    <p className="text-sm text-muted-foreground mb-4">
      {error.message || "An unexpected error occurred"}
    </p>
    <Button onClick={onRetry} variant="outline" size="sm">
      <RefreshCw className="w-4 h-4 mr-2" />
      Retry
    </Button>
  </div>
);

// Widget Loading Fallback Component
const WidgetLoadingFallback: React.FC = () => (
  <div className="text-center py-8">
    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
    <p className="text-sm text-muted-foreground">Loading widget...</p>
  </div>
);

export default PluginDashboardWidgets;

// Example Analytics Widget Component (for reference)
export const AnalyticsOverviewWidget: React.FC<{
  config?: Record<string, any>;
  widgetId?: string;
  size?: string;
  isExpanded?: boolean;
  onConfigChange?: (config: Record<string, any>) => void;
}> = ({ config = {}, size = "medium", isExpanded = false }) => {
  const [data, setData] = useState({
    pageViews: 12345,
    uniqueUsers: 1234,
    sessions: 5678,
    avgSessionDuration: 180,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <WidgetLoadingFallback />;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (size === "small" && !isExpanded) {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold">{formatNumber(data.pageViews)}</div>
        <div className="text-sm text-muted-foreground">Page Views</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">
            {formatNumber(data.pageViews)}
          </div>
          <div className="text-sm text-muted-foreground">Page Views</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {formatNumber(data.uniqueUsers)}
          </div>
          <div className="text-sm text-muted-foreground">Users</div>
        </div>
      </div>

      {(size === "large" || isExpanded) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold">
              {formatNumber(data.sessions)}
            </div>
            <div className="text-sm text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">
              {formatDuration(data.avgSessionDuration)}
            </div>
            <div className="text-sm text-muted-foreground">Avg. Duration</div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="pt-4 border-t">
          <div className="h-32 bg-muted rounded flex items-center justify-center">
            <span className="text-muted-foreground">Chart placeholder</span>
          </div>
        </div>
      )}
    </div>
  );
};
