
// ========================================
// pages/about.tsx - About page
// ========================================
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About Modular App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Learn more about this powerful, extensible web application platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                To provide developers with a modern, extensible foundation for building 
                scalable web applications without the complexity of traditional platforms.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Built with the latest web technologies including Next.js 15, TypeScript, 
                MongoDB, and Tailwind CSS for maximum performance and developer experience.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
