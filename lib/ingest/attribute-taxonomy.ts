/**
 * Canonical attribute taxonomy (Sprint D2 — identity + attribute backbone).
 *
 * Different sources spell the same engineering attribute a dozen ways ("Amps",
 * "Amperage", "Current Rating (A)", "In"). Before any two sources' records can be
 * merged, those names must collapse to ONE canonical key with ONE canonical unit. This
 * dictionary is that mapping — a curated, $0, dependency-free table aligned to the
 * electrical/datacom concepts the catalog already classifies against (see the ETIM
 * concept groups in lib/catalog/etim-specs.ts). It is data only; the resolver +
 * value/unit parsing live in attribute-normalize.ts.
 *
 * Honest by design: an attribute name we don't recognize is reported as UNMAPPED, never
 * force-fit into a canonical bucket.
 */

export interface CanonicalAttribute {
  /** Stable canonical key (kebab-case), e.g. "amperage". */
  key: string;
  /** Human label, e.g. "Amperage". */
  label: string;
  /** Canonical unit SYMBOL this attribute is measured in (when numeric), e.g. "A". */
  unit?: string;
  datatype: "number" | "string";
  /** Source attribute-name spellings that map here (lowercased, compared loosely). */
  aliases: string[];
}

/**
 * The canonical attributes for the pilot's segments (electrical / datacom / lighting).
 * Curated, not exhaustive — extend as new sources surface new attributes. Order is the
 * resolution priority when an alias is ambiguous (earlier wins).
 */
export const ATTRIBUTE_TAXONOMY: CanonicalAttribute[] = [
  // NOTE: the bare IEC symbols "In"/"Ie"/"Ue" are intentionally NOT aliases — as a
  // standalone attribute NAME they're ambiguous (e.g. "In" reads as the word "in"), so we
  // rely on the spelled-out names instead.
  { key: "amperage", label: "Amperage", unit: "A", datatype: "number", aliases: ["amperage", "amp", "amps", "amperes", "current", "current rating", "rated current", "ampere rating"] },
  { key: "voltage", label: "Voltage", unit: "V", datatype: "number", aliases: ["voltage", "volt", "volts", "rated voltage", "voltage rating", "operating voltage", "vac", "vdc"] },
  { key: "poles", label: "Poles", datatype: "number", aliases: ["poles", "pole", "number of poles", "no. of poles", "no of poles"] },
  { key: "phase", label: "Phase", datatype: "string", aliases: ["phase", "phases", "number of phases", "no. of phases"] },
  { key: "frequency", label: "Frequency", unit: "Hz", datatype: "number", aliases: ["frequency", "hz", "rated frequency"] },
  { key: "interrupting-rating", label: "Interrupting rating", unit: "kAIC", datatype: "number", aliases: ["interrupting rating", "interrupt rating", "aic", "kaic", "sccr", "breaking capacity", "short circuit rating", "interrupting capacity", "icu", "ics"] },
  { key: "trip-curve", label: "Trip curve", datatype: "string", aliases: ["trip curve", "trip characteristic", "tripping characteristic", "curve", "characteristic"] },
  { key: "power", label: "Power", unit: "W", datatype: "number", aliases: ["power", "wattage", "watts", "power (w)", "output power", "rated power", "input power"] },
  { key: "apparent-power", label: "Apparent power", unit: "kVA", datatype: "number", aliases: ["kva", "va", "apparent power", "transformer rating", "kva rating"] },
  { key: "luminous-flux", label: "Luminous flux", unit: "lm", datatype: "number", aliases: ["luminous flux", "lumens", "lumen", "lm", "light output", "brightness"] },
  { key: "color-temperature", label: "Color temperature", unit: "K", datatype: "number", aliases: ["color temperature", "colour temperature", "cct", "kelvin", "color temp"] },
  { key: "efficacy", label: "Efficacy", unit: "lm/W", datatype: "number", aliases: ["efficacy", "efficiency", "lm/w", "lumens per watt", "lpw"] },
  { key: "ingress-protection", label: "Ingress protection (IP)", datatype: "string", aliases: ["ingress protection", "ip", "ip rating", "ip code", "degree of protection"] },
  { key: "enclosure-type", label: "Enclosure type (NEMA)", datatype: "string", aliases: ["enclosure type", "enclosure", "nema rating", "nema type", "nema enclosure", "type rating"] },
  { key: "material", label: "Material", datatype: "string", aliases: ["material", "housing material", "construction", "body material", "jacket material", "conductor material"] },
  { key: "conductor-gauge", label: "Conductor gauge (AWG)", unit: "AWG", datatype: "string", aliases: ["conductor gauge", "wire gauge", "gauge", "awg", "wire size", "conductor size", "size awg"] },
  { key: "conductor-count", label: "Conductor count", datatype: "number", aliases: ["conductor count", "number of conductors", "conductors", "no. of conductors", "pairs", "number of pairs"] },
  { key: "trade-size", label: "Trade size", unit: "in", datatype: "string", aliases: ["trade size", "conduit size", "nominal size", "size"] },
  { key: "dimension", label: "Dimension", unit: "in", datatype: "number", aliases: ["dimension", "diameter", "width", "height", "length", "depth", "outer diameter", "od"] },
  { key: "termination", label: "Termination", datatype: "string", aliases: ["termination", "connection", "connector", "contact", "thread", "terminal type", "lug type", "connection type"] },
  { key: "mounting", label: "Mounting", datatype: "string", aliases: ["mounting", "mount", "mounting type", "flush", "surface mount", "din rail"] },
  { key: "cable-category", label: "Cable category", datatype: "string", aliases: ["cable category", "category", "cat", "performance category", "fiber type", "cable type"] },
  { key: "dimming", label: "Dimming", datatype: "string", aliases: ["dimming", "dimmable", "dimming protocol", "dali", "0-10v", "control protocol"] },
  { key: "color", label: "Color", datatype: "string", aliases: ["color", "colour", "finish", "body color"] },
  { key: "operating-temperature", label: "Operating temperature", unit: "°C", datatype: "string", aliases: ["operating temperature", "temperature rating", "temp rating", "ambient temperature", "operating temp"] },
  { key: "lifecycle-status", label: "Lifecycle status", datatype: "string", aliases: ["lifecycle status", "lifecycle", "product status", "availability status", "eol", "end of life", "obsolescence status"] },
];

