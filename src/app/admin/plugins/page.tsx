"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconPuzzle,
  IconPlus,
  IconSearch,
  IconSettings,
  IconPower,
  IconTrash,
  IconUpload,
  IconCircleCheckFilled,
  IconLoader,
  IconShield,
  IconDatabase,
  IconApi,
  IconUsers,
  IconFile,
  IconAlertTriangle,
  IconFilter,
  IconGrid3x3,
  IconList,
  IconX,
} from "@tabler/icons-react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { ApiResponse } from "@/types/global";
import { AppSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

interface Plugin {
  _id: string;
  pluginId: string;
  name: string;
  version: string;
  status: "installed" | "installing" | "failed" | "disabled";
  isActive: boolean;
  manifest: {
    id: string;
    name: string;
    version: string;
    description: string;
    category: string;
    permissions: string[];
    author: {
      name: string;
      email: string;
    };
    adminPages?: Array<{
      path: string;
      title: string;
    }>;
    dashboardWidgets?: Array<{
      id: string;
      title: string;
      size: string;
    }>;
    settings?: {
      schema: Record<string, any>;
      defaults: Record<string, any>;
    };
  };
  config?: Record<string, any>;
  lastActivated?: Date;
  installedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const uploadSchema = z.object({
  file: z.any().refine((file) => file?.length > 0, "Plugin file is required"),
  overwrite: z.boolean(),
  activate: z.boolean(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

// Add configuration modal component
const ConfigurationModal = ({
  plugin,
  isOpen,
  onClose,
  onSave,
  isLoading,
}: {
  plugin: Plugin;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Record<string, any>) => Promise<void>;
  isLoading: boolean;
}) => {
  const [config, setConfig] = React.useState<Record<string, any>>(
    plugin.config || plugin.manifest.settings?.defaults || {}
  );

  const handleSave = async () => {
    await onSave(config);
  };

  const renderConfigField = (key: string, value: any, schemaField?: any) => {
    const currentValue = config[key] ?? value;

    // Determine field type from schema or value
    const fieldType = schemaField?.type || typeof value;
    const fieldDescription = schemaField?.description;
    const fieldLabel =
      schemaField?.title || key.charAt(0).toUpperCase() + key.slice(1);

    switch (fieldType) {
      case "boolean":
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor={key}>{fieldLabel}</Label>
                {fieldDescription && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {fieldDescription}
                  </p>
                )}
              </div>
              <Switch
                id={key}
                checked={currentValue}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, [key]: checked })
                }
              />
            </div>
          </div>
        );

      case "number":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{fieldLabel}</Label>
            {fieldDescription && (
              <p className="text-sm text-muted-foreground">
                {fieldDescription}
              </p>
            )}
            <Input
              id={key}
              type="number"
              value={currentValue}
              onChange={(e) =>
                setConfig({ ...config, [key]: Number(e.target.value) })
              }
            />
          </div>
        );

      case "object":
        if (schemaField?.enum) {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{fieldLabel}</Label>
              {fieldDescription && (
                <p className="text-sm text-muted-foreground">
                  {fieldDescription}
                </p>
              )}
              <Select
                value={currentValue}
                onValueChange={(value) =>
                  setConfig({ ...config, [key]: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schemaField.enum.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        // For complex objects, show as JSON
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{fieldLabel}</Label>
            {fieldDescription && (
              <p className="text-sm text-muted-foreground">
                {fieldDescription}
              </p>
            )}
            <Textarea
              id={key}
              value={JSON.stringify(currentValue, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig({ ...config, [key]: parsed });
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              rows={4}
            />
          </div>
        );

      default: // string or text
        const isLongText =
          schemaField?.format === "textarea" ||
          (typeof currentValue === "string" && currentValue.length > 100);

        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{fieldLabel}</Label>
            {fieldDescription && (
              <p className="text-sm text-muted-foreground">
                {fieldDescription}
              </p>
            )}
            {isLongText ? (
              <Textarea
                id={key}
                value={currentValue}
                onChange={(e) =>
                  setConfig({ ...config, [key]: e.target.value })
                }
                rows={3}
              />
            ) : (
              <Input
                id={key}
                value={currentValue}
                onChange={(e) =>
                  setConfig({ ...config, [key]: e.target.value })
                }
              />
            )}
          </div>
        );
    }
  };

  const schema = plugin.manifest.settings?.schema || {};
  const defaults = plugin.manifest.settings?.defaults || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSettings className="w-5 h-5" />
            Configure {plugin.name}
          </DialogTitle>
          <DialogDescription>
            Adjust the plugin settings below. Changes will be applied
            immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {Object.keys(defaults).length === 0 &&
          Object.keys(schema).length === 0 ? (
            <div className="text-center py-8">
              <IconSettings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Configuration Options
              </h3>
              <p className="text-muted-foreground">
                This plugin doesn't have any configurable settings.
              </p>
            </div>
          ) : (
            <>
              {/* Render schema-defined fields first */}
              {Object.entries(schema).map(([key, schemaField]) =>
                renderConfigField(key, defaults[key], schemaField)
              )}

              {/* Render default fields that aren't in schema */}
              {Object.entries(defaults)
                .filter(([key]) => !schema[key])
                .map(([key, value]) => renderConfigField(key, value))}

              {/* Render current config fields that aren't in defaults or schema */}
              {Object.entries(config)
                .filter(([key]) => !defaults[key] && !schema[key])
                .map(([key, value]) => renderConfigField(key, value))}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const getPermissionIcon = (permission: string) => {
  if (permission.includes("database")) return IconDatabase;
  if (permission.includes("api")) return IconApi;
  if (permission.includes("users")) return IconUsers;
  if (permission.includes("admin")) return IconShield;
  if (permission.includes("files")) return IconFile;
  return IconShield;
};

const getPermissionVariant = (permission: string) => {
  if (
    permission.includes("write") ||
    permission.includes("manage") ||
    permission.includes("admin")
  ) {
    return "destructive";
  }
  if (permission.includes("create") || permission.includes("modify")) {
    return "default";
  }
  return "secondary";
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "analytics":
      return "📊";
    case "utility":
      return "🔧";
    case "marketing":
      return "📈";
    case "security":
      return "🔒";
    case "content":
      return "📝";
    case "commerce":
      return "🛒";
    default:
      return "🧩";
  }
};

export default function PluginsPage() {
  const [plugins, setPlugins] = React.useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [selectedPlugin, setSelectedPlugin] = React.useState<Plugin | null>(
    null
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const uploadForm = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      overwrite: false,
      activate: true,
    },
  });

  React.useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/plugins", {
        credentials: "include",
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.success && data.data?.plugins) {
          setPlugins(data.data.plugins);
          setError(null);
        } else {
          setError(data.error || "Failed to load plugins");
        }
      } else {
        setError("Failed to fetch plugins");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Plugins fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (data: UploadFormData) => {
    try {
      setActionLoading("upload");
      const formData = new FormData();
      formData.append("file", data.file[0]);
      formData.append("overwrite", data.overwrite.toString());
      formData.append("activate", data.activate.toString());

      const response = await fetch("/api/admin/plugins/install", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setUploadOpen(false);
        uploadForm.reset();
        fetchPlugins();
        // Notify sidebar of plugin state change
        window.dispatchEvent(new CustomEvent("pluginStateChanged"));
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed");
      console.error("Plugin upload error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePlugin = async (
    pluginId: string,
    currentlyActive: boolean
  ) => {
    try {
      setActionLoading(pluginId);
      const action = currentlyActive ? "deactivate" : "activate";

      const response = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchPlugins();
        // Notify sidebar of plugin state change
        window.dispatchEvent(new CustomEvent("pluginStateChanged"));
      } else {
        setError(result.error || `${action} failed`);
      }
    } catch (err) {
      setError("Action failed");
      console.error("Plugin action error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfigure = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setConfigOpen(true);
  };

  const handleSaveConfiguration = async (config: Record<string, any>) => {
    if (!selectedPlugin) return;

    try {
      setActionLoading("configure");
      const response = await fetch(
        `/api/admin/plugins/${selectedPlugin.pluginId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "configure",
            config,
          }),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.success) {
        setConfigOpen(false);
        setSelectedPlugin(null);
        fetchPlugins();
        // Notify sidebar of plugin state change
        window.dispatchEvent(new CustomEvent("pluginStateChanged"));
      } else {
        setError(result.error || "Configuration failed");
      }
    } catch (err) {
      setError("Configuration failed");
      console.error("Plugin configure error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    if (!confirm("Are you sure you want to uninstall this plugin?")) return;

    try {
      setActionLoading(pluginId);
      const response = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchPlugins();
        // Notify sidebar of plugin state change
        window.dispatchEvent(new CustomEvent("pluginStateChanged"));
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

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.manifest.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || plugin.manifest.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && plugin.isActive) ||
      (statusFilter === "inactive" && !plugin.isActive) ||
      (statusFilter === "failed" && plugin.status === "failed");

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(
    new Set(plugins.map((p) => p.manifest.category))
  );
  const activePlugins = plugins.filter((p) => p.isActive).length;
  const totalPlugins = plugins.length;

  const PluginCard = ({ plugin }: { plugin: Plugin }) => {
    const Icon = getPermissionIcon(plugin.manifest.permissions[0] || "");

    return (
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {getCategoryIcon(plugin.manifest.category)}
              </div>
              <div>
                <CardTitle className="text-lg">{plugin.name}</CardTitle>
                <CardDescription className="text-sm">
                  v{plugin.version} • {plugin.manifest.category}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconSettings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleConfigure(plugin)}>
                  <IconSettings className="w-4 h-4 mr-2" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    handleTogglePlugin(plugin.pluginId, plugin.isActive)
                  }
                  disabled={actionLoading === plugin.pluginId}
                >
                  {plugin.isActive ? (
                    <>
                      <IconPower className="w-4 h-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <IconCircleCheckFilled className="w-4 h-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleUninstall(plugin.pluginId)}
                  disabled={actionLoading === plugin.pluginId}
                  className="text-destructive"
                >
                  <IconTrash className="w-4 h-4 mr-2" />
                  Uninstall
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {plugin.manifest.description}
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              {plugin.status === "installed" && plugin.isActive ? (
                <Badge variant="default" className="text-xs">
                  <IconCircleCheckFilled className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : plugin.status === "installed" && !plugin.isActive ? (
                <Badge variant="secondary" className="text-xs">
                  <IconPower className="w-3 h-3 mr-1" />
                  Inactive
                </Badge>
              ) : plugin.status === "installing" ? (
                <Badge variant="outline" className="text-xs">
                  <IconLoader className="w-3 h-3 mr-1 animate-spin" />
                  Installing
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <IconAlertTriangle className="w-3 h-3 mr-1" />
                  Failed
                </Badge>
              )}
            </div>

            {plugin.manifest.permissions &&
              plugin.manifest.permissions.length > 0 && (
                <div>
                  <span className="text-sm font-medium mb-2 block">
                    Permissions
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {plugin.manifest.permissions
                      .slice(0, 3)
                      .map((permission) => (
                        <Badge
                          key={permission}
                          variant={getPermissionVariant(permission) as any}
                          className="text-xs"
                        >
                          {permission.split(":")[1] || permission}
                        </Badge>
                      ))}
                    {plugin.manifest.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{plugin.manifest.permissions.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex-1 space-y-4 p-4 pt-6">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setError(null)}
              >
                <IconX className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Plugins
                </CardTitle>
                <IconPuzzle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPlugins}</div>
                <p className="text-xs text-muted-foreground">
                  Installed plugins
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Plugins
                </CardTitle>
                <IconCircleCheckFilled className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePlugins}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Health
                </CardTitle>
                <IconShield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All plugins stable
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Plugins</h1>
              <p className="text-muted-foreground">
                Manage and configure system plugins
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value: "grid" | "list") =>
                  value && setViewMode(value)
                }
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <IconGrid3x3 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <IconList className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
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
                      Upload a plugin ZIP file to install it on your system.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...uploadForm}>
                    <form
                      onSubmit={uploadForm.handleSubmit(handleUpload)}
                      className="space-y-4"
                    >
                      <FormField
                        control={uploadForm.control}
                        name="file"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plugin File</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept=".zip"
                                onChange={(e) => field.onChange(e.target.files)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={uploadForm.control}
                          name="overwrite"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Overwrite
                                </FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Replace if exists
                                </div>
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
                          control={uploadForm.control}
                          name="activate"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Activate
                                </FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Activate after install
                                </div>
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
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setUploadOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={actionLoading === "upload"}
                        >
                          {actionLoading === "upload" ? (
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
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <IconFilter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plugins Grid/List */}
          <div>
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-muted rounded"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPlugins.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <IconPuzzle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No plugins found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ||
                    categoryFilter !== "all" ||
                    statusFilter !== "all"
                      ? "No plugins match your current filters."
                      : "You haven't installed any plugins yet."}
                  </p>
                  <Button onClick={() => setUploadOpen(true)}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Install Your First Plugin
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-4"
                }
              >
                {filteredPlugins.map((plugin) => (
                  <PluginCard key={plugin._id} plugin={plugin} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Modal */}
        {selectedPlugin && (
          <ConfigurationModal
            plugin={selectedPlugin}
            isOpen={configOpen}
            onClose={() => {
              setConfigOpen(false);
              setSelectedPlugin(null);
            }}
            onSave={handleSaveConfiguration}
            isLoading={actionLoading === "configure"}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
