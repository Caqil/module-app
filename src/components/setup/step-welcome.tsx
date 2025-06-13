"use client";

import { ArrowRight, Rocket, Shield, Palette, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StepWelcomeProps {
  onNext: () => void;
  onPrev: () => void;
  data: any;
  isLoading: boolean;
}

const features = [
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "JWT-based authentication with role-based access control",
  },
  {
    icon: Palette,
    title: "Dynamic Themes",
    description:
      "Install and customize themes without rebuilding your application",
  },
  {
    icon: Puzzle,
    title: "Plugin System",
    description: "Extend functionality with powerful plugins and integrations",
  },
];

export function StepWelcome({ onNext, isLoading }: StepWelcomeProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Modular App</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            You're about to set up a powerful, extensible web application with
            theme and plugin support. Let's get you started in just a few steps.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index} className="text-center">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup Information */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold">What we'll set up:</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <div className="font-medium">Database Connection</div>
                  <div className="text-sm text-muted-foreground">
                    Configure MongoDB for data storage
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <div className="font-medium">Administrator Account</div>
                  <div className="text-sm text-muted-foreground">
                    Create your admin user and site settings
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <div className="font-medium">Default Theme</div>
                  <div className="text-sm text-muted-foreground">
                    Choose and configure your initial theme
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <div className="font-medium">System Configuration</div>
                  <div className="text-sm text-muted-foreground">
                    Configure basic settings and preferences
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Before we begin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">MongoDB database (local or cloud)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Administrator email address</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">About 5 minutes of your time</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} disabled={isLoading} size="lg">
          Get Started
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
