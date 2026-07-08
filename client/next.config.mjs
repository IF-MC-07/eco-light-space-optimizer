/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'http://192.168.56.1:3000',
    'http://192.168.56.1',
  ],
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
      jsdom: './empty-module.js',
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      jsdom: false
    };
    return config;
  },
};

export default nextConfig;
