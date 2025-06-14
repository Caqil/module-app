// src/components/setup/setup-wizard.tsx
// Fixed setup wizard with proper data sanitization

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiResponse } from "@/types/global";

// Step Components
import { StepWelcome } from "./step-welcome";
import { StepDatabase } from "./step-database";
import { StepAdmin } from "./step-admin";
// NOTE: StepTheme removed - theme setup moved to admin panel

interface SetupStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<SetupStepProps>;
}

interface SetupStepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
  data: any;
  isLoading: boolean;
}

type SetupData = {
  [K in (typeof SETUP_STEPS)[number]["id"]]?: any;
};

// UPDATED: Theme step removed
const SETUP_STEPS: SetupStep[] = [
  {
    id: "welcome",
    title: "Welcome",
    description: "Welcome to your new modular application",
    component: StepWelcome,
  },
  {
    id: "database",
    title: "Database",
    description: "Configure your MongoDB connection",
    component: StepDatabase,
  },
  {
    id: "admin",
    title: "Admin Account",
    description: "Create your administrator account",
    component: StepAdmin,
  },
];

// ADDED: Data sanitization utility
const sanitizeData = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  if (
    typeof data === "string" ||
    typeof data === "number" ||
    typeof data === "boolean"
  ) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  if (typeof data === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip React-specific properties and functions
      if (
        typeof value === "function" ||
        key.startsWith("__react") ||
        key.startsWith("_react") ||
        key === "ref" ||
        key === "key" ||
        value instanceof HTMLElement ||
        value instanceof Event
      ) {
        continue;
      }
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }

  return data;
};

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const response = await fetch("/api/setup");
      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.success && data.data?.isSetupComplete) {
          // Setup already complete, redirect to signin
          router.push("/signin");
          return;
        }
      }
    } catch (error) {
      console.error("Setup status check failed:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleNext = async (stepData?: any) => {
    const currentStepData = SETUP_STEPS[currentStep];
    setError(null);

    // UPDATED: Sanitize data before saving
    const sanitizedData = sanitizeData(stepData);

    // Save current step data
    if (sanitizedData) {
      setSetupData((prev) => ({
        ...prev,
        [currentStepData.id]: sanitizedData,
      }));
    }

    // If this is the last step, complete setup
    if (currentStep === SETUP_STEPS.length - 1) {
      await completeSetup({
        ...setupData,
        [currentStepData.id]: sanitizedData,
      });
      return;
    }

    // UPDATED: Only make API calls for steps that need backend processing
    const stepsRequiringAPI = ["database", "admin"];

    if (stepsRequiringAPI.includes(currentStepData.id)) {
      // Process the current step via API
      setIsLoading(true);

      try {
        const response = await fetch("/api/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: currentStepData.id,
            data: sanitizedData,
          }),
        });

        const result: ApiResponse = await response.json();

        if (result.success) {
          // Move to next step
          setCurrentStep((prev) => Math.min(prev + 1, SETUP_STEPS.length - 1));
        } else {
          setError(result.error || "Setup step failed");
        }
      } catch (error) {
        console.error("Setup step failed:", error);
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // For frontend-only steps (like welcome), just move to next step
      setCurrentStep((prev) => Math.min(prev + 1, SETUP_STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setError(null);
  };

  const completeSetup = async (allData: SetupData) => {
    setIsLoading(true);
    setError(null);

    try {
      // UPDATED: Sanitize all data before sending
      const sanitizedAllData = sanitizeData(allData);

      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: sanitizedAllData,
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        // Redirect to signin page after successful setup so user can log in
        router.push(
          "/signin?message=Setup completed successfully! Please sign in with your admin account."
        );
      } else {
        setError(result.error || "Setup completion failed");
      }
    } catch (error) {
      console.error("Setup completion failed:", error);
      setError("Network error during setup completion");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = SETUP_STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Setup Your Application
          </h1>
          <p className="text-slate-600">
            Let's get your modular application configured and ready to use
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {SETUP_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < SETUP_STEPS.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 rounded ${
                      index < currentStep
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Circle className="w-5 h-5 text-primary" />
              <span>{SETUP_STEPS[currentStep].title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent
              onNext={handleNext}
              onPrev={handlePrev}
              data={setupData[SETUP_STEPS[currentStep].id]}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {SETUP_STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
