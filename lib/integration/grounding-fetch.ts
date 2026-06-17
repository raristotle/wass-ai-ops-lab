/**
 * Web-grounding fetch (REAL) — env-gated DORMANT. A free, $0 server-side fetch
 * for grounding Ask Meridian / datasheet-RAG answers on a specific manufacturer
 * bulletin or standards page, deliberately chosen over the now-metered Brave
 * Search API (see docs/mcp-servers.md). No key, no spend.
 *
 * SAFE BY DESIGN (SSRF-hardened):
 *  - https only; the allow-list (FETCH_GROUNDING_DOMAINS) is the AUTHORITATIVE
 *    gate — only its hosts/subdomains are fetchable, and literal-IP / localhost /
 *    *.local / *.internal are refused outright (anything else simply isn't on the
 *    list). DORMANT (nothing fetchable) until the list is set.
 *  - Redirects are followed MANUALLY and EACH hop's host is re-validated against
 *    the allow-list, so a 30x can't pivot to an internal / cloud-metadata host.
 *  - Response is size-capped and tag-stripped to a plain-text snippet.
 *
 *   FETCH_GROUNDING_DOMAINS — comma list of trusted hostname suffixes, e.g.
 *                             "ul.com,intertek.com,schneider-electric.com".
 */

import { logApiError } from "@/lib/server/log";

const MAX_BYTES = 200_000; // cap the raw body we read
const MAX_TEXT = 8_000; // cap the returned text snippet
const MAX_REDIRECTS = 3;

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** The operator's trusted hostname suffixes (lowercased). Empty ⇒ dormant. */
export function allowedDomains(): string[] {
  const raw = env("FETCH_GROUNDING_DOMAINS");
  if (!raw) return [];
  const out: string[] = [];
  for (const tok of raw.split(",")) {
    const d = tok.trim().toLowerCase().replace(/^\.+/, "");
    if (d && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) && !out.includes(d)) out.push(d);
  }
  return out;
}

export function groundingFetchConfigured(): boolean {
  return allowedDomains().length > 0;
}

/** Whether a URL is safe + allow-listed to fetch. Exported for testing. */
export function isAllowedUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || // literal IPv4
    host.includes(":") // IPv6 literal
  ) {
    return false;
  }
  return allowedDomains().some((d) => host === d || host.endsWith("." + d));
}

/** Crude HTML → text: drop script/style, strip tags, collapse whitespace. */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type GroundingResult =
  | { enabled: false; reason: "not-configured" | "blocked" | "error" }
  | { enabled: true; url: string; text: string };

/**
 * Fetch with MANUAL redirect handling — every redirect Location is resolved and
 * re-validated against the allow-list before it is followed, so a 30x cannot
 * pivot to an internal / metadata host. Returns the final Response, or null when
 * a redirect is refused or the hop cap is exceeded.
 */
async function guardedFetch(start: string): Promise<Response | null> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "Meridian-Grounding/1.0", Accept: "text/html,text/plain" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      let next: string | null;
      try {
        next = new URL(loc, url).toString();
      } catch {
        next = null;
      }
      if (!next || !isAllowedUrl(next)) return null; // refuse a redirect off the allow-list
      url = next;
      continue;
    }
    return res;
  }
  return null; // too many hops
}

/**
 * Fetch a grounding URL as a plain-text snippet. Dormant (no network) until the
 * allow-list is set; refuses any non-allow-listed or unsafe URL (including across
 * redirects). Fail-closed.
 */
export async function fetchGrounded(url: string): Promise<GroundingResult> {
  if (!groundingFetchConfigured()) return { enabled: false, reason: "not-configured" };
  if (!isAllowedUrl(url)) return { enabled: false, reason: "blocked" };
  try {
    const res = await guardedFetch(url);
    if (!res || !res.ok) {
      if (res) logApiError("grounding:fetch", new Error(`Grounding HTTP ${res.status}`), { host: new URL(url).hostname });
      return { enabled: false, reason: "error" };
    }
    const raw = (await res.text()).slice(0, MAX_BYTES);
    return { enabled: true, url, text: stripHtml(raw).slice(0, MAX_TEXT) };
  } catch (e) {
    logApiError("grounding:fetch", e);
    return { enabled: false, reason: "error" };
  }
}
