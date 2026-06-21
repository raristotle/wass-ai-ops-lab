import { NextResponse } from "next/server";
import { z } from "zod";
import { getCatalog } from "@/lib/catalog/index";
import { findEquivalents } from "@/lib/catalog/equivalents";
import { sourcingForProduct } from "@/lib/catalog/coverage-score";
import { pickActiveSuccessor } from "@/lib/catalog/successor";
import { verifiedCrossesFor } from "@/lib/catalog/verified-crosses";
import { resolvedCrossEntries, resolveStocked } from "@/lib/catalog/cross-runtime";
import { identifierKey } from "@/lib/catalog/identifiers";
import { gradeLine } from "@/lib/catalog/bom-health";
import { bestAward, estimateFreightPerUnit, type SupplyOption } from "@/lib/catalog/landed-cost";
import { complianceForProduct, complianceFlags, rollupCompliance, type Compliance } from "@/lib/catalog/compliance";
import { tariffForLine, tariffRollup } from "@/lib/catalog/tariff";
import { landedTariffForLine } from "@/lib/catalog/hts-tariff";
import { lineEtaDays } from "@/lib/product-finder-delivery";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";
// Per-line catalog scanning over a BOM can be heavy — give it headroom.
export const maxDuration = 30;

// This route runs catalog-scanning work per line (equivalents + sourcing), so the
// cap is deliberately small — a basket/BOM analysis, not a bulk feed. Zod rejects
// malformed input before any catalog work; SKU resolution is O(1) via a cached index.
const ITEM_CAP = 40;

const BodySchema = z.object({
  items: z
    .array(z.object({ sku: z.string().trim().min(1).max(64), qty: z.number().int().positive().max(100_000).optional() }))
    .max(ITEM_CAP),
  branchId: z.string().trim().max(32).optional(),
});

function stockQtyOf(p: CatalogProduct): number {
  return p.branchStock.reduce((s, b) => s + b.quantity, 0) + p.dcStock.reduce((s, d) => s + d.quantity, 0);
}
const isStocked = (p: CatalogProduct) => stockQtyOf(p) > 0;

// SKU → product index, built once and cached on globalThis (like the catalog), so
// each line resolves in O(1) instead of a full 200k-product search scan per item.
const g = globalThis as unknown as { __bomSkuIndex?: Map<string, CatalogProduct> };
function skuIndex(): Map<string, CatalogProduct> {
  if (g.__bomSkuIndex) return g.__bomSkuIndex;
  const m = new Map<string, CatalogProduct>();
  for (const p of getCatalog().products) {
    const k = identifierKey(p.sku);
    if (!m.has(k)) m.set(k, p);
  }
  g.__bomSkuIndex = m;
  return m;
}
function resolveBySku(sku: string): CatalogProduct | null {
  return skuIndex().get(identifierKey(sku)) ?? null;
}

function slim(p: CatalogProduct) {
  return { id: p.id, sku: p.sku, name: p.name, brand: p.brand, unitPrice: p.unitPrice, lifecycleStatus: p.lifecycleStatus };
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const items = parsed.data.items;
    const branchId = parsed.data.branchId || undefined;
    const entries = resolvedCrossEntries();

    const complianceItems: Compliance[] = [];
    // Rollup only needs rate + line duty; both the real per-subcategory model
    // (landedTariffForLine) and the legacy chapter fallback (tariffForLine) satisfy this.
    const tariffDuties: { ratePct: number; dutyLine: number }[] = [];
    const rows = items.map(({ sku, qty }) => {
      const need = Math.max(1, Math.floor(qty ?? 1));
      const product = resolveBySku(sku);
      if (!product) return { sku, qty: need, product: null, health: null, award: null, compliance: null, tariff: null };

      // Real (verified/curated) parts return null — we never fabricate compliance.
      const compliance = complianceForProduct(product);
      if (compliance) complianceItems.push(compliance);

      // Tariff-adjusted landed cost (#14 + DI-7): the REAL per-subcategory HTS duty
      // model — MFN + per-subcategory Section 301 (+ steel Section 232) — falling
      // back to the legacy chapter model only if the subcategory isn't in the HTS table.
      const landed = compliance
        ? landedTariffForLine({
            subcategory: product.subcategory,
            countryOfOrigin: compliance.countryOfOrigin,
            section301: compliance.section301,
            unitPrice: product.unitPrice,
            qty: need,
          })
        : null;
      const tariff =
        landed ??
        (compliance
          ? tariffForLine({
              htsCode: compliance.htsCode,
              countryOfOrigin: compliance.countryOfOrigin,
              section301: compliance.section301,
              unitPrice: product.unitPrice,
              qty: need,
            })
          : null);
      if (tariff) tariffDuties.push({ ratePct: tariff.ratePct, dutyLine: tariff.dutyLine });

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
        compliance: compliance && {
          flags: complianceFlags(compliance),
          countryOfOrigin: compliance.countryOfOrigin,
          section301: compliance.section301,
          ulListed: compliance.ulListed,
        },
        tariff: tariff && {
          ratePct: tariff.ratePct,
          program: tariff.program,
          dutyPerUnit: tariff.dutyPerUnit,
          dutyLine: tariff.dutyLine,
          // Landed unit incl. duty — the price the importer of record actually carries.
          tariffedLandedUnit:
            Math.round(((award ? award.currentLanded.unit : product.unitPrice) + tariff.dutyPerUnit) * 100) / 100,
          // Real per-subcategory HTS detail (DI-7), present when the subcategory is mapped.
          htsCode: landed?.htsDotted,
          mfnDutyPct: landed?.mfnDutyPct,
          section301Pct: landed?.section301Pct,
          section232Pct: landed?.section232Pct,
        },
      };
    });

    return NextResponse.json({
      rows,
      compliance: rollupCompliance(complianceItems),
      tariff: tariffRollup(tariffDuties),
    });
  } catch (e) {
    logApiError("/api/bom/analyze", e);
    return NextResponse.json({ error: "Could not analyze the BOM." }, { status: 400 });
  }
}
