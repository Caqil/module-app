/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for App Router and server components
  experimental: {
    // Required for Mongoose to work properly in server components
    serverComponentsExternalPackages: ['mongoose', 'bcryptjs'],
    // Enable server actions
    serverActions: true,
    // Enable PPR for better performance
    ppr: true,
  },

  // Environment variables
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors (not recommended for production)
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors (not recommended for production)
    ignoreDuringBuilds: false,
    dirs: ['src', 'plugins', 'themes'],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Rewrites for plugin system and API routes
  async rewrites() {
    return [
      // Plugin API routes
      {
        source: '/plugin-api/:path*',
        destination: '/api/plugin-routes/:path*',
      },
      // Theme assets
      {
        source: '/theme-assets/:path*',
        destination: '/themes/installed/:path*',
      },
      // Plugin assets
      {
        source: '/plugin-assets/:path*',
        destination: '/plugins/installed/:path*',
      },
    ]
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // CORS headers for plugin APIs
      {
        source: '/api/plugin-routes/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },

  // Webpack configuration for plugin system
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/plugins': './plugins',
      '@/themes': './themes',
    }

    // Handle dynamic imports for plugins
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    }

    // Add support for loading plugins dynamically
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
      }
    }

    return config
  },

  // Output configuration
  output: 'standalone',

  // Compression
  compress: true,

  // Power optimization
  poweredByHeader: false,

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ]
  },

  // Bundle analyzer (optional)
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      ...this.experimental,
      bundlePagesRouterDependencies: true,
    },
  }),
}

module.exports = nextConfig
