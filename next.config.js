/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing Next.js configuration
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  
  // Webpack configuration to handle dynamic imports and suppress warnings
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Suppress critical dependency warnings for dynamic imports in plugin/theme loaders
    config.module.exprContextCritical = false
    config.module.unknownContextCritical = false
    
    // Add specific rules to ignore warnings for our dynamic loading system
    config.ignoreWarnings = [
      // Ignore critical dependency warnings for our plugin/theme system
      {
        module: /src\/lib\/(plugins|themes)\/loader\.ts/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      // Ignore dynamic import warnings for plugin routes
      {
        module: /src\/app\/api\/plugin-routes/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      // General dynamic import warning suppression for our modular system
      function (warning) {
        return (
          warning.message &&
          warning.message.includes('Critical dependency: the request of a dependency is an expression') &&
          (warning.module?.resource?.includes('plugins/loader') ||
           warning.module?.resource?.includes('themes/loader') ||
           warning.module?.resource?.includes('plugin-routes'))
        )
      },
    ]
    
    // Configure webpack to handle our dynamic module loading
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      module: false,
    }
    
    // Exclude our plugin/theme directories from webpack bundling
    config.externals = [
      ...((config.externals) || []),
      function (context, request, callback) {
        if (request.includes('plugins/installed/') || request.includes('themes/installed/')) {
          return callback(null, 'commonjs ' + request)
        }
        callback()
      },
    ]
    
    // Configure module resolution for our dynamic loading
    config.module.rules.push({
      test: /\.tsx?$/,
      include: [
        /src\/lib\/plugins\/loader\.ts/,
        /src\/lib\/themes\/loader\.ts/,
      ],
      use: [
        {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              allowJs: true,
              esModuleInterop: true,
            },
          },
        },
      ],
    })
    
    return config
  },
  
  // Additional configuration for handling dynamic routes
  async rewrites() {
    return [
      {
        source: '/plugins/:path*',
        destination: '/api/plugin-routes/:path*',
      },
    ]
  },
  
  // Headers for security and CORS
  async headers() {
    return [
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
}

module.exports = nextConfig