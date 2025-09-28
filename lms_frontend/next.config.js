/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
  },
  env: {
    LMS_API_URL: process.env.LMS_API_URL || 'http://localhost:5000',
    IONIA_API_URL: process.env.IONIA_API_URL || 'http://localhost:4000',
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
