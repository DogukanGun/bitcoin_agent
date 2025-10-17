/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  env: {
    NEXT_PUBLIC_MEZO_CHAIN_ID: process.env.NEXT_PUBLIC_MEZO_CHAIN_ID,
    NEXT_PUBLIC_MEZO_RPC_URL: process.env.NEXT_PUBLIC_MEZO_RPC_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SUBSCRIPTION_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_SUBSCRIPTION_FACTORY_ADDRESS,
    NEXT_PUBLIC_RESERVE_POOL_ADDRESS: process.env.NEXT_PUBLIC_RESERVE_POOL_ADDRESS,
    NEXT_PUBLIC_PAYMENT_POINT_NFT_ADDRESS: process.env.NEXT_PUBLIC_PAYMENT_POINT_NFT_ADDRESS,
    NEXT_PUBLIC_TEST_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;