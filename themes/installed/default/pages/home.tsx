// ========================================
// pages/home.tsx - Main home page
// ========================================
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Code2, 
  Palette, 
  Plug, 
  Users, 
  ArrowRight,
  Github,
  Zap,
  Shield,
  Globe,
  Rocket,
  Settings,
  Download,
  Star,
  CheckCircle
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 pt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <Zap className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 text-gray-900 fill-current" />
                </div>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Setup Complete
              </Badge>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome to
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Modular App
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Your powerful, extensible web application is ready! 
              Built with <strong>Next.js 15</strong>, customizable with themes, 
              and extensible with plugins - all without touching code.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-4 h-auto">
                <Link href="/admin">
                  <Settings className="w-5 h-5 mr-2" />
                  Open Admin Panel
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-4 h-auto">
                <Link href="/admin/themes">
                  <Palette className="w-5 h-5 mr-2" />
                  Browse Themes
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-16 h-16 bg-indigo-200 dark:bg-indigo-800 rounded-full opacity-20 animate-pulse delay-300"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-pulse delay-700"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A complete foundation for building modern, scalable web applications
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Dynamic Themes */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Dynamic Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  Switch themes instantly without rebuilding. Customize colors, typography, 
                  and layouts in real-time through the admin panel.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Powerful Plugins */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Plug className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Powerful Plugins</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  Extend functionality with ZIP-based plugins. Add API routes, 
                  admin pages, and dashboard widgets dynamically.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Modern Stack */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Code2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Modern Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  Built with Next.js 15, TypeScript, MongoDB, and Tailwind CSS. 
                  Production-ready with full type safety.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Secure Authentication */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Secure by Default</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  JWT authentication, role-based permissions, CSRF protection, 
                  and comprehensive security features built-in.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Scalable Architecture */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Production Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  Optimized for performance and scalability. Deploy to Vercel, 
                  Docker, or any modern hosting platform.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Global Reach */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Global Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  Multi-language support, timezone handling, and internationalization 
                  features for worldwide deployments.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-12">
            Explore your new application and start customizing it to fit your needs
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Button size="lg" variant="secondary" asChild className="h-auto py-6 px-8">
              <Link href="/admin/users" className="flex flex-col items-center gap-2">
                <Users className="w-8 h-8" />
                <span className="font-semibold">Manage Users</span>
                <span className="text-sm opacity-80">Add team members</span>
              </Link>
            </Button>
            
            <Button size="lg" variant="secondary" asChild className="h-auto py-6 px-8">
              <Link href="/admin/plugins" className="flex flex-col items-center gap-2">
                <Download className="w-8 h-8" />
                <span className="font-semibold">Install Plugins</span>
                <span className="text-sm opacity-80">Extend functionality</span>
              </Link>
            </Button>
            
            <Button size="lg" variant="secondary" asChild className="h-auto py-6 px-8">
              <Link href="/admin/settings" className="flex flex-col items-center gap-2">
                <Settings className="w-8 h-8" />
                <span className="font-semibold">Configure</span>
                <span className="text-sm opacity-80">System settings</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
