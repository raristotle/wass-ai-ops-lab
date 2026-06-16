import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { getCatalog } from "@/lib/catalog/index";
import { lookupCrossReference } from "@/lib/integration/cross-reference";
import { resolveQuickOrderSmart } from "@/lib/product-finder-quick-order";
import { logApiError } from "@/lib/server/log";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

/**
 * Batch SKU resolver for the Quick-Order Pad / paste-to-quote box. Resolves each
 * pasted SKU against the FULL catalog (getCatalog, ~200k) by EXACT SKU first then
 * the canonical competitor/legacy cross-reference (lookupCrossReference, which
 * uses the round-trip-correct xref map) — so a real Wesco SKU or a competitor BOM
 * actually resolves, not just the curated demo subset. SKU is the contract: an
 * unresolved line returns matchKind "none" (the UI flags it) rather than a fuzzy
 * guess. Pure resolution logic is the shared resolveQuickOrderSmart lib.
 */
const BodySchema = z.object({
  skus: z.array(z.string().trim().min(1).max(64)).min(1).max(200),
});

// Exact-SKU index built once over the full catalog and cached (same strategy as
// the cross-reference reverse map) — avoids an O(catalog) scan per pasted line.
const g = globalThis as unknown as { __pfSkuIndex?: Map<string, CatalogProduct> };
function skuIndex(): Map<string, CatalogProduct> {
  if (g.__pfSkuIndex) return g.__pfSkuIndex;
  const m = new Map<string, CatalogProduct>();
  for (const p of getCatalog().products) m.set(p.sku.toUpperCase(), p);
  g.__pfSkuIndex = m;
  return m;
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const index = skuIndex();
    const exact = (sku: string) => index.get(sku.trim().toUpperCase()) ?? null;
    const resolved = resolveQuickOrderSmart(
      parsed.data.skus.map((s) => ({ raw: s, sku: s, qty: 1 })),
      exact,
      lookupCrossReference,
    );

    return NextResponse.json({
      resolved: resolved.map((r) => ({
        sku: r.sku,
        matchKind: r.matchKind,
        via: r.via ?? null,
        product: r.product,
      })),
    });
  } catch (e) {
    logApiError("/api/products/quick-resolve:POST", e);
    return NextResponse.json({ error: "Could not resolve SKUs." }, { status: 400 });
  }
}
