"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { loginSchema } from "@/lib/validations";
import { ApiResponse } from "@/types/global";
import { LoginCredentials } from "@/types/auth";

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔐 [SIGNIN FORM] Starting login for:", data.email);

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result: ApiResponse = await response.json();

      console.log("📤 [SIGNIN FORM] API Response:", {
        ok: response.ok,
        status: response.status,
        success: result.success,
        hasUser: !!result.data?.user,
      });

      if (!response.ok) {
        setError(result.error || "Login failed");
        return;
      }

      if (result.success) {
        console.log("✅ [SIGNIN FORM] Login successful, redirecting...");

        // Small delay to ensure cookie is set
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Redirect based on user role
        const user = result.data?.user;
        console.log("👤 [SIGNIN FORM] User role:", user?.role);

        if (user?.role === "admin") {
          console.log("🚀 [SIGNIN FORM] Redirecting to admin dashboard");
          router.push("/admin/dashboard");
        } else {
          console.log("🚀 [SIGNIN FORM] Redirecting to user dashboard");
          router.push("/home");
        }

        // Force router refresh
        router.refresh();
      }
    } catch (error) {
      console.error("❌ [SIGNIN FORM] Network error:", error);
      setError("Network error. Please try again.");
    } finally {
      // This was missing! Always reset loading state
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Sign In
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="admin@modularapp.com"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Remember me
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="flex flex-col space-y-2 text-center text-sm">
              <Link
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot your password?
              </Link>
              <div>
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
