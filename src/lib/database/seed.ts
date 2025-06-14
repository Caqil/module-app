// src/lib/database/seed.ts - Updated with automatic theme installation

import { connectToDatabase } from './mongodb'
import { UserModel } from './models/user'
import { SystemSettingsModel } from './models/settings'
import { InstalledThemeModel } from './models/theme'
import { InstalledPluginModel } from './models/plugin'
import { hashPassword } from '@/lib/utils'
import { DEFAULT_THEME_COLORS } from '@/lib/constants'
import fs from 'fs/promises'
import path from 'path'

// Default theme files content
const DEFAULT_THEME_FILES = {
  'theme.json': {
    "id": "default",
    "name": "Default Theme",
    "version": "1.0.0",
    "description": "A clean, modern default theme for Modular App with Next.js styling",
    "author": {
      "name": "Modular App Team",
      "email": "team@modularapp.com",
      "url": "https://modularapp.com"
    },
    "license": "MIT",
    "category": "minimal",
    "compatibility": {
      "nextjs": "^15.0.0",
      "app": "^1.0.0"
    },
    "features": [
      "Responsive design",
      "Dark mode support", 
      "Customizable colors",
      "Modern typography",
      "Component-based architecture",
      "SEO optimized"
    ],
    "main": "index.js",
    "layouts": {
      "default": "layouts/default.tsx",
      "admin": "layouts/admin.tsx", 
      "auth": "layouts/auth.tsx"
    },
    "pages": {
      "home": "pages/home.tsx",
      "about": "pages/about.tsx",
      "contact": "pages/contact.tsx"
    },
    "components": {
      "header": "components/header.tsx",
      "footer": "components/footer.tsx",
      "hero": "components/hero.tsx",
      "feature-grid": "components/feature-grid.tsx"
    },
    "assets": {
      "css": ["assets/css/theme.css"],
      "images": ["assets/images/logo.svg"],
      "fonts": ["assets/fonts/inter.woff2"]
    },
    "settings": {
      "schema": {
        "colors": {
          "type": "object",
          "properties": {
            "primary": { "type": "string", "format": "color" },
            "secondary": { "type": "string", "format": "color" },
            "accent": { "type": "string", "format": "color" },
            "background": { "type": "string", "format": "color" },
            "foreground": { "type": "string", "format": "color" }
          }
        },
        "typography": {
          "type": "object",
          "properties": {
            "fontFamily": {
              "type": "object",
              "properties": {
                "sans": { "type": "array", "items": { "type": "string" } },
                "serif": { "type": "array", "items": { "type": "string" } },
                "mono": { "type": "array", "items": { "type": "string" } }
              }
            }
          }
        },
        "borderRadius": { "type": "string" }
      },
      "defaults": {
        "colors": DEFAULT_THEME_COLORS,
        "typography": {
          "fontFamily": {
            "sans": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
            "serif": ["Merriweather", "ui-serif", "Georgia", "serif"],
            "mono": ["Fira Code", "ui-monospace", "SFMono-Regular", "monospace"]
          }
        },
        "borderRadius": "0.5rem",
        "spacing": {
          "containerMaxWidth": "1200px",
          "sectionPadding": "4rem"
        },
        "layout": {
          "headerHeight": "4rem",
          "footerHeight": "auto",
          "sidebarWidth": "16rem"
        },
        "shadows": {
          "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          "md": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)"
        },
        "animations": {
          "duration": "150ms",
          "easing": "cubic-bezier(0.4, 0, 0.2, 1)"
        }
      }
    }
  },

  'index.js': `class DefaultTheme {
  constructor(context) {
    this.context = context
    this.config = context.config
    this.customization = context.customization
  }

  async initialize() {
    console.log('Default theme initialized')
    this.applyCSSVariables()
    this.registerComponents()
    this.setupHooks()
  }

  applyCSSVariables() {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const colors = this.customization.colors || {}
      
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(\`--theme-\${key}\`, value)
      })
      
      if (this.customization.borderRadius) {
        root.style.setProperty('--theme-border-radius', this.customization.borderRadius)
      }
    }
  }

  registerComponents() {
    const { api } = this.context
    
    api.setLayout('default', 'layouts/default.tsx')
    api.setLayout('admin', 'layouts/admin.tsx')
    api.setLayout('auth', 'layouts/auth.tsx')
    
    api.addPage({
      path: '/',
      component: 'pages/home.tsx',
      layout: 'default',
      title: 'Home'
    })
  }

  setupHooks() {
    this.context.events.on('customization:changed', (data) => {
      this.customization = { ...this.customization, ...data }
      this.applyCSSVariables()
    })
  }

  cleanup() {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const colors = this.customization.colors || {}
      
      Object.keys(colors).forEach(key => {
        root.style.removeProperty(\`--theme-\${key}\`)
      })
      
      root.style.removeProperty('--theme-border-radius')
    }
  }
}

module.exports = DefaultTheme`,

  'README.md': `# Default Theme

A clean, modern default theme for Modular App built with Next.js styling principles.

## Features

- 🎨 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 🌙 **Dark Mode Support** - Automatic theme switching
- ⚡ **Performance Optimized** - Minimal CSS and fast loading
- 🎯 **Accessible** - WCAG 2.1 compliant components
- 🔧 **Customizable** - Easy color and typography customization

## Customization

You can customize this theme through the admin panel:

1. Go to **Admin > Themes**
2. Click **Customize** on the Default Theme
3. Adjust colors, typography, and layout settings
4. Save your changes to see them applied instantly

## File Structure

\`\`\`
default/
├── theme.json           # Theme manifest
├── index.js            # Theme entry point
├── layouts/            # Layout components
├── pages/              # Page components  
├── components/         # Reusable components
├── assets/             # Static assets
└── README.md           # This file
\`\`\`

## Development

To modify this theme:

1. Edit the components in their respective folders
2. Update the theme.json manifest if needed
3. Test your changes in development mode
4. The theme will hot-reload automatically

## License

MIT License - feel free to customize and redistribute.
`,

  'assets/css/theme.css': `:root {
  --theme-primary: #0066cc;
  --theme-secondary: #6b7280;
  --theme-accent: #f59e0b;
  --theme-background: #ffffff;
  --theme-foreground: #111827;
  --theme-border-radius: 0.5rem;
}

.dark {
  --theme-background: #0f172a;
  --theme-foreground: #f8fafc;
}

.theme-gradient-primary {
  background: linear-gradient(to right, var(--theme-primary), var(--theme-accent));
}

.theme-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}`,

  'assets/images/logo.svg': `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="url(#paint0_linear)"/>
  <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="white"/>
  <defs>
    <linearGradient id="paint0_linear" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0066CC"/>
      <stop offset="1" stop-color="#6366F1"/>
    </linearGradient>
  </defs>
</svg>`
}

