/**
 * Minimal structured logging for API routes. Emits one JSON line per error so a
 * log drain (Vercel, Datadog, an APM) can parse and alert. A real error-tracking
 * SDK (Sentry) drops in behind logApiError without changing call sites.
 */

export function logApiError(route: string, error: unknown, context?: Record<string, unknown>): void {
  const line = {
    level: "error",
    route,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack?.split("\n").slice(0, 4).join(" | ") : undefined,
    ...context,
  };
  // stderr; the platform stamps the timestamp.
  console.error(JSON.stringify(line));
}
