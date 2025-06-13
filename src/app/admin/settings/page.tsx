"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Save,
  Globe,
  Mail,
  Shield,
  Database,
  Palette,
  Code,
  Bell,
  Users,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { ApiResponse } from "@/types/global";

interface SystemSettings {
  site: {
    name: string;
    description: string;
    url: string;
    logo?: string;
    favicon?: string;
    adminEmail: string;
    timezone: string;
    language: string;
  };
  users: {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    defaultRole: string;
    passwordMinLength: number;
    sessionTimeout: number;
  };
  email: {
    provider: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromName: string;
    fromEmail: string;
    testEmail?: string;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireHttps: boolean;
    enableCors: boolean;
    corsOrigins: string[];
    rateLimitEnabled: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
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

const siteSettingsSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  description: z.string().min(1, "Site description is required"),
  url: z.string().url("Valid URL is required"),
  adminEmail: z.string().email("Valid email is required"),
  timezone: z.string(),
  language: z.string(),
});

const userSettingsSchema = z.object({
  allowRegistration: z.boolean(),
  requireEmailVerification: z.boolean(),
  defaultRole: z.string(),
  passwordMinLength: z.number().min(6).max(50),
  sessionTimeout: z.number().min(1).max(525600), // Max 1 year in minutes
});

const emailSettingsSchema = z.object({
  provider: z.string(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Valid email is required"),
});

const securitySettingsSchema = z.object({
  maxLoginAttempts: z.number().min(1).max(20),
  lockoutDuration: z.number().min(1).max(1440), // Max 24 hours in minutes
  requireHttps: z.boolean(),
  enableCors: z.boolean(),
  corsOrigins: z.array(z.string()).default([]),
  rateLimitEnabled: z.boolean(),
  rateLimitRequests: z.number().min(1).max(10000),
  rateLimitWindow: z.number().min(1).max(3600), // Max 1 hour in seconds
});

const appearanceSettingsSchema = z.object({
  defaultTheme: z.string(),
  allowThemeSelection: z.boolean(),
  customCss: z.string().optional(),
  customJs: z.string().optional(),
});

const advancedSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string(),
  debugMode: z.boolean(),
  logLevel: z.string(),
  cacheEnabled: z.boolean(),
  cacheTtl: z.number().min(60).max(86400), // 1 minute to 1 day
});

