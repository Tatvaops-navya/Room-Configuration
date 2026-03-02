/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow larger image uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon.svg' }]
  },
}

module.exports = nextConfig