export async function seedDatabase(force = false) {
  try {
    console.log('🌱 Starting database seeding...')
    
    await connectToDatabase()

    // Check if database is already seeded
    const existingUser = await UserModel.findOne()
    if (existingUser && !force) {
      console.log('✅ Database already seeded. Use force=true to reseed.')
      return
    }

    if (force) {
      console.log('🗑️ Clearing existing data...')
      await Promise.all([
        UserModel.deleteMany({}),
        SystemSettingsModel.deleteMany({}),
        InstalledThemeModel.deleteMany({}),
        InstalledPluginModel.deleteMany({}),
      ])
    }

    // Create default theme files first
    console.log('🎨 Creating default theme files...')
    await createDefaultThemeFiles()

    // Seed admin user
    console.log('👤 Seeding admin user...')
    const adminUser = await UserModel.create({
      email: 'admin@modularapp.com',
      password: 'AdminPassword123!',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      metadata: {
        source: 'seed',
        createdBy: 'system',
      },
    })

    // Seed demo users
    console.log('👥 Seeding demo users...')
    await UserModel.insertMany([
      {
        email: 'demo@modularapp.com',
        password: 'DemoPassword123!',
        firstName: 'Demo',
        lastName: 'User',
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: false,
            sms: false,
          },
        },
        metadata: {
          source: 'seed',
          createdBy: 'system',
        },
      },
      {
        email: 'moderator@modularapp.com',
        password: 'ModeratorPassword123!',
        firstName: 'Moderator',
        lastName: 'User',
        role: 'moderator',
        isActive: true,
        isEmailVerified: true,
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
        metadata: {
          source: 'seed',
          createdBy: 'system',
        },
      },
    ])

    // Install default theme in database
    console.log('🎨 Installing default theme...')
    const defaultTheme = await InstalledThemeModel.create({
      themeId: 'default',
      name: 'Default Theme',
      version: '1.0.0',
      status: 'installed',
      customization: DEFAULT_THEME_FILES['theme.json'].settings.defaults,
      installPath: path.join(process.cwd(), 'themes', 'installed', 'default'),
      isActive: true,
      manifest: DEFAULT_THEME_FILES['theme.json'],
      installedBy: adminUser._id.toString(),
      activatedAt: new Date(),
    })

    // Seed system settings
    console.log('⚙️ Seeding system settings...')
    await SystemSettingsModel.create({
      siteName: 'Modular App',
      siteDescription: 'A powerful modular web application built with Next.js 15',
      adminEmail: 'admin@modularapp.com',
      isSetupComplete: true,
      allowUserRegistration: true,
      maintenanceMode: false,
      activeTheme: 'default', // Set default theme as active
      seoSettings: {
        metaTitle: 'Modular App - Extensible Web Platform',
        metaDescription: 'Build and extend your web application with themes and plugins',
        metaKeywords: 'modular, web app, nextjs, themes, plugins',
      },
      emailSettings: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        fromEmail: 'noreply@modularapp.com',
        fromName: 'Modular App',
      },
    })

    // Seed sample plugins
    console.log('🔌 Seeding sample plugins...')
    await InstalledPluginModel.insertMany([
      {
        pluginId: 'analytics-plugin',
        name: 'Analytics Plugin',
        version: '1.2.0',
        status: 'installed',
        config: {
          trackingId: 'GA-XXXXXXXXX',
          enableRealtime: true,
          trackEvents: ['click', 'scroll', 'form_submit'],
        },
        installPath: '/plugins/analytics-plugin',
        isActive: true,
        manifest: {
          id: 'analytics-plugin',
          name: 'Analytics Plugin',
          version: '1.2.0',
          description: 'Comprehensive analytics and tracking solution',
          author: {
            name: 'Analytics Team',
            email: 'analytics@modularapp.com',
          },
          license: 'MIT',
          category: 'analytics',
          compatibility: {
            nextjs: '^15.0.0',
            app: '^1.0.0',
          },
          permissions: ['database:read', 'users:read', 'settings:read'],
          main: 'index.js',
          routes: [
            {
              path: '/analytics/data',
              method: 'GET',
              handler: 'routes/data.js',
            },
          ],
          adminPages: [
            {
              path: '/analytics',
              title: 'Analytics',
              icon: 'BarChart3',
              component: 'pages/analytics.tsx',
            },
          ],
          dashboardWidgets: [
            {
              id: 'user-stats',
              title: 'User Statistics',
              component: 'widgets/user-stats.tsx',
              size: 'medium',
            },
          ],
        },
        installedBy: adminUser._id.toString(),
        lastActivated: new Date(),
      },
      {
        pluginId: 'backup-plugin',
        name: 'Backup Plugin',
        version: '1.1.0',
        status: 'installed',
        config: {
          schedule: 'daily',
          retention: 30,
          includeMedia: true,
        },
        installPath: '/plugins/backup-plugin',
        isActive: false,
        manifest: {
          id: 'backup-plugin',
          name: 'Backup Plugin',
          version: '1.1.0',
          description: 'Automated backup and restore functionality',
          author: {
            name: 'Backup Team',
            email: 'backup@modularapp.com',
          },
          license: 'MIT',
          category: 'utility',
          compatibility: {
            nextjs: '^15.0.0',
            app: '^1.0.0',
          },
          permissions: ['database:read', 'files:read', 'files:write'],
          main: 'index.js',
        },
        installedBy: adminUser._id.toString(),
      },
    ])

    console.log('✅ Database seeded successfully!')
    console.log('\n📋 Demo Accounts:')
    console.log('👑 Admin: admin@modularapp.com / AdminPassword123!')
    console.log('👤 Demo: demo@modularapp.com / DemoPassword123!')
    console.log('🛡️ Moderator: moderator@modularapp.com / ModeratorPassword123!')
    console.log('\n🎨 Default theme installed and activated!')
    console.log('🔌 Sample plugins installed!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

// Helper function to create default theme files
async function createDefaultThemeFiles() {
  const themePath = path.join(process.cwd(), 'themes', 'installed', 'default')
  
  try {
    // Create theme directory structure
    await fs.mkdir(themePath, { recursive: true })
    await fs.mkdir(path.join(themePath, 'layouts'), { recursive: true })
    await fs.mkdir(path.join(themePath, 'pages'), { recursive: true })
    await fs.mkdir(path.join(themePath, 'components'), { recursive: true })
    await fs.mkdir(path.join(themePath, 'assets', 'css'), { recursive: true })
    await fs.mkdir(path.join(themePath, 'assets', 'images'), { recursive: true })
    await fs.mkdir(path.join(themePath, 'assets', 'fonts'), { recursive: true })

    // Write theme files
    for (const [fileName, content] of Object.entries(DEFAULT_THEME_FILES)) {
      const filePath = path.join(themePath, fileName)
      const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      await fs.writeFile(filePath, fileContent, 'utf-8')
    }

    console.log('✅ Default theme files created successfully')
  } catch (error) {
    console.error('❌ Failed to create theme files:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  const force = process.argv.includes('--force')
  seedDatabase(force)
    .then(() => {
      console.log('🎉 Seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}