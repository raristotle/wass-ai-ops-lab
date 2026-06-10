import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { getLiveQuotes, liveDistributorsConfigured } from "@/lib/integration/distributor-live";

export const dynamic = "force-dynamic";

// Live distributor lookup for a product's manufacturer part number.
// Only meaningful for real part numbers — simulated SKUs are never sent to
// distributor APIs (they don't exist; querying them would be noise).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const product = getCatalog().byId.get(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const configured = liveDistributorsConfigured();
  if (configured.length === 0) {
    return NextResponse.json({ enabled: false, reason: "no-keys", quotes: [] });
  }
  if (product.dataSource !== "verified" && product.dataSource !== "curated") {
    return NextResponse.json({ enabled: false, reason: "simulated-sku", quotes: [] });
  }

  const quotes = await getLiveQuotes(product.sku);
  return NextResponse.json({
    enabled: true,
    configured,
    quotes,
    fetchedAt: new Date().toISOString(),
  });
}
