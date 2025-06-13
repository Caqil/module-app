"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string | number;
    label: string;
    type: "positive" | "negative" | "neutral";
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {badge && (
            <Badge variant={badge.variant || "default"} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p
            className={`text-xs mt-1 ${
              trend.type === "positive"
                ? "text-green-600"
                : trend.type === "negative"
                  ? "text-red-600"
                  : "text-muted-foreground"
            }`}
          >
            {trend.type === "positive" && "+"}
            {trend.value} {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  title: string;
  description: string;
  color?: "green" | "blue" | "purple" | "orange" | "red";
  timestamp?: string;
}

export function ActivityItem({
  title,
  description,
  color = "blue",
  timestamp,
}: ActivityItemProps) {
  const colorMap = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  return (
    <div className="flex items-center space-x-4">
      <div className={`w-2 h-2 rounded-full ${colorMap[color]}`}></div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {timestamp && (
          <p className="text-xs text-muted-foreground">{timestamp}</p>
        )}
      </div>
    </div>
  );
}

interface DashboardStatsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function DashboardStatsGrid({
  children,
  columns = 4,
}: DashboardStatsGridProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return <div className={`grid gap-6 ${gridClass}`}>{children}</div>;
}
