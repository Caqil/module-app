"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Eye,
  EyeOff,
  Loader2,
  Globe,
  Shield,
  Mail,
} from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setupAdminSchema } from "@/lib/validations";

interface StepAdminProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  data: any;
  isLoading: boolean;
}

type AdminFormData = {
  siteName: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
};

export function StepAdmin({ onNext, onPrev, data, isLoading }: StepAdminProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AdminFormData>({
    resolver: zodResolver(setupAdminSchema),
    defaultValues: {
      siteName: data?.siteName || "Modular App",
      adminEmail: data?.adminEmail || "",
      adminPassword: data?.adminPassword || "",
      adminFirstName: data?.adminFirstName || "",
      adminLastName: data?.adminLastName || "",
    },
  });

  const watchPassword = form.watch("adminPassword");

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3)
      return { strength: score, label: "Weak", color: "bg-red-500" };
    if (score < 4)
      return { strength: score, label: "Medium", color: "bg-yellow-500" };
    return { strength: score, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(watchPassword);

  const handleNext = async (formData: AdminFormData) => {
    onNext(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">Administrator Account</h2>
        <p className="text-muted-foreground">
          Create your admin account and configure basic site settings
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
          {/* Site Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Site Configuration</span>
              </CardTitle>
              <CardDescription>
                Basic information about your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="My Awesome App"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be displayed in the browser title and throughout
                      the application
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Administrator Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Administrator Account</span>
              </CardTitle>
              <CardDescription>
                Create your admin user account with full system access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adminFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email Field */}
              <FormField
                control={form.control}
                name="adminEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="admin@yourapp.com"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      This will be your admin login email and used for system
                      notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="adminPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters with uppercase,
                      lowercase, number, and special character
                    </FormDescription>
                    <FormMessage />

                    {/* Password Strength Indicator */}
                    {watchPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm">Strength:</div>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                              style={{
                                width: `${(passwordStrength.strength / 5) * 100}%`,
                              }}
                            />
                          </div>
                          <div
                            className={`text-sm font-medium ${
                              passwordStrength.strength < 3
                                ? "text-red-600"
                                : passwordStrength.strength < 4
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {passwordStrength.label}
                          </div>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This admin account will have full
              access to your application. Make sure to use a strong password and
              keep your credentials secure. You can create additional admin
              users later from the admin panel.
            </AlertDescription>
          </Alert>

          {/* Account Features */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Admin Account Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <div className="font-medium">Full System Access</div>
                    <div className="text-sm text-muted-foreground">
                      Manage all users, themes, and plugins
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <div className="font-medium">System Configuration</div>
                    <div className="text-sm text-muted-foreground">
                      Configure site settings and preferences
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <div className="font-medium">Theme Management</div>
                    <div className="text-sm text-muted-foreground">
                      Install, activate, and customize themes
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <div className="font-medium">Plugin Control</div>
                    <div className="text-sm text-muted-foreground">
                      Install and manage plugins and extensions
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
