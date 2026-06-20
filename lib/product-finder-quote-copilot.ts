/**
 * Quote Copilot (v5-S2 #5) — paste an RFQ / takeoff → a draft quote where EVERY
 * resolved line arrives pre-loaded with its cross-sell companions, so the rep
 * upsells by default instead of as an afterthought.
 *
 * This is the pure, tested core. It sits on top of machinery that already exists:
 *   parseBomLines → matchBomScored  (lib/product-finder-bom — fuzzy + typo rescue)
 *   summarizeRfq / rfqDraftLines    (lib/product-finder-rfq)
 *   the cross-sell attach rail       (POST /api/companions, mode "attach")
 * The modal wires those async calls; this module assembles the result into a
 * single reviewable draft + an attach rail scoped to the whole RFQ.
 *
 * The deterministic path needs no AI key. An LLM extraction step (parse a messy,
 * prose RFQ email into clean BOM lines) is the env-gated upgrade — dormant until
 * ANTHROPIC_API_KEY is set; the deterministic parser is always the fallback.
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import type { ScoredBomLine } from "@/lib/product-finder-bom";
import { summarizeRfq, type RfqSummary } from "@/lib/product-finder-rfq";

/** A draft line: the resolved product, its quantity, and how confident the match was. */
export interface CopilotDraftLine {
  query: string;
  product: CatalogProduct;
  qty: number;
  tier: ScoredBomLine["tier"];
  /** Lower-confidence matches the rep should eyeball before sending. */
  needsReview: boolean;
}

/** One attach suggestion for the whole RFQ (shape mirrors the /api/companions rail). */
export interface CopilotAttachItem {
  relation: "required" | "recommended";
  attachScore: number;
  reasons: string[];
  product: Pick<CatalogProduct, "id" | "sku" | "name" | "brand" | "subcategory" | "unitPrice"> & {
    inStock?: boolean;
  };
}

export interface CopilotSummary extends RfqSummary {
  /** Distinct companion suggestions across the whole draft. */
  companionCount: number;
  /** How many of those are engineering-REQUIRED (missing-mandatory risk). */
  requiredCompanionCount: number;
  /** Extended value of the draft lines (pre-companion). */
  draftValue: number;
  /** Extended value if every companion were attached at qty 1 — the upsell headroom. */
  companionValue: number;
}

export interface CopilotDraft {
  lines: CopilotDraftLine[];
  attach: CopilotAttachItem[];
  summary: CopilotSummary;
}

/** The matched draft lines, lower-confidence ones flagged for review. */
export function copilotDraftLines(scored: ScoredBomLine[]): CopilotDraftLine[] {
  return scored
    .filter((l): l is ScoredBomLine & { match: CatalogProduct } => l.match !== null)
    .map((l) => ({
      query: l.query,
      product: l.match,
      qty: l.qty,
      tier: l.tier,
      needsReview: l.tier !== "high",
    }));
}

/**
 * Assemble the full Copilot draft from scored RFQ lines and the attach rail that
 * /api/companions returned for those SKUs. Companions already in the draft are
 * dropped (the cart endpoint excludes them, but we re-check defensively so a draft
 * never up-sells a line it already contains).
 */
export function buildCopilotDraft(
  scored: ScoredBomLine[],
  attach: CopilotAttachItem[],
  crossableCount = 0,
): CopilotDraft {
  const lines = copilotDraftLines(scored);
  const draftIds = new Set(lines.map((l) => l.product.id));

  // Dedup the attach rail by product and exclude anything already drafted.
  const seen = new Set<string>();
  const cleanAttach: CopilotAttachItem[] = [];
  for (const a of attach) {
    if (draftIds.has(a.product.id) || seen.has(a.product.id)) continue;
    seen.add(a.product.id);
    cleanAttach.push(a);
  }
  // Required first, then by attach score — the rep sees must-haves up top.
  cleanAttach.sort((x, y) => {
    if (x.relation !== y.relation) return x.relation === "required" ? -1 : 1;
    return y.attachScore - x.attachScore;
  });

  const base = summarizeRfq(scored, crossableCount);
  const draftValue = lines.reduce((s, l) => s + l.product.unitPrice * l.qty, 0);
  const companionValue = cleanAttach.reduce((s, a) => s + a.product.unitPrice, 0);

  return {
    lines,
    attach: cleanAttach,
    summary: {
      ...base,
      companionCount: cleanAttach.length,
      requiredCompanionCount: cleanAttach.filter((a) => a.relation === "required").length,
      draftValue,
      companionValue,
    },
  };
}

/** One-line, demo-safe headline for the Copilot result banner. */
export function copilotHeadline(summary: CopilotSummary): string {
  if (summary.totalLines === 0) return "Paste an RFQ or takeoff to draft a quote with companions.";
  const parts = [`${summary.matched} of ${summary.totalLines} lines drafted`];
  if (summary.companionCount > 0) {
    const req = summary.requiredCompanionCount;
    parts.push(
      `${summary.companionCount} companion${summary.companionCount === 1 ? "" : "s"} to attach` +
        (req > 0 ? ` (${req} required)` : ""),
    );
  }
  if (summary.needsReview > 0) parts.push(`${summary.needsReview} to review`);
  return parts.join(" · ");
}
