import { NextResponse } from "next/server";
import { resolvedCrossEntries, resolveStocked, provenancedIndex } from "@/lib/catalog/cross-runtime";
import { findCrossSuggestion } from "@/lib/catalog/bom-cross";
import { identifierKey } from "@/lib/catalog/identifiers";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { recordCrossMiss } from "@/lib/server/cross-misses";

export const dynamic = "force-dynamic";

const CROSS_LIMIT = { limit: 60, windowMs: 60_000 };

const QUERY_CAP = 200; // matches BOM_LINE_CAP

/**
 * Competitor-BOM cross matching: POST { queries: string[] } → one suggestion
 * (or null) per query, in order. Each suggestion cites the document that
 * states the cross and carries the stocked equivalent product.
 */
export async function POST(req: Request) {
  const rl = await rateLimit(req, CROSS_LIMIT);
  if (!rl.ok) return tooManyRequests(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const queries = (body as { queries?: unknown })?.queries;
  if (!Array.isArray(queries) || queries.some((q) => typeof q !== "string")) {
    return NextResponse.json({ error: "queries must be a string array" }, { status: 400 });
  }

  const entries = resolvedCrossEntries();
  const anyStocked = (mpn: string) => (provenancedIndex().get(identifierKey(mpn)) ?? []).length > 0;
  const capped = queries.slice(0, QUERY_CAP);
  const suggestions = capped.map((q) => findCrossSuggestion(q, entries, resolveStocked, anyStocked));

  // Record the MISSES (deduped per SKU, bounded, best-effort) so the coverage-gap
  // queue ranks the competitor parts customers look up but we don't cross yet.
  // Awaited so the counter flushes on serverless before the response returns; each
  // recordCrossMiss swallows its own store error, so this can never break the route.
  const missed = [
    ...new Set(capped.filter((q, i) => suggestions[i] == null && q.trim().length >= 3).map((q) => q.trim().toUpperCase())),
  ].slice(0, 50);
  if (missed.length > 0) await Promise.allSettled(missed.map((q) => recordCrossMiss(q)));

  return NextResponse.json({ suggestions });
}
