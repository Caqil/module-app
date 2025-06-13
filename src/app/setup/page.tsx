"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SetupWizard } from "@/components/setup/setup-wizard";
import { checkSetupStatus } from "@/lib/setup/wizard";

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<{
    isComplete: boolean;
    siteName?: string;
    error?: string;
  }>({ isComplete: false });
  const router = useRouter();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const status = await checkSetupStatus();
      setSetupStatus(status);

      // If setup is already complete, redirect to sign in
      if (status.isComplete) {
        router.push("/signin?message=Setup already completed");
      }
    } catch (error) {
      setSetupStatus({
        isComplete: false,
        error: "Failed to check setup status",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h2 className="text-lg font-semibold mb-2">Loading Setup</h2>
            <p className="text-sm text-muted-foreground text-center">
              Checking setup status and preparing the wizard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (setupStatus.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{setupStatus.error}</AlertDescription>
            </Alert>
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Setup Error</h2>
              <p className="text-sm text-muted-foreground mb-6">
                There was an error checking the setup status. Please try again.
              </p>
              <Button onClick={checkStatus} className="w-full">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already complete state (shouldn't normally be seen due to redirect)
  if (setupStatus.isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-lg font-semibold mb-2">Setup Complete</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {setupStatus.siteName || "Your application"} has already been set
              up.
            </p>
            <Button onClick={() => router.push("/signin")} className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main setup wizard
  return <SetupWizard />;
}
