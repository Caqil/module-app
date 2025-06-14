// src/components/dynamic/theme-wrapper.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { themeRegistry } from "@/lib/themes/registry";
import { LoadedTheme, ActiveTheme } from "@/types/theme";

// Theme Context
interface ThemeContextType {
  activeTheme: ActiveTheme | null;
  isLoading: boolean;
  error: string | null;
  getThemeComponent: (componentName: string) => React.ComponentType<any> | null;
  getThemeLayout: (layoutName: string) => React.ComponentType<any> | null;
}

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: null,
  isLoading: true,
  error: null,
  getThemeComponent: () => null,
  getThemeLayout: () => null,
});

// Theme Provider Component
interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [activeTheme, setActiveTheme] = useState<ActiveTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveTheme();
  }, []);

  const loadActiveTheme = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get active theme from registry
      const activeThemeData = themeRegistry.getActiveThemeData();

      if (activeThemeData) {
        setActiveTheme(activeThemeData);
      } else {
        // Fallback to default theme
        await loadDefaultTheme();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load theme";
      setError(errorMessage);
      console.error("Theme loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultTheme = async () => {
    try {
      // Try to load and activate default theme
      await themeRegistry.loadTheme("default");
      await themeRegistry.activateTheme("default");

      const defaultThemeData = themeRegistry.getActiveThemeData();
      if (defaultThemeData) {
        setActiveTheme(defaultThemeData);
      }
    } catch (err) {
      console.error("Failed to load default theme:", err);
      // Continue without theme - use base layout
    }
  };

  const getThemeComponent = (
    componentName: string
  ): React.ComponentType<any> | null => {
    if (!activeTheme) return null;

    const component = activeTheme.components.get(componentName);
    return component || null;
  };

  const getThemeLayout = (
    layoutName: string
  ): React.ComponentType<any> | null => {
    if (!activeTheme) return null;

    const layout = activeTheme.layouts.get(layoutName);
    return layout || null;
  };

  const contextValue: ThemeContextType = {
    activeTheme,
    isLoading,
    error,
    getThemeComponent,
    getThemeLayout,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Dynamic Theme Layout Wrapper
interface ThemeLayoutProps {
  children: React.ReactNode;
  layoutName?: string;
}

export function ThemeLayout({
  children,
  layoutName = "default",
}: ThemeLayoutProps) {
  const { getThemeLayout, isLoading, error, activeTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading theme...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Theme Loading Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Get the theme layout component
  const LayoutComponent = getThemeLayout(layoutName);

  if (LayoutComponent) {
    // Use theme layout
    return <LayoutComponent>{children}</LayoutComponent>;
  }

  // Fallback to base layout if no theme layout found
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="min-h-screen">
          <header className="border-b bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-xl font-semibold">
                {activeTheme?.name || "Modular App"}
              </h1>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

// Dynamic Theme Component Wrapper
interface ThemeComponentProps {
  name: string;
  fallback?: React.ComponentType<any>;
  [key: string]: any;
}

export function ThemeComponent({
  name,
  fallback: Fallback,
  ...props
}: ThemeComponentProps) {
  const { getThemeComponent } = useTheme();

  const Component = getThemeComponent(name);

  if (Component) {
    return <Component {...props} />;
  }

  if (Fallback) {
    return <Fallback {...props} />;
  }

  return (
    <div className="p-4 border border-dashed border-muted rounded-lg bg-muted/20">
      <p className="text-sm text-muted-foreground">
        Component "{name}" not found in active theme
      </p>
    </div>
  );
}

// Theme-aware utility hooks
export function useThemeColors() {
  const { activeTheme } = useTheme();
  return activeTheme?.customization.colors || {};
}

export function useThemeConfig() {
  const { activeTheme } = useTheme();
  return activeTheme?.customization || {};
}
