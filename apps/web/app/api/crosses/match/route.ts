import { NextResponse } from "next/server";
import { resolvedCrossEntries, resolveStocked, provenancedIndex } from "@/lib/catalog/cross-runtime";
import { findCrossSuggestion } from "@/lib/catalog/bom-cross";
import { identifierKey } from "@/lib/catalog/identifiers";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const CROSS_LIMIT = { limit: 60, windowMs: 60_000 };

const QUERY_CAP = 200; // matches BOM_LINE_CAP

/**
 * Competitor-BOM cross matching: POST { queries: string[] } → one suggestion
 * (or null) per query, in order. Each suggestion cites the document that
 * states the cross and carries the stocked equivalent product.
 */
export async function POST(req: Request) {
  const rl = rateLimit(req, CROSS_LIMIT);
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
  const suggestions = queries
    .slice(0, QUERY_CAP)
    .map((q) => findCrossSuggestion(q, entries, resolveStocked, anyStocked));

  return NextResponse.json({ suggestions });
}
