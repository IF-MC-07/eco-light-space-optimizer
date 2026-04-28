/** @type {import('next').NextConfig} */
const nextConfig = {
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
