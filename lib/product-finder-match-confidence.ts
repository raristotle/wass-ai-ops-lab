import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Match confidence for BOM/RFQ line matching — pure token-coverage scoring.
 *
 * How much of the customer's line text does the matched product actually
 * cover? Exact SKU hits score 1.0. Tokens containing digits ("20a", "12")
 * must match exactly — a 20A request must not silently match a 200A part.
 * Alpha tokens may prefix-match ("break" covers "breaker").
 */

export type ConfidenceTier = "high" | "medium" | "low";

/** Lowercase alphanumeric tokens. */
export function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function normalizeSku(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const STOP_WORDS = new Set(["a", "an", "the", "of", "for", "with", "and", "x", "ea", "each", "pcs", "pc"]);

/**
 * 0..1 — fraction of meaningful query tokens covered by the product's
 * name / SKU / brand / subcategory. Exact normalized-SKU match → 1.0.
 */
export function matchConfidence(query: string, product: CatalogProduct): number {
  const q = query.trim();
  if (!q) return 0;

  if (normalizeSku(q) === normalizeSku(product.sku)) return 1;

  const queryTokens = tokenize(q).filter((t) => !STOP_WORDS.has(t));
  if (queryTokens.length === 0) return 0;

  const haystackTokens = new Set([
    ...tokenize(product.name),
    ...tokenize(product.sku),
    ...tokenize(product.brand),
    ...tokenize(product.subcategory),
  ]);

  let covered = 0;
  for (const token of queryTokens) {
    if (haystackTokens.has(token)) {
      covered += 1;
      continue;
    }
    const hasDigit = /\d/.test(token);
    if (!hasDigit && token.length >= 3) {
      // Alpha tokens may prefix-match either direction ("break" ↔ "breaker")
      let partial = false;
      for (const h of haystackTokens) {
        if (h.startsWith(token) || (h.length >= 3 && token.startsWith(h))) {
          partial = true;
          break;
        }
      }
      if (partial) covered += 0.7;
    }
    // digit-bearing tokens get no partial credit — exact or nothing
  }

  return Math.min(1, covered / queryTokens.length);
}

/** high ≥ 0.8, medium ≥ 0.5, low below. */
export function confidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

export const CONFIDENCE_TIER_COLOR: Record<ConfidenceTier, string> = {
  high: "#00AA13",
  medium: "#EAAA00",
  low: "#DB6B30",
};

export const CONFIDENCE_TIER_LABEL: Record<ConfidenceTier, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};
