import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/health",
        destination: "/api/health",
      },
      {
        source: "/tweet",
        destination: "/api/tweet-html",
      },
      {
        source: "/tweet-svg",
        destination: "/api/tweet-svg",
      },
    ];
  },
};

export default nextConfig;
