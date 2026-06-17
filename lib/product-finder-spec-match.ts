import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Spec-to-product matching (#20) — pure, deterministic, $0. Parses a free-text
 * engineering spec ("NEMA 4X, 60A, 480V 3-phase, SCCR ≥ 65kA") into structured
 * requirements and scores catalog candidates with a pass/fail table per
 * requirement. The retrieval + scoring are free; an optional Claude summary is
 * layered on top by the route (gated on the existing Anthropic key).
 */

export interface SpecRequirement {
  attr: string;
  op: ">=" | "<=" | "=";
  value: string;
  num: number | null;
}

export interface SpecCheck {
  attr: string;
  required: string;
  actual: string | null;
  pass: boolean;
}

export interface SpecMatch {
  product: CatalogProduct;
  checks: SpecCheck[];
  passCount: number;
  total: number;
  allPass: boolean;
  score: number; // passCount / total (1 when no requirements)
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");

function numOf(s: string): number | null {
  const m = s.match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/** Parse a free-text spec into structured requirements (first hit per attribute). */
export function parseSpecRequirements(text: string): SpecRequirement[] {
  const t = text.replace(/\s+/g, " ").trim();
  const reqs: SpecRequirement[] = [];
  const push = (attr: string, op: SpecRequirement["op"], value: string) => {
    if (!reqs.some((r) => r.attr === attr)) reqs.push({ attr, op, value, num: numOf(value) });
  };

  // SCCR / AIC — keyword-first ("SCCR ≥ 65kA") OR rating-first ("100kA AIC", "22kAIC");
  // safety-critical, so it must never silently vanish from the requirement set.
  let m =
    t.match(/(?:sccr|a?ic)\s*(?:>=|≥|min(?:imum)?|of)?\s*(\d{1,3}(?:\.\d+)?\s*k?a)/i) ||
    t.match(/(\d{1,3}(?:\.\d+)?\s*ka)\s*(?:a?ic|sccr)/i);
  if (m) push("SCCR", ">=", m[1].replace(/\s+/g, "").toUpperCase());
  m = t.match(/\b(\d{2,4}(?:\/\d{2,4})?)\s*v(?:olt(?:age|s)?|ac|dc)?\b/i);
  if (m) push("Voltage", "=", `${m[1]}V`);
  m = t.match(/\b(\d{1,4})\s*a(?:mp|mps|mperes)?\b/i);
  if (m) push("Amperage", ">=", `${m[1]}A`);
  m = t.match(/\b(\d+(?:\.\d+)?)\s*hp\b/i);
  if (m) push("Horsepower", ">=", `${m[1]}HP`);
  m = t.match(/\b([13])\s*-?\s*(?:ph(?:ase)?\b|ø)/i);
  if (m) push("Phase", "=", `${m[1]}PH`);
  m = t.match(/\b([1-4])\s*-?\s*poles?\b/i);
  if (m) push("Poles", "=", m[1]);
  m = t.match(/\bnema\s*(\d+[a-z]?)\b/i);
  if (m) push("Enclosure", "=", `NEMA ${m[1].toUpperCase()}`);

  return reqs;
}

/** A catalog search query from the requirements (for free retrieval). */
export function specQuery(reqs: SpecRequirement[]): string {
  return reqs.map((r) => r.value).join(" ").trim();
}

function specValue(product: CatalogProduct, attr: string): string | null {
  const lc = attr.toLowerCase();
  const found = product.specs.find((s) => {
    const n = s.name.toLowerCase();
    return n.includes(lc) || lc.includes(n);
  });
  return found ? found.value : null;
}

/** Score one product against the requirements: a pass/fail per requirement. Pure. */
export function matchSpec(product: CatalogProduct, reqs: SpecRequirement[]): SpecMatch {
  const checks: SpecCheck[] = reqs.map((req) => {
    const actual = specValue(product, req.attr);
    let pass = false;
    if (actual !== null) {
      if (req.op === "=") {
        pass = normalize(actual).includes(normalize(req.value)) || normalize(req.value).includes(normalize(actual));
      } else {
        const an = numOf(actual);
        if (an !== null && req.num !== null) pass = req.op === ">=" ? an >= req.num : an <= req.num;
      }
    }
    return { attr: req.attr, required: req.value, actual, pass };
  });
  const passCount = checks.filter((c) => c.pass).length;
  const total = checks.length;
  return {
    product,
    checks,
    passCount,
    total,
    allPass: total > 0 && passCount === total,
    score: total === 0 ? 1 : passCount / total,
  };
}

/** Rank candidates by pass rate (then price). Pure. */
export function rankSpecMatches(products: CatalogProduct[], reqs: SpecRequirement[], k = 8): SpecMatch[] {
  return products
    .map((p) => matchSpec(p, reqs))
    .sort((a, b) => b.score - a.score || a.product.unitPrice - b.product.unitPrice)
    .slice(0, Math.max(1, k));
}