type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;
type UserSettingsFormData = z.infer<typeof userSettingsSchema>;
type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;
type AppearanceSettingsFormData = z.infer<typeof appearanceSettingsSchema>;
type AdvancedSettingsFormData = z.infer<typeof advancedSettingsSchema>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<string | null>(null);
  const [emailTest, setEmailTest] = useState<{
    loading: boolean;
    result: string | null;
  }>({ loading: false, result: null });

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

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      // Initialize all forms with current settings
      siteForm.reset(settings.site);
      userForm.reset(settings.users);
      emailForm.reset(settings.email);
      securityForm.reset(settings.security);
      appearanceForm.reset(settings.appearance);
      advancedForm.reset(settings.advanced);
    }
  }, [settings]);

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

  const handleSaveSettings = async (section: string, data: any) => {
    try {
      setSaveLoading(section);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, settings: data }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setSuccess(`${section} settings saved successfully`);
        fetchSettings(); // Refresh settings
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (err) {
      setError("Failed to save settings");
      console.error("Save settings error:", err);
    } finally {
      setSaveLoading(null);
    }
  };

  const handleTestEmail = async () => {
    try {
      setEmailTest({ loading: true, result: null });
      const emailSettings = emailForm.getValues();

      const response = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailSettings),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setEmailTest({ loading: false, result: "Email sent successfully!" });
      } else {
        setEmailTest({
          loading: false,
          result: result.error || "Email test failed",
        });
      }
    } catch (err) {
      setEmailTest({
        loading: false,
        result: "Email test failed",
      });
      console.error("Email test error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-4 w-1/4 bg-muted rounded"></div>
                  <div className="h-10 w-full bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="site" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="site" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Site</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="flex items-center space-x-2"
          >
            <Palette className="h-4 w-4" />
            <span>Theme</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* Site Settings */}
        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>
                Configure basic site information and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...siteForm}>
                <form
                  onSubmit={siteForm.handleSubmit((data) =>
                    handleSaveSettings("site", data)
                  )}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={siteForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your website or application
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={siteForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site URL</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" />
                          </FormControl>
                          <FormDescription>
                            The primary URL of your website
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={siteForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormDescription>
                          A brief description of your website for SEO and social
                          media
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                      control={siteForm.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormDescription>
                            Primary administrator email address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={siteForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="America/New_York">
                                Eastern Time
                              </SelectItem>
                              <SelectItem value="America/Chicago">
                                Central Time
                              </SelectItem>
                              <SelectItem value="America/Denver">
                                Mountain Time
                              </SelectItem>
                              <SelectItem value="America/Los_Angeles">
                                Pacific Time
                              </SelectItem>
                              <SelectItem value="Europe/London">
                                London
                              </SelectItem>
                              <SelectItem value="Europe/Paris">
                                Paris
                              </SelectItem>
                              <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={siteForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="it">Italian</SelectItem>
                              <SelectItem value="pt">Portuguese</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={saveLoading === "site"}>
                    {saveLoading === "site" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Site Settings
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
                Configure user registration and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...userForm}>
                <form
                  onSubmit={userForm.handleSubmit((data) =>
                    handleSaveSettings("users", data)
                  )}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={userForm.control}
                      name="allowRegistration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Registration
                            </FormLabel>
                            <FormDescription>
                              Allow new users to register accounts
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
                            <FormLabel className="text-base">
                              Email Verification
                            </FormLabel>
                            <FormDescription>
                              Require email verification for new accounts
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
                  </div>
                  <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                      control={userForm.control}
                      name="defaultRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">
                                Moderator
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Default role for new user accounts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="passwordMinLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Password Length</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum password length requirement
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            User session timeout in minutes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={saveLoading === "users"}>
                    {saveLoading === "users" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save User Settings
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
                Configure email delivery settings and SMTP server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit((data) =>
                    handleSaveSettings("email", data)
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={emailForm.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Provider</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="smtp">SMTP Server</SelectItem>
                            <SelectItem value="sendgrid">SendGrid</SelectItem>
                            <SelectItem value="mailgun">Mailgun</SelectItem>
                            <SelectItem value="ses">Amazon SES</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {emailForm.watch("provider") === "smtp" && (
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={emailForm.control}
                        name="smtpHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emailForm.control}
                        name="smtpUser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emailForm.control}
                        name="smtpPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Name that appears in the "From" field
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormDescription>
                            Email address that appears in the "From" field
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button type="submit" disabled={saveLoading === "email"}>
                      {saveLoading === "email" && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Save Email Settings
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestEmail}
                      disabled={emailTest.loading}
                    >
                      {emailTest.loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Mail className="mr-2 h-4 w-4" />
                      Test Email
                    </Button>
                  </div>

                  {emailTest.result && (
                    <Alert>
                      <AlertDescription>{emailTest.result}</AlertDescription>
                    </Alert>
                  )}
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
                Configure authentication and security measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form
                  onSubmit={securityForm.handleSubmit((data) =>
                    handleSaveSettings("security", data)
                  )}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={securityForm.control}
                      name="maxLoginAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Login Attempts</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum failed login attempts before lockout
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="lockoutDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lockout Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            How long to lock accounts after max attempts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={securityForm.control}
                      name="requireHttps"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Require HTTPS
                            </FormLabel>
                            <FormDescription>
                              Force HTTPS for all connections
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
                      name="rateLimitEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Rate Limiting
                            </FormLabel>
                            <FormDescription>
                              Enable API rate limiting
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
                  </div>

                  {securityForm.watch("rateLimitEnabled") && (
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={securityForm.control}
                        name="rateLimitRequests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate Limit Requests</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum requests per window
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={securityForm.control}
                        name="rateLimitWindow"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate Limit Window (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Time window for rate limiting
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Button type="submit" disabled={saveLoading === "security"}>
                    {saveLoading === "security" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Security Settings
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
                Configure theme and visual appearance settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...appearanceForm}>
                <form
                  onSubmit={appearanceForm.handleSubmit((data) =>
                    handleSaveSettings("appearance", data)
                  )}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={appearanceForm.control}
                      name="defaultTheme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Theme</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Default theme for new users
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
                            <FormLabel className="text-base">
                              Theme Selection
                            </FormLabel>
                            <FormDescription>
                              Allow users to select their own theme
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
                  </div>

                  <FormField
                    control={appearanceForm.control}
                    name="customCss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom CSS</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={6}
                            className="font-mono text-sm"
                            placeholder="/* Add your custom CSS here */"
                          />
                        </FormControl>
                        <FormDescription>
                          Custom CSS that will be injected into all pages
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appearanceForm.control}
                    name="customJs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom JavaScript</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={6}
                            className="font-mono text-sm"
                            placeholder="// Add your custom JavaScript here"
                          />
                        </FormControl>
                        <FormDescription>
                          Custom JavaScript that will be injected into all pages
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={saveLoading === "appearance"}>
                    {saveLoading === "appearance" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Appearance Settings
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
                Configure advanced system settings and maintenance options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...advancedForm}>
                <form
                  onSubmit={advancedForm.handleSubmit((data) =>
                    handleSaveSettings("advanced", data)
                  )}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={advancedForm.control}
                      name="maintenanceMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Maintenance Mode
                            </FormLabel>
                            <FormDescription>
                              Enable maintenance mode for the site
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
                      name="debugMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Debug Mode
                            </FormLabel>
                            <FormDescription>
                              Enable debug mode for development
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
                  </div>

                  <FormField
                    control={advancedForm.control}
                    name="maintenanceMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maintenance Message</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormDescription>
                          Message to display when maintenance mode is enabled
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                      control={advancedForm.control}
                      name="logLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Log Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                            System logging level
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
                            <FormLabel className="text-base">
                              Enable Cache
                            </FormLabel>
                            <FormDescription>
                              Enable system caching
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
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Cache time-to-live in seconds
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={saveLoading === "advanced"}>
                    {saveLoading === "advanced" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Advanced Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
