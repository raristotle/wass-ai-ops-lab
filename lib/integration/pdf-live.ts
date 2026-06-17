/**
 * Branded PDF rendering (REAL) — env-gated DORMANT via self-hosted Gotenberg
 * (Chromium HTML→PDF, Apache-2.0 OSS, no per-document fee). Renders a quote's
 * existing branded HTML to a pixel-accurate PDF server-side. Unset GOTENBERG_URL
 * ⇒ no render and the app keeps client print-to-PDF. $0 (self-hosted).
 *
 *   GOTENBERG_URL — the Gotenberg service URL, e.g. http://localhost:3000 or an
 *                   internal container URL. The gate.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export function pdfConfigured(): boolean {
  return Boolean(env("GOTENBERG_URL"));
}

export type PdfResult =
  | { enabled: false; reason: "not-configured" | "error" }
  | { enabled: true; pdf: ArrayBuffer };

/**
 * Render HTML to a PDF via Gotenberg's Chromium route. Dormant (no network) when
 * GOTENBERG_URL is unset; fail-closed on any error so the caller can fall back to
 * client print-to-PDF.
 */
export async function renderPdf(html: string): Promise<PdfResult> {
  const base = env("GOTENBERG_URL");
  if (!base) return { enabled: false, reason: "not-configured" };
  try {
    const form = new FormData();
    // Gotenberg requires the main document to be named index.html.
    form.append("files", new Blob([html], { type: "text/html" }), "index.html");
    const res = await fetch(`${base.replace(/\/+$/, "")}/forms/chromium/convert/html`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      logApiError("pdf:render", new Error(`Gotenberg HTTP ${res.status}`));
      return { enabled: false, reason: "error" };
    }
    return { enabled: true, pdf: await res.arrayBuffer() };
  } catch (e) {
    logApiError("pdf:render", e);
    return { enabled: false, reason: "error" };
  }
}
