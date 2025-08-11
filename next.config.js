/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@vanilla-extract', 
    '@rainbow-me',
    '@reown',
    '@walletconnect'
  ],
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
