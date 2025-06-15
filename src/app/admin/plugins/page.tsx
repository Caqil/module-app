// Complete Admin Plugins Page
// src/app/admin/plugins/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Activity,
  Settings,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Plus,
} from "lucide-react";

// Import our plugin components
import PluginManager from "@/components/admin/plugin-manager";
import PluginSystemStatus from "@/components/admin/plugin-system-status";
import PluginDashboardWidgets from "@/components/dynamic/plugin-dashboard-widgets";

interface PluginOverviewStats {
  totalPlugins: number;
  activePlugins: number;
  failedPlugins: number;
  updateAvailable: number;
  totalRoutes: number;
  totalHooks: number;
  systemHealth: "healthy" | "warning" | "error";
  lastCheck: Date;
}

const AdminPluginsPage: React.FC = () => {
  const [stats, setStats] = useState<PluginOverviewStats>({
    totalPlugins: 0,
    activePlugins: 0,
    failedPlugins: 0,
    updateAvailable: 0,
    totalRoutes: 0,
    totalHooks: 0,
    systemHealth: "healthy",
    lastCheck: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Load plugin overview stats
  const loadStats = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would fetch from the API
      // For demonstration, we'll use mock data
      const mockStats: PluginOverviewStats = {
        totalPlugins: 4,
        activePlugins: 2,
        failedPlugins: 1,
        updateAvailable: 1,
        totalRoutes: 8,
        totalHooks: 12,
        systemHealth: "healthy",
        lastCheck: new Date(),
      };

      setStats(mockStats);
    } catch (error) {
      console.error("Failed to load plugin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get health badge
  const getHealthBadge = (health: string) => {
    switch (health) {
      case "healthy":
        return (
          <Badge variant="default" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Healthy
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="secondary" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Unknown
          </Badge>
        );
    }
  };

  // Initial load
  useEffect(() => {
    loadStats();

    // Listen for plugin state changes
    const handlePluginChange = () => {
      loadStats();
    };

    window.addEventListener("pluginStateChanged", handlePluginChange);
    window.addEventListener("pluginInstalled", handlePluginChange);
    window.addEventListener("pluginUninstalled", handlePluginChange);

    return () => {
      window.removeEventListener("pluginStateChanged", handlePluginChange);
      window.removeEventListener("pluginInstalled", handlePluginChange);
      window.removeEventListener("pluginUninstalled", handlePluginChange);
    };
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plugin Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage, monitor, and configure your application plugins
          </p>
        </div>

        <div className="flex items-center gap-3">
          {getHealthBadge(stats.systemHealth)}

          <Button
            onClick={loadStats}
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

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plugins</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlugins}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePlugins} active,{" "}
              {stats.totalPlugins - stats.activePlugins} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthBadge(stats.systemHealth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.failedPlugins > 0
                ? `${stats.failedPlugins} plugins failed`
                : "All systems operational"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Updates Available
            </CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.updateAvailable}</div>
            <p className="text-xs text-muted-foreground">
              {stats.updateAvailable > 0
                ? "Updates ready to install"
                : "All plugins up to date"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Components
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRoutes + stats.totalHooks}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRoutes} routes, {stats.totalHooks} hooks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {stats.systemHealth === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Plugin system has detected critical issues. Check the Status tab for
            details.
          </AlertDescription>
        </Alert>
      )}

      {stats.systemHealth === "warning" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Plugin system has detected warnings. Review the Status tab for more
            information.
          </AlertDescription>
        </Alert>
      )}

      {stats.updateAvailable > 0 && (
        <Alert>
          <Download className="h-4 w-4" />
          <AlertDescription>
            {stats.updateAvailable} plugin update
            {stats.updateAvailable !== 1 ? "s" : ""} available. Check the
            Management tab to update your plugins.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Management
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Widgets
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Current plugin system status and metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>System Status</span>
                  {getHealthBadge(stats.systemHealth)}
                </div>

                <div className="flex items-center justify-between">
                  <span>Active Plugins</span>
                  <Badge variant="outline">
                    {stats.activePlugins}/{stats.totalPlugins}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Failed Plugins</span>
                  <Badge
                    variant={
                      stats.failedPlugins > 0 ? "destructive" : "secondary"
                    }
                  >
                    {stats.failedPlugins}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>API Routes</span>
                  <Badge variant="outline">{stats.totalRoutes}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Event Hooks</span>
                  <Badge variant="outline">{stats.totalHooks}</Badge>
                </div>

                <div className="pt-4 border-t text-xs text-muted-foreground">
                  Last checked: {stats.lastCheck.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common plugin management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("management")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Install New Plugin
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("status")}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  System Health Check
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("management")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Update Available Plugins
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("widgets")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest plugin system events and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">Analytics Pro activated</p>
                    <p className="text-sm text-muted-foreground">
                      2 minutes ago
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <Download className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">
                      SEO Optimizer update available
                    </p>
                    <p className="text-sm text-muted-foreground">1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-medium">
                      Social Media Pro failed to load
                    </p>
                    <p className="text-sm text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management">
          <PluginManager />
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status">
          <PluginSystemStatus />
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Dashboard Widgets</h3>
              <p className="text-muted-foreground">
                Manage plugin-provided dashboard widgets
              </p>
            </div>
          </div>

          <PluginDashboardWidgets
            layout="grid"
            columns={3}
            allowResize={true}
            allowReorder={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPluginsPage;
