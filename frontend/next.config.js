/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/login', 
        destination: '/auth/login',
      },
      {
        source: '/register',
        destination: '/auth/register',
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com"
          }
        ]
      }
    ];
  },
  optimizeFonts: true
};

module.exports = nextConfig; 