/** Canonical unit symbols keyed by lowercased source spelling. */
const UNIT_ALIASES: Record<string, string> = {
  a: "A", amp: "A", amps: "A", ampere: "A", amperes: "A",
  v: "V", volt: "V", volts: "V", vac: "V", vdc: "V",
  hz: "Hz", hertz: "Hz",
  w: "W", watt: "W", watts: "W",
  kva: "kVA", va: "VA", kw: "kW",
  ka: "kAIC", kaic: "kAIC",
  lm: "lm", lumen: "lm", lumens: "lm",
  k: "K", kelvin: "K",
  "lm/w": "lm/W",
  awg: "AWG",
  in: "in", '"': "in", inch: "in", inches: "in",
  mm: "mm", cm: "cm", m: "m", ft: "ft",
  "°c": "°C", c: "°C", "°f": "°F", f: "°F",
};

/** Map a raw unit token to its canonical symbol, or undefined when unrecognized. */
export function canonicalUnit(raw: string): string | undefined {
  return UNIT_ALIASES[raw.trim().toLowerCase()];
}

/** Normalize an attribute name for loose comparison: lowercase, strip non-alphanumerics. */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

// Build an alias → canonical index once. Aliases are normalized the same way names are.
const ALIAS_INDEX = new Map<string, CanonicalAttribute>();
for (const attr of ATTRIBUTE_TAXONOMY) {
  for (const alias of [attr.key, attr.label, ...attr.aliases]) {
    const norm = normalizeName(alias);
    if (norm && !ALIAS_INDEX.has(norm)) ALIAS_INDEX.set(norm, attr);
  }
}

/**
 * Resolve a raw attribute name to its canonical attribute, or null when unmapped.
 * Tries an exact normalized match first, then a token-contains match (so "rated current
 * (a)" resolves via the "current" alias) — guarded to a single unambiguous hit.
 */
export function resolveAttribute(rawName: string): CanonicalAttribute | null {
  const norm = normalizeName(rawName);
  if (!norm) return null;
  const exact = ALIAS_INDEX.get(norm);
  if (exact) return exact;
  // Token fallback: every alias word of some attribute appears in the name.
  const tokens = norm.split(" ").filter(Boolean);
  let hit: CanonicalAttribute | null = null;
  for (const [alias, attr] of ALIAS_INDEX) {
    const aliasTokens = alias.split(" ").filter((t) => t.length >= 3);
    if (aliasTokens.length === 0) continue;
    if (aliasTokens.every((t) => tokens.includes(t))) {
      if (hit && hit !== attr) return null; // ambiguous → unmapped (honest)
      hit = attr;
    }
  }
  return hit;
}
