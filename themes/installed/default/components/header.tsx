// ========================================
// components/header.tsx - Site header
// ========================================
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Menu, 
  Zap, 
  Settings, 
  User, 
  Palette, 
  Plug,
  Users,
  BarChart3
} from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Modular App</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <div className="grid gap-1">
                      <Link href="/admin" className="flex items-center gap-2 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <BarChart3 className="w-4 h-4" />
                        <div>
                          <div className="text-sm font-medium">Dashboard</div>
                          <p className="text-xs text-muted-foreground">View system overview</p>
                        </div>
                      </Link>
                      
                      <Link href="/admin/users" className="flex items-center gap-2 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <Users className="w-4 h-4" />
                        <div>
                          <div className="text-sm font-medium">Users</div>
                          <p className="text-xs text-muted-foreground">Manage user accounts</p>
                        </div>
                      </Link>
                      
                      <Link href="/admin/themes" className="flex items-center gap-2 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <Palette className="w-4 h-4" />
                        <div>
                          <div className="text-sm font-medium">Themes</div>
                          <p className="text-xs text-muted-foreground">Customize appearance</p>
                        </div>
                      </Link>
                      
                      <Link href="/admin/plugins" className="flex items-center gap-2 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <Plug className="w-4 h-4" />
                        <div>
                          <div className="text-sm font-medium">Plugins</div>
                          <p className="text-xs text-muted-foreground">Extend functionality</p>
                        </div>
                      </Link>
                      
                      <Link href="/admin/settings" className="flex items-center gap-2 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <Settings className="w-4 h-4" />
                        <div>
                          <div className="text-sm font-medium">Settings</div>
                          <p className="text-xs text-muted-foreground">System configuration</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    About
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link href="/contact" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    Contact
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link href="/auth/signin">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            </Button>
            
            <Button size="sm" asChild className="hidden md:inline-flex">
              <Link href="/admin">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link href="/" className="text-sm font-medium">Home</Link>
                  <Link href="/admin" className="text-sm font-medium">Admin</Link>
                  <Link href="/about" className="text-sm font-medium">About</Link>
                  <Link href="/contact" className="text-sm font-medium">Contact</Link>
                  <div className="border-t pt-4">
                    <Link href="/auth/signin" className="text-sm font-medium">Sign In</Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
