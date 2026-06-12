import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { findEquivalents } from "@/lib/catalog/equivalents";
import { verifiedCrossesFor } from "@/lib/catalog/verified-crosses";
import { VERIFIED_CROSS_ENTRIES } from "@/data/real/verified-crosses";
import { identifierKey } from "@/lib/catalog/identifiers";
import { brandHierarchyFor } from "@/lib/catalog/brand-hierarchy";

export const dynamic = "force-dynamic";

// Verified/curated products indexed by identifier key — small (hundreds),
// built once per process for cross resolution.
type ProvenancedIndex = Map<string, import("@/features/product-finder/types").CatalogProduct[]>;
const g = globalThis as unknown as { __provenancedIndex?: ProvenancedIndex };
function provenancedIndex(): ProvenancedIndex {
  if (!g.__provenancedIndex) {
    const m: ProvenancedIndex = new Map();
    for (const p of getCatalog().products) {
      if (p.dataSource !== "verified" && p.dataSource !== "curated") continue;
      const key = identifierKey(p.sku);
      const list = m.get(key);
      if (list) list.push(p);
      else m.set(key, [p]);
    }
    g.__provenancedIndex = m;
  }
  return g.__provenancedIndex;
}

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return ctx.params.then(({ id }) => {
    const catalog = getCatalog();
    const product = catalog.byId.get(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") ?? undefined;

    // Source-backed crosses: production path returns only ≥95-confidence
    // results, and only for records that are themselves provenance-backed.
    const verifiedCrosses =
      product.dataSource === "verified" || product.dataSource === "curated"
        ? verifiedCrossesFor(product, VERIFIED_CROSS_ENTRIES, (brand, mpn) => {
            const candidates = provenancedIndex().get(identifierKey(mpn)) ?? [];
            return candidates.find((p) => p.brand.toLowerCase() === brand.toLowerCase()) ?? null;
          })
        : [];

    return NextResponse.json({
      product,
      equivalents: findEquivalents(product, 8, branchId),
      verifiedCrosses,
      brandHierarchy: brandHierarchyFor(product.brand),
    });
  });
}
