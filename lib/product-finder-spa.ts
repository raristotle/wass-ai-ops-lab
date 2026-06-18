/**
 * Special Pricing Agreement (SPA) / rebate claim-back (v3-S3 #9).
 *
 * Distributors negotiate SPAs with manufacturers: a below-standard cost on
 * specific lines (often per-customer). When a rep sells at the standard cost
 * basis but a SPA exists, the distributor can CLAIM BACK the delta from the
 * manufacturer. Unclaimed SPA dollars are pure margin leakage.
 *
 * This is a deterministic rule engine over the standard distributor cost model
 * ([[product-finder-margin]]) — $0, no external calls. The claim-back per unit is
 * `standardCost × rebatePct`; we surface the total unclaimed across WON quotes so
 * a manager can chase it (and export a claim file).
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import { estimatedUnitCost } from "@/lib/product-finder-margin";

export interface SpaRule {
  /** Manufacturer = product brand the SPA covers. */
  manufacturer: string;
  /** Claim-back as a fraction of the distributor's standard unit cost. */
  rebatePct: number;
  /** When set, only this customer's lines qualify; null/undefined = all customers. */
  customerId?: string | null;
  /** SPA agreement reference (shown + exported). */
  ref: string;
}

/**
 * Demo SPA registry — manufacturer-level agreements, a couple customer-scoped.
 * Real deployments would load these from the rebate/contract system.
 */
export const SPA_REGISTRY: SpaRule[] = [
  { manufacturer: "Square D", rebatePct: 0.08, ref: "SPA-SQD-2026-114" },
  { manufacturer: "Eaton", rebatePct: 0.07, ref: "SPA-EAT-2026-077" },
  { manufacturer: "Siemens", rebatePct: 0.06, ref: "SPA-SIE-2026-051" },
  { manufacturer: "ABB", rebatePct: 0.06, ref: "SPA-ABB-2026-033" },
  { manufacturer: "Schneider Electric", rebatePct: 0.08, ref: "SPA-SE-2026-090" },
  { manufacturer: "Leviton", rebatePct: 0.05, ref: "SPA-LEV-2026-022" },
  // A richer, customer-specific agreement (takes precedence over the brand rule).
  { manufacturer: "Square D", rebatePct: 0.12, customerId: "CUST-001", ref: "SPA-SQD-GULF-2026" },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The best SPA for a product/customer — a matching customer-scoped rule wins. */
export function spaForLine(product: CatalogProduct, customerId: string | null): SpaRule | null {
  const matches = SPA_REGISTRY.filter(
    (s) => s.manufacturer === product.brand && (s.customerId == null || s.customerId === customerId),
  );
  if (matches.length === 0) return null;
  // Prefer a customer-specific agreement, then the higher rebate.
  return matches.sort((a, b) => {
    const aScoped = a.customerId ? 1 : 0;
    const bScoped = b.customerId ? 1 : 0;
    return bScoped - aScoped || b.rebatePct - a.rebatePct;
  })[0];
}

export interface ClaimLine {
  manufacturer: string;
  ref: string;
  standardUnitCost: number;
  rebatePct: number;
  claimablePerUnit: number;
  qty: number;
  claimable: number;
}

/** Claim-back for one quote line, or null when no SPA applies. */
export function claimForLine(
  line: { product: CatalogProduct; qty: number },
  customerId: string | null,
): ClaimLine | null {
  const spa = spaForLine(line.product, customerId);
  if (!spa) return null;
  const standardUnitCost = estimatedUnitCost(line.product);
  const claimablePerUnit = round2(standardUnitCost * spa.rebatePct);
  const qty = Math.max(1, line.qty);
  return {
    manufacturer: spa.manufacturer,
    ref: spa.ref,
    standardUnitCost: round2(standardUnitCost),
    rebatePct: spa.rebatePct,
    claimablePerUnit,
    qty,
    claimable: round2(claimablePerUnit * qty),
  };
}

export interface SpaQuote {
  number: string;
  customer: string;
  customerId: string | null;
  lines: { product: CatalogProduct; qty: number }[];
}

export interface SpaClaimRow extends ClaimLine {
  quoteNumber: string;
  customer: string;
  sku: string;
  name: string;
}

export interface SpaClaimSummary {
  totalClaimable: number;
  lineCount: number;
  byManufacturer: { manufacturer: string; claimable: number; lines: number }[];
  rows: SpaClaimRow[];
}

/**
 * Aggregate unclaimed SPA dollars across won quotes — total, per-manufacturer
 * breakdown (descending), and line detail for the claim export.
 */
export function spaClaimbacks(wonQuotes: SpaQuote[]): SpaClaimSummary {
  const rows: SpaClaimRow[] = [];
  for (const q of wonQuotes) {
    for (const line of q.lines) {
      const claim = claimForLine(line, q.customerId);
      if (!claim) continue;
      rows.push({
        ...claim,
        quoteNumber: q.number,
        customer: q.customer || "—",
        sku: line.product.sku,
        name: line.product.name,
      });
    }
  }

  const byMfr = new Map<string, { claimable: number; lines: number }>();
  let totalClaimable = 0;
  for (const r of rows) {
    totalClaimable += r.claimable;
    const cur = byMfr.get(r.manufacturer) ?? { claimable: 0, lines: 0 };
    cur.claimable = round2(cur.claimable + r.claimable);
    cur.lines += 1;
    byMfr.set(r.manufacturer, cur);
  }

  return {
    totalClaimable: round2(totalClaimable),
    lineCount: rows.length,
    byManufacturer: [...byMfr.entries()]
      .map(([manufacturer, v]) => ({ manufacturer, ...v }))
      .sort((a, b) => b.claimable - a.claimable),
    rows,
  };
}
