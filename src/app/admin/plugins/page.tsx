// Updated Admin Plugins Page
// src/app/admin/plugins/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconPackage,
  IconActivity,
  IconSettings,
  IconDownload,
  IconShield,
  IconAlertTriangle,
  IconCircleCheckFilled,
  IconInfoCircle,
  IconRefresh,
  IconPlus,
  IconLoader,
  IconUpload,
  IconUsers,
  IconDatabase,
  IconGlobe,
  IconTrash,
  IconPalette,
  IconPuzzle,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import { MoreVerticalIcon, PauseIcon, PlayIcon } from "lucide-react";

// Import the improved PluginInstallForm component
import { PluginInstallForm } from "./components/PluginInstallForm";

// Types from API
interface Plugin {
  _id: string;
  pluginId: string;
  name: string;
  version: string;
  status: "installed" | "installing" | "failed" | "disabled" | "updating";
  isActive: boolean;
  manifest: {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    category: string;
    keywords?: string[];
    adminPages?: any[];
    dashboardWidgets?: any[];
    permissions?: string[];
  };
  runtimeInfo: {
    isLoaded: boolean;
    hasErrors: boolean;
    lastError: any;
    routeCount: number;
    hookCount: number;
    loadedAt: string | null;
    adminPageCount: number;
    dashboardWidgetCount: number;
    dependencyCount: number;
    errorCount: number;
  };
  errorLog: any[];
  routes: any[];
  hooks: any[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    plugins: Plugin[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  error?: string;
}

interface PluginActionResponse {
  success: boolean;
  data?: {
    plugin: Plugin;
  };
  error?: string;
  message?: string;
}

const PluginStatusBadge: React.FC<{ status: Plugin["status"] }> = ({
  status,
}) => {
  const variants = {
    installed: "bg-green-100 text-green-800 border-green-200",
    installing: "bg-yellow-100 text-yellow-800 border-yellow-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    disabled: "bg-gray-100 text-gray-800 border-gray-200",
    updating: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const icons = {
    installed: IconCircleCheckFilled,
    installing: IconLoader,
    failed: IconAlertTriangle,
    disabled: PauseIcon,
    updating: IconRefresh,
  };

  const Icon = icons[status];

  return (
    <Badge
      variant="outline"
      className={`${variants[status]} flex items-center gap-1`}
    >
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Calculate statistics
  const totalPlugins = plugins.length;
  const activePlugins = plugins.filter((p) => p.isActive).length;
  const failedPlugins = plugins.filter((p) => p.status === "failed").length;
  const totalAdminPages = plugins.reduce(
    (sum, p) => sum + (p.manifest?.adminPages?.length || 0),
    0
  );

  // Filter plugins based on search and filters
  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.manifest?.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      plugin.manifest?.author?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || plugin.manifest?.category === categoryFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && plugin.isActive) ||
      (statusFilter === "inactive" && !plugin.isActive) ||
      statusFilter === "failed" ||
      plugin.runtimeInfo?.hasErrors;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories
  const categories = Array.from(
    new Set(plugins.map((p) => p.manifest?.category).filter(Boolean))
  );

  // Load plugins from API
  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/plugins", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch plugins: ${response.status} ${response.statusText}`
        );
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load plugins");
      }

      setPlugins(data.data?.plugins || []);
      console.log("✅ Plugins loaded:", data.data?.plugins?.length || 0);
    } catch (err) {
      console.error("Failed to load plugins:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Plugin actions
  const togglePlugin = async (pluginId: string, currentState: boolean) => {
    try {
      const action = currentState ? "deactivate" : "activate";
      const response = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action }),
      });

