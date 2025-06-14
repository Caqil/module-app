// src/components/setup/step-theme.tsx - Simplified with default theme only

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Palette,
  Loader2,
  CheckCircle,
  Layout,
  Star,
  Monitor,
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
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  selectedTheme: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface SetupStepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
  data: any;
  isLoading: boolean;
}

// Simple default theme data
const defaultTheme = {
  id: "default",
  name: "Default Theme",
  description: "Clean, modern design perfect for getting started",
  features: [
    "Responsive Design",
    "Dark Mode Support",
    "Modern Components",
    "Performance Optimized",
  ],
  preview: "/themes/previews/default.jpg",
  author: "Modular App Team",
  version: "1.0.0",
  isRecommended: true,
};

export function StepTheme({ onNext, onPrev, data, isLoading }: SetupStepProps) {
  const [isInstalling, setIsInstalling] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedTheme: "default",
    },
  });

  const handleNext = async () => {
    setIsInstalling(true);

    try {
      // Simulate theme installation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Prepare theme data for setup completion
      const themeData = {
        selectedTheme: "default",
        themeName: defaultTheme.name,
        themeVersion: defaultTheme.version,
        installDefault: true,
      };

      onNext(themeData);
    } catch (error) {
      console.error("Theme installation failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleSkip = () => {
    // Skip theme installation for now
    onNext({
      selectedTheme: null,
      skipTheme: true,
    });
  };

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
          Install the default theme to get started with a beautiful, responsive
          design. You can customize or change themes later in the admin panel.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Default Theme Card */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                    <Layout className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {defaultTheme.name}
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {defaultTheme.description}
                    </CardDescription>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="selectedTheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex items-center"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="default" id="default" />
                            <Label htmlFor="default" className="sr-only">
                              Select Default Theme
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Theme Preview */}
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center border">
                  <div className="text-center space-y-2">
                    <Monitor className="w-8 h-8 mx-auto text-slate-500" />
                    <p className="text-sm text-slate-600">Theme Preview</p>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultTheme.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theme Info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Version: {defaultTheme.version}</p>
                  <p>Author: {defaultTheme.author}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={onPrev}>
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={isInstalling}
              >
                Skip for Now
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                disabled={isInstalling}
                className="min-w-[140px]"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  "Install & Continue"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
