/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Your original rewrites - keeping all the API routing
  async rewrites() {
    return [
      {
        source: '/login', 
        destination: '/login',
      },
      {
        source: '/register',
        destination: '/register',
      },
      // API proxy to backend - ensure all API requests go through Next.js
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/:path*`,
      },
      // Admin routes
      {
        source: '/api/v1/admin/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/:path*`,
      },
      // More specific routes for other endpoints
      {
        source: '/users/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/users/:path*`,
      },
      {
        source: '/questions/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/questions/:path*`,
      },
      {
        source: '/tests/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/tests/:path*`,
      }
    ];
  },

  // Your original image configuration with some improvements
  images: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Added from new config for better performance
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://3.7.73.172/api/v1',
  },

  // Your original headers with some security improvements
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://ionia.sbs' : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; connect-src 'self' http://3.110.43.68/ https://ionia.sbs https://www.ionia.sbs https://api.ionia.sbs http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:* ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https: http: https://res.cloudinary.com;"
          },
          // Added some basic security headers from new config
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },

  // Simple compiler optimization - only remove console.log in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },

  // Keep font optimization
  optimizeFonts: true,

  // Production-only optimizations (simplified)
  ...(process.env.NODE_ENV === 'production' && {
    swcMinify: true,
  }),
};

module.exports = nextConfig;