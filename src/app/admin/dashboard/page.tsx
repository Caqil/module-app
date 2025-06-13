
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { AppSidebar } from "@/components/admin/admin-sidebar";
import { SystemMetricsCards } from "@/components/admin/system-metrics-cards";
import { UserGrowthChart } from "@/components/admin/user-growth-chart";
import { ActivePluginsTable } from "@/components/admin/active-plugins-table";

export default function DashboardPage() {
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
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SystemMetricsCards />
              <div className="px-4 lg:px-6">
                <UserGrowthChart />
              </div>
              <ActivePluginsTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
