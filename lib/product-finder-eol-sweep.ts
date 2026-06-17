import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Proactive risk sweep (#7) — pure, deterministic, $0. Scans open quote / cart
 * lines and flags parts that are EOL/obsolescent or single-sourced, with a
 * suggested replacement, so a rep catches a discontinued breaker before it stalls
 * a job. All catalog knowledge (lifecycle, sourcing, replacement) is INJECTED, so
 * candidate-finding never touches the network or a model. The route layers an
 * optional Claude rationale on top (gated); the template below is the $0 fallback.
 */

export type RiskKind = "eol" | "single-source";

export interface SweepLine {
  product: CatalogProduct;
  qty: number;
  source: string; // e.g. "Quote Q-1024" | "Cart"
}

export interface RiskFinding {
  product: CatalogProduct;
  qty: number;
  source: string;
  riskKind: RiskKind;
  severity: number; // higher = more urgent
  detail: string;
  suggestionSku: string | null;
}

export interface SweepDeps {
  lifecycleSeverityOf: (p: CatalogProduct) => number; // 0 = active
  lifecycleLabelOf: (p: CatalogProduct) => string;
  isSingleSource: (p: CatalogProduct) => boolean;
  replacementFor: (p: CatalogProduct) => string | null;
}

/** One finding per (source, product); EOL dominates a single-source flag. */
export function sweepForRisks(lines: SweepLine[], deps: SweepDeps): RiskFinding[] {
  const out: RiskFinding[] = [];
  const seen = new Set<string>();
  for (const l of lines) {
    const key = `${l.source}::${l.product.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const sev = deps.lifecycleSeverityOf(l.product);
    if (sev > 0) {
      out.push({
        product: l.product,
        qty: l.qty,
        source: l.source,
        riskKind: "eol",
        severity: 10 + sev,
        detail: `${deps.lifecycleLabelOf(l.product)} — plan a substitution before it can't be sourced`,
        suggestionSku: deps.replacementFor(l.product),
      });
      continue;
    }
    if (deps.isSingleSource(l.product)) {
      out.push({
        product: l.product,
        qty: l.qty,
        source: l.source,
        riskKind: "single-source",
        severity: 5,
        detail: "Single-source — supply risk; qualify a second source",
        suggestionSku: deps.replacementFor(l.product),
      });
    }
  }
  return out.sort((a, b) => b.severity - a.severity);
}

/** Deterministic $0 rationale, used when the assistant is dormant. */
export function riskRationaleTemplate(f: RiskFinding): string {
  const sub = f.suggestionSku ? ` Suggested replacement: ${f.suggestionSku}.` : "";
  if (f.riskKind === "eol") {
    return `${f.product.brand} ${f.product.sku} on ${f.source} is ${f.detail}.${sub}`;
  }
  return `${f.product.brand} ${f.product.sku} on ${f.source} is single-sourced — a supply disruption would stall the job.${sub}`;
}
