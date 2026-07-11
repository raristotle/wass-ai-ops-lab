import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { getCatalog } from "@/lib/catalog/index";
import { crossReferencesFor } from "@/lib/integration/cross-reference";

export const dynamic = "force-dynamic";

/**
 * Competitor cross-references for one product (the "Cross-references / Replaces"
 * chips on the product detail modal). Served from an API route so client code never
 * imports the cross-reference/catalog graph — computing this client-side shipped the
 * generated datasets to the browser (docs/perf-audit-2026-07-10.md). Same public-read
 * posture as /api/products/suggest. Rate-limited (30/min) for uniformity and
 * politeness, not security — payload is synthetic.
 */
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ refs: [] });
  const product = getCatalog().byId.get(id);
  if (!product) return NextResponse.json({ refs: [] });
  return NextResponse.json({ refs: crossReferencesFor(product) });
}
