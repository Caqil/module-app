"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ApiResponse, UserRole } from "@/types/global";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requiredRole,
  redirectTo = "/signin",
  fallback,
}: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/profile", {
        credentials: "include",
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.success && data.data?.user) {
          setIsAuthenticated(true);

          if (requiredRole) {
            const roleHierarchy: Record<UserRole, number> = {
              user: 1,
              moderator: 2,
              admin: 3,
            };

            const userRole = data.data.user.role as UserRole;
            const userRoleLevel = roleHierarchy[userRole];
            const requiredRoleLevel = roleHierarchy[requiredRole];
            setHasRequiredRole(userRoleLevel >= requiredRoleLevel);
          } else {
            setHasRequiredRole(true);
          }
        } else {
          router.push(redirectTo);
        }
      } else {
        router.push(redirectTo);
      }
    } catch (error) {
      router.push(redirectTo);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    );
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}
