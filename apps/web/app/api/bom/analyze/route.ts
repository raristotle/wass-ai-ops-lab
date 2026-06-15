import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog/search";
import { findEquivalents } from "@/lib/catalog/equivalents";
import { sourcingForProduct } from "@/lib/catalog/coverage-score";
import { pickActiveSuccessor } from "@/lib/catalog/successor";
import { verifiedCrossesFor } from "@/lib/catalog/verified-crosses";
import { resolvedCrossEntries, resolveStocked } from "@/lib/catalog/cross-runtime";
import { identifierKey } from "@/lib/catalog/identifiers";
import { gradeLine } from "@/lib/catalog/bom-health";
import { bestAward, estimateFreightPerUnit, type SupplyOption } from "@/lib/catalog/landed-cost";
import { lineEtaDays } from "@/lib/product-finder-delivery";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

const ITEM_CAP = 200;

function stockQtyOf(p: CatalogProduct): number {
  return p.branchStock.reduce((s, b) => s + b.quantity, 0) + p.dcStock.reduce((s, d) => s + d.quantity, 0);
}
const isStocked = (p: CatalogProduct) => stockQtyOf(p) > 0;

function resolveBySku(sku: string): CatalogProduct | null {
  const key = identifierKey(sku);
  const res = searchCatalog({ text: sku, pageSize: 10 });
  return res.items.find((p) => identifierKey(p.sku) === key) ?? res.items[0] ?? null;
}

function slim(p: CatalogProduct) {
  return { id: p.id, sku: p.sku, name: p.name, brand: p.brand, unitPrice: p.unitPrice, lifecycleStatus: p.lifecycleStatus };
}

export async function POST(req: Request) {
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    const body = (await req.json()) as { items?: { sku: string; qty?: number }[]; branchId?: string };
    const items = (body.items ?? []).slice(0, ITEM_CAP);
    const branchId = body.branchId?.trim() || undefined;
    const entries = resolvedCrossEntries();

    const rows = items.map(({ sku, qty }) => {
      const need = Math.max(1, Math.floor(qty ?? 1));
      const product = resolveBySku(sku);
      if (!product) return { sku, qty: need, product: null, health: null, award: null };

      const equivalents = findEquivalents(product, 8, branchId);
      const successor = pickActiveSuccessor(product, equivalents);
      const sourcing = sourcingForProduct(product, branchId);

      // Documented, stocked, production-grade cross substitutes.
      const crossSubs = verifiedCrossesFor(product, entries, resolveStocked)
        .filter((c) => c.productionReady && c.substituteProduct && isStocked(c.substituteProduct))
        .map((c) => c.substituteProduct as CatalogProduct);

      const cheaperPct = crossSubs
        .filter((s) => s.unitPrice < product.unitPrice)
        .reduce((max, s) => Math.max(max, ((product.unitPrice - s.unitPrice) / product.unitPrice) * 100), 0);

      const health = gradeLine({
        lifecycleStatus: product.lifecycleStatus,
        stockQty: stockQtyOf(product),
        qty: need,
        sourcingScore: sourcing.score,
        hasActiveSuccessor: Boolean(successor),
        cheaperCrossSavingPct: cheaperPct > 0 ? cheaperPct : undefined,
      });

      // Landed-cost options: the current part + stocked crosses + an active successor.
      const toOption = (p: CatalogProduct, kind: SupplyOption["kind"], label: string): SupplyOption => ({
        id: p.id,
        label,
        unitPrice: p.unitPrice,
        qty: need,
        leadDays: lineEtaDays(p, branchId),
        freightPerUnit: estimateFreightPerUnit(p.category, p.unitPrice),
        kind,
      });
      const options: SupplyOption[] = [toOption(product, "current", `${product.brand} ${product.sku}`)];
      for (const s of crossSubs) options.push(toOption(s, "cross", `${s.brand} ${s.sku} (cross)`));
      if (successor) options.push(toOption(successor, "successor", `${successor.brand} ${successor.sku} (active successor)`));
      const award = bestAward(options);

      return {
        sku,
        qty: need,
        product: slim(product),
        sourcingScore: sourcing.score,
        health,
        award: award && {
          switch: award.switch,
          lineSavings: award.lineSavings,
          rationale: award.rationale,
          best: { id: award.best.id, label: award.best.label, kind: award.best.kind, landedUnit: award.bestLanded.unit },
          currentLandedUnit: award.currentLanded.unit,
        },
      };
    });

    return NextResponse.json({ rows });
  } catch (e) {
    logApiError("/api/bom/analyze", e);
    return NextResponse.json({ error: "Could not analyze the BOM." }, { status: 400 });
  }
}
