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
import { StepTheme } from "./step-theme";

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

interface SetupData {
  database?: any;
  admin?: any;
  theme?: any;
}

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
  {
    id: "theme",
    title: "Theme Selection",
    description: "Choose your default theme",
    component: StepTheme,
  },
];

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
    setError(null);
    setIsLoading(true);

    try {
      const currentStepId = SETUP_STEPS[currentStep].id;
      const newSetupData = { ...setupData, [currentStepId]: stepData };
      setSetupData(newSetupData);

      // Handle API calls for specific steps
      if (currentStepId === "database" && stepData) {
        const response = await fetch("/api/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: "database",
            data: stepData,
          }),
        });

        const result: ApiResponse = await response.json();
        if (!result.success) {
          setError(result.error || "Database connection failed");
          return;
        }
      }

      if (currentStepId === "admin" && stepData) {
        const response = await fetch("/api/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: "admin",
            data: stepData,
          }),
        });

        const result: ApiResponse = await response.json();
        if (!result.success) {
          setError(result.error || "Admin account creation failed");
          return;
        }
      }

      // Move to next step or complete setup
      if (currentStep < SETUP_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete setup
        await completeSetup();
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeSetup = async () => {
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete",
          data: {},
        }),
      });

      const result: ApiResponse = await response.json();
      if (result.success) {
        // Redirect to admin login
        router.push("/signin?message=Setup completed successfully");
      } else {
        setError(result.error || "Failed to complete setup");
      }
    } catch (error) {
      setError("Failed to complete setup. Please try again.");
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">
              Checking setup status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CurrentStepComponent = SETUP_STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-muted/50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Application Setup</h1>
          <p className="text-muted-foreground">
            Let's get your modular application up and running
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
            {SETUP_STEPS.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center space-x-2 min-w-0 flex-shrink-0"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      index < currentStep
                        ? "bg-primary border-primary text-primary-foreground"
                        : index === currentStep
                          ? "border-primary text-primary"
                          : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="text-center min-w-0">
                    <div className="text-sm font-medium truncate">
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < SETUP_STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
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
