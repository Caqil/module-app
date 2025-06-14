// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Settings, LogOut } from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/auth/profile", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      if (data.success && data.data?.user) {
        setUser(data.data.user);
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      setError("Failed to load profile");
      router.push("/signin");
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    try {
      setLoading?.(true); // If you have loading state

      console.log("🚪 [CLIENT] Starting sign out process");

      const response = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      console.log("📤 [CLIENT] Sign out response:", {
        ok: response.ok,
        status: response.status,
      });

      // Always redirect regardless of response status
      // This ensures user is logged out even if there are server issues
      if (response.ok || response.status >= 400) {
        console.log("✅ [CLIENT] Redirecting to signin");

        // Clear any client-side storage if you're using it
        if (typeof window !== "undefined") {
          // Clear localStorage/sessionStorage if used
          try {
            localStorage.removeItem("user");
            localStorage.removeItem("session");
            sessionStorage.clear();
          } catch (e) {
            console.warn("Error clearing client storage:", e);
          }
        }

        // Force a hard navigation to clear all state
        window.location.href = "/signin?message=Logged out successfully";

        // Fallback using Next.js router if window.location fails
        setTimeout(() => {
          router.push("/signin");
          router.refresh();
        }, 100);
      }
    } catch (error) {
      console.error("❌ [CLIENT] Sign out error:", error);

      // Even on error, redirect to sign in page
      console.log("🔄 [CLIENT] Error occurred, forcing logout anyway");
      window.location.href = "/signin?message=Logged out due to error";
    } finally {
      setLoading?.(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">{error || "User not found"}</p>
          <Button onClick={() => router.push("/signin")}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your account today.
            </p>
          </div>
          <div className="flex space-x-4">
            {user.role === "admin" && (
              <Button
                variant="outline"
                onClick={() => router.push("/admin/dashboard")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Name:
                  </span>
                  <p className="text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Email:
                  </span>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Role:
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Application health and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ● Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Last Login:</span>
                  <span className="text-sm text-gray-900">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Welcome to Modular App!
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                This is your personal dashboard where you can manage your
                account, access features, and customize your experience. The
                application supports dynamic themes and plugins that can be
                managed through the admin panel.
              </p>
              {user.role === "admin" && (
                <div className="mt-6">
                  <Button onClick={() => router.push("/admin/dashboard")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Admin Dashboard
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
