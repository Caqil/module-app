import {
  ThemeLayout,
  ThemeComponent,
} from "@/components/dynamic/theme-wrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Fallback components (used when theme doesn't provide them)
function FallbackCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <Card className={`p-6 ${className}`}>{children}</Card>;
}

function FallbackButton({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  return <Button {...props}>{children}</Button>;
}

function FallbackPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
    </div>
  );
}

// Homepage component - theme agnostic
export default async function HomePage() {
  return (
    <ThemeLayout layoutName="default">
      <div className="space-y-8">
        {/* ✅ USE DYNAMIC THEME COMPONENTS */}
        <ThemeComponent
          name="PageHeader"
          fallback={FallbackPageHeader}
          title="Welcome Dashboard"
          subtitle="Overview of your application"
        />

        {/* Stats Grid - Uses theme components dynamically */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ThemeComponent
            name="DefaultCard"
            fallback={FallbackCard}
            className="text-center"
          >
            <p className="text-muted-foreground">Total Users</p>
          </ThemeComponent>

          <ThemeComponent
            name="DefaultCard"
            fallback={FallbackCard}
            className="text-center"
          >
            <p className="text-muted-foreground">Posts Created</p>
          </ThemeComponent>

          <ThemeComponent
            name="DefaultCard"
            fallback={FallbackCard}
            className="text-center"
          >
            <p className="text-muted-foreground">Revenue</p>
          </ThemeComponent>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

         
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <ThemeComponent
            name="DefaultButton"
            fallback={FallbackButton}
            variant="primary"
          >
            Create Post
          </ThemeComponent>

          <ThemeComponent
            name="DefaultButton"
            fallback={FallbackButton}
            variant="outline"
          >
            View Analytics
          </ThemeComponent>
        </div>
      </div>
    </ThemeLayout>
  );
}
