/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: 'filesystem',
        compression: false,
        maxMemoryGenerations: 1,
      }
    }
    return config
  },
}

export default nextConfig
