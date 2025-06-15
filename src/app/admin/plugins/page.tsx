// Admin Plugins Page with Proper Layout
// src/app/admin/plugins/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { MoreVerticalIcon, PauseIcon, PlayIcon } from "lucide-react";

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
// Plugin Installation Form Component
const uploadSchema = z.object({
  file: z
    .any()
    .refine((files) => files?.length === 1, "Plugin file is required"),
  activate: z.boolean(),
  overwrite: z.boolean(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface PluginInstallFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PluginInstallForm: React.FC<PluginInstallFormProps> = ({
  onSuccess,
  onError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<string>("");

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      activate: true,
      overwrite: false,
    },
  });

  const watchedFile = form.watch("file");

  const onSubmit = async (data: UploadFormData) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      onError(""); // Clear previous errors

      const file = data.file[0];

      console.log("🔄 Starting plugin installation...", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        activate: data.activate,
        overwrite: data.overwrite,
      });

      // Step 1: Validate file
      setUploadStep("Validating file...");
      setUploadProgress(10);

      if (!file.name.endsWith(".zip")) {
        throw new Error("Only ZIP files are allowed");
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size exceeds 50MB limit");
      }

      // Step 2: Create form data
      setUploadStep("Preparing upload...");
      setUploadProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("activate", data.activate.toString());
      formData.append("overwrite", data.overwrite.toString());

      // Step 3: Upload and install - Use the correct endpoint
      setUploadStep("Installing plugin...");
      setUploadProgress(30);

      const response = await fetch("/api/admin/plugins/install", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      setUploadProgress(70);

      console.log("📡 Response received:", {
        status: response.status,
        statusText: response.statusText,
      });

      // Step 4: Process response
      setUploadStep("Processing response...");
      setUploadProgress(80);

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse response:", responseText);
        throw new Error(
          `Invalid response from server: ${responseText.substring(0, 200)}`
        );
      }

      if (!response.ok) {
        const errorMessage =
          result?.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (!result.success) {
        throw new Error(
          result.error || "Installation failed for unknown reason"
        );
      }

      // Step 5: Success
      setUploadStep("Installation completed!");
      setUploadProgress(100);

      console.log("✅ Plugin installed successfully:", result.data);

      // Emit events for real-time updates - Fixed the property access
      if (typeof window !== "undefined") {
        const pluginId = result.data?.plugin?.pluginId;
        window.dispatchEvent(
          new CustomEvent("pluginInstalled", {
            detail: { pluginId, plugin: result.data?.plugin },
          })
        );
      }

      // Reset form and notify success
      form.reset();
      setTimeout(() => {
        onSuccess();
        setUploadStep("");
        setUploadProgress(0);
      }, 1000);
    } catch (err) {
      console.error("❌ Plugin installation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      onError(errorMessage);

      setUploadStep("");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Plugin File</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".zip"
                  onChange={(e) => onChange(e.target.files)}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Select a .zip file containing the plugin
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Activate after installation</FormLabel>
                <FormDescription>
                  Automatically activate the plugin once installed
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="overwrite"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Overwrite existing</FormLabel>
                <FormDescription>
                  Replace plugin if it already exists
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <>
                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <IconUpload className="w-4 h-4 mr-2" />
                Install Plugin
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const AdminPluginsPage: React.FC = () => {
  // State management
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Computed values
  const totalPlugins = plugins.length;
  const activePlugins = plugins.filter((p) => p.isActive).length;
  const failedPlugins = plugins.filter(
    (p) =>
      p.status === "failed" ||
      p.runtimeInfo?.hasErrors ||
      p.runtimeInfo?.errorCount > 0
  ).length;
  const totalRoutes = plugins.reduce(
    (sum, p) => sum + (p.runtimeInfo?.routeCount || 0),
    0
  );
  const totalHooks = plugins.reduce(
    (sum, p) => sum + (p.runtimeInfo?.hookCount || 0),
    0
  );
  const totalAdminPages = plugins.reduce(
    (sum, p) => sum + (p.runtimeInfo?.adminPageCount || 0),
    0
  );

  // Filtered plugins
  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      !searchTerm ||
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
      (statusFilter === "failed" &&
        (plugin.status === "failed" || plugin.runtimeInfo?.hasErrors));

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
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Plugin actions
  const handleActivatePlugin = async (pluginId: string) => {
    try {
      setActionLoading(pluginId);
      const response = await fetch("/api/admin/plugins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate", pluginId }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchPlugins();
        // Emit event for sidebar update
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pluginActivated", { detail: { pluginId } })
          );
        }
      } else {
        setError(result.error || "Activation failed");
      }
    } catch (err) {
      setError("Activation failed");
      console.error("Plugin activation error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivatePlugin = async (pluginId: string) => {
    try {
      setActionLoading(pluginId);
      const response = await fetch("/api/admin/plugins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate", pluginId }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchPlugins();
        // Emit event for sidebar update
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pluginDeactivated", { detail: { pluginId } })
          );
        }
      } else {
        setError(result.error || "Deactivation failed");
      }
    } catch (err) {
      setError("Deactivation failed");
      console.error("Plugin deactivation error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    if (
      !confirm(
        "Are you sure you want to uninstall this plugin? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading(pluginId);
      const response = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchPlugins();
        // Emit event for sidebar update
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pluginUninstalled", { detail: { pluginId } })
          );
        }
      } else {
        setError(result.error || "Uninstall failed");
      }
    } catch (err) {
      setError("Uninstall failed");
      console.error("Plugin uninstall error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Status badge helper
  const getStatusBadge = (plugin: Plugin) => {
    if (
      plugin.runtimeInfo?.hasErrors ||
      plugin.runtimeInfo?.errorCount > 0 ||
      plugin.status === "failed"
    ) {
      return (
        <Badge variant="destructive" className="text-xs">
          <IconAlertTriangle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }

    if (plugin.isActive) {
      return (
        <Badge variant="default" className="text-xs">
          <IconCircleCheckFilled className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs">
        <PauseIcon className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  // Load plugins on mount
  useEffect(() => {
    fetchPlugins();

    // Listen for plugin state changes
    const handlePluginChange = () => {
      fetchPlugins();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pluginStateChanged", handlePluginChange);
      window.addEventListener("pluginInstalled", handlePluginChange);
      window.addEventListener("pluginUninstalled", handlePluginChange);
      window.addEventListener("pluginActivated", handlePluginChange);
      window.addEventListener("pluginDeactivated", handlePluginChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("pluginStateChanged", handlePluginChange);
        window.removeEventListener("pluginInstalled", handlePluginChange);
        window.removeEventListener("pluginUninstalled", handlePluginChange);
        window.removeEventListener("pluginActivated", handlePluginChange);
        window.removeEventListener("pluginDeactivated", handlePluginChange);
      }
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
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
            {/* Header Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <IconCircleCheckFilled className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activePlugins}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{failedPlugins}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    API Routes
                  </CardTitle>
                  <IconGlobe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRoutes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hooks</CardTitle>
                  <IconDatabase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalHooks}</div>
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
                  <div className="text-2xl font-bold">{totalAdminPages}</div>
                </CardContent>
              </Card>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
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

                  <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <IconPlus className="w-4 h-4 mr-2" />
                        Install Plugin
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Install Plugin</DialogTitle>
                        <DialogDescription>
                          Upload a plugin ZIP file to install and activate it.
                        </DialogDescription>
                      </DialogHeader>
                      <PluginInstallForm
                        onSuccess={() => {
                          setUploadOpen(false);
                          fetchPlugins();
                        }}
                        onError={setError}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <TabsContent value="plugins" className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search plugins..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <IconFilter className="w-4 h-4 mr-2" />
                        Category:{" "}
                        {categoryFilter === "all" ? "All" : categoryFilter}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => setCategoryFilter("all")}
                      >
                        All Categories
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {categories.map((category) => (
                        <DropdownMenuItem
                          key={category}
                          onClick={() => setCategoryFilter(category)}
                        >
                          {category}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <IconFilter className="w-4 h-4 mr-2" />
                        Status: {statusFilter === "all" ? "All" : statusFilter}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                        All Status
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatusFilter("active")}
                      >
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatusFilter("inactive")}
                      >
                        Inactive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatusFilter("failed")}
                      >
                        Failed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                        <TableHead>Stats</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <IconLoader className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p className="text-muted-foreground">
                              Loading plugins...
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : filteredPlugins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <IconPuzzle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium mb-2">
                              No plugins found
                            </p>
                            <p className="text-muted-foreground">
                              {searchTerm ||
                              categoryFilter !== "all" ||
                              statusFilter !== "all"
                                ? "Try adjusting your filters"
                                : "Install your first plugin to get started"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlugins.map((plugin) => (
                          <TableRow key={plugin._id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{plugin.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {plugin.manifest?.description ||
                                    "No description"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  by {plugin.manifest?.author || "Unknown"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {plugin.version}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {plugin.manifest?.category || "Other"}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(plugin)}</TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>
                                  Routes: {plugin.runtimeInfo?.routeCount || 0}
                                </div>
                                <div>
                                  Hooks: {plugin.runtimeInfo?.hookCount || 0}
                                </div>
                                <div>
                                  Pages:{" "}
                                  {plugin.runtimeInfo?.adminPageCount || 0}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoading === plugin.pluginId}
                                  >
                                    {actionLoading === plugin.pluginId ? (
                                      <IconLoader className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <MoreVerticalIcon className="w-4 h-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {plugin.isActive ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeactivatePlugin(plugin.pluginId)
                                      }
                                    >
                                      <PauseIcon className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleActivatePlugin(plugin.pluginId)
                                      }
                                    >
                                      <PlayIcon className="w-4 h-4 mr-2" />
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>
                                    <IconSettings className="w-4 h-4 mr-2" />
                                    Configure
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUninstall(plugin.pluginId)
                                    }
                                    className="text-destructive"
                                  >
                                    <IconTrash className="w-4 h-4 mr-2" />
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Sample plugins that could be installed */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconShield className="w-5 h-5" />
                        Security Scanner
                      </CardTitle>
                      <CardDescription>
                        Monitor your application for security vulnerabilities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Badge variant="outline">Security</Badge>
                        <span>v1.2.0</span>
                      </div>
                      <p className="text-sm">
                        Advanced security monitoring with real-time alerts and
                        vulnerability scanning.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" disabled>
                        <IconDownload className="w-4 h-4 mr-2" />
                        Not Available
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconDatabase className="w-5 h-5" />
                        Backup Manager
                      </CardTitle>
                      <CardDescription>
                        Automated backup and restore functionality
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Badge variant="outline">Utility</Badge>
                        <span>v2.1.0</span>
                      </div>
                      <p className="text-sm">
                        Schedule automated backups and easily restore your data
                        when needed.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" disabled>
                        <IconDownload className="w-4 h-4 mr-2" />
                        Not Available
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconGlobe className="w-5 h-5" />
                        Analytics Pro
                      </CardTitle>
                      <CardDescription>
                        Advanced analytics and reporting dashboard
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Badge variant="outline">Analytics</Badge>
                        <span>v3.0.1</span>
                      </div>
                      <p className="text-sm">
                        Comprehensive analytics with custom dashboards and
                        detailed reports.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" disabled>
                        <IconDownload className="w-4 h-4 mr-2" />
                        Not Available
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                <Alert>
                  <IconInfoCircle className="h-4 w-4" />
                  <AlertDescription>
                    Plugin marketplace is in development. For now, you can
                    install plugins manually using ZIP files.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="system" className="space-y-4">
                <Card className="p-8 text-center">
                  <IconActivity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">System Status</h3>
                  <p className="text-muted-foreground mb-4">
                    Monitor plugin system health and performance
                  </p>
                  <Button variant="outline">View Details</Button>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminPluginsPage;
