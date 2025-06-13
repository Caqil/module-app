"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
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
import { setupDatabaseSchema } from "@/lib/validations";
import { ApiResponse } from "@/types/global";

interface StepDatabaseProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  data: any;
  isLoading: boolean;
}

type DatabaseFormData = {
  mongodbUri?: string;
  testConnection?: boolean;
};

export function StepDatabase({
  onNext,
  onPrev,
  data,
  isLoading,
}: StepDatabaseProps) {
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showUri, setShowUri] = useState(false);

  const form = useForm<DatabaseFormData>({
    resolver: zodResolver(setupDatabaseSchema),
    defaultValues: {
      mongodbUri: data?.mongodbUri || process.env.NEXT_PUBLIC_MONGODB_URI || "",
      testConnection: false,
    },
  });

  const testConnection = async () => {
    const mongodbUri = form.getValues("mongodbUri");
    if (!mongodbUri) {
      setConnectionError("Please enter a MongoDB connection string");
      return;
    }

    setConnectionStatus("testing");
    setConnectionError(null);

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "database",
          data: { mongodbUri, testConnection: true },
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setConnectionStatus("success");
      } else {
        setConnectionStatus("error");
        setConnectionError(result.error || "Connection test failed");
      }
    } catch (error) {
      setConnectionStatus("error");
      setConnectionError("Network error. Please try again.");
    }
  };

  const handleNext = async (formData: DatabaseFormData) => {
    if (connectionStatus !== "success") {
      setConnectionError("Please test your database connection first");
      return;
    }
    onNext(formData);
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "testing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Database className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "testing":
        return "Testing connection...";
      case "success":
        return "Connection successful!";
      case "error":
        return "Connection failed";
      default:
        return "Not tested";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">Database Configuration</h2>
        <p className="text-muted-foreground">
          Configure your MongoDB connection to store application data
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
          {/* MongoDB URI Field */}
          <FormField
            control={form.control}
            name="mongodbUri"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MongoDB Connection String</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showUri ? "text" : "password"}
                      placeholder="mongodb://localhost:27017/modular-app"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowUri(!showUri)}
                    >
                      {showUri ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Enter your MongoDB connection string. This can be a local
                  instance or a cloud provider like MongoDB Atlas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Connection Test */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                {getConnectionStatusIcon()}
                <span>Connection Test</span>
              </CardTitle>
              <CardDescription>
                Test your database connection before proceeding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">
                    Status: {getConnectionStatusText()}
                  </div>
                  {connectionStatus === "success" && (
                    <div className="text-sm text-green-600">
                      Database is ready for use
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConnection}
                  disabled={
                    connectionStatus === "testing" ||
                    !form.getValues("mongodbUri")
                  }
                >
                  {connectionStatus === "testing" ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>

              {connectionError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{connectionError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Connection Examples */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Connection Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium text-sm">Local MongoDB:</div>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  mongodb://localhost:27017/modular-app
                </code>
              </div>
              <div>
                <div className="font-medium text-sm">MongoDB Atlas:</div>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  mongodb+srv://username:password@cluster.mongodb.net/modular-app
                </code>
              </div>
              <div>
                <div className="font-medium text-sm">With Authentication:</div>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  mongodb://username:password@localhost:27017/modular-app
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Your connection string will be
              stored securely in environment variables. Make sure to use strong
              credentials and restrict database access to your application only.
            </AlertDescription>
          </Alert>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>
            <Button
              type="submit"
              disabled={isLoading || connectionStatus !== "success"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Configuring...
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
