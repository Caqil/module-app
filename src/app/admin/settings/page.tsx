"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconLoader,
  IconMail,
  IconShield,
  IconPalette,
  IconCode,
  IconDatabase,
  IconGlobe,
  IconUser,
  IconBell,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiResponse } from "@/types/global";
import { AppSidebar } from "@/components/admin/admin-sidebar";
import { SaveIcon } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";

interface SystemSettings {
  site: {
    siteName: string;
    siteDescription: string;
    siteLogo?: string;
    adminEmail: string;
  };
  users: {
    allowUserRegistration: boolean;
    requireEmailVerification: boolean;
    defaultUserRole: string;
    maxLoginAttempts: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireStrongPasswords: boolean;
    enableTwoFactor: boolean;
  };
  appearance: {
    defaultTheme: string;
    allowThemeSelection: boolean;
    customCss?: string;
    customJs?: string;
  };
  advanced: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    debugMode: boolean;
    logLevel: string;
    cacheEnabled: boolean;
    cacheTtl: number;
  };
}

// Form schemas
const siteSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required").max(200),
  siteDescription: z.string().max(1000).optional(),
  siteLogo: z.string().url().optional().or(z.literal("")),
  adminEmail: z.string().email("Invalid email address"),
});

const userSettingsSchema = z.object({
  allowUserRegistration: z.boolean(),
  requireEmailVerification: z.boolean(),
  defaultUserRole: z.enum(["user", "moderator"]),
  maxLoginAttempts: z.number().min(3).max(10),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().min(1).max(65535),
  smtpUser: z.string().min(1, "SMTP user is required"),
  smtpPass: z.string().min(1, "SMTP password is required"),
  fromEmail: z.string().email("Invalid email address"),
  fromName: z.string().min(1, "From name is required"),
});

const securitySettingsSchema = z.object({
  sessionTimeout: z.number().min(300).max(86400), // 5 minutes to 24 hours
  passwordMinLength: z.number().min(8).max(128),
  requireStrongPasswords: z.boolean(),
  enableTwoFactor: z.boolean(),
});

const appearanceSettingsSchema = z.object({
  defaultTheme: z.string(),
  allowThemeSelection: z.boolean(),
  customCss: z.string().optional(),
  customJs: z.string().optional(),
});

const advancedSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().max(500),
  debugMode: z.boolean(),
  logLevel: z.enum(["error", "warn", "info", "debug"]),
  cacheEnabled: z.boolean(),
  cacheTtl: z.number().min(60).max(86400),
});

