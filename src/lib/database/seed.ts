
import { connectToDatabase } from './mongodb'
import { UserModel } from './models/user'
import { SystemSettingsModel } from './models/settings'
import { InstalledThemeModel } from './models/theme'
import { InstalledPluginModel } from './models/plugin'
import { DEFAULT_THEME_COLORS } from '@/lib/constants'

export async function seedDatabase(force = false) {
  try {
    console.log('🌱 Starting database seeding...')
    
    await connectToDatabase()

    // Check if database is already seeded
    const settings = await SystemSettingsModel.findOne()
    if (!force || !settings?.isSetupComplete) {
      console.log('❌ Seeding skipped: Setup must be completed first, or use force=true')
      return
    }

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

    // Seed system settings
    console.log('⚙️ Seeding system settings...')
    await SystemSettingsModel.create({
      siteName: 'Modular App',
      siteDescription: 'A powerful modular web application built with Next.js 15',
      adminEmail: 'admin@modularapp.com',
      isSetupComplete: true,
      allowUserRegistration: true,
      maintenanceMode: false,
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
        metadata: { source: 'seed' },
      },
      {
        email: 'moderator@modularapp.com',
        password: 'ModeratorPassword123!',
        firstName: 'Demo',
        lastName: 'Moderator',
        role: 'moderator',
        isActive: true,
        isEmailVerified: true,
        metadata: { source: 'seed' },
      },
    ])

    // Seed default theme
    console.log('🎨 Seeding default theme...')
    const defaultTheme = await InstalledThemeModel.create({
      themeId: 'default-theme',
      name: 'Default Theme',
      version: '1.0.0',
      status: 'installed',
      customization: {
        colors: DEFAULT_THEME_COLORS,
        typography: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            serif: ['Merriweather', 'serif'],
            mono: ['Fira Code', 'monospace'],
          },
        },
        borderRadius: '0.5rem',
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        },
      },
      installPath: '/themes/default-theme',
      isActive: true,
      manifest: {
        id: 'default-theme',
        name: 'Default Theme',
        version: '1.0.0',
        description: 'Default theme for Modular App',
        author: {
          name: 'Modular App Team',
          email: 'team@modularapp.com',
        },
        license: 'MIT',
        category: 'minimal',
        compatibility: {
          nextjs: '^15.0.0',
          app: '^1.0.0',
        },
        preview: {
          thumbnail: '/themes/default-theme/preview.jpg',
        },
        features: ['Responsive design', 'Dark mode support', 'Customizable'],
        main: 'index.js',
        layouts: {
          default: 'layouts/default.tsx',
          admin: 'layouts/admin.tsx',
          auth: 'layouts/auth.tsx',
        },
      },
      installedBy: adminUser._id.toString(),
      activatedAt: new Date(),
    })

    // Update system settings with active theme
    await SystemSettingsModel.updateOne(
      {},
      { activeTheme: defaultTheme.themeId }
    )

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
              component: 'admin/analytics.tsx',
            },
          ],
          dashboardWidgets: [
            {
              id: 'visitor-stats',
              title: 'Visitor Statistics',
              component: 'widgets/visitor-stats.tsx',
              size: 'medium',
            },
          ],
        },
        installedBy: adminUser._id.toString(),
        lastActivated: new Date(),
      },
      {
        pluginId: 'backup-plugin',
        name: 'Backup & Restore',
        version: '2.1.0',
        status: 'installed',
        config: {
          schedule: 'daily',
          retention: 30,
          storage: 'local',
          compression: true,
        },
        installPath: '/plugins/backup-plugin',
        isActive: false,
        manifest: {
          id: 'backup-plugin',
          name: 'Backup & Restore',
          version: '2.1.0',
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
          permissions: ['database:read', 'database:write', 'files:read', 'files:write'],
          main: 'index.js',
          adminPages: [
            {
              path: '/backup',
              title: 'Backup & Restore',
              icon: 'Archive',
              component: 'admin/backup.tsx',
            },
          ],
        },
        installedBy: adminUser._id.toString(),
      },
      {
        pluginId: 'seo-plugin',
        name: 'SEO Optimizer',
        version: '1.5.0',
        status: 'installed',
        config: {
          autoSitemap: true,
          metaAnalysis: true,
          keywordTracking: ['nextjs', 'modular', 'web app'],
        },
        installPath: '/plugins/seo-plugin',
        isActive: true,
        manifest: {
          id: 'seo-plugin',
          name: 'SEO Optimizer',
          version: '1.5.0',
          description: 'Complete SEO optimization and analysis tools',
          author: {
            name: 'SEO Team',
            email: 'seo@modularapp.com',
          },
          license: 'MIT',
          category: 'content',
          compatibility: {
            nextjs: '^15.0.0',
            app: '^1.0.0',
          },
          permissions: ['database:read', 'settings:write', 'files:write'],
          main: 'index.js',
          routes: [
            {
              path: '/sitemap.xml',
              method: 'GET',
              handler: 'routes/sitemap.js',
            },
          ],
          adminPages: [
            {
              path: '/seo',
              title: 'SEO Tools',
              icon: 'Search',
              component: 'admin/seo.tsx',
            },
          ],
          dashboardWidgets: [
            {
              id: 'seo-score',
              title: 'SEO Score',
              component: 'widgets/seo-score.tsx',
              size: 'small',
            },
          ],
        },
        installedBy: adminUser._id.toString(),
        lastActivated: new Date(),
      },
    ])

    console.log('✅ Database seeded successfully!')
    console.log('📊 Seeded data summary:')
    console.log(`  - Users: ${await UserModel.countDocuments()}`)
    console.log(`  - Themes: ${await InstalledThemeModel.countDocuments()}`)
    console.log(`  - Plugins: ${await InstalledPluginModel.countDocuments()}`)
    console.log(`  - Settings: ${await SystemSettingsModel.countDocuments()}`)
    console.log('')
    console.log('🔑 Login credentials:')
    console.log('  Admin: admin@modularapp.com / AdminPassword123!')
    console.log('  Demo: demo@modularapp.com / DemoPassword123!')
    console.log('  Moderator: moderator@modularapp.com / ModeratorPassword123!')

  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  }
}

// CLI runner
if (require.main === module) {
  const force = process.argv.includes('--force')
  seedDatabase(force)
    .then(() => {
      console.log('🌱 Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

export default seedDatabase