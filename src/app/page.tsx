"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch("/api/setup");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.isSetupComplete) {
          // Setup complete, redirect to signin
          router.push("/signin");
        } else {
          // Setup not complete, redirect to setup wizard
          router.push("/setup");
        }
      } else {
        // Setup API not working, try setup page directly
        router.push("/setup");
      }
    } catch (error) {
      console.error("Setup status check failed:", error);
      setError("Failed to check setup status");
      // Fallback to setup page
      setTimeout(() => router.push("/setup"), 2000);
    } finally {
      setIsChecking(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Setup Check Failed
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Modular App
        </h1>
        <p className="text-gray-600">
          {isChecking ? "Checking setup status..." : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}
