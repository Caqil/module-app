// Plugin System Status Component
// src/components/admin/plugin-system-status.tsx

"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Activity,
  Zap,
  Database,
  Shield,
  Package,
  Settings,
  Info,
  TrendingUp,
  Users,
  Globe,
} from "lucide-react";

interface PluginSystemStatusProps {
  className?: string;
}

interface SystemStatus {
  isInitialized: boolean;
  isInitializing: boolean;
  stats: {
    totalPlugins: number;
    activePlugins: number;
    totalRoutes: number;
    totalHooks: number;
    totalAdminPages: number;
    totalDashboardWidgets: number;
  };
  health: {
    healthy: boolean;
    issues: string[];
    lastCheck: Date;
  };
  performance: {
    avgLoadTime: number;
    totalMemoryUsage: number;
    totalApiCalls: number;
    errorRate: number;
  };
  plugins: Array<{
    id: string;
    name: string;
    version: string;
    status: string;
    isActive: boolean;
    loadTime: number;
    memoryUsage: number;
    errorCount: number;
    lastUsed: Date | null;
  }>;
}

const PluginSystemStatus: React.FC<PluginSystemStatusProps> = ({
  className = "",
}) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load system status
  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would call the plugin system API
      // For now, we'll simulate the data
      const mockStatus: SystemStatus = {
        isInitialized: true,
        isInitializing: false,
        stats: {
          totalPlugins: 4,
          activePlugins: 2,
          totalRoutes: 8,
          totalHooks: 12,
          totalAdminPages: 6,
          totalDashboardWidgets: 4,
        },
        health: {
          healthy: true,
          issues: [],
          lastCheck: new Date(),
        },
        performance: {
          avgLoadTime: 125,
          totalMemoryUsage: 45.2,
          totalApiCalls: 1247,
          errorRate: 0.02,
        },
        plugins: [
          {
            id: "analytics-pro",
            name: "Analytics Pro",
            version: "1.0.0",
            status: "installed",
            isActive: true,
            loadTime: 89,
            memoryUsage: 12.4,
            errorCount: 0,
            lastUsed: new Date(Date.now() - 3600000),
          },
          {
            id: "seo-optimizer",
            name: "SEO Optimizer",
            version: "2.1.0",
            status: "installed",
            isActive: true,
            loadTime: 156,
            memoryUsage: 8.7,
            errorCount: 0,
            lastUsed: new Date(Date.now() - 7200000),
          },
          {
            id: "backup-pro",
            name: "Backup Pro",
            version: "1.2.1",
            status: "installed",
            isActive: false,
            loadTime: 0,
            memoryUsage: 0,
            errorCount: 0,
            lastUsed: null,
          },
          {
            id: "social-media-pro",
            name: "Social Media Pro",
            version: "1.0.5",
            status: "failed",
            isActive: false,
            loadTime: 0,
            memoryUsage: 0,
            errorCount: 3,
            lastUsed: null,
          },
        ],
      };

      setStatus(mockStatus);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to load system status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load system status"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle system restart
  const handleSystemRestart = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would restart the plugin system
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await loadSystemStatus();
    } catch (err) {
      setError("Failed to restart plugin system");
    } finally {
      setLoading(false);
    }
  };

  // Handle health check
  const handleHealthCheck = async () => {
    try {
      setLoading(true);
      // Simulate health check
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await loadSystemStatus();
    } catch (err) {
      setError("Health check failed");
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (
    isHealthy: boolean,
    isInitialized: boolean,
    isInitializing: boolean
  ) => {
    if (isInitializing) {
      return (
        <Badge variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1 animate-spin" />
          Initializing
        </Badge>
      );
    } else if (!isInitialized) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Not Initialized
        </Badge>
      );
    } else if (isHealthy) {
      return (
        <Badge variant="default" className="text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Healthy
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Issues Detected
        </Badge>
      );
    }
  };

  // Get performance badge
  const getPerformanceBadge = (errorRate: number) => {
    if (errorRate < 0.01) {
      return (
        <Badge variant="default" className="text-xs">
          Excellent
        </Badge>
      );
    } else if (errorRate < 0.05) {
      return (
        <Badge variant="secondary" className="text-xs">
          Good
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs">
          Poor
        </Badge>
      );
    }
  };

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format memory
  const formatMemory = (mb: number): string => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Format percentage
  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  // Initial load
  useEffect(() => {
    loadSystemStatus();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadSystemStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Plugin System Status</h2>
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
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
          <h2 className="text-xl font-semibold">Plugin System Status</h2>
          <Button onClick={loadSystemStatus} variant="outline" size="sm">
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

  if (!status) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Plugin System Status</h2>
          <p className="text-muted-foreground">
            Monitor plugin system health and performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(
            status.health.healthy,
            status.isInitialized,
            status.isInitializing
          )}

          <Button
            onClick={handleHealthCheck}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <Activity
              className={`w-4 h-4 mr-2 ${loading ? "animate-pulse" : ""}`}
            />
            Health Check
          </Button>

          <Button
            onClick={loadSystemStatus}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Issues */}
      {status.health.issues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">System Issues Detected:</div>
            <ul className="list-disc list-inside space-y-1">
              {status.health.issues.map((issue, index) => (
                <li key={index} className="text-sm">
                  {issue}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plugins</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.stats.totalPlugins}
            </div>
            <p className="text-xs text-muted-foreground">
              {status.stats.activePlugins} active,{" "}
              {status.stats.totalPlugins - status.stats.activePlugins} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Routes</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.stats.totalRoutes}</div>
            <p className="text-xs text-muted-foreground">
              Dynamic plugin routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Hooks</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.stats.totalHooks}</div>
            <p className="text-xs text-muted-foreground">
              Event hooks registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UI Components</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.stats.totalAdminPages +
                status.stats.totalDashboardWidgets}
            </div>
            <p className="text-xs text-muted-foreground">
              {status.stats.totalAdminPages} admin pages,{" "}
              {status.stats.totalDashboardWidgets} widgets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.performance.avgLoadTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Plugin initialization time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMemory(status.performance.totalMemoryUsage)}
            </div>
            <p className="text-xs text-muted-foreground">Total plugin memory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(status.performance.totalApiCalls)}
            </div>
            <p className="text-xs text-muted-foreground">
              Plugin route requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {formatPercentage(status.performance.errorRate)}
              </div>
              {getPerformanceBadge(status.performance.errorRate)}
            </div>
            <p className="text-xs text-muted-foreground">Plugin error rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Plugin Details */}
      <Card>
        <CardHeader>
          <CardTitle>Plugin Details</CardTitle>
          <CardDescription>
            Individual plugin status and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.plugins.map((plugin) => (
              <div
                key={plugin.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{plugin.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      v{plugin.version}
                    </Badge>

                    {plugin.status === "installed" && plugin.isActive && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}

                    {plugin.status === "installed" && !plugin.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}

                    {plugin.status === "failed" && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground mt-1">
                    {plugin.isActive ? (
                      <>
                        Load time: {plugin.loadTime}ms • Memory:{" "}
                        {formatMemory(plugin.memoryUsage)} •
                        {plugin.lastUsed
                          ? `Last used: ${plugin.lastUsed.toLocaleTimeString()}`
                          : "Never used"}
                      </>
                    ) : (
                      "Plugin is not currently active"
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {plugin.errorCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {plugin.errorCount} errors
                    </Badge>
                  )}

                  {plugin.isActive && (
                    <Badge variant="outline" className="text-xs">
                      <Activity className="w-3 h-3 mr-1" />
                      Running
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
          <CardDescription>Manage the plugin system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSystemRestart}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Restart System
            </Button>

            <Button
              onClick={handleHealthCheck}
              variant="outline"
              disabled={loading}
            >
              <Activity className="w-4 h-4 mr-2" />
              Run Health Check
            </Button>

            <div className="flex-1" />

            <div className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PluginSystemStatus;
