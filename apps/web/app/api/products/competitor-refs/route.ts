import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { crossReferencesFor } from "@/lib/integration/cross-reference";

export const dynamic = "force-dynamic";

/**
 * Competitor cross-references for one product (the "Cross-references / Replaces"
 * chips on the product detail modal). Served from an API route so client code never
 * imports the cross-reference/catalog graph — computing this client-side shipped the
 * generated datasets to the browser (docs/perf-audit-2026-07-10.md). Same public-read
 * posture as /api/products/suggest.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ refs: [] });
  const product = getCatalog().byId.get(id);
  if (!product) return NextResponse.json({ refs: [] });
  return NextResponse.json({ refs: crossReferencesFor(product) });
}
