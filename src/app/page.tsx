// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function HomePage() {
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndSetup();
  }, []);

  const checkAuthAndSetup = async () => {
    try {
      // First check if user is authenticated
      const authResponse = await fetch("/api/auth/profile", {
        credentials: "include",
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.success && authData.data?.user) {
          setUser(authData.data.user);
          // User is authenticated, redirect to appropriate dashboard
          if (authData.data.user.role === "admin") {
            router.push("/admin/dashboard");
          } else {
            router.push("/dashboard");
          }
          return;
        }
      }

      // User not authenticated, check setup status
      const setupResponse = await fetch("/api/setup");
      if (setupResponse.ok) {
        const setupData = await setupResponse.json();
        if (setupData.success && setupData.data?.isSetupComplete) {
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
      console.error("Auth/Setup status check failed:", error);
      setError("Failed to check authentication status");
      // Fallback to signin page
      setTimeout(() => router.push("/signin"), 2000);
    } finally {
      setIsChecking(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Check Failed
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to sign in...</p>
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
          {user
            ? `Welcome back, ${user.firstName}! Redirecting to dashboard...`
            : isChecking
              ? "Checking authentication status..."
              : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}
