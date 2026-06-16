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
        // OAuth 2.1 discovery (RFC 8414 §3.1): SignalDesk's issuer is the
        // path-bearing https://app.raristotle.com/signaldesk, so a strict MCP
        // client derives the authorization-server (and protected-resource)
        // metadata at the APEX insertion path /.well-known/<doc>/signaldesk —
        // which lands on THIS gateway, not SignalDesk. Forward those apex paths
        // to SignalDesk's basePath-served append-form routes so the connector
        // resolves them. (SDK clients also try the append form SignalDesk already
        // serves; this covers strict, insertion-only clients.)
        {
          source: "/.well-known/oauth-authorization-server/signaldesk",
          destination: "https://signaldesk-mike-w-s-projects.vercel.app/signaldesk/.well-known/oauth-authorization-server",
        },
        {
          source: "/.well-known/oauth-protected-resource/signaldesk",
          destination: "https://signaldesk-mike-w-s-projects.vercel.app/signaldesk/.well-known/oauth-protected-resource",
        },
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
