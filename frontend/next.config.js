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
            value: "default-src 'self' https://ionia-next-production.up.railway.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://ionia-next-production.up.railway.app; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
          },
          {
            key: 'Set-Cookie',
            value: 'SameSite=Strict; Secure'
          }
        ]
      }
    ];
  },
  optimizeFonts: true
};

module.exports = nextConfig; 