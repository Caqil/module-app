"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Palette,
  Puzzle,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Themes",
    href: "/admin/themes",
    icon: Palette,
  },
  {
    title: "Plugins",
    href: "/admin/plugins",
    icon: Puzzle,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg">Admin Panel</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 py-4">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isCollapsed={isCollapsed}
            pathname={pathname}
          />
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-start"
        >
          <Menu className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-50 md:border-r md:bg-background",
          isCollapsed ? "md:w-16" : "md:w-64"
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        {/* Mobile Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-50"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile Overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
            <div className="fixed left-0 top-0 h-full w-64 border-r bg-background">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-semibold text-lg">Admin Panel</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="space-y-2 py-4">
                {sidebarItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    isCollapsed={false}
                    pathname={pathname}
                    onClick={() => setIsMobileOpen(false)}
                  />
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

interface SidebarItemProps {
  item: SidebarItem;
  isCollapsed: boolean;
  pathname: string;
  onClick?: () => void;
}

function SidebarItem({
  item,
  isCollapsed,
  pathname,
  onClick,
}: SidebarItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onClick?.();
  };

  return (
    <div className="px-3">
      {hasChildren ? (
        <button
          onClick={handleClick}
          className={cn(
            "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {!isCollapsed && (
            <>
              <span className="ml-3 flex-1 text-left">{item.title}</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={onClick}
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {!isCollapsed && <span className="ml-3">{item.title}</span>}
        </Link>
      )}

      {hasChildren && isExpanded && !isCollapsed && (
        <div className="ml-6 mt-2 space-y-1">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onClick}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                pathname === child.href && "bg-accent text-accent-foreground"
              )}
            >
              <child.icon className="h-4 w-4" />
              <span className="ml-3">{child.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
