"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
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
  IconUpload,
  IconCamera,
} from "@tabler/icons-react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiResponse } from "@/types/global";
import { AppSidebar } from "@/components/admin/admin-sidebar";
import { SaveIcon, Camera, Upload } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  sessionTimeout: z.number().min(300).max(86400),
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

// Types
type SystemSettings = {
  site: z.infer<typeof siteSettingsSchema>;
  users: z.infer<typeof userSettingsSchema>;
  email: z.infer<typeof emailSettingsSchema>;
  security: z.infer<typeof securitySettingsSchema>;
  appearance: z.infer<typeof appearanceSettingsSchema>;
  advanced: z.infer<typeof advancedSettingsSchema>;
};

type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;
type UserSettingsFormData = z.infer<typeof userSettingsSchema>;
type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;
type AppearanceSettingsFormData = z.infer<typeof appearanceSettingsSchema>;
type AdvancedSettingsFormData = z.infer<typeof advancedSettingsSchema>;

// Settings navigation items
const settingsNavigation = [
  {
    id: "general",
    label: "General Details",
    icon: IconGlobe,
    description: "Update your site & personal details here.",
  },
  {
    id: "users",
    label: "User Management",
    icon: IconUser,
    description: "Configure user registration and permissions.",
  },
  {
    id: "security",
    label: "Security",
    icon: IconShield,
    description: "Manage security settings and authentication.",
  },
  {
    id: "email",
    label: "Email Settings",
    icon: IconMail,
    description: "Configure SMTP and email notifications.",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: IconPalette,
    description: "Customize themes and visual settings.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: IconBell,
    description: "Configure notification preferences.",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: IconCode,
    description: "Advanced system settings and debugging.",
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState("general");
  const [settings, setSettings] = React.useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [saveLoading, setSaveLoading] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);

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
      siteForm.reset(settings.site);
      userForm.reset(settings.users);
      emailForm.reset(settings.email);
      securityForm.reset(settings.security);
      appearanceForm.reset(settings.appearance);
      advancedForm.reset(settings.advanced);
    }
  }, [
    settings,
    siteForm,
    userForm,
    emailForm,
    securityForm,
    appearanceForm,
    advancedForm,
  ]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/settings", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch settings`);
      }

      const result: ApiResponse = await response.json();
      console.log("API Response:", result); // Debug log

      if (result.success && result.data?.settings) {
        console.log("Settings data:", result.data.settings); // Debug log
        setSettings(result.data.settings);
      } else {
        console.error("Invalid API response:", result);
        throw new Error(result.error || "Invalid response format");
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [section]: data }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings");
      }

      setSuccess("Settings saved successfully");
      await fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaveLoading(null);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save handlers for each section
  const handleSaveSection = async () => {
    try {
      switch (activeSection) {
        case "general":
          const siteData = siteForm.getValues();
          const siteResult = await siteForm.trigger();
          if (siteResult) {
            await saveSettings("site", siteData);
          }
          break;

        case "users":
          const userData = userForm.getValues();
          const userResult = await userForm.trigger();
          if (userResult) {
            await saveSettings("users", userData);
          }
          break;

        case "security":
          const securityData = securityForm.getValues();
          const securityResult = await securityForm.trigger();
          if (securityResult) {
            await saveSettings("security", securityData);
          }
          break;

        case "email":
          const emailData = emailForm.getValues();
          const emailResult = await emailForm.trigger();
          if (emailResult) {
            await saveSettings("email", emailData);
          }
          break;

        case "appearance":
          const appearanceData = appearanceForm.getValues();
          const appearanceResult = await appearanceForm.trigger();
          if (appearanceResult) {
            await saveSettings("appearance", appearanceData);
          }
          break;

        case "advanced":
          const advancedData = advancedForm.getValues();
          const advancedResult = await advancedForm.trigger();
          if (advancedResult) {
            await saveSettings("advanced", advancedData);
          }
          break;

        default:
          setError("Unknown settings section");
      }
    } catch (err) {
      setError("Failed to save settings");
    }
  };

  // Cancel handler to reset forms
  const handleCancel = () => {
    if (settings) {
      switch (activeSection) {
        case "general":
          siteForm.reset(settings.site);
          break;
        case "users":
          userForm.reset(settings.users);
          break;
        case "security":
          securityForm.reset(settings.security);
          break;
        case "email":
          emailForm.reset(settings.email);
          break;
        case "appearance":
          appearanceForm.reset(settings.appearance);
          break;
        case "advanced":
          advancedForm.reset(settings.advanced);
          break;
      }
    }
    setError(null);
    setSuccess(null);
  };

  const currentSection = settingsNavigation.find(
    (nav) => nav.id === activeSection
  );

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <AdminHeader />
          <div className="flex items-center justify-center h-96">
            <IconLoader className="h-8 w-8 animate-spin" />
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
        <div className="flex flex-1">
          {/* Settings Sidebar */}
          <div className="w-80 border-r bg-muted/30 p-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage your application settings and preferences.
              </p>
            </div>

            <nav className="mt-8 space-y-1">
              {settingsNavigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div
                      className={cn(
                        "text-xs mt-0.5",
                        activeSection === item.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold">
                  {currentSection?.label}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {currentSection?.description}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSection} disabled={!!saveLoading}>
                  {saveLoading ? (
                    <IconLoader className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <SaveIcon className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6">
                <IconCheck className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Content Sections */}
            {activeSection === "general" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                  <Form {...siteForm}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={siteForm.control}
                          name="siteName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter site name"
                                />
                              </FormControl>
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
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="admin@example.com"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={siteForm.control}
                        name="siteDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="A brief description of your site"
                                rows={4}
                              />
                            </FormControl>
                            <FormDescription>
                              This will be used in meta descriptions and site
                              previews.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={siteForm.control}
                        name="siteLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site Logo URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://example.com/logo.png"
                              />
                            </FormControl>
                            <FormDescription>
                              URL to your site logo image.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>

                {/* Right Column - Profile Image */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Site Logo</CardTitle>
                      <CardDescription>
                        Upload and manage your site logo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col items-center space-y-4">
                        <Avatar className="h-24 w-24">
                          <AvatarImage
                            src={profileImage || "/default-logo.png"}
                          />
                          <AvatarFallback>
                            <IconGlobe className="h-12 w-12" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Camera className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="text-sm">
                            <label
                              htmlFor="logo-upload"
                              className="cursor-pointer text-primary hover:underline"
                            >
                              Click to upload
                            </label>
                            <span className="text-muted-foreground">
                              {" "}
                              or drag and drop
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            SVG, PNG, JPG or GIF (Max. 800x400px)
                          </div>
                          <input
                            id="logo-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeSection === "users" && (
              <Card>
                <CardHeader>
                  <CardTitle>User Management Settings</CardTitle>
                  <CardDescription>
                    Configure user registration and default permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...userForm}>
                    <form className="space-y-6">
                      <FormField
                        control={userForm.control}
                        name="allowUserRegistration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Allow User Registration
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
                                Require Email Verification
                              </FormLabel>
                              <FormDescription>
                                Users must verify their email before accessing
                                the system
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
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select default role" />
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
                              <Input
                                {...field}
                                type="number"
                                min={3}
                                max={10}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Number of failed login attempts before account
                              lockout
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeSection === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure authentication and security preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form className="space-y-6">
                      <FormField
                        control={securityForm.control}
                        name="sessionTimeout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Session Timeout (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={5}
                                max={1440}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              How long users stay logged in (5 minutes to 24
                              hours)
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
                              <Input
                                {...field}
                                type="number"
                                min={8}
                                max={128}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum number of characters required for
                              passwords
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
                              <FormLabel className="text-base">
                                Require Strong Passwords
                              </FormLabel>
                              <FormDescription>
                                Enforce password complexity requirements
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
                              <FormLabel className="text-base">
                                Enable Two-Factor Authentication
                              </FormLabel>
                              <FormDescription>
                                Add an extra layer of security to user accounts
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
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeSection === "email" && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>
                    Configure SMTP settings for sending emails.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...emailForm}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={emailForm.control}
                          name="smtpHost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Host</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="smtp.gmail.com"
                                />
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
                                  {...field}
                                  type="number"
                                  placeholder="587"
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
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
                                <Input
                                  {...field}
                                  placeholder="your-email@gmail.com"
                                />
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
                                    placeholder="••••••••"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                      setShowPassword(!showPassword)
                                    }
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
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="noreply@yoursite.com"
                                />
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
                                <Input
                                  {...field}
                                  placeholder="Your Site Name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeSection === "advanced" && (
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    System-level configuration and debugging options.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...advancedForm}>
                    <form className="space-y-6">
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
                                Put the site in maintenance mode for all users
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
                                placeholder="We're currently performing maintenance. Please check back soon."
                                rows={3}
                              />
                            </FormControl>
                            <FormDescription>
                              Message shown to users when site is in maintenance
                              mode
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={advancedForm.control}
                        name="logLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Log Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
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
                        name="debugMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Debug Mode
                              </FormLabel>
                              <FormDescription>
                                Enable detailed error reporting and debugging
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
                        name="cacheEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Enable Caching
                              </FormLabel>
                              <FormDescription>
                                Enable system-wide caching for better
                                performance
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
                                {...field}
                                type="number"
                                min={60}
                                max={86400}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              How long to keep cached data (1 minute to 24
                              hours)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Add other sections (security, email, appearance, advanced) here */}
            {(activeSection === "appearance" ||
              activeSection === "notifications") && (
              <Card>
                <CardHeader>
                  <CardTitle>{currentSection?.label}</CardTitle>
                  <CardDescription>
                    {currentSection?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Settings for {currentSection?.label} will be implemented
                    here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
