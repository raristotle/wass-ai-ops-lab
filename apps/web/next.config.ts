import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

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

// ── Sentry (env-gated) ──────────────────────────────────────────────────────
// withSentryConfig is applied ONLY when a DSN is present at build time, so a
// dormant build (no DSN) keeps the exact original pipeline — no Sentry webpack
// plugin, no tunnel route, no source-map step. The instrumentation files
// (instrumentation*.ts, sentry.*.config.ts) self-guard their init() on the DSN.
// Activation = set the DSN env vars in Vercel and redeploy. Source-map upload is
// further gated on SENTRY_AUTH_TOKEN, so a token-less active build still succeeds.
const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN);
const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: true,
      sourcemaps: { disable: !hasSentryAuthToken },
      disableLogger: true,
    })
  : nextConfig;
