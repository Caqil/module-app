"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { IconTrendingUp } from "@tabler/icons-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ApiResponse } from "@/types/global";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserGrowthData {
  date: string;
  newUsers: number;
  activeUsers: number;
  totalUsers: number;
}

const chartConfig = {
  newUsers: {
    label: "New Users",
    color: "var(--primary)",
  },
  activeUsers: {
    label: "Active Users",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function UserGrowthChart() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");
  const [chartData, setChartData] = React.useState<UserGrowthData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  React.useEffect(() => {
    fetchUserGrowthData();
  }, [timeRange]);

  const fetchUserGrowthData = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch actual user growth data
      // For now, we'll generate realistic data based on the time range
      const data = generateUserGrowthData(timeRange);
      setChartData(data);
      setError(null);
    } catch (err) {
      setError("Failed to load user growth data");
      console.error("User growth data error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateUserGrowthData = (range: string): UserGrowthData[] => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const data: UserGrowthData[] = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - days);

    let cumulativeUsers = 1250; // Starting base

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + i);

      // Generate realistic growth patterns
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Lower growth on weekends, higher on weekdays
      const baseGrowth = isWeekend ? 2 : 8;
      const randomVariation = Math.floor(Math.random() * 5) - 2;
      const newUsers = Math.max(0, baseGrowth + randomVariation);

      cumulativeUsers += newUsers;
      const activeUsers = Math.floor(
        cumulativeUsers * (0.7 + Math.random() * 0.2)
      ); // 70-90% active

      data.push({
        date: currentDate.toISOString().split("T")[0],
        newUsers,
        activeUsers,
        totalUsers: cumulativeUsers,
      });
    }

    return data;
  };

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const totalNewUsers = filteredData.reduce(
    (sum, item) => sum + item.newUsers,
    0
  );
  const avgDailyGrowth =
    filteredData.length > 0
      ? Math.round(totalNewUsers / filteredData.length)
      : 0;
  const growthTrend =
    filteredData.length >= 2
      ? filteredData[filteredData.length - 1].newUsers -
        filteredData[0].newUsers
      : 0;

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Loading user growth data...</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[250px] w-full bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription className="text-destructive">
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            User registration and activity trends
          </span>
          <span className="@[540px]/card:hidden">Registration trends</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillNewUsers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-newUsers)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-newUsers)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillActiveUsers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-activeUsers)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-activeUsers)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="activeUsers"
              type="natural"
              fill="url(#fillActiveUsers)"
              stroke="var(--color-activeUsers)"
              stackId="a"
            />
            <Area
              dataKey="newUsers"
              type="natural"
              fill="url(#fillNewUsers)"
              stroke="var(--color-newUsers)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {totalNewUsers} new users in this period{" "}
          <IconTrendingUp className="size-4 text-green-600" />
        </div>
        <div className="text-muted-foreground">
          Average {avgDailyGrowth} new users per day
        </div>
      </CardFooter>
    </Card>
  );
}
