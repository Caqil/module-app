"use client";

import { useState, useEffect } from "react";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconPalette,
  IconPuzzle,
  IconActivity,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiResponse } from "@/types/global";

interface DashboardStats {
  users: {
    total: number;
    active: number;
    recent: any[];
  };
  themes: {
    total: number;
    active: string;
  };
  plugins: {
    total: number;
    active: number;
  };
}

export function SystemMetricsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/dashboard", {
        credentials: "include",
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.success && data.data) {
          setStats(data.data.stats);
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
    }
  };

  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <CardDescription>
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardTitle>
              <CardAction>
                <div className="h-6 bg-muted rounded w-16"></div>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-40"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const userActivityRate =
    stats.users.total > 0
      ? Math.round((stats.users.active / stats.users.total) * 100)
      : 0;

  const pluginAdoptionRate =
    stats.plugins.total > 0
      ? Math.round((stats.plugins.active / stats.plugins.total) * 100)
      : 0;

  const recentUserGrowth = stats.users.recent?.length || 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.users.total.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers className="w-4 h-4" />
              {stats.users.active} active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {userActivityRate}% user activity rate{" "}
            {userActivityRate >= 70 ? (
              <IconTrendingUp className="size-4 text-green-600" />
            ) : (
              <IconTrendingDown className="size-4 text-orange-600" />
            )}
          </div>
          <div className="text-muted-foreground">
            {recentUserGrowth} new users recently
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Installed Themes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.themes.total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconPalette className="w-4 h-4" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Current: {stats.themes.active} <IconPalette className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Theme customization available
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Plugin System</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.plugins.total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconPuzzle className="w-4 h-4" />
              {stats.plugins.active} active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {pluginAdoptionRate}% activation rate{" "}
            {pluginAdoptionRate >= 60 ? (
              <IconTrendingUp className="size-4 text-green-600" />
            ) : (
              <IconTrendingDown className="size-4 text-orange-600" />
            )}
          </div>
          <div className="text-muted-foreground">
            Extensibility through plugins
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>System Health</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            Healthy
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconActivity className="w-4 h-4" />
              Online
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All systems operational{" "}
            <IconTrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-muted-foreground">
            Database and services running
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
