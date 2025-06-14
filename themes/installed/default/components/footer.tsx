
// ========================================
// components/footer.tsx - Site footer
// ========================================
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Zap, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail,
  Heart
} from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Modular App</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              A powerful, extensible web application platform built with modern technologies.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://github.com" target="_blank">
                  <Github className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://twitter.com" target="_blank">
                  <Twitter className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://linkedin.com" target="_blank">
                  <Linkedin className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Product</h3>
            <div className="space-y-2">
              <Link href="/admin" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Admin Panel
              </Link>
              <Link href="/admin/themes" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Themes
              </Link>
              <Link href="/admin/plugins" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Plugins
              </Link>
              <Link href="/admin/users" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                User Management
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Support</h3>
            <div className="space-y-2">
              <Link href="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </Link>
              <Link href="/docs" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link href="/help" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Help Center
              </Link>
              <Link href="/api" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                API Reference
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Legal</h3>
            <div className="space-y-2">
              <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookie Policy
              </Link>
              <Link href="/license" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                License
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>© {currentYear} Modular App. Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>using Next.js</span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <Link href="/status" className="hover:text-foreground transition-colors">
              System Status
            </Link>
            <Link href="/changelog" className="hover:text-foreground transition-colors">
              Changelog
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="mailto:contact@modularapp.com">
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
