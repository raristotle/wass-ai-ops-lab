import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Wesco SignalDesk runs as its own Vercel project; this domain proxies
  // /signaldesk/* to it (the SignalDesk app is basePath-aware, so the
  // prefix is preserved on the destination).
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/signaldesk",
          destination: "https://signaldesk-mike-w-s-projects.vercel.app/signaldesk",
        },
        {
          source: "/signaldesk/:path*",
          destination: "https://signaldesk-mike-w-s-projects.vercel.app/signaldesk/:path*",
        },
      ],
    };
  },
  turbopack: {
    resolveAlias: {
      "@/components": path.resolve(__dirname, "../../components"),
      "@/lib": path.resolve(__dirname, "../../lib"),
      "@/features": path.resolve(__dirname, "../../features"),
      "@/data": path.resolve(__dirname, "../../data"),
    },
  },
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
