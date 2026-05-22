// ── AutoBOM parser tests ───────────────────────────────────────────────────────
// Vitest unit tests for the deterministic scope-to-BOM parser.
// Run: npm test  (vitest run, config: lib/**/*.test.ts)

import { describe, it, expect } from "vitest";
import { parseScopeText } from "./autobom-parser";

// ── category detection ─────────────────────────────────────────────────────────

describe("category detection", () => {
  it("detects Circuit Breakers for 'breaker' keyword", () => {
    const { lines } = parseScopeText("20A single pole circuit breaker", "test");
    expect(lines[0]?.category).toBe("Circuit Breakers");
  });

  it("detects Panelboards for 'panelboard' keyword", () => {
    const { lines } = parseScopeText("100A 3-phase panelboard", "test");
    expect(lines[0]?.category).toBe("Panelboards");
  });

  it("detects Wire & Cable for THHN keyword", () => {
    const { lines } = parseScopeText("#12 AWG THHN wire, 500ft", "test");
    expect(lines[0]?.category).toBe("Wire & Cable");
  });

  it("detects Conduit for EMT keyword", () => {
    const { lines } = parseScopeText('3/4" EMT conduit, 100ft', "test");
    expect(lines[0]?.category).toBe("Conduit");
  });

  it("detects Lighting for high bay keyword", () => {
    const { lines } = parseScopeText("LED high bay fixtures, 200W", "test");
    expect(lines[0]?.category).toBe("Lighting");
  });

  it("detects Power Infrastructure for UPS keyword", () => {
    const { lines } = parseScopeText("10kVA online UPS, 208V", "test");
    expect(lines[0]?.category).toBe("Power Infrastructure");
  });

  it("detects Wiring Devices for GFCI keyword", () => {
    const { lines } = parseScopeText("20A GFCI receptacle", "test");
    expect(lines[0]?.category).toBe("Wiring Devices");
  });

  it("falls back to Uncategorized for generic text", () => {
    const { lines } = parseScopeText("Mounting hardware and miscellaneous fasteners", "test");
    expect(lines[0]?.category).toBe("Uncategorized");
  });
});

// ── quantity extraction ────────────────────────────────────────────────────────

describe("quantity extraction", () => {
  it("extracts quantity from parenthetical notation (20)", () => {
    const { lines } = parseScopeText("(20) 20A circuit breakers", "test");
    expect(lines[0]?.quantity).toBe(20);
  });

  it("extracts quantity from leading number '50 LED high bay'", () => {
    const { lines } = parseScopeText("50 LED high bay fixtures, 200W", "test");
    expect(lines[0]?.quantity).toBe(50);
  });

  it("extracts qty from body 'qty 8'", () => {
    const { lines } = parseScopeText("Emergency exit signs with battery backup, qty 8", "test");
    expect(lines[0]?.quantity).toBe(8);
  });

  it("converts linear feet to 10ft sticks for EMT conduit (200 LF → 20)", () => {
    const { lines } = parseScopeText('3/4" EMT conduit, 200 linear feet', "test");
    expect(lines[0]?.quantity).toBe(20);
    expect(lines[0]?.unit).toBe("EA");
  });

  it("converts 50ft EMT to 5 sticks", () => {
    const { lines } = parseScopeText('2" EMT conduit, 50ft total', "test");
    expect(lines[0]?.quantity).toBe(5);
  });

  it("returns null quantity for unquantified lines", () => {
    const { lines } = parseScopeText("Mounting hardware and fasteners", "test");
    expect(lines[0]?.quantity).toBeNull();
  });
});

// ── SKU matching ───────────────────────────────────────────────────────────────

