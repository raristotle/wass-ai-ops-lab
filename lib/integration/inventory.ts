// INTEGRATION SEAM — lib/integration/inventory.ts
//
// Mock InventoryProvider implementation.
// Replace with a real ERP/WMS inventory API client in lib/integration/index.ts;
// the InventoryProvider interface in types.ts is the contract.
//
// Design notes:
//   - Fully deterministic & pure: no Date.now(), no Math.random().
//   - today is INJECTED via ctx.today — never read from the clock.
//   - atpDate derivation: stableHash(product.id) selects a lead-time bucket;
//     bucket maps to a representative number of days; atpDate = today + days (UTC).
//   - transferEtaDays: stable small int derived from stableHash(product.id + branchId)
//     when the rep's branch has 0 stock but other branches do.

import type { CatalogProduct } from "@/features/product-finder/types";
import type { Availability, BranchAvailability, InventoryProvider } from "@/lib/integration/types";
import { isInStock, leadTimeFor } from "@/lib/product-finder-leadtime";

// ─── Lead-time bucket → representative days ───────────────────────────────────

const BUCKET_DAYS: Record<string, number> = {
  "3–5 business days": 5,
  "1–2 weeks": 14,
  "2–3 weeks": 21,
  "4–6 weeks": 42,
};

// ─── Stable deterministic hash (djb2-style) ───────────────────────────────────
// Identical algorithm to lib/product-finder-leadtime.ts (inlined to avoid
// exporting an internal helper from that module).

function stableHash(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    hash = hash >>> 0; // keep 32-bit unsigned
  }
  return hash;
}

// ─── ISO yyyy-mm-dd formatter (UTC) ──────────────────────────────────────────

function toISODate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Mock implementation ──────────────────────────────────────────────────────

export const mockInventoryProvider: InventoryProvider = {
  getAvailability(
    product: CatalogProduct,
    ctx: { branchId?: string; today: Date }
  ): Availability {
    const { branchId, today } = ctx;

    // ── Qty totals ────────────────────────────────────────────────────────────
    const branchQty = product.branchStock.reduce((sum, b) => sum + b.quantity, 0);
    const dcQty = product.dcStock.reduce((sum, d) => sum + d.quantity, 0);

    // ── In-stock check (reuses existing helper) ───────────────────────────────
    const inStock = isInStock(product); // branchQty>0 || dcQty>0

    // ── otherBranches — all branchStock entries with qty > 0 ─────────────────
    const otherBranches: BranchAvailability[] = product.branchStock
      .filter((b) => b.quantity > 0)
      .map((b) => ({
        branchId: b.branchId,
        name: b.branchName || b.branchId, // fallback to branchId when name absent/empty
        qty: b.quantity,
      }));

    // ── OOS path ─────────────────────────────────────────────────────────────
    if (!inStock) {
      const leadTime = leadTimeFor(product); // null when in stock; non-null when OOS
      let atpDate: string | null = null;

      if (leadTime !== null) {
        const days = BUCKET_DAYS[leadTime] ?? 14; // default to 14 if unknown bucket
        const dt = new Date(today);
        dt.setUTCDate(dt.getUTCDate() + days);
        atpDate = toISODate(dt);
      }

      return {
        inStock: false,
        branchQty,
        dcQty,
        atpDate,
        leadTime,
        otherBranches: [], // nothing to transfer from
        transferEtaDays: null,
      };
    }

    // ── In-stock path ─────────────────────────────────────────────────────────

    // Transfer ETA: only when a specific rep branchId is given AND that branch
    // has 0 qty but other branches do.
    let transferEtaDays: number | null = null;

    if (branchId !== undefined) {
      const repBranchEntry = product.branchStock.find((b) => b.branchId === branchId);
      const repHasStock = (repBranchEntry?.quantity ?? 0) > 0;
      const othersHaveStock = otherBranches.length > 0;

      if (!repHasStock && othersHaveStock) {
        // Deterministic small int: 1–4 days based on product+branch hash
        const h = stableHash(product.id + branchId);
        transferEtaDays = (h % 4) + 1; // 1, 2, 3, or 4
      }
    }

    return {
      inStock: true,
      branchQty,
      dcQty,
      atpDate: null,
      leadTime: null,
      otherBranches,
      transferEtaDays,
    };
  },
};
