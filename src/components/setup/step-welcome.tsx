// src/components/setup/step-welcome.tsx
// Fixed welcome step with clean data passing

"use client";

import { ArrowRight, Rocket, Shield, Database, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StepWelcomeProps {
  onNext: (data?: any) => void;
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
    icon: Database,
    title: "Database Management",
    description: "MongoDB integration with robust data modeling",
  },
  {
    icon: User,
    title: "Admin Dashboard",
    description: "Comprehensive admin panel for system management",
  },
];

export function StepWelcome({ onNext, isLoading }: StepWelcomeProps) {
  // UPDATED: Pass clean data object (or no data for welcome step)
  const handleNext = () => {
    const cleanData = {
      acknowledged: true,
      timestamp: new Date().toISOString(),
    };

    onNext(cleanData);
  };

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
            You're about to set up a powerful, extensible web application. Let's
            get you started in just a few simple steps.
          </p>
        </div>
      </div>

      {/* Features Grid */}

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
                    Connect to your MongoDB database
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-2">
          <div className="text-2xl font-bold text-primary">3</div>
          <div className="text-sm text-muted-foreground">Simple Steps</div>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-primary">5</div>
          <div className="text-sm text-muted-foreground">Minutes Setup</div>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-primary">100%</div>
          <div className="text-sm text-muted-foreground">Ready to Use</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center">
        <Button
          onClick={handleNext}
          disabled={isLoading}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <Rocket className="mr-2 w-4 h-4 animate-pulse" />
              Starting Setup...
            </>
          ) : (
            <>
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
