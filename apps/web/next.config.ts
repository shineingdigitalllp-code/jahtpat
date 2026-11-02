import type { NextConfig } from "next";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api/v1";
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@jhatpat/shared"],
  allowedDevOrigins: ["192.168.*.*"],
  devIndicators: false,
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_INTERNAL_URL}/:path*` },
      { source: "/uploads/:path*", destination: `${API_ORIGIN}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
