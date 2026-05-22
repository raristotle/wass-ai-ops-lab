// ── AutoBOM deterministic parser ───────────────────────────────────────────────
// Pure function: takes raw scope text → BomExtraction.
// No external dependencies, no API calls. All rules are local and deterministic.

import type {
  BomExtraction, BomLine, BomSku, BomCategory,
  AvailabilityStatus,
} from "@/lib/autobom";
import { toConfidenceLevel } from "@/lib/autobom";

export const PARSER_VERSION = "stub-v1";

// ── SKU catalog ────────────────────────────────────────────────────────────────

interface CatalogEntry {
  sku: string;
  description: string;
  manufacturer: string;
  unitPrice: number | null;
  availability: AvailabilityStatus;
  leadTimeDays?: number;
  unitOfMeasure: string;
  /** Patterns that indicate THIS entry should be the primary suggestion */
  matchPatterns: RegExp[];
  /** Base confidence when this pattern fires */
  baseConfidence: number;
  /** SKU IDs of ranked alternates (resolved after catalog build) */
  altSkus: string[];
}

const CATALOG: CatalogEntry[] = [
  // ── Circuit Breakers ────────────────────────────────────────────────────────
  {
    sku: "BR120",       description: "20A 1-Pole 120V Plug-On Circuit Breaker",
    manufacturer: "Eaton",          unitPrice: 8.50,   availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [
      /\b20\s*a.*\b(1[- ]?p(ole)?|single[- ]?p(ole)?)\b.*b(reak|cb)/i,
      /\b20\s*amp.*single.*b(reak|cb)/i,
      /\b1p.*20a.*b(reak|cb)/i,
    ],
    baseConfidence: 75, altSkus: ["QO120", "B120"],
  },
  {
    sku: "QO120",       description: "20A 1-Pole 120V QO Circuit Breaker",
    manufacturer: "Schneider Electric", unitPrice: 9.25, availability: "in-stock", unitOfMeasure: "EA",
    matchPatterns: [], baseConfidence: 73, altSkus: [],
  },
  {
    sku: "B120",        description: "20A 1-Pole 120V Circuit Breaker",
    manufacturer: "Siemens",         unitPrice: 7.80,   availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [], baseConfidence: 72, altSkus: [],
  },
  {
    sku: "BR230",       description: "30A 2-Pole 240V Plug-On Circuit Breaker",
    manufacturer: "Eaton",           unitPrice: 14.75,  availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/\b30\s*a.*\b2[- ]?p(ole)?\b.*b(reak|cb)/i, /\b30\s*amp.*double.*b(reak|cb)/i, /\b2p.*30a/i],
    baseConfidence: 78, altSkus: ["QO230"],
  },
  {
    sku: "QO230",       description: "30A 2-Pole 240V QO Circuit Breaker",
    manufacturer: "Schneider Electric", unitPrice: 15.90, availability: "in-stock", unitOfMeasure: "EA",
    matchPatterns: [], baseConfidence: 75, altSkus: [],
  },
  {
    sku: "BR250",       description: "50A 2-Pole 240V Plug-On Circuit Breaker",
    manufacturer: "Eaton",           unitPrice: 22.50,  availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/\b50\s*a.*\b2[- ]?p(ole)?\b.*b(reak|cb)/i],
    baseConfidence: 78, altSkus: [],
  },
  {
    sku: "Q2200",       description: "200A 2-Pole 240V Circuit Breaker",
    manufacturer: "Schneider Electric", unitPrice: 189.00, availability: "limited", unitOfMeasure: "EA",
    matchPatterns: [/\b200\s*a.*\b2[- ]?p(ole)?\b.*b(reak|cb)/i, /\b2p.*200a/i],
    baseConfidence: 74, altSkus: [],
  },
  {
    sku: "HJL36200",    description: "200A 3-Pole 600V Molded Case Circuit Breaker",
    manufacturer: "Eaton",           unitPrice: 385.00, availability: "limited",   unitOfMeasure: "EA",
    matchPatterns: [/\b200\s*a.*\b3[- ]?p(ole)?\b.*b(reak|cb)/i, /\b3p.*200a.*b(reak|cb)/i],
    baseConfidence: 72, altSkus: [],
  },

  // ── Panelboards ─────────────────────────────────────────────────────────────
  {
    sku: "PRL1A3100G",  description: "100A 3-Phase 4W 30-Circuit Main Lug Panelboard",
    manufacturer: "Eaton",           unitPrice: 425.00, availability: "limited",   unitOfMeasure: "EA",
    matchPatterns: [/\b100\s*a.*\b3[- ]?ph.*panel/i, /\b3ph.*100a.*panel/i, /100\s*a.*3.{0,5}phase.*panel/i],
    baseConfidence: 68, altSkus: ["HOM130L30PGC"],
  },
  {
    sku: "HOM130L30PGC",description: "100A 3-Phase 4W 30-Circuit Homeline Panelboard",
    manufacturer: "Schneider Electric", unitPrice: 398.00, availability: "limited", unitOfMeasure: "EA",
    matchPatterns: [], baseConfidence: 65, altSkus: [],
  },
  {
    sku: "P1E42M400ATS", description: "400A 3-Phase 42-Space Main Breaker Panelboard",
    manufacturer: "Eaton",           unitPrice: 1250.00,availability: "lead-time", unitOfMeasure: "EA", leadTimeDays: 21,
    matchPatterns: [/\b400\s*a.*\b3[- ]?ph.*panel/i, /\b3ph.*400a.*panel/i, /400\s*a.*main.*panel/i],
    baseConfidence: 70, altSkus: ["I-LINE-400"],
  },
  {
    sku: "I-LINE-400",  description: "400A 3-Phase I-Line Main Breaker Panelboard",
    manufacturer: "Schneider Electric", unitPrice: 1380.00, availability: "lead-time", unitOfMeasure: "EA", leadTimeDays: 28,
    matchPatterns: [], baseConfidence: 67, altSkus: [],
  },
  {
    sku: "LMCB200P3",   description: "200A 3-Phase 42-Circuit Main Breaker Panelboard",
    manufacturer: "Siemens",          unitPrice: 720.00, availability: "limited",   unitOfMeasure: "EA",
    matchPatterns: [/\b200\s*a.*\b3[- ]?ph.*panel/i, /\b3ph.*200a.*panel/i],
    baseConfidence: 68, altSkus: [],
  },

  // ── EMT Conduit ──────────────────────────────────────────────────────────────
  {
    sku: "EMT-050-10",  description: '1/2" EMT Conduit 10ft Stick',
    manufacturer: "Allied Tube",     unitPrice: 4.20,   availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/\b1\/2["\s].*EMT/i, /\bEMT.*1\/2["\s]/i, /\bhalf.{0,5}inch.*EMT/i],
    baseConfidence: 90, altSkus: [],
  },
  {
    sku: "EMT-075-10",  description: '3/4" EMT Conduit 10ft Stick',
    manufacturer: "Allied Tube",     unitPrice: 6.85,   availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/\b3\/4["\s].*EMT/i, /\bEMT.*3\/4/i, /\.75["\s].*EMT/i],
    baseConfidence: 92, altSkus: [],
  },
  {
    sku: "EMT-100-10",  description: '1" EMT Conduit 10ft Stick',
    manufacturer: "Allied Tube",     unitPrice: 9.50,   availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/\b1["\s].*EMT\b/i, /\bEMT.*\b1["\s]/i, /\bone.{0,5}inch.*EMT/i],
    baseConfidence: 90, altSkus: [],
  },
  {
    sku: "EMT-150-10",  description: '1-1/2" EMT Conduit 10ft Stick',
    manufacturer: "Allied Tube",     unitPrice: 15.20,  availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/\b1[- ]?1\/2["\s].*EMT/i, /\bEMT.*1[- ]?1\/2/i],
    baseConfidence: 91, altSkus: [],
  },
  {
    sku: "EMT-200-10",  description: '2" EMT Conduit 10ft Stick',
    manufacturer: "Allied Tube",     unitPrice: 22.40,  availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/\b2["\s].*EMT\b/i, /\bEMT.*\b2["\s]/i, /\btwo.{0,5}inch.*EMT/i],
    baseConfidence: 90, altSkus: [],
  },

  // ── Wire & Cable ─────────────────────────────────────────────────────────────
  {
    sku: "THHN-14-500", description: "#14 AWG THHN/THWN-2 Copper Wire, 500ft Spool",
    manufacturer: "Southwire",       unitPrice: 59.00,  availability: "in-stock",  unitOfMeasure: "SPOOL",
    matchPatterns: [/#14.*THHN/i, /THHN.*#14/i, /\b14\s*AWG.*THHN/i],
    baseConfidence: 88, altSkus: [],
  },
  {
    sku: "THHN-12-500", description: "#12 AWG THHN/THWN-2 Copper Wire, 500ft Spool",
    manufacturer: "Southwire",       unitPrice: 89.00,  availability: "in-stock",  unitOfMeasure: "SPOOL",
    matchPatterns: [/#12.*THHN/i, /THHN.*#12/i, /\b12\s*AWG.*THHN/i],
    baseConfidence: 88, altSkus: [],
  },
  {
    sku: "THHN-10-500", description: "#10 AWG THHN/THWN-2 Copper Wire, 500ft Spool",
    manufacturer: "Southwire",       unitPrice: 135.00, availability: "in-stock",  unitOfMeasure: "SPOOL",
    matchPatterns: [/#10.*THHN/i, /THHN.*#10/i, /\b10\s*AWG.*THHN/i],
    baseConfidence: 88, altSkus: [],
  },
  {
    sku: "THHN-8-500",  description: "#8 AWG THHN/THWN-2 Copper Wire, 500ft Spool",
    manufacturer: "Southwire",       unitPrice: 209.00, availability: "in-stock",  unitOfMeasure: "SPOOL",
    matchPatterns: [/#8\s*AWG.*THHN/i, /THHN.*#8\s*AWG/i, /#8\s*THHN/i],
    baseConfidence: 87, altSkus: [],
  },
  {
    sku: "THHN-6-500",  description: "#6 AWG THHN/THWN-2 Copper Wire, 500ft Spool",
    manufacturer: "Southwire",       unitPrice: 329.00, availability: "in-stock",  unitOfMeasure: "SPOOL",
    matchPatterns: [/#6\s*AWG.*THHN/i, /THHN.*#6/i],
    baseConfidence: 87, altSkus: [],
  },
  {
    sku: "THHN-2-500",  description: "#2 AWG THHN/THWN-2 Copper Wire, 500ft Spool",
    manufacturer: "Southwire",       unitPrice: 389.00, availability: "limited",   unitOfMeasure: "SPOOL",
    matchPatterns: [/#2\s*AWG.*THHN/i, /THHN.*#2\s*AWG/i, /#2\s*THHN\b/i],
    baseConfidence: 86, altSkus: [],
  },
  {
    sku: "THHN-1/0-250",description: "#1/0 AWG THHN/THWN-2 Copper Wire, 250ft Spool",
    manufacturer: "Southwire",       unitPrice: 649.00, availability: "limited",   unitOfMeasure: "SPOOL",
    matchPatterns: [/#1\/0.*THHN/i, /THHN.*1\/0\s*AWG/i],
    baseConfidence: 85, altSkus: [],
  },
  {
    sku: "THHN-4/0-250",description: "#4/0 AWG THHN/THWN-2 Copper Wire, 250ft Spool",
    manufacturer: "Southwire",       unitPrice: 1125.00,availability: "limited",   unitOfMeasure: "SPOOL",
    matchPatterns: [/#4\/0.*THHN/i, /THHN.*4\/0/i, /4\/0\s*AWG.*ground/i],
    baseConfidence: 85, altSkus: [],
  },

  // ── Lighting ─────────────────────────────────────────────────────────────────
  {
    sku: "HBLED-150W-UNV", description: "150W LED High Bay Fixture, 120-277V, 5000K, 20000lm",
    manufacturer: "Lithonia Lighting", unitPrice: 155.00, availability: "in-stock", unitOfMeasure: "EA",
    matchPatterns: [/\b150\s*w.*high\s*bay/i, /high\s*bay.*\b150\s*w/i],
    baseConfidence: 83, altSkus: [],
  },
  {
    sku: "HBLED-200W-UNV", description: "200W LED High Bay Fixture, 120-277V, 5000K, 28000lm",
    manufacturer: "Lithonia Lighting", unitPrice: 189.00, availability: "in-stock", unitOfMeasure: "EA",
    matchPatterns: [/\b200\s*w.*high\s*bay/i, /high\s*bay.*\b200\s*w/i, /\b200\s*watt.*LED.*bay/i],
    baseConfidence: 84, altSkus: ["HBLED-240W-UNV"],
  },
  {
    sku: "HBLED-240W-UNV", description: "240W LED High Bay Fixture, 120-277V, 5000K, 33600lm",
    manufacturer: "Cree Lighting",   unitPrice: 215.00, availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/\b240\s*w.*high\s*bay/i, /high\s*bay.*\b240\s*w/i],
    baseConfidence: 84, altSkus: [],
  },
  {
    sku: "HBLED-GEN-UNV", description: "LED High Bay Fixture (wattage TBD), 120-277V",
    manufacturer: "Lithonia Lighting", unitPrice: null,  availability: "unknown",  unitOfMeasure: "EA",
    // generic fallback — only fires if no wattage pattern fires first
    matchPatterns: [/\bhigh\s*bay\b/i, /LED.*warehouse.*fixture/i],
    baseConfidence: 42, altSkus: ["HBLED-150W-UNV", "HBLED-200W-UNV", "HBLED-240W-UNV"],
  },
  {
    sku: "EXIT-LED-BB",   description: "LED Exit Sign, Battery Backup, Single/Double Face",
    manufacturer: "Lithonia Lighting", unitPrice: 45.00, availability: "in-stock", unitOfMeasure: "EA",
    matchPatterns: [/exit\s*sign/i, /emergency.*exit/i],
    baseConfidence: 82, altSkus: [],
  },
  {
    sku: "EMRG-LED-90",   description: "LED Emergency Light, Dual Head, 90-min Battery, 120-277V",
    manufacturer: "Lithonia Lighting", unitPrice: 62.00, availability: "in-stock", unitOfMeasure: "EA",
    matchPatterns: [/emergency\s*light/i, /emergency.*luminaire/i],
    baseConfidence: 80, altSkus: [],
  },

  // ── Wiring Devices ────────────────────────────────────────────────────────────
  {
    sku: "MS-OPS5M-WH",   description: "360° Passive Infrared Occupancy Sensor, 120-277V",
    manufacturer: "Leviton",          unitPrice: 28.50, availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/occupancy\s*sensor/i, /motion\s*sensor/i, /360.{0,10}sensor/i],
    baseConfidence: 72, altSkus: [],
  },
  {
    // Generic dimmer — no default SKU until wattage/load type confirmed
    sku: "DIMMER-GEN",    description: "Dimmer Switch — wattage and load type TBD",
    manufacturer: "TBD",              unitPrice: null,  availability: "unknown",   unitOfMeasure: "EA",
    matchPatterns: [/\bdimmer/i],
    baseConfidence: 35, altSkus: [],
  },
  {
    sku: "5362-I",         description: "20A 125V Duplex Receptacle, Ivory",
    manufacturer: "Leviton",          unitPrice: 3.45,  availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/\b20\s*a.*125v.*receptacle/i, /duplex.*recept.*20a/i, /\b20a.*outlet\b/i],
    baseConfidence: 80, altSkus: ["GF20-W"],
  },
  {
    sku: "GFNT1-W",        description: "20A 125V GFCI Receptacle, White, Self-Test",
    manufacturer: "Leviton",          unitPrice: 14.25, availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/GFCI.*\b20a\b/i, /\b20a.*GFCI/i, /ground\s*fault.*recept/i],
    baseConfidence: 85, altSkus: [],
  },

  // ── Power Infrastructure ─────────────────────────────────────────────────────
  {
    sku: "SRT10KXLT",     description: "10kVA Smart-UPS SRT Online Double-Conversion, 208V",
    manufacturer: "APC by Schneider", unitPrice: 4850.00,availability: "lead-time",unitOfMeasure: "EA", leadTimeDays: 14,
    matchPatterns: [/\b10\s*k[Vv][Aa].*ups/i, /ups.*\b10\s*k[Vv][Aa]/i, /10kva.*online/i],
    baseConfidence: 78, altSkus: ["GXT5-10000RT208"],
  },
  {
    sku: "GXT5-10000RT208",description: "10kVA Liebert GXT5 Online UPS, 208V, 10U Rack",
    manufacturer: "Vertiv",           unitPrice: 5125.00,availability: "lead-time",unitOfMeasure: "EA", leadTimeDays: 21,
    matchPatterns: [], baseConfidence: 75, altSkus: [],
  },
  {
    sku: "AP7900B",        description: "Metered Rack PDU, 200A, 30A L6-30R ×12 Outlets, 208V",
    manufacturer: "APC by Schneider", unitPrice: 1250.00,availability: "limited",  unitOfMeasure: "EA",
    matchPatterns: [/pdu.*L6-30/i, /power\s*dist.*unit.*30a/i, /rack.*pdu.*208v/i, /\bpdu\b.*208/i],
    baseConfidence: 74, altSkus: [],
  },

  // ── Data Center ───────────────────────────────────────────────────────────────
  {
    sku: "GGB-4\/0-12",   description: "Ground Bus Bar, 4/0 AWG Cable, 12-Port",
    manufacturer: "Panduit",          unitPrice: 89.00, availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/ground\s*bus/i, /equipment\s*ground.*bus/i],
    baseConfidence: 60, altSkus: [],
  },
  {
    sku: "APC-AP9870",    description: "C13 to C14 PDU Power Cord, 6ft, 15A, 250V",
    manufacturer: "APC by Schneider", unitPrice: 7.25,  availability: "in-stock",  unitOfMeasure: "EA",
    matchPatterns: [/c13.*c14.*cord/i, /c13.{0,5}to.{0,5}c14/i, /iec.*c13.*power/i],
    baseConfidence: 90, altSkus: [],
  },
];

// Build a SKU → CatalogEntry map for alternate resolution
const CATALOG_MAP = new Map<string, CatalogEntry>(CATALOG.map((e) => [e.sku, e]));

function resolveAlts(entry: CatalogEntry): BomSku[] {
  return entry.altSkus
    .map((sku) => CATALOG_MAP.get(sku))
    .filter((e): e is CatalogEntry => e !== undefined)
    .map(entryToSku);
}

function entryToSku(e: CatalogEntry): BomSku {
  return {
    sku:           e.sku,
    description:   e.description,
    manufacturer:  e.manufacturer,
    unitPrice:     e.unitPrice,
    availability:  e.availability,
    leadTimeDays:  e.leadTimeDays,
    unitOfMeasure: e.unitOfMeasure,
  };
}

// ── Category detection ─────────────────────────────────────────────────────────

const CATEGORY_RULES: { pattern: RegExp; category: BomCategory }[] = [
  { pattern: /\b(circuit\s*breakers?|breakers?|MCB|MCCB|HACR\s*breaker|CB)\b/i,  category: "Circuit Breakers"           },
  { pattern: /\b(panel|panelboard|MDP|load\s*center|distribution\s*board)\b/i,    category: "Panelboards"                },
  { pattern: /\b(THHN|THWN|wire|cable|MC\s*cable|NM-?B|romex|AWG)\b/i,           category: "Wire & Cable"               },
  { pattern: /\bEMT\b|\brigid\s*conduit\b|\bIMC\b|\bPVC\s*conduit\b|\bconduit\b/i,category: "Conduit"                   },
  { pattern: /\b(coupling|connector|elbow|LB\b|pulling\s*elbow|strut|fitting)\b/i,category: "Conduit Fittings"           },
  { pattern: /\b(fixture|luminaire|LED|high\s*bay|troffer|exit\s*sign|emergency\s*light|lamp)\b/i, category: "Lighting" },
  { pattern: /\b(occupancy\s*sensor|motion\s*sensor|dimmer|receptacle|outlet|GFCI|switch)\b/i,     category: "Wiring Devices" },
  { pattern: /\b(transformer|xfmr|step[- ]down|step[- ]up)\b/i,                   category: "Transformers"              },
  { pattern: /\b(disconnect|safety\s*switch|fusible|non-?fusible|SSW)\b/i,        category: "Disconnects & Switches"    },
  { pattern: /\b(motor|drive|VFD|variable\s*freq|starter|contactor|MCC)\b/i,      category: "Motor Controls"            },
  { pattern: /\b(UPS|uninterruptible|PDU|power\s*dist.*unit|rack\s*PDU)\b/i,      category: "Power Infrastructure"      },
  { pattern: /\b(server|rack|cabinet|patch\s*panel|structured\s*cabling|C13|C14|fiber|ground\s*bus)\b/i, category: "Data Center Infrastructure" },
];

function detectCategory(text: string): BomCategory {
  for (const { pattern, category } of CATEGORY_RULES) {
    if (pattern.test(text)) return category;
  }
  return "Uncategorized";
}

// ── Quantity extraction ────────────────────────────────────────────────────────

interface QtyResult {
  quantity: number | null;
  unit: string | null;
  linearFeet?: number; // raw LF before stick conversion
}

function extractQuantity(text: string, category: BomCategory): QtyResult {
  // Parenthetical: (20), (4), etc.
  const paren = /^\s*\((\d+)\)/.exec(text);
  if (paren) {
    const qty = parseInt(paren[1]!, 10);
    return maybeConvertConduit(qty, text, category);
  }
  // Leading number: "20 breakers", "50 LED fixtures", "4x"
  const lead = /^\s*(\d+)\s*[xX×]?\s+/.exec(text);
  if (lead) {
    const qty = parseInt(lead[1]!, 10);
    return maybeConvertConduit(qty, text, category);
  }
  // Linear feet in body: "200 linear feet", "200 LF", "100ft"
  const lf = /(\d+)\s*(linear\s*feet?|LF|l\.f\.|ft)\b/i.exec(text);
  if (lf) {
    const feet = parseInt(lf[1]!, 10);
    if (category === "Conduit") {
      // Convert to 10ft sticks
      return { quantity: Math.ceil(feet / 10), unit: "EA", linearFeet: feet };
    }
    return { quantity: feet, unit: "FT" };
  }
  // Qty in body: "qty 8", "quantity: 12"
  const qtyBody = /\bqty\s*[:\-]?\s*(\d+)\b/i.exec(text);
  if (qtyBody) {
    const qty = parseInt(qtyBody[1]!, 10);
    return maybeConvertConduit(qty, text, category);
  }
  return { quantity: null, unit: null };
}

function maybeConvertConduit(qty: number, text: string, category: BomCategory): QtyResult {
  if (category !== "Conduit") return { quantity: qty, unit: "EA" };
  // If the spec says "200 LF" and a separate (qty) precedes, qty is sticks
  const lfMatch = /(\d+)\s*(linear\s*feet?|LF|ft)/i.exec(text);
  if (lfMatch) {
    const feet = parseInt(lfMatch[1]!, 10);
    return { quantity: Math.ceil(feet / 10), unit: "EA", linearFeet: feet };
  }
  return { quantity: qty, unit: "EA" };
}

// ── Catalog lookup ─────────────────────────────────────────────────────────────

interface LookupResult {
  entry: CatalogEntry | null;
  confidence: number;
  reasons: string[];
  missingInfo: string[];
}

function lookupCatalog(text: string, category: BomCategory, qty: number | null): LookupResult {
  const reasons: string[] = [];
  const missingInfo: string[] = [];

  // Try each catalog entry's match patterns in order
  for (const entry of CATALOG) {
    for (const pat of entry.matchPatterns) {
      if (pat.test(text)) {
        let conf = entry.baseConfidence;

        // Positive signals
        if (qty !== null) {
          conf += 10;
          reasons.push("Quantity specified (+10)");
        }
        if (/\b(A|amp|ampere)\b/i.test(text)) {
          conf += 8;
          reasons.push("Amperage specified (+8)");
        }
        if (/\b(AWG|gauge|#\d+)\b/i.test(text)) {
          conf += 12;
          reasons.push("Wire gauge specified (+12)");
        }
        if (/\b(V|volt)\b/i.test(text)) {
          conf += 6;
          reasons.push("Voltage specified (+6)");
        }
        if (/\b\d+[- ]?p(ole|h(ase)?)\b/i.test(text)) {
          conf += 8;
          reasons.push("Pole/phase count specified (+8)");
        }
        if (/\b(THHN|THWN|EMT|GFCI|AFCI|NEMA|UPS|PDU)\b/.test(text)) {
          conf += 5;
          reasons.push("Industry standard type specified (+5)");
        }
        if (/\b(Eaton|Schneider|Siemens|Leviton|Southwire|Lithonia|APC)\b/i.test(text)) {
          conf += 5;
          reasons.push("Manufacturer specified (+5)");
        }

        // Negative signals / missing info
        if (category === "Panelboards") {
          if (!/NEMA/i.test(text)) {
            conf -= 8;
            missingInfo.push("NEMA enclosure rating (NEMA 1 vs NEMA 3R)");
          }
          if (!/\b(main\s*breaker|main\s*lug|MLO|MCB)\b/i.test(text)) {
            conf -= 6;
            missingInfo.push("Main breaker vs. main lug only");
          }
          if (!/\b\d{2,}\s*(circuit|space|pole)\b/i.test(text)) {
            conf -= 5;
            missingInfo.push("Number of circuit spaces");
          }
        }
        if (category === "Circuit Breakers") {
          if (!/\b(BR|QO|HOM|bolt.?on|plug.?on)\b/i.test(text)) {
            missingInfo.push("Panel family (Eaton BR, Square D QO, Siemens) — must match panelboard");
          }
          if (/hvac|heat|air.?cond/i.test(text) && !/HACR/i.test(text)) {
            missingInfo.push("Confirm HACR rating required for HVAC loads");
          }
        }
        if (category === "Wire & Cable") {
          if (qty !== null && /4\s*color/i.test(text)) {
            missingInfo.push("Confirm color schedule: standard 3-phase (Brown/Orange/Yellow + Grey/Green)");
          }
        }
        if (category === "Lighting") {
          if (!/\b\d{2,3}\s*w\b/i.test(text)) {
            conf -= 20;
            missingInfo.push("Wattage not specified — required for accurate fixture selection");
          }
          if (!/\b\d{4}K?\b/i.test(text)) {
            missingInfo.push("Color temperature (e.g., 4000K, 5000K)");
          }
          if (!/\b(hook|pendant|surface|rigid|aircraft)\b/i.test(text)) {
            missingInfo.push("Mounting type (pendant hook, aircraft cable, rigid stem, surface)");
          }
        }
        if (category === "Power Infrastructure" && /ups/i.test(text)) {
          if (!/\b\d+\s*(min|minute|hour)\b/i.test(text)) {
            missingInfo.push("Required runtime at full load");
          }
          if (!/\bU\b|\brack\b/i.test(text)) {
            missingInfo.push("Rack unit height constraint (6U, 8U, 10U?)");
          }
        }
        if (category === "Wiring Devices" && /dimmer/i.test(text)) {
          if (!/\b\d{3,4}W\b/i.test(text)) {
            conf -= 15;
            missingInfo.push("Amperage/wattage rating of dimmer");
          }
          missingInfo.push("LED-compatible dimmer vs. standard incandescent");
          missingInfo.push("Single-pole or 3-way");
        }
        if (category === "Conduit Fittings") {
          if (!/\d\/\d["\s]|1["\s]|2["\s]/i.test(text)) {
            conf -= 15;
            missingInfo.push("Conduit trade size required for fittings");
          }
        }

        // Clamp to 0–100
        conf = Math.max(0, Math.min(100, conf));

        if (reasons.length === 0) {
          reasons.push(`Pattern match on catalog entry ${entry.sku} (base ${entry.baseConfidence})`);
        }

        return { entry, confidence: conf, reasons, missingInfo };
      }
    }
  }

  // No match
  reasons.push("No catalog pattern matched (0)");
  reasons.push("Manual selection or SME review required");
  missingInfo.push("Specific product type or part number");
  if (qty === null) missingInfo.push("Quantity");
  return { entry: null, confidence: qty !== null ? 15 : 8, reasons, missingInfo };
}

// ── Main parser ────────────────────────────────────────────────────────────────

let _lineSeq = 0;
function nextLineId(): string { return `PL-${String(++_lineSeq).padStart(4, "0")}`; }

/**
 * Parse a multi-line scope text into a BomExtraction.
 * This is a pure deterministic function — no randomness, no network calls.
 */
export function parseScopeText(scopeText: string, projectName: string): BomExtraction {
  const rawLines = scopeText
    .split("\n")
    .map((l) => l.trim())
    // "# comment" and "// comment" are scope notes, not material lines.
    // "#12 AWG" is valid material text — only filter "# " (hash-space) as comments.
    .filter((l) => l.length > 0 && !l.startsWith("//") && !l.startsWith("# "));

  const lines: BomLine[] = rawLines.map((raw, idx) => {
    const category  = detectCategory(raw);
    const { quantity, unit, linearFeet } = extractQuantity(raw, category);
    const { entry, confidence, reasons, missingInfo } = lookupCatalog(raw, category, quantity);

    // Build parsedIntent summary
    let intent = raw;
    if (category !== "Uncategorized") {
      const qtyStr = quantity !== null ? `qty ${quantity} ${unit ?? ""}`.trim() : "qty unknown";
      const lfNote = linearFeet ? ` (${linearFeet} LF → ${quantity} sticks)` : "";
      intent = `${category}: ${entry?.description ?? "unmatched"}, ${qtyStr}${lfNote}`;
    }

    const suggestedSku = entry ? entryToSku(entry) : null;
    const alternates   = entry ? resolveAlts(entry) : [];

    return {
      id:               nextLineId(),
      lineNumber:       idx + 1,
      rawText:          raw,
      parsedIntent:     intent,
      category,
      quantity,
      unit:             unit ?? null,
      suggestedSku,
      confidence,
      confidenceLevel:  toConfidenceLevel(confidence),
      confidenceReasons: reasons,
      alternates,
      missingInfo,
      status:           missingInfo.length > 2 || confidence < 30 ? "flagged" : "pending",
      tags:             buildTags(category, raw),
    };
  });

  return {
    id:            `BOM-LIVE-${Date.now()}`,
    projectName,
    sourceText:    scopeText,
    lines,
    extractedAt:   new Date().toISOString(),
    parserVersion: PARSER_VERSION,
  };
}

function buildTags(category: BomCategory, text: string): string[] {
  const tags: string[] = [];
  if (["Circuit Breakers","Panelboards","Wire & Cable","Conduit","Conduit Fittings","Transformers","Disconnects & Switches","Motor Controls"].includes(category)) {
    tags.push("electrical");
  }
  if (["Power Infrastructure","Data Center Infrastructure"].includes(category)) {
    tags.push("dc");
  }
  if (category === "Lighting") tags.push("lighting");
  if (/hvac|heat|air.?cond/i.test(text)) tags.push("hvac");
  if (/ground|earth/i.test(text)) tags.push("grounding");
  if (/life.?safety|exit|emergency/i.test(text)) tags.push("life-safety");
  return tags;
}
