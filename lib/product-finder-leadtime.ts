import type { CatalogProduct } from "@/features/product-finder/types";

// ─── Lead-time buckets ────────────────────────────────────────────────────────

const LEAD_TIME_BUCKETS = [
  "3–5 business days",
  "1–2 weeks",
  "2–3 weeks",
  "4–6 weeks",
] as const;

// ─── Stable deterministic hash of a string ───────────────────────────────────
// djb2-style — deterministic, no randomness

function stableHash(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    hash = hash >>> 0; // keep 32-bit unsigned
  }
  return hash;
}

// ─── isInStock ────────────────────────────────────────────────────────────────

export function isInStock(product: CatalogProduct): boolean {
  const totalBranch = product.branchStock.reduce((sum, b) => sum + b.quantity, 0);
  if (totalBranch > 0) return true;
  const totalDC = product.dcStock.reduce((sum, d) => sum + d.quantity, 0);
  return totalDC > 0;
}

// ─── leadTimeFor ─────────────────────────────────────────────────────────────

export function leadTimeFor(product: CatalogProduct): string | null {
  if (isInStock(product)) return null;
  const idx = stableHash(product.id) % LEAD_TIME_BUCKETS.length;
  return LEAD_TIME_BUCKETS[idx];
}
