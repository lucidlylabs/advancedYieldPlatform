/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vanilla-extract', '@rainbow-me'],
  reactStrictMode: true,
  experimental: {
    esmExternals: 'loose', 
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
