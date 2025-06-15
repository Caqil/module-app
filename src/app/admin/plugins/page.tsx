// Corrected Admin Plugins Page - Using Existing Types
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
  IconMail,
  IconExternalLink,
} from "@tabler/icons-react";
import { MoreVerticalIcon, PauseIcon, PlayIcon } from "lucide-react";

// ✅ FIXED: Import existing types instead of creating new ones
import {
  InstalledPlugin,
  PluginManifest,
  PluginCategory,
  PluginPermission,
} from "@/types/plugin";
import { ApiResponse } from "@/types/global";

// API Response interfaces (these are specific to the API, not core plugin types)
interface PluginApiResponse extends ApiResponse {
  data?: {
    plugins: InstalledPlugin[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

interface PluginActionResponse extends ApiResponse {
  data?: {
    plugin: InstalledPlugin;
  };
  message?: string;
}

// ✅ FIXED: Helper functions using the existing PluginManifest.author type
const renderAuthorName = (author: PluginManifest["author"]): string => {
  // The type is already correctly defined as { name: string; email?: string; url?: string }
  return author?.name || "Unknown Author";
};

const getAuthorEmail = (author: PluginManifest["author"]): string | null => {
  return author?.email || null;
};

const getAuthorUrl = (author: PluginManifest["author"]): string | null => {
  return author?.url || null;
};

// ✅ FIXED: Component using the correct type
const PluginAuthorInfo: React.FC<{
  author: PluginManifest["author"];
  showEmail?: boolean;
}> = ({ author, showEmail = false }) => {
  const name = renderAuthorName(author);
  const email = getAuthorEmail(author);
  const url = getAuthorUrl(author);

  return (
    <div>
      <div className="font-medium">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
          >
            {name}
            <IconExternalLink className="w-3 h-3" />
          </a>
        ) : (
          name
        )}
      </div>
      {showEmail && email && (
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <IconMail className="w-3 h-3" />
          {email}
        </div>
      )}
    </div>
  );
};

// Plugin Install Form Component
const PluginInstallForm: React.FC<{ onSuccess: () => void }> = ({
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleInstall = async () => {
    if (!file) {
      setError("Please select a plugin file");
      return;
    }

    setInstalling(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/plugins/install", {
        method: "POST",
        body: formData,
      });

      const result: PluginActionResponse = await response.json();

      if (result.success) {
        setFile(null);
        onSuccess();
      } else {
        setError(result.error || "Installation failed");
      }
    } catch (err) {
      setError(
        "Installation failed: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="plugin-file" className="block text-sm font-medium mb-2">
          Select Plugin File
        </label>
        <Input
          id="plugin-file"
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          disabled={installing}
        />
        {file && (
          <p className="text-sm text-muted-foreground mt-1">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleInstall}
        disabled={!file || installing}
        className="w-full"
      >
        {installing ? (
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
  );
};

// Main Plugins Page Component
export default function PluginsPage() {
  // ✅ FIXED: Using the existing InstalledPlugin type
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    PluginCategory | "all"
  >("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showInstallDialog, setShowInstallDialog] = useState(false);

  // Load plugins
  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/plugins");
      const result: PluginApiResponse = await response.json();

      if (result.success && result.data) {
        setPlugins(result.data.plugins);
      } else {
        setError(result.error || "Failed to load plugins");
      }
    } catch (err) {
      setError(
        "Error loading plugins: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Plugin actions
  const togglePlugin = async (plugin: InstalledPlugin) => {
    try {
      const action = plugin.isActive ? "deactivate" : "activate";
      const response = await fetch(
        `/api/admin/plugins/${plugin.pluginId}/${action}`,
        {
          method: "POST",
        }
      );

      const result: PluginActionResponse = await response.json();

      if (result.success) {
        loadPlugins(); // Refresh the list
      } else {
        alert(result.error || `Failed to ${action} plugin`);
      }
    } catch (err) {
      alert(
        "Error toggling plugin: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const deletePlugin = async (plugin: InstalledPlugin) => {
    if (!confirm(`Are you sure you want to delete "${plugin.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/plugins/${plugin.pluginId}`, {
        method: "DELETE",
      });

      const result: PluginActionResponse = await response.json();

      if (result.success) {
        loadPlugins(); // Refresh the list
      } else {
        alert(result.error || "Failed to delete plugin");
      }
    } catch (err) {
      alert(
        "Error deleting plugin: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  // Filter plugins
  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.manifest.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      renderAuthorName(plugin.manifest.author)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      plugin.manifest.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories from the PluginCategory type and current plugins
  const availableCategories = Array.from(
    new Set(plugins.map((p) => p.manifest.category))
  ) as PluginCategory[];

  // Load plugins on mount
  useEffect(() => {
    loadPlugins();
  }, []);

  // Plugin statistics
  const stats = {
    total: plugins.length,
    active: plugins.filter((p) => p.isActive).length,
    inactive: plugins.filter((p) => !p.isActive).length,
    withErrors: plugins.filter((p) => p.errorLog && p.errorLog.length > 0)
      .length,
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Plugins</h1>
              <p className="text-muted-foreground mt-1">
                Manage and configure your installed plugins
              </p>
            </div>
            <Dialog
              open={showInstallDialog}
              onOpenChange={setShowInstallDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <IconPlus className="w-4 h-4 mr-2" />
                  Install Plugin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Install New Plugin</DialogTitle>
                  <DialogDescription>
                    Upload a plugin ZIP file to install it.
                  </DialogDescription>
                </DialogHeader>
                <PluginInstallForm
                  onSuccess={() => {
                    setShowInstallDialog(false);
                    loadPlugins();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Plugins
                </CardTitle>
                <IconPackage className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <IconActivity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                <IconPuzzle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">
                  {stats.inactive}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  With Errors
                </CardTitle>
                <IconAlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.withErrors}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search plugins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as PluginCategory | "all")
              }
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() =>
                setViewMode(viewMode === "table" ? "grid" : "table")
              }
            >
              {viewMode === "table" ? "Grid View" : "Table View"}
            </Button>
            <Button variant="outline" onClick={loadPlugins} disabled={loading}>
              <IconRefresh className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <IconLoader className="w-6 h-6 animate-spin mr-2" />
              Loading plugins...
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Plugins Content */}
          {!loading && !error && (
            <>
              {filteredPlugins.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <IconPackage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No plugins found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {plugins.length === 0
                        ? "You haven't installed any plugins yet."
                        : "No plugins match your current filters."}
                    </p>
                    {plugins.length === 0 && (
                      <Button onClick={() => setShowInstallDialog(true)}>
                        <IconPlus className="w-4 h-4 mr-2" />
                        Install Your First Plugin
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {viewMode === "table" ? (
                    /* Table View */
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Plugin</TableHead>
                              <TableHead>Version</TableHead>
                              <TableHead>Author</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Permissions</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPlugins.map((plugin) => (
                              <TableRow key={plugin._id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      {plugin.isActive ? (
                                        <IconCircleCheckFilled className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <IconPackage className="w-5 h-5 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {plugin.manifest.name}
                                      </div>
                                      <div className="text-sm text-muted-foreground line-clamp-1">
                                        {plugin.manifest.description}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <Badge variant="secondary">
                                    {plugin.version}
                                  </Badge>
                                </TableCell>

                                {/* ✅ FIXED: Using existing types with proper component */}
                                <TableCell>
                                  <PluginAuthorInfo
                                    author={plugin.manifest.author}
                                    showEmail={true}
                                  />
                                </TableCell>

                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={
                                        plugin.isActive
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {plugin.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    {plugin.errorLog &&
                                      plugin.errorLog.length > 0 && (
                                        <Badge variant="destructive">
                                          <IconAlertTriangle className="w-3 h-3 mr-1" />
                                          Error
                                        </Badge>
                                      )}
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <Badge variant="outline">
                                    {plugin.manifest.category
                                      .charAt(0)
                                      .toUpperCase() +
                                      plugin.manifest.category.slice(1)}
                                  </Badge>
                                </TableCell>

                                <TableCell>
                                  <div className="text-sm text-muted-foreground">
                                    {plugin.manifest.permissions?.length || 0}{" "}
                                    permissions
                                  </div>
                                </TableCell>

                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVerticalIcon className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => togglePlugin(plugin)}
                                      >
                                        {plugin.isActive ? (
                                          <>
                                            <PauseIcon className="w-4 h-4 mr-2" />
                                            Deactivate
                                          </>
                                        ) : (
                                          <>
                                            <PlayIcon className="w-4 h-4 mr-2" />
                                            Activate
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <IconSettings className="w-4 h-4 mr-2" />
                                        Configure
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <IconInfoCircle className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => deletePlugin(plugin)}
                                        disabled={plugin.isActive}
                                      >
                                        <IconTrash className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    /* Grid View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPlugins.map((plugin) => (
                        <Card key={plugin._id} className="relative">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {plugin.isActive ? (
                                  <IconCircleCheckFilled className="w-6 h-6 text-green-500 flex-shrink-0" />
                                ) : (
                                  <IconPackage className="w-6 h-6 text-gray-400 flex-shrink-0" />
                                )}
                                <div>
                                  <CardTitle className="text-lg">
                                    {plugin.manifest.name}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      v{plugin.version}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {plugin.manifest.category}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVerticalIcon className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => togglePlugin(plugin)}
                                  >
                                    {plugin.isActive
                                      ? "Deactivate"
                                      : "Activate"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Configure</DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => deletePlugin(plugin)}
                                    disabled={plugin.isActive}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>

                          <CardContent>
                            <CardDescription className="mb-4 line-clamp-2">
                              {plugin.manifest.description}
                            </CardDescription>

                            {/* ✅ FIXED: Using existing types in grid view */}
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Author:
                                </span>
                                <div className="mt-1">
                                  <PluginAuthorInfo
                                    author={plugin.manifest.author}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Status:
                                </span>
                                <Badge
                                  variant={
                                    plugin.isActive ? "default" : "secondary"
                                  }
                                >
                                  {plugin.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Permissions:
                                </span>
                                <span>
                                  {plugin.manifest.permissions?.length || 0}
                                </span>
                              </div>

                              {plugin.errorLog &&
                                plugin.errorLog.length > 0 && (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <IconAlertTriangle className="w-4 h-4" />
                                    <span className="text-sm">Has errors</span>
                                  </div>
                                )}
                            </div>
                          </CardContent>

                          <CardFooter>
                            <Button
                              variant={plugin.isActive ? "outline" : "default"}
                              size="sm"
                              onClick={() => togglePlugin(plugin)}
                              className="w-full"
                            >
                              {plugin.isActive ? (
                                <>
                                  <PauseIcon className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <PlayIcon className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
