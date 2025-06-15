// Step 1: Create the separate component file
// src/app/admin/plugins/components/PluginInstallForm.tsx

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Upload,
  Info,
} from "lucide-react";
import { IconFileZip } from "@tabler/icons-react";

// Enhanced validation schema
const uploadSchema = z.object({
  file: z
    .any()
    .refine((files) => files?.length === 1, "Plugin file is required")
    .refine(
      (files) => files?.[0]?.size <= 50 * 1024 * 1024,
      "File size must be less than 50MB"
    )
    .refine(
      (files) => files?.[0]?.name?.endsWith(".zip"),
      "Only ZIP files are allowed"
    ),
  activate: z.boolean(),
  overwrite: z.boolean(),
  skipValidation: z.boolean().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface PluginInstallFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const PluginInstallForm: React.FC<PluginInstallFormProps> = ({
  onSuccess,
  onError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      activate: true,
      overwrite: false,
      skipValidation: false,
    },
  });

  const watchedFile = form.watch("file");
  const fileInfo = watchedFile?.[0];

  const onSubmit = async (data: UploadFormData) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentStep("");
      onError(""); // Clear previous errors
      setDebugInfo(null);

      const file = data.file[0];

      console.log("🔄 Starting plugin installation...", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        activate: data.activate,
        overwrite: data.overwrite,
        skipValidation: data.skipValidation,
      });

      // Step 1: Client-side validation
      setCurrentStep("Validating file...");
      setUploadProgress(10);

      // Enhanced client-side validation
      if (!file.name.toLowerCase().endsWith(".zip")) {
        throw new Error("Only ZIP files are allowed");
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size exceeds 50MB limit");
      }

      if (file.size === 0) {
        throw new Error("File appears to be empty");
      }

      // Step 2: Prepare upload
      setCurrentStep("Preparing upload...");
      setUploadProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("activate", data.activate.toString());
      formData.append("overwrite", data.overwrite.toString());

      if (data.skipValidation) {
        formData.append("skipValidation", "true");
      }

      // Step 3: Upload and install
      setCurrentStep("Uploading to server...");
      setUploadProgress(30);

      const startTime = Date.now();
      const response = await fetch("/api/admin/plugins/install", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const uploadTime = Date.now() - startTime;
      console.log(`📡 Upload completed in ${uploadTime}ms`, {
        status: response.status,
        statusText: response.statusText,
      });

      setUploadProgress(70);

      // Step 4: Process response
      setCurrentStep("Processing server response...");
      setUploadProgress(80);

      let result;
      const responseText = await response.text();

      // Enhanced response debugging
      setDebugInfo({
        requestDuration: uploadTime,
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseSize: responseText.length,
        responsePreview: responseText.substring(0, 500),
      });

      try {
        result = JSON.parse(responseText);
        console.log("✅ Response parsed successfully:", result);
      } catch (parseError) {
        console.error("❌ Failed to parse response:", {
          error: parseError,
          responseText: responseText.substring(0, 1000),
          responseLength: responseText.length,
        });
        throw new Error(
          `Server returned invalid JSON response. Status: ${response.status}. Response: ${responseText.substring(0, 200)}...`
        );
      }

      if (!response.ok) {
        const errorMessage =
          result?.error ||
          result?.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        console.error("❌ Server error:", {
          status: response.status,
          error: errorMessage,
          fullResponse: result,
        });

        throw new Error(errorMessage);
      }

      if (!result.success) {
        console.error("❌ Installation failed:", result);
        throw new Error(
          result.error || "Installation failed for unknown reason"
        );
      }

      // Step 5: Success
      setCurrentStep("Installation completed!");
      setUploadProgress(100);

      console.log("✅ Plugin installed successfully:", {
        pluginInfo: result.data?.plugin,
        message: result.message,
      });

      // Emit custom event for real-time updates
      if (typeof window !== "undefined") {
        const pluginId = result.data?.plugin?.pluginId;
        window.dispatchEvent(
          new CustomEvent("pluginInstalled", {
            detail: {
              pluginId,
              plugin: result.data?.plugin,
              timestamp: new Date().toISOString(),
            },
          })
        );
      }

      // Reset form and show success
      form.reset();
      setTimeout(() => {
        onSuccess();
        setCurrentStep("");
        setUploadProgress(0);
        setDebugInfo(null);
      }, 2000);
    } catch (err) {
      console.error("❌ Plugin installation error:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";

      // Enhanced error logging
      console.error("💥 Full error details:", {
        error: err,
        fileInfo: fileInfo
          ? {
              name: fileInfo.name,
              size: fileInfo.size,
              type: fileInfo.type,
              lastModified: new Date(fileInfo.lastModified).toISOString(),
            }
          : null,
        formData: data,
        debugInfo,
      });

      onError(errorMessage);
      setCurrentStep("");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* File Upload Field */}
          <FormField
            control={form.control}
            name="file"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <IconFileZip className="h-4 w-4" />
                  Plugin File
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".zip"
                      onChange={(e) => onChange(e.target.files)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      {...field}
                    />
                    {fileInfo && (
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <IconFileZip className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{fileInfo.name}</span>
                          </div>
                          <Badge variant="secondary">
                            {(fileInfo.size / (1024 * 1024)).toFixed(2)} MB
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Last modified:{" "}
                          {new Date(fileInfo.lastModified).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Select a .zip file containing the plugin (max 50MB)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Basic Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="activate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-activate</FormLabel>
                    <FormDescription className="text-sm">
                      Activate plugin after installation
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Overwrite existing
                    </FormLabel>
                    <FormDescription className="text-sm">
                      Replace if plugin already exists
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
          </div>

          {/* Advanced Options */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </Button>

            {showAdvanced && (
              <FormField
                control={form.control}
                name="skipValidation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-yellow-200 p-4 shadow-sm bg-yellow-50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Skip validation
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Skip security validation (not recommended)
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
            )}
          </div>

          {/* Progress Display */}
          {isUploading && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{currentStep}</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <div className="text-xs text-muted-foreground">
                {uploadProgress}% complete
              </div>
            </div>
          )}

          {/* Debug Information */}
          {debugInfo && showAdvanced && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">
                    Debug Information
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isUploading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !watchedFile?.[0]}
              className="min-w-[140px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Install Plugin
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
