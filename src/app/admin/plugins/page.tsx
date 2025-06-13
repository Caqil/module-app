"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Puzzle,
  Play,
  Square,
  Settings,
  Trash2,
  Shield,
  Loader2,
  Plus,
  Search,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import { ApiResponse } from "@/types/global";

interface Plugin {
  id: string;
  pluginId: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  category: string;
  isActive: boolean;
  status: "installed" | "installing" | "error";
  permissions: string[];
  routes?: Array<{
    path: string;
    method: string;
  }>;
  adminPages?: Array<{
    path: string;
    title: string;
  }>;
  dashboardWidgets?: Array<{
    id: string;
    title: string;
    size: string;
  }>;
  configuration?: Record<string, any>;
  installedAt: string;
  activatedAt?: string;
}

const uploadSchema = z.object({
  file: z.any().refine((file) => file?.length > 0, "Plugin file is required"),
  overwrite: z.boolean().optional().default(false),
  activate: z.boolean().optional().default(true),
});

type UploadFormData = z.infer<typeof uploadSchema>;

const PERMISSION_RISK_LEVELS = {
  "database:read": "medium",
  "database:write": "high",
  "api:create": "high",
  "admin:access": "high",
  "users:read": "medium",
  "users:write": "high",
  "files:read": "low",
  "files:write": "medium",
  "settings:read": "low",
  "settings:write": "high",
  "plugins:manage": "high",
  "themes:manage": "medium",
} as const;

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const uploadForm = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      overwrite: false,
      activate: true,
    },
  });

  useEffect(() => {
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

  const handleActivate = async (pluginId: string) => {
    try {
      setActionLoading(pluginId);
      const response = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchPlugins();
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

  const handleDeactivate = async (pluginId: string) => {
    try {
      setActionLoading(pluginId);
      const response = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchPlugins();
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

  const openConfiguration = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setConfigOpen(true);
  };

  const getPermissionRiskColor = (permission: string) => {
    const risk =
      PERMISSION_RISK_LEVELS[permission as keyof typeof PERMISSION_RISK_LEVELS];
    switch (risk) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || plugin.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set(plugins.map((plugin) => plugin.category))
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Plugins</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-3 w-1/2 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Plugins</h1>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Install Plugin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Install New Plugin</DialogTitle>
              <DialogDescription>
                Upload a plugin ZIP file to install it on your site.
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
                <FormField
                  control={uploadForm.control}
                  name="overwrite"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Overwrite if exists</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={uploadForm.control}
                  name="activate"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Activate after installation</FormLabel>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={actionLoading === "upload"}>
                    {actionLoading === "upload" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Install Plugin
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Plugins Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlugins.map((plugin) => (
          <Card key={plugin.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Puzzle className="h-5 w-5" />
                  <span>{plugin.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {plugin.isActive && <Badge>Active</Badge>}
                  <Badge
                    variant={
                      plugin.status === "installed" ? "default" : "secondary"
                    }
                  >
                    {plugin.status}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>{plugin.description}</CardDescription>
              <div className="text-sm text-muted-foreground">
                v{plugin.version} by {plugin.author.name}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Permissions */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Permissions
                </div>
                <div className="flex flex-wrap gap-1">
                  {plugin.permissions.slice(0, 3).map((permission, idx) => (
                    <Badge
                      key={idx}
                      variant={getPermissionRiskColor(permission) as any}
                      className="text-xs"
                    >
                      {permission.split(":")[1]}
                    </Badge>
                  ))}
                  {plugin.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{plugin.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="text-sm font-medium mb-2">Features</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {plugin.routes && plugin.routes.length > 0 && (
                    <div>• {plugin.routes.length} API route(s)</div>
                  )}
                  {plugin.adminPages && plugin.adminPages.length > 0 && (
                    <div>• {plugin.adminPages.length} admin page(s)</div>
                  )}
                  {plugin.dashboardWidgets &&
                    plugin.dashboardWidgets.length > 0 && (
                      <div>
                        • {plugin.dashboardWidgets.length} dashboard widget(s)
                      </div>
                    )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex space-x-2">
                  {plugin.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(plugin.id)}
                      disabled={actionLoading === plugin.id}
                    >
                      {actionLoading === plugin.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleActivate(plugin.id)}
                      disabled={actionLoading === plugin.id}
                    >
                      {actionLoading === plugin.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openConfiguration(plugin)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUninstall(plugin.id)}
                  disabled={actionLoading === plugin.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Configure {selectedPlugin?.name}</DialogTitle>
            <DialogDescription>
              Manage plugin settings and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedPlugin && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium">Plugin Name</label>
                    <Input value={selectedPlugin.name} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={selectedPlugin.description} disabled />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Version</label>
                      <Input value={selectedPlugin.version} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Input value={selectedPlugin.category} disabled />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Author</label>
                    <Input value={selectedPlugin.author.name} disabled />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-3">
                  {selectedPlugin.permissions.map((permission, idx) => {
                    const risk =
                      PERMISSION_RISK_LEVELS[
                        permission as keyof typeof PERMISSION_RISK_LEVELS
                      ];
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {risk === "high" ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : risk === "medium" ? (
                            <Info className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <div>
                            <div className="font-medium">{permission}</div>
                            <div className="text-sm text-muted-foreground">
                              Risk level: {risk}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={getPermissionRiskColor(permission) as any}
                        >
                          {risk}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              <TabsContent value="features" className="space-y-4">
                <div className="grid gap-6">
                  {selectedPlugin.routes &&
                    selectedPlugin.routes.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">API Routes</h4>
                        <div className="space-y-2">
                          {selectedPlugin.routes.map((route, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-3 p-2 border rounded"
                            >
                              <Badge variant="outline">{route.method}</Badge>
                              <code className="text-sm">{route.path}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  {selectedPlugin.adminPages &&
                    selectedPlugin.adminPages.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Admin Pages</h4>
                        <div className="space-y-2">
                          {selectedPlugin.adminPages.map((page, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <span>{page.title}</span>
                              <code className="text-sm">{page.path}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  {selectedPlugin.dashboardWidgets &&
                    selectedPlugin.dashboardWidgets.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Dashboard Widgets</h4>
                        <div className="space-y-2">
                          {selectedPlugin.dashboardWidgets.map(
                            (widget, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 border rounded"
                              >
                                <span>{widget.title}</span>
                                <Badge variant="outline">{widget.size}</Badge>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Plugin-specific configuration settings would be displayed
                  here.
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>
              Cancel
            </Button>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
