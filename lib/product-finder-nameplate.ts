/**
 * Nameplate / equipment-label parser (#9) — pure, deterministic, $0. Extracts the
 * structured electrical fields a field rep needs from OCR'd nameplate text
 * (catalog number, manufacturer, voltage, amperage, HP, AIC/SCCR, phase) and
 * builds a catalog search query. The parsing always works on text from any
 * source; only the image→text OCR step (lib/integration/ocr-live.ts) is gated.
 */

export interface NameplateFields {
  catalogNumber?: string;
  manufacturer?: string;
  voltage?: string;
  amperage?: string;
  horsepower?: string;
  interruptRating?: string; // AIC / SCCR / kA
  phase?: string;
}

// Brand aliases → canonical brand. Order-independent; matched on whole words.
const MFR_CANON: Record<string, string> = {
  "general electric": "GE",
  "cutler-hammer": "Eaton",
  "cutler hammer": "Eaton",
  "allen-bradley": "Allen-Bradley",
  "allen bradley": "Allen-Bradley",
  "federal pacific": "Federal Pacific",
  "square d": "Square D",
  schneider: "Square D",
  westinghouse: "Eaton",
  challenger: "Eaton",
  rockwell: "Allen-Bradley",
  murray: "Siemens",
  siemens: "Siemens",
  eaton: "Eaton",
  abb: "ABB",
  leviton: "Leviton",
  hubbell: "Hubbell",
  cooper: "Cooper",
  bussmann: "Bussmann",
  littelfuse: "Littelfuse",
  mersen: "Mersen",
  lutron: "Lutron",
  ge: "GE",
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function findManufacturer(text: string): string | undefined {
  // Longest alias first so "general electric" wins over a bare "ge".
  const aliases = Object.keys(MFR_CANON).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    if (new RegExp(`\\b${escapeRe(alias)}\\b`, "i").test(text)) return MFR_CANON[alias];
  }
  return undefined;
}

/** Parse nameplate text into structured electrical fields. Pure. */
export function parseNameplate(text: string): NameplateFields {
  const t = text.replace(/\s+/g, " ").trim();
  const fields: NameplateFields = {};

  const cat = t.match(/\b(?:CAT(?:ALOG)?\.?\s*(?:NO\.?|#|NUMBER)?|TYPE|MODEL)\s*[:#\-]?\s*([A-Z0-9][A-Z0-9\-/.]{2,})/i);
  if (cat) fields.catalogNumber = cat[1].toUpperCase();

  const volt = t.match(/\b(\d{2,3}(?:\/\d{2,3})?)\s*V(?:AC|DC|OLTS?)?\b/i);
  if (volt) fields.voltage = `${volt[1]}V`;

  const amp = t.match(/\b(\d{1,4})\s*(?:A\b|AMP\b|AMPS\b|AMPERES?\b)/i);
  if (amp) fields.amperage = `${amp[1]}A`;

  const hp = t.match(/\b(\d+(?:\.\d+)?)\s*HP\b/i);
  if (hp) fields.horsepower = `${hp[1]}HP`;

  const aic = t.match(/\b(\d{1,3}(?:\.\d+)?)\s*k?\s*(?:aic|sccr|ka)\b/i);
  if (aic) fields.interruptRating = `${aic[1].replace(/\s+/g, "")}kA`.toUpperCase(); // canonical token

  const phase = t.match(/\b([13])\s*-?\s*(?:ph(?:ase)?\b|ø)/i);
  if (phase) fields.phase = `${phase[1]}PH`;

  const mfr = findManufacturer(t);
  if (mfr) fields.manufacturer = mfr;

  return fields;
}

/**
 * A catalog search query from parsed fields: the catalog number when present
 * (most specific → exact / cross-reference), else manufacturer + key specs.
 */
export function nameplateQuery(fields: NameplateFields): string {
  if (fields.catalogNumber) return fields.catalogNumber;
  return [fields.manufacturer, fields.amperage, fields.voltage, fields.horsepower].filter(Boolean).join(" ").trim();
}
