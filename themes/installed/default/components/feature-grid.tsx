
// ========================================
// components/feature-grid.tsx - Features grid component
// ========================================
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Code2, 
  Palette, 
  Plug, 
  Shield,
  Rocket,
  Globe,
  LucideIcon
} from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  gradient: string
}

const features: Feature[] = [
  {
    icon: Palette,
    title: "Dynamic Themes",
    description: "Switch themes instantly without rebuilding. Customize colors, typography, and layouts in real-time through the admin panel.",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    icon: Plug,
    title: "Powerful Plugins",
    description: "Extend functionality with ZIP-based plugins. Add API routes, admin pages, and dashboard widgets dynamically.",
    gradient: "from-green-500 to-green-600"
  },
  {
    icon: Code2,
    title: "Modern Stack",
    description: "Built with Next.js 15, TypeScript, MongoDB, and Tailwind CSS. Production-ready with full type safety.",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "JWT authentication, role-based permissions, CSRF protection, and comprehensive security features built-in.",
    gradient: "from-red-500 to-red-600"
  },
  {
    icon: Rocket,
    title: "Production Ready",
    description: "Optimized for performance and scalability. Deploy to Vercel, Docker, or any modern hosting platform.",
    gradient: "from-orange-500 to-orange-600"
  },
  {
    icon: Globe,
    title: "Global Ready",
    description: "Multi-language support, timezone handling, and internationalization features for worldwide deployments.",
    gradient: "from-teal-500 to-teal-600"
  }
]

interface FeatureGridProps {
  title?: string
  subtitle?: string
  features?: Feature[]
  columns?: 1 | 2 | 3 | 4
}

export default function FeatureGrid({ 
  title = "Everything You Need",
  subtitle = "A complete foundation for building modern, scalable web applications",
  features: customFeatures = features,
  columns = 3
}: FeatureGridProps) {
  const getGridClasses = () => {
    switch (columns) {
      case 1: return 'grid-cols-1'
      case 2: return 'md:grid-cols-2'
      case 4: return 'md:grid-cols-2 lg:grid-cols-4'
      default: return 'md:grid-cols-2 lg:grid-cols-3'
    }
  }

  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
        
        <div className={`grid ${getGridClasses()} gap-8`}>
          {customFeatures.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}