type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;
type UserSettingsFormData = z.infer<typeof userSettingsSchema>;
type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;
type AppearanceSettingsFormData = z.infer<typeof appearanceSettingsSchema>;
type AdvancedSettingsFormData = z.infer<typeof advancedSettingsSchema>;

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [saveLoading, setSaveLoading] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  // Forms for each settings section
  const siteForm = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
  });

  const userForm = useForm<UserSettingsFormData>({
    resolver: zodResolver(userSettingsSchema),
  });

  const emailForm = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
  });

  const securityForm = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
  });

  const appearanceForm = useForm<AppearanceSettingsFormData>({
    resolver: zodResolver(appearanceSettingsSchema),
  });

  const advancedForm = useForm<AdvancedSettingsFormData>({
    resolver: zodResolver(advancedSettingsSchema),
  });

  React.useEffect(() => {
    fetchSettings();
  }, []);

  React.useEffect(() => {
    if (settings) {
      // Initialize all forms with current settings
      siteForm.reset(settings.site);
      userForm.reset(settings.users);
      emailForm.reset(settings.email);
      securityForm.reset(settings.security);
      appearanceForm.reset(settings.appearance);
      advancedForm.reset(settings.advanced);
    }
  }, [settings, siteForm, userForm, emailForm, securityForm, appearanceForm, advancedForm]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/settings", {
        credentials: "include",
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.success && data.data?.settings) {
          setSettings(data.data.settings);
          setError(null);
        } else {
          setError(data.error || "Failed to load settings");
        }
      } else {
        setError("Failed to fetch settings");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Settings fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (section: string, data: any) => {
    try {
      setSaveLoading(section);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [section]: data }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`);
        fetchSettings(); // Refresh settings
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Settings save error:", err);
    } finally {
      setSaveLoading(null);
    }
  };

  const testEmailConnection = async () => {
    try {
      setSaveLoading("email-test");
      const formData = emailForm.getValues();
      
      const response = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setSuccess("Email test successful! Check your inbox.");
      } else {
        setError(result.error || "Email test failed");
      }
    } catch (err) {
      setError("Email test failed");
      console.error("Email test error:", err);
    } finally {
      setSaveLoading(null);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <AdminHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
                <div className="grid gap-6 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-32"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-5/6"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Configure your application settings and preferences
              </p>
            </div>

            {/* Status Messages */}
            {error && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <IconCheck className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Settings Tabs */}
            <Tabs defaultValue="site" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="site">
                  <IconGlobe className="w-4 h-4 mr-2" />
                  Site
                </TabsTrigger>
                <TabsTrigger value="users">
                  <IconUser className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="email">
                  <IconMail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="security">
                  <IconShield className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="appearance">
                  <IconPalette className="w-4 h-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  <IconCode className="w-4 h-4 mr-2" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Site Settings */}
              <TabsContent value="site">
                <Card>
                  <CardHeader>
                    <CardTitle>Site Information</CardTitle>
                    <CardDescription>
                      Configure basic site information and branding
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...siteForm}>
                      <form onSubmit={siteForm.handleSubmit((data) => saveSettings("site", data))} className="space-y-4">
                        <FormField
                          control={siteForm.control}
                          name="siteName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="My Awesome Site" />
                              </FormControl>
                              <FormDescription>
                                This name will appear in the browser title and throughout the application.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={siteForm.control}
                          name="siteDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="A brief description of your site..." />
                              </FormControl>
                              <FormDescription>
                                Used for SEO and social media sharing.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={siteForm.control}
                          name="adminEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Admin Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="admin@example.com" />
                              </FormControl>
                              <FormDescription>
                                Primary administrator email address.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={saveLoading === "site"}>
                          {saveLoading === "site" ? (
                            <>
                              <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <SaveIcon className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* User Settings */}
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Configure user registration and default settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...userForm}>
                      <form onSubmit={userForm.handleSubmit((data) => saveSettings("users", data))} className="space-y-4">
                        <FormField
                          control={userForm.control}
                          name="allowUserRegistration"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow User Registration</FormLabel>
                                <FormDescription>
                                  Allow new users to create accounts
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="requireEmailVerification"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Require Email Verification</FormLabel>
                                <FormDescription>
                                  Users must verify their email before accessing the system
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="defaultUserRole"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default User Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select default role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Role assigned to new users by default
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="maxLoginAttempts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Login Attempts</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min={3} max={10} />
                              </FormControl>
                              <FormDescription>
                                Number of failed login attempts before account lockout
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={saveLoading === "users"}>
                          {saveLoading === "users" ? (
                            <>
                              <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <SaveIcon className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Email Settings */}
              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Configuration</CardTitle>
                    <CardDescription>
                      Configure SMTP settings for sending emails
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...emailForm}>
                      <form onSubmit={emailForm.handleSubmit((data) => saveSettings("email", data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={emailForm.control}
                            name="smtpHost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Host</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="smtp.gmail.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={emailForm.control}
                            name="smtpPort"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Port</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" placeholder="587" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={emailForm.control}
                            name="smtpUser"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Username</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="your-email@gmail.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={emailForm.control}
                            name="smtpPass"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      {...field} 
                                      type={showPassword ? "text" : "password"} 
                                      placeholder="Your app password"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? (
                                        <IconEyeOff className="h-4 w-4" />
                                      ) : (
                                        <IconEye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={emailForm.control}
                            name="fromEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" placeholder="noreply@example.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={emailForm.control}
                            name="fromName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="My Site" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={saveLoading === "email"}>
                            {saveLoading === "email" ? (
                              <>
                                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <SaveIcon className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={testEmailConnection}
                            disabled={saveLoading === "email-test"}
                          >
                            {saveLoading === "email-test" ? (
                              <>
                                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <IconMail className="w-4 h-4 mr-2" />
                                Test Connection
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Configure security policies and authentication settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...securityForm}>
                      <form onSubmit={securityForm.handleSubmit((data) => saveSettings("security", data))} className="space-y-4">
                        <FormField
                          control={securityForm.control}
                          name="sessionTimeout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session Timeout (seconds)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min={300} max={86400} />
                              </FormControl>
                              <FormDescription>
                                How long user sessions remain active (300-86400 seconds)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={securityForm.control}
                          name="passwordMinLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Password Length</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min={8} max={128} />
                              </FormControl>
                              <FormDescription>
                                Minimum number of characters required for passwords
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={securityForm.control}
                          name="requireStrongPasswords"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Require Strong Passwords</FormLabel>
                                <FormDescription>
                                  Enforce uppercase, lowercase, numbers, and special characters
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={securityForm.control}
                          name="enableTwoFactor"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Two-Factor Authentication</FormLabel>
                                <FormDescription>
                                  Allow users to enable 2FA for enhanced security
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={saveLoading === "security"}>
                          {saveLoading === "security" ? (
                            <>
                              <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <SaveIcon className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Settings */}
              <TabsContent value="appearance">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>
                      Customize the look and feel of your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...appearanceForm}>
                      <form onSubmit={appearanceForm.handleSubmit((data) => saveSettings("appearance", data))} className="space-y-4">
                        <FormField
                          control={appearanceForm.control}
                          name="defaultTheme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Theme</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select default theme" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="default">Default</SelectItem>
                                  <SelectItem value="dark">Dark</SelectItem>
                                  <SelectItem value="light">Light</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Theme applied to new users and visitors
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={appearanceForm.control}
                          name="allowThemeSelection"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow Theme Selection</FormLabel>
                                <FormDescription>
                                  Let users choose their preferred theme
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={appearanceForm.control}
                          name="customCss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom CSS</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="/* Your custom CSS here */"
                                  className="font-mono"
                                  rows={6}
                                />
                              </FormControl>
                              <FormDescription>
                                Additional CSS styles to customize the appearance
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={saveLoading === "appearance"}>
                          {saveLoading === "appearance" ? (
                            <>
                              <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <SaveIcon className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Settings */}
              <TabsContent value="advanced">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>
                      System-level configuration and maintenance options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...advancedForm}>
                      <form onSubmit={advancedForm.handleSubmit((data) => saveSettings("advanced", data))} className="space-y-4">
                        <FormField
                          control={advancedForm.control}
                          name="maintenanceMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Maintenance Mode</FormLabel>
                                <FormDescription>
                                  Put the site in maintenance mode
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={advancedForm.control}
                          name="maintenanceMessage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maintenance Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="We're performing scheduled maintenance. Please check back soon."
                                />
                              </FormControl>
                              <FormDescription>
                                Message shown to users during maintenance
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={advancedForm.control}
                          name="debugMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Debug Mode</FormLabel>
                                <FormDescription>
                                  Enable detailed error logging and debugging
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={advancedForm.control}
                          name="logLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Log Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select log level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="error">Error</SelectItem>
                                  <SelectItem value="warn">Warning</SelectItem>
                                  <SelectItem value="info">Info</SelectItem>
                                  <SelectItem value="debug">Debug</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Minimum level for logging messages
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={advancedForm.control}
                          name="cacheEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Caching</FormLabel>
                                <FormDescription>
                                  Cache frequently accessed data for better performance
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={advancedForm.control}
                          name="cacheTtl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cache TTL (seconds)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min={60} max={86400} />
                              </FormControl>
                              <FormDescription>
                                How long to keep cached data (60-86400 seconds)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={saveLoading === "advanced"}>
                          {saveLoading === "advanced" ? (
                            <>
                              <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <SaveIcon className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}