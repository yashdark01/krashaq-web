import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  compress: false,
  experimental: { proxyTimeout: 300000 },
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${process.env.API_GATEWAY_URL ?? 'http://127.0.0.1:3100'}/v1/:path*`,
      },
    ];
  },
};
export default config;
