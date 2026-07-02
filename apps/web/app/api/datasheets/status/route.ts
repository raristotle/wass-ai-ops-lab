import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { getStore } from "@/lib/server/persistence";
import { LINKROT_NS, LINKROT_STATUS_KEY, normalizeUrl, type LinkStatusMap } from "@/lib/product-finder-linkrot";

export const dynamic = "force-dynamic";

/**
 * B14 — read recorded datasheet link-rot status for a set of URLs, so the client can show a
 * "link may be outdated" badge before a rep sends a submittal. Public read (advisory only),
 * rate-limited. Returns only the URLs a sweep has actually checked — an empty map until the
 * (dormant) sweep has run, so the badge never appears speculatively.
 *
 * POST { urls: string[] } → { statuses: { [normalizedUrl]: { ok, code, checkedAtIso } } }
 */
export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ statuses: {} });
  }
  const urls = (body as { urls?: unknown })?.urls;
  if (!Array.isArray(urls)) return NextResponse.json({ statuses: {} });

  try {
    const map = (await getStore().get<LinkStatusMap>(LINKROT_NS, LINKROT_STATUS_KEY)) ?? {};
    const out: LinkStatusMap = {};
    for (const u of urls.slice(0, 200)) {
      if (typeof u !== "string") continue;
      const k = normalizeUrl(u);
      if (k && map[k]) out[k] = map[k];
    }
    return NextResponse.json({ statuses: out });
  } catch {
    return NextResponse.json({ statuses: {} });
  }
}
