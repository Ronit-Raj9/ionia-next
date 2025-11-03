/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
  },
  env: {
    LMS_API_URL: process.env.LMS_API_URL || 'http://localhost:5000',
    IONIA_API_URL: process.env.IONIA_API_URL || 'http://localhost:4000',
    AI_API_URL: process.env.AI_API_URL || 'http://localhost:8000',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        events: false,
        process: false,
        util: false,
        buffer: false,
        querystring: false,
        vm: false,
        constants: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/lms/:path*',
        destination: `${process.env.LMS_API_URL || 'http://localhost:5000'}/api/v1/:path*`,
      },
      {
        source: '/api/ionia/:path*',
        destination: `${process.env.IONIA_API_URL || 'http://localhost:4000'}/api/v1/:path*`,
      },
      {
        source: '/api/ai/:path*',
        destination: `${process.env.AI_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
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
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
