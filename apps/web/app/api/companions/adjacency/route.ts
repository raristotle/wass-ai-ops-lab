import { NextResponse } from "next/server";
import { subcategoryAdjacency } from "@/lib/catalog/companion-graph";

export const dynamic = "force-dynamic";

/**
 * Subcategory adjacency (v5-S2) — the global companion graph at the subcategory
 * grain, built once from the spec rules + affinity baseline (no 200k catalog).
 * Powers the Account 360 whitespace panel and the Segment Solution Builder on the
 * client. Public read, $0, deterministic.
 *
 * GET /api/companions/adjacency → { adjacency: { [subcat]: { to, required }[] } }
 */
export function GET() {
  const adjacency: Record<string, { to: string; required: boolean }[]> = {};
  for (const [from, edges] of subcategoryAdjacency()) adjacency[from] = edges;
  return NextResponse.json({ adjacency });
}
