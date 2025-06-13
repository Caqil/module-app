"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Download,
  Palette,
  Settings,
  Play,
  Square,
  Trash2,
  FileArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiResponse } from "@/types/global";
import { formatDate } from "@/lib/utils";
import { InstalledTheme } from "@/types/theme";

export function ThemeManager() {
  const [themes, setThemes] = useState<InstalledTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
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
        }
      } else {
        setError("Failed to load themes");
      }
    } catch (error) {
      setError("Network error loading themes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("activate", "false");
      formData.append("overwrite", "false");

      const response = await fetch("/api/admin/themes/install", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Theme ${file.name} uploaded successfully`);
        fetchThemes();
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (error) {
      setError("Network error during upload");
    } finally {
      setUploadLoading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleThemeAction = async (themeId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/themes/${themeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || `Theme ${action} successful`);
        fetchThemes();
      } else {
        setError(data.error || `Theme ${action} failed`);
      }
    } catch (error) {
      setError("Network error");
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm("Are you sure you want to delete this theme?")) return;

    try {
      const response = await fetch(`/api/admin/themes/${themeId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        setSuccess("Theme deleted successfully");
        fetchThemes();
      } else {
        setError(data.error || "Delete failed");
      }
    } catch (error) {
      setError("Network error during delete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Theme Manager</h2>
          <p className="text-muted-foreground">
            Install, activate, and manage themes
          </p>
        </div>

        {/* Upload Button */}
        <div className="relative">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            disabled={uploadLoading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button disabled={uploadLoading}>
            {uploadLoading ? (
              <>
                <FileArchive className="mr-2 h-4 w-4 animate-pulse" />
                Installing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Theme
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Themes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : themes.length > 0 ? (
          themes.map((theme) => (
            <Card
              key={theme.themeId}
              className={theme.isActive ? "ring-2 ring-primary" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {theme.name}
                  </CardTitle>
                  <Badge variant={theme.isActive ? "default" : "secondary"}>
                    {theme.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>
                  Version {theme.version} • {theme.manifest.author?.name}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {theme.manifest.description}
                </p>

                <div className="text-xs text-muted-foreground">
                  Installed {formatDate(theme.createdAt!)}
                </div>

                <div className="flex gap-2">
                  {theme.isActive ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleThemeAction(theme.themeId, "deactivate")
                      }
                    >
                      <Square className="mr-2 h-3 w-3" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleThemeAction(theme.themeId, "activate")
                      }
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Activate
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleThemeAction(theme.themeId, "customize")
                    }
                  >
                    <Settings className="mr-2 h-3 w-3" />
                    Customize
                  </Button>

                  {!theme.isActive && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTheme(theme.themeId)}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Palette className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No themes installed
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your first theme to get started
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Theme
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
