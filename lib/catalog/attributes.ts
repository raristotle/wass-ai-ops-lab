/**
 * Numeric attribute parsing for range facets.
 *
 * NUMERIC_SPECS: allow-list of spec names that carry a numeric measurement.
 * parseAttribute: extracts the leading numeric value from a spec string value.
 * Both are pure/deterministic — no Date.now or Math.random.
 */

export interface NumericSpecMeta {
  unit: string;
}

export const NUMERIC_SPECS: Record<string, NumericSpecMeta> = {
  Amperage: { unit: "A" },
  Voltage: { unit: "V" },
  Wattage: { unit: "W" },
  Lumens: { unit: "lm" },
  Gauge: { unit: "AWG" },
  kVA: { unit: "kVA" },
  Ports: { unit: "ports" },
  CCT: { unit: "K" },
  Height: { unit: "U" },
  // Additional numeric specs found in taxonomy
  "Output Current": { unit: "A" },
  "Main Rating": { unit: "A" },
};

/**
 * Parse a spec value for a known numeric spec name.
 *
 * Returns `{ numeric, unit }` when the spec name is in NUMERIC_SPECS and a
 * leading number can be extracted from the value string; otherwise null.
 *
 * Examples:
 *   parseAttribute("Amperage", "15A")         → { numeric: 15,   unit: "A"   }
 *   parseAttribute("Voltage",  "120/240V")    → { numeric: 120,  unit: "V"   }  (first number)
 *   parseAttribute("Lumens",   "1000 lm")     → { numeric: 1000, unit: "lm"  }
 *   parseAttribute("Gauge",    "12 AWG")      → { numeric: 12,   unit: "AWG" }
 *   parseAttribute("Ports",    "24-Port")     → { numeric: 24,   unit: "ports" }
 *   parseAttribute("CCT",      "4000K")       → { numeric: 4000, unit: "K"   }
 *   parseAttribute("Height",   "42U")         → { numeric: 42,   unit: "U"   }
 *   parseAttribute("kVA",      "15 kVA")      → { numeric: 15,   unit: "kVA" }
 *   parseAttribute("Color",    "Red")         → null  (not in NUMERIC_SPECS)
 *   parseAttribute("Voltage",  "no-number")   → null  (no parseable number)
 */
export function parseAttribute(
  specName: string,
  value: string,
): { numeric: number; unit: string } | null {
  const meta = NUMERIC_SPECS[specName];
  if (!meta) return null;

  // Extract the first integer or decimal number from the value string.
  // Handles: "15A", "120/240V", "1000 lm", "12 AWG", "24-Port", "4000K", "42U",
  //          "15 kVA", "112.5 kVA", "30000 lm", etc.
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const numeric = parseFloat(match[1]);
  if (!Number.isFinite(numeric)) return null;

  return { numeric, unit: meta.unit };
}
