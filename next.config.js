/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow larger image uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
