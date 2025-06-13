"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  CheckCircle,
  Palette,
  Monitor,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface StepThemeProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  data: any;
  isLoading: boolean;
}

type ThemeFormData = {
  selectedTheme: string;
  colorMode: string;
};

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

const availableThemes: ThemeOption[] = [
  {
    id: "default",
    name: "Default Theme",
    description: "Clean and professional theme with modern design",
    preview: "/themes/default-theme/preview.jpg",
    features: [
      "Responsive design",
      "Dark mode support",
      "Customizable colors",
      "Modern typography",
    ],
  },
  {
    id: "minimal",
    name: "Minimal Theme",
    description: "Simple and clean design focused on content",
    preview: "/themes/minimal-theme/preview.jpg",
    features: [
      "Ultra-clean design",
      "Fast loading",
      "Content-focused",
      "Typography emphasis",
    ],
  },
  {
    id: "business",
    name: "Business Theme",
    description: "Professional theme perfect for business applications",
    preview: "/themes/business-theme/preview.jpg",
    features: [
      "Professional layout",
      "Dashboard widgets",
      "Charts support",
      "Corporate styling",
    ],
  },
];

const colorModes = [
  {
    id: "light",
    name: "Light",
    description: "Light theme for better readability",
    icon: Sun,
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dark theme for reduced eye strain",
    icon: Moon,
  },
  {
    id: "system",
    name: "System",
    description: "Follow system preference",
    icon: Monitor,
  },
];

export function StepTheme({ onNext, onPrev, data, isLoading }: StepThemeProps) {
  const [selectedTheme, setSelectedTheme] = useState(
    data?.selectedTheme || "default"
  );
  const [selectedColorMode, setSelectedColorMode] = useState(
    data?.colorMode || "system"
  );

  const form = useForm<ThemeFormData>({
    defaultValues: {
      selectedTheme: selectedTheme,
      colorMode: selectedColorMode,
    },
  });

  const handleNext = async () => {
    const formData = {
      selectedTheme,
      colorMode: selectedColorMode,
    };
    onNext(formData);
  };

  const selectedThemeData = availableThemes.find(
    (theme) => theme.id === selectedTheme
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Palette className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">Theme Selection</h2>
        <p className="text-muted-foreground">
          Choose your default theme and appearance preferences
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Themes</CardTitle>
              <CardDescription>
                Select a theme that matches your application's style and purpose
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {availableThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`relative rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTheme === theme.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="font-semibold">{theme.name}</div>
                            {selectedTheme === theme.id && (
                              <CheckCircle className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {theme.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {theme.features.map((feature, index) => (
                              <span
                                key={index}
                                className="text-xs bg-muted px-2 py-1 rounded-md"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="w-20 h-12 bg-muted rounded border flex items-center justify-center">
                            <Palette className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Color Mode</CardTitle>
              <CardDescription>
                Choose your preferred color scheme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {colorModes.map((mode) => (
                  <div
                    key={mode.id}
                    className={`relative rounded-lg border-2 cursor-pointer transition-all p-4 text-center ${
                      selectedColorMode === mode.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedColorMode(mode.id)}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <mode.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center justify-center space-x-2">
                          <span>{mode.name}</span>
                          {selectedColorMode === mode.id && (
                            <CheckCircle className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {mode.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Theme Summary */}
          {selectedThemeData && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">
                  Selected Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Theme:</span>
                    <span>{selectedThemeData.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Color Mode:</span>
                    <span className="capitalize">
                      {
                        colorModes.find((mode) => mode.id === selectedColorMode)
                          ?.name
                      }
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      <strong>Note:</strong> You can change themes and customize
                      colors anytime from the admin panel after setup is
                      complete.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Theme Features Info */}
          <Alert>
            <Palette className="h-4 w-4" />
            <AlertDescription>
              All themes support full customization including colors,
              typography, spacing, and layout. You can install additional themes
              or create custom themes later through the admin panel.
            </AlertDescription>
          </Alert>

          {/* What's Next */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <div className="font-medium">Complete Setup</div>
                    <div className="text-sm text-muted-foreground">
                      Finalize your configuration and initialize the database
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <div className="font-medium">Access Admin Panel</div>
                    <div className="text-sm text-muted-foreground">
                      Sign in with your admin account to start customizing
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <div className="font-medium">Install Additional Themes</div>
                    <div className="text-sm text-muted-foreground">
                      Browse and install more themes from the theme manager
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? (
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
