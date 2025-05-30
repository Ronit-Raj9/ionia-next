/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB', 'INP'],
  },

  // Bundle analyzer
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
  },

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com https://www.googletagmanager.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.example.com https://www.google-analytics.com",
              "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
              "media-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()',
              'payment=()',
              'usb=()'
            ].join(', ')
          }
        ],
      },
      // Cache headers for static assets
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Cache headers for API routes
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ];
  },

  // Webpack configuration for optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Analyze bundle in development
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      );
    }

    // Optimize chunks
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunk for common libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
              enforce: true,
              minSize: 0,
            },
            // Common components chunk
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              chunks: 'all',
              enforce: true,
              minSize: 0,
            },
            // Admin-specific chunk
            admin: {
              test: /[\\/]src[\\/](app[\\/]admin|components[\\/]admin)/,
              name: 'admin',
              priority: 15,
              chunks: 'all',
              enforce: true,
            },
            // Auth-specific chunk
            auth: {
              test: /[\\/]src[\\/](app[\\/]auth|components[\\/]auth)/,
              name: 'auth',
              priority: 15,
              chunks: 'all',
              enforce: true,
            },
            // Test-specific chunk
            test: {
              test: /[\\/]src[\\/](app[\\/]exam|components[\\/]test|components[\\/]analysis)/,
              name: 'test',
              priority: 15,
              chunks: 'all',
              enforce: true,
            },
            // UI libraries chunk
            ui: {
              test: /[\\/]node_modules[\\/](react|react-dom|@headlessui|@heroicons|framer-motion)/,
              name: 'ui',
              priority: 20,
              chunks: 'all',
              enforce: true,
            },
            // Charts and visualization
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3|chart\.js)/,
              name: 'charts',
              priority: 20,
              chunks: 'all',
              enforce: true,
            }
          },
        },
      };
    }

    // Alias for absolute imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Optimize images
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/images/',
          outputPath: 'static/images/',
          name: '[name].[hash].[ext]',
        },
      },
    });

    // Tree shaking for lodash
    config.plugins.push(
      new webpack.ContextReplacementPlugin(
        /lodash/,
        /\.(js|ts)$/
      )
    );

    // Ignore moment locales to reduce bundle size
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
    ];
  },

  // Rewrites for API routing
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/:path*`,
      },
    ];
  },

  // Output settings
  output: 'standalone',
  
  // Production-only optimizations
  ...(process.env.NODE_ENV === 'production' && {
    productionBrowserSourceMaps: false,
    optimizeFonts: true,
    swcMinify: true,
  }),

  // Development settings
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right',
    },
  }),
};

const path = require('path');

// With Bundle Analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// With PWA
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 86400, // 24 hours
        },
      },
    },
  ],
});

module.exports = withBundleAnalyzer(withPWA(nextConfig)); 