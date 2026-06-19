import { ETIM_CLASS_ENTRIES } from "@/data/real/etim-classes";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * ETIM attribute classification (v-DI #1) — maps each electrical subcategory to
 * its ETIM class (the standard the EU electrical channel + a growing US base
 * classify to) and the engineering FEATURES that class requires. From the free
 * ETIM International model (ODC-By license; attribution required). Lets the app
 * show the authoritative attribute schema per category and measure how complete a
 * product's specs are against it — a real, standards-grounded "attributes" lift
 * that complements the #11 data-quality score and enriches embedding text.
 */

export interface EtimClass {
  subcategory: string;
  /** ETIM class code, e.g. "EC000042". May list alternates ("A / B"). */
  classCode: string;
  className: string;
  /** The engineering attributes this ETIM class defines as required. */
  requiredFeatures: string[];
  confidence: "high" | "medium" | "low";
}

const bySub = new Map(ETIM_CLASS_ENTRIES.map((e) => [e.subcategory.trim().toLowerCase(), e]));

/** The ETIM class for a subcategory, or null when unmapped. */
export function etimClassFor(subcategory: string): EtimClass | null {
  return bySub.get(subcategory.trim().toLowerCase()) ?? null;
}

/**
 * Concept groups bridging verbose ETIM feature names to our terse catalog spec
 * names (ETIM keyword(s) ↔ spec keyword(s) for the same electrical concept).
 * A feature counts as "present" when the product has a spec in the same group.
 */
const CONCEPTS: { etim: string[]; spec: string[] }[] = [
  { etim: ["current", "amp", "in (a)", "ie"], spec: ["amp", "current"] },
  { etim: ["pole"], spec: ["pole"] },
  { etim: ["voltage", "ue", "volt"], spec: ["volt"] },
  { etim: ["breaking capacity", "ka", "interrupt", "sccr", "aic"], spec: ["ka", "interrupt", "sccr", "aic", "breaking"] },
  { etim: ["tripping characteristic", "trip"], spec: ["trip", "curve", "character"] },
  { etim: ["lumen", "luminous flux"], spec: ["lumen", "lm"] },
  { etim: ["power (w)", "wattage", "output power"], spec: ["watt", "wattage", "power", "output"] },
  { etim: ["colour temperature", "color temperature", "cct"], spec: ["cct", "color", "colour", "kelvin"] },
  { etim: ["degree of protection", "ip"], spec: ["ip", "protection", "nema"] },
  { etim: ["material"], spec: ["material", "housing", "construction"] },
  { etim: ["diameter", "size", "width", "height", "length"], spec: ["diameter", "size", "trade size", "width", "height", "length", "gauge", "awg"] },
  { etim: ["number of phases", "phase"], spec: ["phase"] },
  { etim: ["rated power", "va", "kva"], spec: ["va", "kva", "rating"] },
  { etim: ["frequency"], spec: ["frequency", "hz"] },
  { etim: ["connection", "thread", "connector", "contact"], spec: ["connection", "thread", "connector", "contact", "termination"] },
  { etim: ["mounting", "flush", "surface"], spec: ["mount", "flush", "surface"] },
  { etim: ["category", "cat 5", "cat 6", "fiber type"], spec: ["category", "cat", "fiber", "type"] },
  { etim: ["dimming", "dali", "0-10v", "pwm"], spec: ["dimming", "dimmable", "dali", "0-10v"] },
];

const has = (hay: string, needles: string[]) => needles.some((n) => hay.includes(n));

function featureMatched(feature: string, specNames: string[]): boolean {
  const f = feature.toLowerCase();
  for (const c of CONCEPTS) {
    if (has(f, c.etim) && specNames.some((s) => has(s, c.spec))) return true;
  }
  // Fallback: a meaningful (≥4-char) token of the feature appears in a spec name.
  const tokens = f.replace(/\([^)]*\)/g, " ").split(/[^a-z]+/).filter((w) => w.length >= 4);
  return specNames.some((s) => tokens.some((t) => s.includes(t)));
}

export interface EtimCoverage {
  classCode: string;
  className: string;
  required: string[];
  /** Required features the product appears to specify. */
  present: string[];
  missing: string[];
  /** 0..100 — indicative completeness against the ETIM required set. */
  coveragePct: number;
  confidence: "high" | "medium" | "low";
}

/** Best-effort coverage of a product's specs against its ETIM class's required features. */
export function etimCoverage(product: CatalogProduct): EtimCoverage | null {
  const cls = etimClassFor(product.subcategory);
  if (!cls) return null;
  const specNames = (product.specs ?? []).map((s) => s.name.toLowerCase());
  const present: string[] = [];
  const missing: string[] = [];
  for (const feat of cls.requiredFeatures) {
    (featureMatched(feat, specNames) ? present : missing).push(feat);
  }
  const coveragePct = cls.requiredFeatures.length
    ? Math.round((present.length / cls.requiredFeatures.length) * 100)
    : 0;
  return {
    classCode: cls.classCode,
    className: cls.className,
    required: cls.requiredFeatures,
    present,
    missing,
    coveragePct,
    confidence: cls.confidence,
  };
}
