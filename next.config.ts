import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/caregivers',
        destination: '/ingrijitori',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
