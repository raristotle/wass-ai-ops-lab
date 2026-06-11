import { describe, it, expect } from "vitest";
import { TAXONOMY, CATEGORIES, ALL_SUBCATEGORIES } from "@/lib/catalog/taxonomy";
import {
  GLYPH_IDS,
  SUBCATEGORY_GLYPH,
  CATEGORY_GLYPH,
  glyphIdFor,
} from "@/lib/product-finder-glyph-map";

describe("GLYPH_IDS", () => {
  it("has exactly 79 ids", () => {
    expect(GLYPH_IDS.length).toBe(79);
  });

  it("has no duplicate ids", () => {
    expect(new Set(GLYPH_IDS).size).toBe(GLYPH_IDS.length);
  });
});

describe("SUBCATEGORY_GLYPH", () => {
  it("covers all 79 taxonomy subcategories", () => {
    expect(ALL_SUBCATEGORIES.length).toBe(79);
    for (const sub of ALL_SUBCATEGORIES) {
      expect(SUBCATEGORY_GLYPH[sub], `missing glyph for "${sub}"`).toBeDefined();
    }
    expect(Object.keys(SUBCATEGORY_GLYPH).length).toBe(79);
  });

  it("assigns a distinct glyph to every subcategory (79 unique values)", () => {
    const values = Object.values(SUBCATEGORY_GLYPH);
    expect(new Set(values).size).toBe(79);
  });
  it("has an explicit glyph for every taxonomy subcategory", () => {
    for (const category of CATEGORIES) {
      for (const sub of TAXONOMY[category]) {
        expect(SUBCATEGORY_GLYPH[sub.name], `missing glyph for "${sub.name}"`).toBeDefined();
      }
    }
  });

  it("only references glyph IDs that exist in the vocabulary", () => {
    const ids = new Set<string>(GLYPH_IDS);
    for (const [sub, glyph] of Object.entries(SUBCATEGORY_GLYPH)) {
      expect(ids.has(glyph), `"${sub}" → unknown glyph "${glyph}"`).toBe(true);
    }
  });

  it("has no stale entries for subcategories not in the taxonomy", () => {
    const known = new Set(CATEGORIES.flatMap((c) => TAXONOMY[c].map((s) => s.name)));
    for (const sub of Object.keys(SUBCATEGORY_GLYPH)) {
      expect(known.has(sub), `stale glyph entry "${sub}"`).toBe(true);
    }
  });

  it("keepers retained their original glyph", () => {
    const keepers: Record<string, string> = {
      "Receptacles & Outlets": "outlet",
      "Lamps & Tubes": "bulb",
      "Panelboards": "panel",
      "Conduit": "conduit",
      "Boxes & Covers": "box",
      "Cable Tray": "tray",
      "Terminal Blocks": "terminal",
      "Relays": "relay",
      "Occupancy & Vacancy Sensors": "sensor",
      "Cord Plugs & Connectors": "plug",
      "LED Troffers & Panels": "troffer",
      "High Bay Fixtures": "highbay",
      "Drivers & Ballasts": "driver",
      "Ethernet Cable": "ethernet",
      "Patch Panels": "patchpanel",
      "Racks & Cabinets": "rack",
      "Displays": "display",
      "Speakers": "speaker",
      "Wire & Cable": "cable",
      "Access Control": "access",
    };
    for (const [sub, glyph] of Object.entries(keepers)) {
      expect(SUBCATEGORY_GLYPH[sub], sub).toBe(glyph);
    }
  });

  it("former sharers now map to their dedicated new glyphs", () => {
    const remapped: Record<string, string> = {
      "Wiring Devices": "wiringdevice",
      "Combination Devices": "combodevice",
      "Lighting Accessories": "lampholder",
      "Load Centers": "loadcenter",
      "Alarm Panels": "alarmpanel",
      "Conduit Fittings": "fitting",
      "Flexible Conduit & Liquidtight": "flexconduit",
      "Enclosures": "enclosure",
      "Strut & Channel": "strut",
      "Lugs & Wire Connectors": "lug",
      "Contactors": "contactor",
      "Photo Controls": "photocell",
      "Intrusion Sensors": "intrusion",
      "Sensors & Proximity Switches": "proximity",
      "Industrial Plugs & Receptacles": "indplug",
      "Strip & Wrap Fixtures": "stripfixture",
      "Outdoor & Area Lighting": "arealight",
      "Power Supplies": "powersupply",
      "Connectivity": "keystone",
      "Network Switches": "netswitch",
      "NVRs": "nvr",
      "Video Conferencing": "videoconf",
      "Amplifiers & DSP": "amplifier",
      "Security Cable & Power Supplies": "seccable",
      "Intercom & Entry Systems": "intercom",
    };
    for (const [sub, glyph] of Object.entries(remapped)) {
      expect(SUBCATEGORY_GLYPH[sub], sub).toBe(glyph);
    }
  });
});

describe("glyphIdFor", () => {
  it("resolves a mapped subcategory", () => {
    expect(glyphIdFor("Circuit Breakers", "electrical")).toBe("breaker");
  });

  it("falls back to the category glyph for unknown subcategories", () => {
    for (const category of CATEGORIES) {
      expect(glyphIdFor("Not A Real Subcategory", category)).toBe(CATEGORY_GLYPH[category]);
    }
  });
});
