/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    emotion: true,
  },
  transpilePackages: ['@traverum/shared'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@traverum/shared': require('path').resolve(__dirname, '../../packages/shared/src'),
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'vwbxkkzzpacqzqvqxqvf.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/embed.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Cache-Control', value: 'public, max-age=300' }, // 5 min cache
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      // CORS for embed API (Shadow DOM widget fetches data from any hotel site)
      {
        source: '/api/embed/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      // CORS for dashboard API (dashboard app calls widget API cross-origin)
      {
        source: '/api/dashboard/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      // Prevent caching on hotel pages to ensure fresh config is always loaded
      {
        source: '/:hotelSlug((?!api|_next|favicon|embed).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Vercel-CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