describe("SKU matching", () => {
  it("suggests BR120 for 20A 1-pole breaker", () => {
    const { lines } = parseScopeText("(10) 20A 1-pole circuit breakers", "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("BR120");
  });

  it("suggests BR230 for 30A 2-pole breaker", () => {
    const { lines } = parseScopeText("(4) 30A 2-pole circuit breakers", "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("BR230");
  });

  it("suggests THHN-12-500 for #12 AWG THHN", () => {
    const { lines } = parseScopeText("#12 AWG THHN wire, 500ft spool", "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("THHN-12-500");
  });

  it("suggests THHN-10-500 for #10 AWG THHN", () => {
    const { lines } = parseScopeText("#10 AWG THHN wire, black, 500ft", "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("THHN-10-500");
  });

  it("suggests EMT-075-10 for 3/4\" EMT conduit", () => {
    const { lines } = parseScopeText('3/4" EMT conduit, 200 linear feet', "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("EMT-075-10");
  });

  it("suggests EMT-200-10 for 2\" EMT conduit", () => {
    const { lines } = parseScopeText('2" EMT conduit, 50ft total', "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("EMT-200-10");
  });

  it("suggests HBLED-200W-UNV for 200W high bay", () => {
    const { lines } = parseScopeText("(50) 200W LED high bay fixtures", "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("HBLED-200W-UNV");
  });

  it("falls back to generic HBLED-GEN-UNV when no wattage specified", () => {
    const { lines } = parseScopeText("LED high bay fixtures for warehouse", "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("HBLED-GEN-UNV");
  });

  it("suggests SRT10KXLT for 10kVA UPS", () => {
    const { lines } = parseScopeText("(1) 10kVA online double-conversion UPS, 208V", "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("SRT10KXLT");
  });

  it("suggests EXIT-LED-BB for exit signs", () => {
    const { lines } = parseScopeText("Emergency exit signs with battery backup, qty 8", "test");
    expect(lines[0]?.suggestedSku?.sku).toBe("EXIT-LED-BB");
  });

  it("returns null suggestedSku for unmatched generic line", () => {
    const { lines } = parseScopeText("Mounting hardware and miscellaneous fasteners", "test");
    expect(lines[0]?.suggestedSku).toBeNull();
  });
});

// ── confidence scoring ─────────────────────────────────────────────────────────

describe("confidence scoring", () => {
  it("gives high confidence (≥80) to fully specified breaker", () => {
    const { lines } = parseScopeText("(10) 30A 2-pole 240V circuit breakers", "test");
    expect(lines[0]?.confidence).toBeGreaterThanOrEqual(80);
    expect(lines[0]?.confidenceLevel).toBe("high");
  });

  it("gives low confidence (<60) to generic high bay with no wattage", () => {
    const { lines } = parseScopeText("LED high bay fixtures for warehouse", "test");
    expect(lines[0]?.confidence).toBeLessThan(60);
  });

  it("gives low confidence (<30) to fully unmatched line", () => {
    const { lines } = parseScopeText("Mounting hardware and fasteners", "test");
    expect(lines[0]?.confidence).toBeLessThan(30);
    expect(lines[0]?.confidenceLevel).toBe("unknown");
  });

  it("boosts confidence when quantity is provided", () => {
    const withQty    = parseScopeText("(20) 20A 1-pole circuit breakers", "test");
    const withoutQty = parseScopeText("20A 1-pole circuit breakers", "test");
    expect(withQty.lines[0]!.confidence).toBeGreaterThan(withoutQty.lines[0]!.confidence);
  });

  it("boosts confidence when manufacturer is named", () => {
    const withMfr    = parseScopeText("(5) Eaton BR120 20A 1-pole circuit breakers", "test");
    const withoutMfr = parseScopeText("(5) 20A 1-pole circuit breakers", "test");
    expect(withMfr.lines[0]!.confidence).toBeGreaterThanOrEqual(withoutMfr.lines[0]!.confidence);
  });
});

// ── missing info detection ─────────────────────────────────────────────────────

describe("missing info detection", () => {
  it("flags missing NEMA rating for panelboard", () => {
    const { lines } = parseScopeText("100A 3-phase panelboard, 30 circuits", "test");
    const missing = lines[0]?.missingInfo ?? [];
    expect(missing.some((m) => /NEMA/i.test(m))).toBe(true);
  });

  it("flags missing panel family for circuit breakers", () => {
    const { lines } = parseScopeText("(10) 20A 1-pole circuit breakers", "test");
    const missing = lines[0]?.missingInfo ?? [];
    expect(missing.some((m) => /panel family/i.test(m))).toBe(true);
  });

  it("flags missing wattage for generic high bay", () => {
    const { lines } = parseScopeText("LED high bay fixtures, qty 50", "test");
    const missing = lines[0]?.missingInfo ?? [];
    expect(missing.some((m) => /wattage/i.test(m))).toBe(true);
  });

  it("no missing info for fully specified C13-C14 cord", () => {
    const { lines } = parseScopeText("(20) C13 to C14 power cords, 6ft", "test");
    expect(lines[0]?.missingInfo.length).toBe(0);
  });

  it("flags dimmer for missing amperage and load type", () => {
    const { lines } = parseScopeText("(4) dimmer switches for office zones", "test");
    const missing = lines[0]?.missingInfo ?? [];
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.some((m) => /LED|dimmer|amper|watt/i.test(m))).toBe(true);
  });
});

// ── status assignment ─────────────────────────────────────────────────────────

describe("initial status assignment", () => {
  it("assigns 'pending' to high-confidence matched lines", () => {
    const { lines } = parseScopeText("(20) C13 to C14 power cords, 6ft", "test");
    expect(lines[0]?.status).toBe("pending");
  });

  it("assigns 'flagged' to lines with no SKU match", () => {
    const { lines } = parseScopeText("Mounting hardware and miscellaneous fasteners", "test");
    expect(lines[0]?.status).toBe("flagged");
  });
});

// ── multi-line scope integration ───────────────────────────────────────────────

describe("sample scope: electrical panel install", () => {
  const scope = [
    "100A, 3-phase panelboard, 240/120V, 30-circuit spaces",
    "(20) 20A single-pole circuit breakers",
    "(4) 30A 2-pole circuit breakers",
    '3/4" EMT conduit, 200 linear feet',
    "#12 AWG THHN wire, 4 colors, 500ft each",
    "#10 AWG THHN wire, black, 1 spool 500ft",
  ].join("\n");

  it("extracts the correct number of lines", () => {
    const { lines } = parseScopeText(scope, "Panel Install");
    expect(lines.length).toBe(6);
  });

  it("correctly categorises each line", () => {
    const { lines } = parseScopeText(scope, "Panel Install");
    const cats = lines.map((l) => l.category);
    expect(cats[0]).toBe("Panelboards");
    expect(cats[1]).toBe("Circuit Breakers");
    expect(cats[2]).toBe("Circuit Breakers");
    expect(cats[3]).toBe("Conduit");
    expect(cats[4]).toBe("Wire & Cable");
    expect(cats[5]).toBe("Wire & Cable");
  });

  it("suggests SKUs for at least 4 of 6 lines", () => {
    const { lines } = parseScopeText(scope, "Panel Install");
    const withSku = lines.filter((l) => l.suggestedSku !== null);
    expect(withSku.length).toBeGreaterThanOrEqual(4);
  });

  it("converts 200 LF conduit to 20 sticks", () => {
    const { lines } = parseScopeText(scope, "Panel Install");
    const conduit = lines.find((l) => l.category === "Conduit");
    expect(conduit?.quantity).toBe(20);
  });
});

describe("sample scope: warehouse lighting retrofit", () => {
  const scope = [
    "(50) LED high bay fixtures — 200W, suitable for 30ft ceiling",
    "Emergency exit signs with battery backup, qty 8",
    "Occupancy sensors for warehouse aisles, 360-degree coverage, qty 12",
    "(4) dimmer switches for office transition zones",
  ].join("\n");

  it("extracts 4 lines", () => {
    const { lines } = parseScopeText(scope, "Lighting Retrofit");
    expect(lines.length).toBe(4);
  });

  it("matches specific 200W high bay with high confidence", () => {
    const { lines } = parseScopeText(scope, "Lighting Retrofit");
    const hb = lines[0]!;
    expect(hb.suggestedSku?.sku).toBe("HBLED-200W-UNV");
    expect(hb.confidence).toBeGreaterThan(75);
  });

  it("flags dimmer switch as needing more info", () => {
    const { lines } = parseScopeText(scope, "Lighting Retrofit");
    const dimmer = lines[3]!;
    expect(dimmer.missingInfo.length).toBeGreaterThan(0);
  });
});

describe("sample scope: data center power", () => {
  const scope = [
    "400A, 480V, 3-phase main distribution panelboard — NEMA 1",
    "(2) 200A 3-pole 480V circuit breakers for downstream distribution",
    "(1) 200A metered rack PDU, 30A L6-30R receptacles, 12 outlets, 208V",
    "#2 AWG THHN, 4-conductor set, 100ft per run, qty 2 runs",
    '2" EMT conduit, 50ft total',
    "(1) 10kVA online double-conversion UPS, 208V output",
    "(20) C13 to C14 power cords, 6ft",
  ].join("\n");

  it("extracts 7 lines", () => {
    const { lines } = parseScopeText(scope, "DC Power");
    expect(lines.length).toBe(7);
  });

  it("matches C13 to C14 cord with high confidence (≥85)", () => {
    const { lines } = parseScopeText(scope, "DC Power");
    const cord = lines[6]!;
    expect(cord.suggestedSku?.sku).toBe("APC-AP9870");
    expect(cord.confidence).toBeGreaterThanOrEqual(85);
  });

  it("converts 50ft 2\" EMT to 5 sticks", () => {
    const { lines } = parseScopeText(scope, "DC Power");
    const conduit = lines.find((l) => l.category === "Conduit");
    expect(conduit?.quantity).toBe(5);
    expect(conduit?.suggestedSku?.sku).toBe("EMT-200-10");
  });

  it("suggests UPS with lead-time availability", () => {
    const { lines } = parseScopeText(scope, "DC Power");
    const ups = lines.find((l) => /UPS/i.test(l.rawText));
    expect(ups?.suggestedSku?.availability).toBe("lead-time");
  });

  it("has no null-SKU lines (all match something)", () => {
    const { lines } = parseScopeText(scope, "DC Power");
    const nullSku = lines.filter((l) => l.suggestedSku === null);
    expect(nullSku.length).toBe(0);
  });
});

// ── BomExtraction metadata ─────────────────────────────────────────────────────

describe("BomExtraction metadata", () => {
  it("sets parserVersion to stub-v1", () => {
    const result = parseScopeText("(5) 20A 1-pole circuit breakers", "test");
    expect(result.parserVersion).toBe("stub-v1");
  });

  it("preserves the original sourceText", () => {
    const src = "(5) 20A 1-pole circuit breakers";
    const result = parseScopeText(src, "test");
    expect(result.sourceText).toBe(src);
  });

  it("sets projectName correctly", () => {
    const result = parseScopeText("(5) 20A 1-pole circuit breakers", "My Project");
    expect(result.projectName).toBe("My Project");
  });

  it("skips blank lines in source text", () => {
    const src = "\n(5) 20A 1-pole circuit breakers\n\n#12 AWG THHN wire\n";
    const { lines } = parseScopeText(src, "test");
    expect(lines.length).toBe(2);
  });

  it("assigns sequential line numbers starting from 1", () => {
    const src = ["(5) 20A breakers", "#12 THHN wire", '3/4" EMT conduit, 100ft'].join("\n");
    const { lines } = parseScopeText(src, "test");
    expect(lines.map((l) => l.lineNumber)).toEqual([1, 2, 3]);
  });
});
