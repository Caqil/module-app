
// ========================================
// components/hero.tsx - Hero section component
// ========================================
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Zap, Star, CheckCircle, Settings, Palette } from 'lucide-react'

interface HeroProps {
  title?: string
  subtitle?: string
  showCTA?: boolean
  variant?: 'default' | 'minimal' | 'gradient'
}

export default function Hero({ 
  title = "Welcome to Modular App",
  subtitle = "Your powerful, extensible web application is ready!",
  showCTA = true,
  variant = 'default'
}: HeroProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-background'
      case 'gradient':
        return 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900'
      default:
        return 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900'
    }
  }

  return (
    <section className={`relative pt-20 pb-32 ${getVariantClasses()}`}>
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
              {title.split(' ').slice(0, 2).join(' ')}
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              {title.split(' ').slice(2).join(' ')}
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            {subtitle}
          </p>
          
          {/* CTA Buttons */}
          {showCTA && (
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
          )}
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-10 w-16 h-16 bg-indigo-200 dark:bg-indigo-800 rounded-full opacity-20 animate-pulse delay-300"></div>
      <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-pulse delay-700"></div>
    </section>
  )
}
