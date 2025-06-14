// src/components/setup/step-theme.tsx - Updated with default theme installation

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Palette,
  Loader2,
  CheckCircle,
  Zap,
  Star,
  Monitor,
  Sun,
  Moon,
  Sparkles,
  Brush,
  Layout,
  Type,
  Image,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  selectedTheme: z.string().min(1, "Please select a theme"),
  colorMode: z.enum(["light", "dark", "system"]).default("system"),
  customization: z
    .object({
      primaryColor: z.string().default("#0066cc"),
      enableAnimations: z.boolean().default(true),
      borderRadius: z
        .enum(["none", "small", "medium", "large"])
        .default("medium"),
    })
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SetupStepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
  data: any;
  isLoading: boolean;
}

// Available themes with enhanced information
const availableThemes = [
  {
    id: "default",
    name: "Default Theme",
    description: "Clean, modern design with Next.js styling principles",
    category: "minimal",
    features: [
      "Responsive Design",
      "Dark Mode",
      "Customizable Colors",
      "Performance Optimized",
    ],
    preview: "/themes/previews/default.jpg",
    colors: {
      primary: "#0066cc",
      secondary: "#6b7280",
      accent: "#f59e0b",
    },
    author: "Modular App Team",
    version: "1.0.0",
    isRecommended: true,
    isBuiltIn: true,
  },
  {
    id: "minimal",
    name: "Minimal Theme",
    description: "Ultra-clean design focusing on content and simplicity",
    category: "minimal",
    features: ["Ultra Clean", "Fast Loading", "Content Focus", "Typography"],
    preview: "/themes/previews/minimal.jpg",
    colors: {
      primary: "#000000",
      secondary: "#666666",
      accent: "#999999",
    },
    author: "Design Team",
    version: "1.0.0",
    isRecommended: false,
    isBuiltIn: true,
  },
  {
    id: "business",
    name: "Business Theme",
    description: "Professional design perfect for corporate applications",
    category: "business",
    features: [
      "Professional",
      "Corporate Ready",
      "Dashboard Focus",
      "Charts Ready",
    ],
    preview: "/themes/previews/business.jpg",
    colors: {
      primary: "#1f2937",
      secondary: "#374151",
      accent: "#3b82f6",
    },
    author: "Business Team",
    version: "1.0.0",
    isRecommended: false,
    isBuiltIn: true,
  },
];

const colorModes = [
  {
    id: "light",
    name: "Light",
    description: "Light theme for daytime use",
    icon: Sun,
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dark theme for comfortable viewing",
    icon: Moon,
  },
  {
    id: "system",
    name: "System",
    description: "Follow system preference",
    icon: Monitor,
  },
];

