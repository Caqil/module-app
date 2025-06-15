// Plugin Manager UI Component
// src/components/admin/plugin-manager.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Upload,
  Settings,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
  Shield,
  Database,
  Zap,
  Info,
} from "lucide-react";
import { ApiResponse } from "@/types/global";
import { InstalledPlugin } from "@/types/plugin";

interface PluginManagerProps {
  className?: string;
}

interface PluginConfigModalProps {
  plugin: InstalledPlugin;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Record<string, any>) => Promise<void>;
  isLoading: boolean;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (
    file: File,
    options: { overwrite: boolean; activate: boolean }
  ) => Promise<void>;
  isLoading: boolean;
}

const PluginManager: React.FC<PluginManagerProps> = ({ className }) => {
  const router = useRouter();
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [configModalPlugin, setConfigModalPlugin] =
    useState<InstalledPlugin | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load plugins
  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set("search", searchQuery);
      if (statusFilter !== "all") queryParams.set("status", statusFilter);
      if (categoryFilter !== "all") queryParams.set("category", categoryFilter);

      const response = await fetch(`/api/admin/plugins?${queryParams}`, {
        credentials: "include",
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setPlugins(result.data.plugins);
      } else {
        setError(result.error || "Failed to load plugins");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Plugins fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle plugin action
  const handlePluginAction = async (
    pluginId: string,
    action: string,
    options?: any
  ) => {
    try {
      setActionLoading(pluginId);
      setError(null);

      const response = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, ...options }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        await loadPlugins();

        // Emit plugin state change event for UI updates
        window.dispatchEvent(
          new CustomEvent("pluginStateChanged", {
            detail: { pluginId, action },
          })
        );
      } else {
        setError(result.error || `Failed to ${action} plugin`);
      }
    } catch (err) {
      setError(`Failed to ${action} plugin`);
      console.error(`Plugin ${action} error:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle plugin upload
  const handlePluginUpload = async (
    file: File,
    options: { overwrite: boolean; activate: boolean }
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("overwrite", options.overwrite.toString());
      formData.append("activate", options.activate.toString());

      const response = await fetch("/api/admin/plugins/install", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setUploadModalOpen(false);
        await loadPlugins();

        // Emit plugin install event
        window.dispatchEvent(
          new CustomEvent("pluginInstalled", {
            detail: result.data,
          })
        );
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle plugin deletion
  const handlePluginDelete = async (pluginId: string) => {
    if (
      !confirm(
        "Are you sure you want to uninstall this plugin? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading(pluginId);

      const response = await fetch(
        `/api/admin/plugins/${pluginId}?backup=true`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result: ApiResponse = await response.json();

      if (result.success) {
        await loadPlugins();

        // Emit plugin uninstall event
        window.dispatchEvent(
          new CustomEvent("pluginUninstalled", {
            detail: { pluginId },
          })
        );
      } else {
        setError(result.error || "Failed to uninstall plugin");
      }
    } catch (err) {
      setError("Failed to uninstall plugin");
      console.error("Plugin delete error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle configuration save
  const handleConfigSave = async (config: Record<string, any>) => {
    if (!configModalPlugin) return;

    await handlePluginAction(configModalPlugin.pluginId, "configure", {
      config,
    });
    setConfigModalPlugin(null);
  };

  // Filter plugins
  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      !searchQuery ||
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.manifest.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && plugin.isActive) ||
      (statusFilter === "inactive" && !plugin.isActive) ||
      plugin.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || plugin.manifest.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get status badge
  const getStatusBadge = (plugin: InstalledPlugin) => {
    if (plugin.status === "installed" && plugin.isActive) {
      return (
        <Badge variant="default" className="text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else if (plugin.status === "installed" && !plugin.isActive) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Pause className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    } else if (plugin.status === "installing") {
      return (
        <Badge variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1 animate-spin" />
          Installing
        </Badge>
      );
    } else if (plugin.status === "failed") {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        {plugin.status}
      </Badge>
    );
  };

  // Get security risk badge
  const getSecurityBadge = (permissions: string[]) => {
    const highRiskPerms = [
      "database:write",
      "files:write",
      "settings:write",
      "plugins:manage",
    ];
    const mediumRiskPerms = ["database:read", "admin:access", "users:write"];

    const hasHighRisk = permissions.some((p) => highRiskPerms.includes(p));
    const hasMediumRisk = permissions.some((p) => mediumRiskPerms.includes(p));

    if (hasHighRisk) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Shield className="w-3 h-3 mr-1" />
          High Risk
        </Badge>
      );
    } else if (hasMediumRisk) {
      return (
        <Badge variant="outline" className="text-xs">
          <Shield className="w-3 h-3 mr-1" />
          Medium Risk
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="text-xs">
          <Shield className="w-3 h-3 mr-1" />
          Low Risk
        </Badge>
      );
    }
  };

  // Initial load
  useEffect(() => {
    loadPlugins();
  }, [searchQuery, statusFilter, categoryFilter]);

  if (loading && plugins.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Plugin Manager</h1>
          <div className="h-9 bg-muted animate-pulse rounded w-32"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-4">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-4/5"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plugin Manager</h1>
          <p className="text-muted-foreground">
            Install, configure, and manage your application plugins
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={loadPlugins}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <UploadModal
            isOpen={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            onUpload={handlePluginUpload}
            isLoading={actionLoading === "upload"}
          />

          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Install Plugin
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="commerce">Commerce</SelectItem>
              <SelectItem value="utility">Utility</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="seo">SEO</SelectItem>
              <SelectItem value="social">Social</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlugins.map((plugin) => (
          <Card key={plugin._id} className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {plugin.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    v{plugin.version} • {plugin.manifest.category}
                  </CardDescription>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {plugin.isActive ? (
                      <DropdownMenuItem
                        onClick={() =>
                          handlePluginAction(plugin.pluginId, "deactivate")
                        }
                        disabled={actionLoading === plugin.pluginId}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() =>
                          handlePluginAction(plugin.pluginId, "activate")
                        }
                        disabled={
                          actionLoading === plugin.pluginId ||
                          plugin.status !== "installed"
                        }
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() => setConfigModalPlugin(plugin)}
                      disabled={!plugin.manifest.settings?.schema}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() =>
                        handlePluginAction(plugin.pluginId, "reload")
                      }
                      disabled={
                        actionLoading === plugin.pluginId || !plugin.isActive
                      }
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reload
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => handlePluginDelete(plugin.pluginId)}
                      disabled={actionLoading === plugin.pluginId}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Uninstall
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                {plugin.manifest.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(plugin)}
                  {getSecurityBadge(plugin.manifest.permissions || [])}

                  {plugin.metadata.updateAvailable && (
                    <Badge variant="outline" className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Update Available
                    </Badge>
                  )}
                </div>

                {plugin.errorLog.length > 0 && (
                  <Alert variant="destructive" className="p-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Last error:{" "}
                      {plugin.errorLog[plugin.errorLog.length - 1].message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    By{" "}
                    {typeof plugin.manifest.author === "string"
                      ? plugin.manifest.author
                      : plugin.manifest.author?.name || "Unknown"}
                  </span>
                  <span>
                    {plugin.routes.length} routes, {plugin.hooks.length} hooks
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlugins.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No plugins found</h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your filters or search query"
              : "Get started by installing your first plugin"}
          </p>
        </div>
      )}

      {/* Configuration Modal */}
      {configModalPlugin && (
        <PluginConfigModal
          plugin={configModalPlugin}
          isOpen={true}
          onClose={() => setConfigModalPlugin(null)}
          onSave={handleConfigSave}
          isLoading={actionLoading === configModalPlugin.pluginId}
        />
      )}
    </div>
  );
};

// Plugin Configuration Modal Component
const PluginConfigModal: React.FC<PluginConfigModalProps> = ({
  plugin,
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [config, setConfig] = useState(plugin.config || {});

  const handleSave = async () => {
    await onSave(config);
  };

  const renderConfigField = (key: string, fieldSchema: any) => {
    const value = config[key] ?? fieldSchema.default;

    switch (fieldSchema.type) {
      case "boolean":
        return (
          <div key={key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{fieldSchema.title}</Label>
              {fieldSchema.description && (
                <p className="text-sm text-muted-foreground">
                  {fieldSchema.description}
                </p>
              )}
            </div>
            <Switch
              checked={value}
              onCheckedChange={(checked) =>
                setConfig({ ...config, [key]: checked })
              }
            />
          </div>
        );

      case "string":
      case "number":
        return (
          <div key={key} className="space-y-2">
            <Label>{fieldSchema.title}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground">
                {fieldSchema.description}
              </p>
            )}
            <Input
              type={fieldSchema.type === "number" ? "number" : "text"}
              value={value || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  [key]:
                    fieldSchema.type === "number"
                      ? Number(e.target.value)
                      : e.target.value,
                })
              }
            />
          </div>
        );

      case "textarea":
        return (
          <div key={key} className="space-y-2">
            <Label>{fieldSchema.title}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground">
                {fieldSchema.description}
              </p>
            )}
            <Textarea
              value={value || ""}
              onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
            />
          </div>
        );

      case "select":
        return (
          <div key={key} className="space-y-2">
            <Label>{fieldSchema.title}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground">
                {fieldSchema.description}
              </p>
            )}
            <Select
              value={value}
              onValueChange={(newValue) =>
                setConfig({ ...config, [key]: newValue })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldSchema.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div key={key} className="space-y-2">
            <Label>{fieldSchema.title}</Label>
            <Input
              value={JSON.stringify(value)}
              onChange={(e) => {
                try {
                  setConfig({ ...config, [key]: JSON.parse(e.target.value) });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {plugin.name}</DialogTitle>
          <DialogDescription>
            Adjust plugin settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {plugin.manifest.settings?.schema &&
            Object.entries(plugin.manifest.settings.schema).map(
              ([key, fieldSchema]) => renderConfigField(key, fieldSchema)
            )}

          {!plugin.manifest.settings?.schema && (
            <div className="text-center py-8">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No Configuration Available
              </h3>
              <p className="text-muted-foreground">
                This plugin doesn't have any configurable settings.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !plugin.manifest.settings?.schema}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Upload Modal Component
const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isLoading,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [activate, setActivate] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a plugin file");
      return;
    }

    try {
      setError(null);
      await onUpload(file, { overwrite, activate });

      // Reset form
      setFile(null);
      setOverwrite(false);
      setActivate(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install Plugin</DialogTitle>
          <DialogDescription>
            Upload a plugin ZIP file to install it
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plugin-file">Plugin File</Label>
            <Input
              id="plugin-file"
              type="file"
              accept=".zip"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Select a ZIP file containing the plugin
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="overwrite"
                checked={overwrite}
                onCheckedChange={setOverwrite}
              />
              <Label htmlFor="overwrite">Overwrite if exists</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activate"
                checked={activate}
                onCheckedChange={setActivate}
              />
              <Label htmlFor="activate">Activate after installation</Label>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !file}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Install Plugin
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PluginManager;
