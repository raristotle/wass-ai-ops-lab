import { SUBSTANCES, HTS_CHAPTERS } from "@/data/real/substances";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Compliance substance + tariff grounding (v-DI #1) — replaces hashed/synthetic
 * compliance signals with REAL, sourced reference data: substances common in
 * electrical goods (CAS numbers + which regulatory lists they're on — ECHA REACH
 * SVHC Candidate List, EU RoHS Annex II, CA Prop 65) and the USITC HTS chapters
 * with Section-301 exposure. A product's potential substance exposure is inferred
 * DETERMINISTICALLY from its stated materials/specs (e.g. flexible-PVC insulation →
 * phthalate plasticizers + lead stabilizers), not from a hash — an honest
 * "may contain, based on stated materials" flag the BOM rollup and product detail
 * can cite. No fabricated CAS or HTS codes.
 */

export type ComplianceList = "REACH-SVHC" | "RoHS" | "Prop65";

export interface Substance {
  name: string;
  cas: string;
  lists: ComplianceList[];
  electricalUse: string;
  sourceUrl: string;
}

export interface HtsChapter {
  /** 2-digit HTS chapter, e.g. "85". */
  chapter: string;
  description: string;
  section301Note: string;
  exampleCategory: string;
}

const byCas = new Map(SUBSTANCES.map((s) => [s.cas, s]));

/**
 * Material keyword → CAS numbers it implies. Anchored on CAS (stable) so the
 * inference always resolves to a real, listed substance.
 */
const TRIGGER_RULES: { keywords: string[]; cas: string[] }[] = [
  // Flexible PVC (cable insulation/jacketing) → phthalate plasticizers + Pb stabilizer.
  { keywords: ["pvc", "phthalate", "plasticiz"], cas: ["117-81-7", "85-68-7", "84-74-2", "84-69-5", "7439-92-1"] },
  // Brass / leaded alloys / solder → lead.
  { keywords: ["brass", "leaded", "tin-lead", "solder", " lead "], cas: ["7439-92-1"] },
  // Lamps with mercury.
  { keywords: ["fluorescent", "mercury", "hid lamp"], cas: ["7439-97-6"] },
  // Chromate conversion coatings / chrome plating → hexavalent chromium.
  { keywords: ["chromate", "hexavalent", "passivat", "electroplat", "chrome plat"], cas: ["18540-29-9", "1333-82-0"] },
  // Cadmium platings / brazing.
  { keywords: ["cadmium", "brazing"], cas: ["7440-43-9"] },
];

function productText(product: CatalogProduct): string {
  const specs = (product.specs ?? []).map((s) => `${s.name} ${s.value}`).join(" ");
  return ` ${product.name} ${product.description ?? ""} ${specs} `.toLowerCase();
}

/**
 * Substance/material terms that products commonly advertise the ABSENCE of
 * ("RoHS lead-free", "mercury-free LED", "PVC-free jacket"). Used two ways below.
 */
const NEG_TERMS = [
  "lead", "pb", "mercury", "hg", "cadmium", "cd", "pvc", "phthalate", "phthalates",
  "plasticizer", "plasticizers", "chromate", "hexavalent", "chrome", "chromium", "cr6",
  "halogen", "brass", "solder",
];
const NEG_ALT = NEG_TERMS.join("|");

/**
 * Strip negated material phrases so a "<term>-free" / "free of <term>" / "no <term>"
 * mention never SELF-triggers its own rule (e.g. "PVC-free" must not match the "pvc"
 * keyword). Applied before the trigger scan.
 */
function neutralizeNegations(text: string): string {
  return text.replace(
    new RegExp(`\\b(?:(?:${NEG_ALT})[-\\s]?free|free[-\\s](?:of|from)[-\\s](?:${NEG_ALT})|(?:no|without|non)[-\\s]?(?:${NEG_ALT}))\\b`, "g"),
    " ",
  );
}

/** True when the ORIGINAL text explicitly claims `term` is absent. */
function claimsAbsent(text: string, term: string): boolean {
  return (
    new RegExp(`\\b${term}[-\\s]?free\\b`).test(text) ||
    new RegExp(`\\bfree[-\\s](?:of|from)[-\\s]${term}\\b`).test(text) ||
    new RegExp(`\\b(?:no|without|non)[-\\s]?${term}\\b`).test(text)
  );
}

/**
 * Explicit "absent" claims → the CAS numbers they negate. Lets us suppress a
 * substance even when a DIFFERENT implication keyword fired it (e.g. "solder"
 * implies lead, but "lead-free solder" must not flag lead). PVC/phthalate-free
 * negates only the phthalate CAS — lead can still come from brass/solder, so it
 * is not blanket-negated here.
 */
const NEGATION_RULES: { terms: string[]; cas: string[] }[] = [
  { terms: ["lead", "pb"], cas: ["7439-92-1"] },
  { terms: ["mercury", "hg"], cas: ["7439-97-6"] },
  { terms: ["cadmium", "cd"], cas: ["7440-43-9"] },
  { terms: ["pvc", "phthalate", "phthalates"], cas: ["117-81-7", "85-68-7", "84-74-2", "84-69-5"] },
  { terms: ["hexavalent", "chromate", "cr6"], cas: ["18540-29-9", "1333-82-0"] },
];

/** Substances a product MAY contain, inferred from its stated materials/specs. */
export function substancesForProduct(product: CatalogProduct): Substance[] {
  const text = productText(product);

  // CAS the product explicitly advertises as absent — never report these.
  const negated = new Set<string>();
  for (const rule of NEGATION_RULES) {
    if (rule.terms.some((t) => claimsAbsent(text, t))) for (const c of rule.cas) negated.add(c);
  }

  const scan = neutralizeNegations(text);
  const cas = new Set<string>();
  for (const rule of TRIGGER_RULES) {
    if (rule.keywords.some((k) => scan.includes(k))) {
      for (const c of rule.cas) cas.add(c);
    }
  }
  const out: Substance[] = [];
  for (const c of cas) {
    if (negated.has(c)) continue;
    const s = byCas.get(c);
    if (s) out.push(s);
  }
  return out;
}

/** The distinct regulatory lists implicated by a product's inferred substances. */
export function complianceListsForProduct(product: CatalogProduct): ComplianceList[] {
  const lists = new Set<ComplianceList>();
  for (const s of substancesForProduct(product)) for (const l of s.lists) lists.add(l);
  return [...lists];
}

/** Look up the real HTS-chapter detail (description + Section-301 note) for an HTS code. */
export function htsChapterInfo(htsCode: string): HtsChapter | null {
  const chapter = htsCode.replace(/[^0-9]/g, "").slice(0, 2);
  return HTS_CHAPTERS.find((h) => h.chapter === chapter) ?? null;
}

export { SUBSTANCES, HTS_CHAPTERS };
