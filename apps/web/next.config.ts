import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/components": path.resolve(__dirname, "../../components"),
      "@/lib": path.resolve(__dirname, "../../lib"),
      "@/features": path.resolve(__dirname, "../../features"),
      "@/data": path.resolve(__dirname, "../../data"),
    };
    return config;
  },
};

export default nextConfig;