      const data: PluginActionResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || `Failed to ${action} plugin`);
      }

      // Refresh plugins list
      await fetchPlugins();

      console.log(`✅ Plugin ${action}d successfully`);
    } catch (err) {
      console.error(`Failed to toggle plugin:`, err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
    }
  };

  const uninstallPlugin = async (pluginId: string) => {
    if (
      !confirm(
        "Are you sure you want to uninstall this plugin? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data: PluginActionResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to uninstall plugin");
      }

      // Refresh plugins list
      await fetchPlugins();

      console.log("✅ Plugin uninstalled successfully");
    } catch (err) {
      console.error("Failed to uninstall plugin:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
    }
  };

  // Handle plugin installation success
  const handleInstallSuccess = () => {
    console.log("🎉 Plugin installation completed!");
    setUploadOpen(false);
    setUploadError("");
    fetchPlugins(); // Refresh the plugins list
  };

  // Handle plugin installation error
  const handleInstallError = (errorMessage: string) => {
    console.error("❌ Plugin installation failed:", errorMessage);
    setUploadError(errorMessage);
  };

  // Load plugins on component mount
  useEffect(() => {
    fetchPlugins();

    // Listen for plugin installation events
    const handlePluginInstalled = (event: CustomEvent) => {
      console.log("🔄 Plugin installed event received:", event.detail);
      // Refresh plugins after a short delay to ensure database is updated
      setTimeout(() => {
        fetchPlugins();
      }, 1000);
    };

    window.addEventListener(
      "pluginInstalled",
      handlePluginInstalled as EventListener
    );

    return () => {
      window.removeEventListener(
        "pluginInstalled",
        handlePluginInstalled as EventListener
      );
    };
  }, []);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Plugin Manager
                    </h1>
                    <p className="text-muted-foreground">
                      Install, configure, and manage plugins for your
                      application
                    </p>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Plugins
                      </CardTitle>
                      <IconPackage className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalPlugins}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Plugins
                      </CardTitle>
                      <IconActivity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {activePlugins}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Failed Plugins
                      </CardTitle>
                      <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {failedPlugins}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Admin Pages
                      </CardTitle>
                      <IconUsers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {totalAdminPages}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchPlugins}
                        className="ml-2"
                      >
                        Try Again
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Upload Error Alert */}
                {uploadError && (
                  <Alert variant="destructive" className="mb-6">
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Plugin Installation Error: {uploadError}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadError("")}
                        className="ml-2"
                      >
                        Dismiss
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Main Content */}
                <Tabs defaultValue="plugins" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="plugins">Plugin Manager</TabsTrigger>
                      <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                      <TabsTrigger value="system">System Status</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={fetchPlugins}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <IconRefresh className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                      </Button>

                      {/* Install Plugin Dialog with new component */}
                      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <IconPlus className="w-4 h-4 mr-2" />
                            Install Plugin
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Install Plugin</DialogTitle>
                            <DialogDescription>
                              Upload a plugin ZIP file to install and activate
                              it. The plugin will be validated for security
                              before installation.
                            </DialogDescription>
                          </DialogHeader>

                          {/* Use the improved PluginInstallForm component */}
                          <PluginInstallForm
                            onSuccess={handleInstallSuccess}
                            onError={handleInstallError}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <TabsContent value="plugins" className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search plugins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() +
                                category.slice(1)}
                            </option>
                          ))}
                        </select>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>

                    {/* Plugins Table */}
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plugin</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <IconLoader className="w-4 h-4 animate-spin" />
                                  Loading plugins...
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : filteredPlugins.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8"
                              >
                                {searchTerm ||
                                categoryFilter !== "all" ||
                                statusFilter !== "all"
                                  ? "No plugins match your filters"
                                  : "No plugins installed yet"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredPlugins.map((plugin) => (
                              <TableRow key={plugin._id}>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      {plugin.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {plugin.manifest?.description}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      by {plugin.manifest?.author}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {plugin.version}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {plugin.manifest?.category || "Unknown"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <PluginStatusBadge status={plugin.status} />
                                    {plugin.isActive && (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-200"
                                      >
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                      >
                                        <MoreVerticalIcon className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          togglePlugin(
                                            plugin.pluginId,
                                            plugin.isActive
                                          )
                                        }
                                      >
                                        {plugin.isActive ? (
                                          <>
                                            <PauseIcon className="mr-2 h-4 w-4" />
                                            Deactivate
                                          </>
                                        ) : (
                                          <>
                                            <PlayIcon className="mr-2 h-4 w-4" />
                                            Activate
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <IconSettings className="mr-2 h-4 w-4" />
                                        Configure
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          uninstallPlugin(plugin.pluginId)
                                        }
                                        className="text-red-600"
                                      >
                                        <IconTrash className="mr-2 h-4 w-4" />
                                        Uninstall
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="marketplace" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Plugin Marketplace</CardTitle>
                        <CardDescription>
                          Browse and install plugins from the marketplace
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          Marketplace functionality coming soon...
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="system" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>System Status</CardTitle>
                        <CardDescription>
                          Plugin system health and diagnostics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span>Plugin System Status</span>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Operational
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Total Plugins Installed</span>
                            <span className="font-medium">{totalPlugins}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Active Plugins</span>
                            <span className="font-medium">{activePlugins}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Failed Plugins</span>
                            <span className="font-medium text-red-600">
                              {failedPlugins}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