const primaryColors = [
  { name: "Blue", value: "#0066cc" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Gray", value: "#6b7280" },
];

const borderRadiusOptions = [
  { id: "none", name: "None", value: "0px", description: "Sharp corners" },
  {
    id: "small",
    name: "Small",
    value: "0.25rem",
    description: "Slightly rounded",
  },
  {
    id: "medium",
    name: "Medium",
    value: "0.5rem",
    description: "Moderately rounded",
  },
  { id: "large", name: "Large", value: "1rem", description: "Very rounded" },
];

export function StepTheme({ onNext, onPrev, data, isLoading }: SetupStepProps) {
  const [selectedTheme, setSelectedTheme] = useState(
    data?.selectedTheme || "default"
  );
  const [isInstalling, setIsInstalling] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedTheme: data?.selectedTheme || "default",
      colorMode: data?.colorMode || "system",
      customization: {
        primaryColor: data?.customization?.primaryColor || "#0066cc",
        enableAnimations: data?.customization?.enableAnimations ?? true,
        borderRadius: data?.customization?.borderRadius || "medium",
      },
    },
  });

  const handleNext = async () => {
    const formData = form.getValues();
    const selectedThemeData = availableThemes.find(
      (theme) => theme.id === formData.selectedTheme
    );

    setIsInstalling(true);

    // Prepare theme data for installation
    const themeData = {
      ...formData,
      theme: {
        selectedTheme: formData.selectedTheme,
        themeData: selectedThemeData,
        customization: {
          ...formData.customization,
          colors: {
            primary:
              formData.customization?.primaryColor ||
              selectedThemeData?.colors.primary,
            secondary: selectedThemeData?.colors.secondary,
            accent: selectedThemeData?.colors.accent,
          },
        },
      },
    };

    try {
      // Simulate theme installation process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onNext(themeData);
    } catch (error) {
      console.error("Theme installation failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const selectedThemeData = availableThemes.find(
    (theme) => theme.id === selectedTheme
  );
  const watchedValues = form.watch();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
            <Palette className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold">Choose Your Theme</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select a theme and customize it to match your brand. You can always
          change this later in the admin panel.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-8">
          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Available Themes
              </CardTitle>
              <CardDescription>
                Choose from our collection of built-in themes. Each theme is
                fully customizable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="selectedTheme"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedTheme(value);
                        }}
                        className="grid gap-4"
                      >
                        {availableThemes.map((theme) => (
                          <div key={theme.id} className="relative">
                            <RadioGroupItem
                              value={theme.id}
                              id={theme.id}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={theme.id}
                              className={`
                                relative flex cursor-pointer rounded-xl border-2 p-6 transition-all
                                ${
                                  selectedTheme === theme.id
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-muted hover:border-primary/50 hover:bg-muted/50"
                                }
                              `}
                            >
                              <div className="flex w-full items-start gap-4">
                                {/* Theme Icon */}
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center border">
                                    {theme.id === "default" && (
                                      <Zap className="w-6 h-6 text-blue-600" />
                                    )}
                                    {theme.id === "minimal" && (
                                      <Sparkles className="w-6 h-6 text-gray-600" />
                                    )}
                                    {theme.id === "business" && (
                                      <Brush className="w-6 h-6 text-indigo-600" />
                                    )}
                                  </div>
                                </div>

                                {/* Theme Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">
                                      {theme.name}
                                    </h3>
                                    {theme.isRecommended && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-yellow-100 text-yellow-800"
                                      >
                                        <Star className="w-3 h-3 mr-1" />
                                        Recommended
                                      </Badge>
                                    )}
                                    {theme.isBuiltIn && (
                                      <Badge variant="outline">Built-in</Badge>
                                    )}
                                  </div>

                                  <p className="text-muted-foreground mb-3">
                                    {theme.description}
                                  </p>

                                  {/* Theme Features */}
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {theme.features.map((feature) => (
                                      <Badge
                                        key={feature}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>

                                  {/* Theme Colors */}
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">
                                      Colors:
                                    </span>
                                    <div className="flex gap-1">
                                      <div
                                        className="w-4 h-4 rounded-full border border-gray-300"
                                        style={{
                                          backgroundColor: theme.colors.primary,
                                        }}
                                        title="Primary"
                                      />
                                      <div
                                        className="w-4 h-4 rounded-full border border-gray-300"
                                        style={{
                                          backgroundColor:
                                            theme.colors.secondary,
                                        }}
                                        title="Secondary"
                                      />
                                      <div
                                        className="w-4 h-4 rounded-full border border-gray-300"
                                        style={{
                                          backgroundColor: theme.colors.accent,
                                        }}
                                        title="Accent"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Selection Indicator */}
                                {selectedTheme === theme.id && (
                                  <div className="flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 text-primary" />
                                  </div>
                                )}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Theme Customization */}
          {selectedThemeData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brush className="w-5 h-5" />
                  Theme Customization
                </CardTitle>
                <CardDescription>
                  Customize the appearance of your selected theme. You can
                  change these settings anytime.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Color Mode */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Color Mode</Label>
                  <FormField
                    control={form.control}
                    name="colorMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-3 gap-4"
                          >
                            {colorModes.map((mode) => (
                              <div key={mode.id}>
                                <RadioGroupItem
                                  value={mode.id}
                                  id={`mode-${mode.id}`}
                                  className="sr-only"
                                />
                                <Label
                                  htmlFor={`mode-${mode.id}`}
                                  className={`
                                    flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all
                                    ${
                                      field.value === mode.id
                                        ? "border-primary bg-primary/5"
                                        : "border-muted hover:border-primary/50"
                                    }
                                  `}
                                >
                                  <mode.icon className="w-6 h-6" />
                                  <span className="font-medium">
                                    {mode.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground text-center">
                                    {mode.description}
                                  </span>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Primary Color */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Primary Color
                  </Label>
                  <FormField
                    control={form.control}
                    name="customization.primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="grid grid-cols-6 gap-2">
                            {primaryColors.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => field.onChange(color.value)}
                                className={`
                                  w-10 h-10 rounded-lg border-2 transition-all relative
                                  ${
                                    field.value === color.value
                                      ? "border-gray-900 dark:border-white scale-110"
                                      : "border-gray-300 hover:scale-105"
                                  }
                                `}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              >
                                {field.value === color.value && (
                                  <CheckCircle className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                )}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Border Radius */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Border Radius</Label>
                  <FormField
                    control={form.control}
                    name="customization.borderRadius"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-2 gap-4"
                          >
                            {borderRadiusOptions.map((option) => (
                              <div key={option.id}>
                                <RadioGroupItem
                                  value={option.id}
                                  id={`radius-${option.id}`}
                                  className="sr-only"
                                />
                                <Label
                                  htmlFor={`radius-${option.id}`}
                                  className={`
                                    flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all
                                    ${
                                      field.value === option.id
                                        ? "border-primary bg-primary/5"
                                        : "border-muted hover:border-primary/50"
                                    }
                                  `}
                                >
                                  <div
                                    className="w-6 h-6 bg-primary/20 border border-primary/40"
                                    style={{ borderRadius: option.value }}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {option.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {option.description}
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {selectedThemeData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Theme Preview
                </CardTitle>
                <CardDescription>
                  Preview of how your theme will look with current settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/30 p-6">
                  <div className="space-y-4">
                    {/* Mock Header */}
                    <div className="flex items-center justify-between p-3 bg-background rounded border">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded"
                          style={{
                            backgroundColor:
                              watchedValues.customization?.primaryColor,
                            borderRadius: borderRadiusOptions.find(
                              (o) =>
                                o.id ===
                                watchedValues.customization?.borderRadius
                            )?.value,
                          }}
                        />
                        <span className="font-semibold">Modular App</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-16 h-6 bg-muted rounded" />
                        <div className="w-12 h-6 bg-muted rounded" />
                      </div>
                    </div>

                    {/* Mock Content */}
                    <div className="space-y-3">
                      <div className="h-8 bg-muted rounded w-2/3" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-4/5" />

                      <div className="flex gap-2 pt-2">
                        <button
                          className="px-4 py-2 text-white font-medium rounded transition-colors"
                          style={{
                            backgroundColor:
                              watchedValues.customization?.primaryColor,
                            borderRadius: borderRadiusOptions.find(
                              (o) =>
                                o.id ===
                                watchedValues.customization?.borderRadius
                            )?.value,
                          }}
                        >
                          Primary Button
                        </button>
                        <button
                          className="px-4 py-2 border rounded transition-colors"
                          style={{
                            borderRadius: borderRadiusOptions.find(
                              (o) =>
                                o.id ===
                                watchedValues.customization?.borderRadius
                            )?.value,
                          }}
                        >
                          Secondary
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps Info */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Almost done!</strong> Your theme will be installed and
              configured automatically. You can customize colors, typography,
              and layout settings anytime through the admin panel.
            </AlertDescription>
          </Alert>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>
            <Button onClick={handleNext} disabled={isLoading || isInstalling}>
              {isInstalling ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Installing Theme...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Completing Setup...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
