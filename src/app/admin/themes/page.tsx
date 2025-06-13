"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconPalette,
  IconPlus,
  IconSearch,
  IconSettings,
  IconDownload,
  IconTrash,
  IconUpload,
  IconCircleCheckFilled,
  IconLoader,
  IconEye,
  IconColorSwatch,
  IconBrush,
  IconPhoto,
  IconGrid3x3,
  IconList,
  IconStar,
  IconHeart,
} from "@tabler/icons-react";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ApiResponse } from "@/types/global";
import { AppSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

interface Theme {
  _id: string;
  themeId: string;
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
    author: {
      name: string;
      email: string;
    };
    compatibility: {
      nextjs: string;
      app: string;
    };
    preview?: string;
    tags?: string[];
    colors?: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  customization?: Record<string, any>;
  activatedAt?: Date;
  installedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const uploadSchema = z.object({
  file: z.any().refine((file) => file?.length > 0, "Theme file is required"),
  overwrite: z.boolean(),
  activate: z.boolean(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "business": return "💼";
    case "portfolio": return "👤";
    case "blog": return "📖";
    case "ecommerce": return "🛒";
    case "landing": return "🚀";
    case "dashboard": return "📊";
    case "minimal": return "⚪";
    case "creative": return "🎨";
    default: return "🎨";
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "business": return "default";
    case "portfolio": return "secondary";
    case "blog": return "outline";
    case "ecommerce": return "default";
    case "landing": return "secondary";
    case "dashboard": return "outline";
    case "minimal": return "secondary";
    case "creative": return "default";
    default: return "outline";
  }
};

export default function ThemesPage() {
  const [themes, setThemes] = React.useState<Theme[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [selectedTheme, setSelectedTheme] = React.useState<Theme | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
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
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/themes", {
        credentials: "include",
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.success && data.data?.themes) {
          setThemes(data.data.themes);
          setError(null);
        } else {
          setError(data.error || "Failed to load themes");
        }
      } else {
        setError("Failed to fetch themes");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Themes fetch error:", err);
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

      const response = await fetch("/api/admin/themes/install", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setUploadOpen(false);
        uploadForm.reset();
        fetchThemes();
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed");
      console.error("Theme upload error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateTheme = async (themeId: string) => {
    try {
      setActionLoading(themeId);
      const response = await fetch(`/api/admin/themes/${themeId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchThemes();
      } else {
        setError(result.error || "Activation failed");
      }
    } catch (err) {
      setError("Activation failed");
      console.error("Theme activation error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUninstall = async (themeId: string) => {
    if (!confirm("Are you sure you want to uninstall this theme?")) return;

    try {
      setActionLoading(themeId);
      const response = await fetch(`/api/admin/themes/${themeId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchThemes();
      } else {
        setError(result.error || "Uninstall failed");
      }
    } catch (err) {
      setError("Uninstall failed");
      console.error("Theme uninstall error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredThemes = themes.filter((theme) => {
    const matchesSearch = 
      theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theme.manifest.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || theme.manifest.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(themes.map(t => t.manifest.category)));
  const activeTheme = themes.find(t => t.isActive);
  const totalThemes = themes.length;

  const ThemeCard = ({ theme }: { theme: Theme }) => {
    const isCurrentlyActive = theme.isActive;
    
    return (
      <Card className={`group hover:shadow-md transition-shadow ${isCurrentlyActive ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader>
          <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-md mb-3 flex items-center justify-center relative overflow-hidden">
            {theme.manifest.preview ? (
              <img 
                src={theme.manifest.preview} 
                alt={`${theme.name} preview`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl">{getCategoryIcon(theme.manifest.category)}</div>
            )}
            {isCurrentlyActive && (
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="text-xs">
                  <IconCircleCheckFilled className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedTheme(theme);
                  setPreviewOpen(true);
                }}
              >
                <IconEye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{theme.name}</CardTitle>
              <CardDescription className="text-sm">
                v{theme.version} • {theme.manifest.category}
              </CardDescription>
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
                <DropdownMenuItem onClick={() => {
                  setSelectedTheme(theme);
                  setPreviewOpen(true);
                }}>
                  <IconEye className="w-4 h-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                {!isCurrentlyActive && (
                  <DropdownMenuItem 
                    onClick={() => handleActivateTheme(theme.themeId)}
                    disabled={actionLoading === theme.themeId}
                  >
                    <IconCircleCheckFilled className="w-4 h-4 mr-2" />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <IconSettings className="w-4 h-4 mr-2" />
                  Customize
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleUninstall(theme.themeId)}
                  disabled={actionLoading === theme.themeId || isCurrentlyActive}
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
            {theme.manifest.description}
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Category</span>
              <Badge variant={getCategoryColor(theme.manifest.category)} className="text-xs">
                {theme.manifest.category.charAt(0).toUpperCase() + theme.manifest.category.slice(1)}
              </Badge>
            </div>
            {theme.manifest.colors && (
              <div>
                <span className="text-sm font-medium">Colors</span>
                <div className="flex gap-1 mt-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-border" 
                    style={{ backgroundColor: theme.manifest.colors.primary }}
                    title="Primary"
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-border" 
                    style={{ backgroundColor: theme.manifest.colors.secondary }}
                    title="Secondary"
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-border" 
                    style={{ backgroundColor: theme.manifest.colors.accent }}
                    title="Accent"
                  />
                </div>
              </div>
            )}
            {theme.manifest.tags && theme.manifest.tags.length > 0 && (
              <div>
                <span className="text-sm font-medium">Tags</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {theme.manifest.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {theme.manifest.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{theme.manifest.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="w-full">
            <div className="text-xs text-muted-foreground mb-2">
              By {theme.manifest.author.name} • Installed {new Date(theme.createdAt).toLocaleDateString()}
            </div>
            {!isCurrentlyActive && (
              <Button 
                className="w-full" 
                size="sm"
                onClick={() => handleActivateTheme(theme.themeId)}
                disabled={actionLoading === theme.themeId}
              >
                {actionLoading === theme.themeId ? (
                  <>
                    <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <IconCircleCheckFilled className="w-4 h-4 mr-2" />
                    Activate Theme
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Themes</CardTitle>
                  <IconPalette className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalThemes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Theme</CardTitle>
                  <IconCircleCheckFilled className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeTheme ? '1' : '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeTheme ? activeTheme.name : 'No active theme'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <IconColorSwatch className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Theme categories
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customization</CardTitle>
                  <IconBrush className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Available</div>
                  <p className="text-xs text-muted-foreground">
                    Full theme control
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Themes</h1>
                <p className="text-muted-foreground">
                  Customize your application's appearance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ToggleGroup type="single" value={viewMode} onValueChange={(value: "grid" | "list") => value && setViewMode(value)}>
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
                      Install Theme
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Install New Theme</DialogTitle>
                      <DialogDescription>
                        Upload a theme ZIP file to install it on your system.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...uploadForm}>
                      <form onSubmit={uploadForm.handleSubmit(handleUpload)} className="space-y-4">
                        <FormField
                          control={uploadForm.control}
                          name="file"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Theme File</FormLabel>
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
                                  <FormLabel className="text-base">Overwrite</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Replace existing theme
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
                                  <FormLabel className="text-base">Activate</FormLabel>
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
                          <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={actionLoading === "upload"}>
                            {actionLoading === "upload" ? (
                              <>
                                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                                Installing...
                              </>
                            ) : (
                              <>
                                <IconUpload className="w-4 h-4 mr-2" />
                                Install Theme
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
                  placeholder="Search themes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
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
            </div>

            {/* Error Display */}
            {error && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Error</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={fetchThemes} variant="outline">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Themes Grid */}
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="aspect-video bg-muted rounded-md mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
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
            ) : filteredThemes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <IconPalette className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No themes found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || categoryFilter !== "all"
                      ? "No themes match your current filters."
                      : "You haven't installed any themes yet."}
                  </p>
                  <Button onClick={() => setUploadOpen(true)}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Install Your First Theme
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredThemes.map((theme) => (
                  <ThemeCard key={theme._id} theme={theme} />
                ))}
              </div>
            )}

            {/* Theme Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{selectedTheme?.name} Preview</DialogTitle>
                  <DialogDescription>
                    Preview how this theme will look on your site
                  </DialogDescription>
                </DialogHeader>
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  {selectedTheme?.manifest.preview ? (
                    <img 
                      src={selectedTheme.manifest.preview} 
                      alt={`${selectedTheme.name} preview`}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="text-center">
                      <IconPhoto className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No preview available</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                    Close
                  </Button>
                  {selectedTheme && !selectedTheme.isActive && (
                    <Button onClick={() => {
                      handleActivateTheme(selectedTheme.themeId);
                      setPreviewOpen(false);
                    }}>
                      <IconCircleCheckFilled className="w-4 h-4 mr-2" />
                      Activate Theme
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}