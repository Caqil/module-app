"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Palette,
  Puzzle,
  Settings,
  TrendingUp,
  Activity,
  Database,
  Shield,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { ApiResponse } from "@/types/global";

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  themes: {
    installed: number;
    active: string;
  };
  plugins: {
    installed: number;
    active: number;
  };
  system: {
    status: "healthy" | "warning" | "error";
    uptime: string;
    version: string;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      const response = await fetch("/api/admin/dashboard", {
        credentials: "include",
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.success && data.data) {
          setStats(data.data);
          setError(null);
        } else {
          setError(data.error || "Failed to load dashboard data");
        }
      } else {
        setError("Failed to fetch dashboard statistics");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Dashboard stats error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                <div className="h-3 w-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchDashboardStats}
                  disabled={isRefreshing}
                  aria-label="Retry fetching dashboard data"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Retry fetching data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Badge
            variant={
              stats?.system?.status === "healthy" ? "default" : "destructive"
            }
            className="text-xs uppercase"
          >
            System {stats?.system?.status || "Unknown"}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchDashboardStats}
                  disabled={isRefreshing}
                  aria-label="Refresh dashboard data"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh dashboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-inset">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.users?.newThisMonth || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-inset">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.users?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card className="shadow-inset">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Themes</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.themes?.installed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active: {stats?.themes?.active || "None"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-inset">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.plugins?.installed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.plugins?.active || 0} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System and Security Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-inset">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <span>System Information</span>
            </CardTitle>
            <CardDescription>
              Current system status and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Version</span>
              <span className="text-sm text-muted-foreground font-mono">
                {stats?.system?.version || "1.0.0"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Uptime</span>
              <span className="text-sm text-muted-foreground">
                {stats?.system?.uptime || "Unknown"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status</span>
              <Badge
                variant={
                  stats?.system?.status === "healthy"
                    ? "default"
                    : "destructive"
                }
                className="text-xs uppercase"
              >
                {stats?.system?.status || "Unknown"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-inset">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Security Overview</span>
            </CardTitle>
            <CardDescription>
              Security status and recent activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Authentication</span>
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Session Security</span>
              <Badge variant="default" className="text-xs">
                Enabled
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">HTTPS</span>
              <Badge variant="default" className="text-xs">
                Enforced
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-inset">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest system activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  status: "success",
                  title: "System initialized successfully",
                  desc: "Application started",
                  color: "bg-green-500",
                },
                {
                  status: "info",
                  title: "Database connection established",
                  desc: "MongoDB connected",
                  color: "bg-blue-500",
                },
                {
                  status: "theme",
                  title: "Default theme activated",
                  desc: "Theme system ready",
                  color: "bg-purple-500",
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div
                    className={`w-2 h-2 ${activity.color} rounded-full`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-inset">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>User Activity</span>
            </CardTitle>
            <CardDescription>Recent user activity trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Chart placeholder (e.g., using Chart.js or shadcn chart
                components)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
