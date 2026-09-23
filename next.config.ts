import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  experimental: { serverActions: { allowedOrigins: ['localhost:3000', 'rent.healingcity.lk'] } }
}

export default nextConfig
