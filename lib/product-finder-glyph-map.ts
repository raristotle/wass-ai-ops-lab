import type { ProductCategory } from "@/features/product-finder/types";

// ─── Glyph vocabulary ─────────────────────────────────────────────────────────
// Each ID names a hand-drawn 48×48 line-art glyph in
// features/product-finder/glyphs.tsx (Record<GlyphId, …> enforces completeness).

export const GLYPH_IDS = [
  "breaker", "cable", "conduit", "outlet", "switch", "wallplate", "plug",
  "bulb", "panel", "transformer", "disconnect", "fuse", "meter", "surge",
  "generator", "box", "tray", "ground", "terminal", "motor", "relay",
  "timer", "sensor", "dimmer", "ev", "troffer", "highbay", "downlight",
  "driver", "exit", "ethernet", "patchpanel", "rack", "fiber", "wifi",
  "ups", "pushbutton", "plc", "display", "projector", "speaker", "extender",
  "mic", "mount", "camera", "access", "hardhat", "glasses", "glove", "vest",
  "harness", "earmuff", "respirator", "lockout",
  "wiringdevice", "combodevice", "lampholder", "loadcenter", "alarmpanel",
  "fitting", "flexconduit", "enclosure", "strut", "lug", "contactor",
  "photocell", "intrusion", "proximity", "indplug", "stripfixture",
  "arealight", "powersupply", "keystone", "netswitch", "nvr", "videoconf",
  "amplifier", "seccable", "intercom",
] as const;

export type GlyphId = (typeof GLYPH_IDS)[number];

// ─── Subcategory → glyph ──────────────────────────────────────────────────────
// Keys must exactly match subcategory names in lib/catalog/taxonomy.ts.
// Every subcategory has its OWN glyph — all 79 values are pairwise distinct.

export const SUBCATEGORY_GLYPH: Record<string, GlyphId> = {
  // electrical — distribution & devices
  "Circuit Breakers":               "breaker",
  "Wire & Cable":                   "cable",
  "Conduit":                        "conduit",
  "Wiring Devices":                 "wiringdevice",
  "Receptacles & Outlets":          "outlet",
  "Switches":                       "switch",
  "Wall Plates & Covers":           "wallplate",
  "Cord Plugs & Connectors":        "plug",
  "Combination Devices":            "combodevice",
  "Lighting Accessories":           "lampholder",
  "Load Centers":                   "loadcenter",
  "Panelboards":                    "panel",
  "Dry-Type Transformers":          "transformer",
  "Safety Switches & Disconnects":  "disconnect",
  "Fuses":                          "fuse",
  "Meter Sockets":                  "meter",
  "Surge Protective Devices":       "surge",
  "Generators & Transfer Switches": "generator",
  "Conduit Fittings":               "fitting",
  "Boxes & Covers":                 "box",
  "Enclosures":                     "enclosure",
  "Flexible Conduit & Liquidtight": "flexconduit",
  "Cable Tray":                     "tray",
  "Strut & Channel":                "strut",
  "Grounding & Bonding":            "ground",
  "Lugs & Wire Connectors":         "lug",
  "Motor Starters & Controls":      "motor",
  "Contactors":                     "contactor",
  "Timers & Time Switches":         "timer",
  "Photo Controls":                 "photocell",
  "Occupancy & Vacancy Sensors":    "sensor",
  "Dimmers & Lighting Controls":    "dimmer",
  "EV Charging Stations":           "ev",
  "Industrial Plugs & Receptacles": "indplug",
  // electrical — lighting
  "LED Troffers & Panels":          "troffer",
  "High Bay Fixtures":              "highbay",
  "Strip & Wrap Fixtures":          "stripfixture",
  "LED Downlights":                 "downlight",
  "Lamps & Tubes":                  "bulb",
  "Drivers & Ballasts":             "driver",
  "Exit & Emergency Lighting":      "exit",
  "Outdoor & Area Lighting":        "arealight",
  // datacom
  "Ethernet Cable":                 "ethernet",
  "Patch Panels":                   "patchpanel",
  "Network Switches":               "netswitch",
  "Racks & Cabinets":               "rack",
  "Fiber Optic Cable":              "fiber",
  "Wireless Access Points":         "wifi",
  "UPS & Power Protection":         "ups",
  "Connectivity":                   "keystone",
  // oem-electrical
  "Relays":                         "relay",
  "Terminal Blocks":                "terminal",
  "Power Supplies":                 "powersupply",
  "Push Buttons":                   "pushbutton",
  "PLCs & I/O Modules":             "plc",
  "Sensors & Proximity Switches":   "proximity",
  // av
  "Displays":                       "display",
  "Projectors":                     "projector",
  "Speakers":                       "speaker",
  "Signal Extenders":               "extender",
  "Microphones & Audio Capture":    "mic",
  "Display & Projector Mounts":     "mount",
  "Video Conferencing":             "videoconf",
  "Amplifiers & DSP":               "amplifier",
  // security
  "IP Cameras":                     "camera",
  "Access Control":                 "access",
  "NVRs":                           "nvr",
  "Intrusion Sensors":              "intrusion",
  "Alarm Panels":                   "alarmpanel",
  "Intercom & Entry Systems":       "intercom",
  "Security Cable & Power Supplies":"seccable",
  // safety
  "Hard Hats":                      "hardhat",
  "Safety Glasses":                 "glasses",
  "Gloves":                         "glove",
  "Hi-Vis Apparel":                 "vest",
  "Fall Protection":                "harness",
  "Hearing Protection":             "earmuff",
  "Respiratory Protection":         "respirator",
  "Lockout/Tagout":                 "lockout",
};

// ─── Category-level fallback ──────────────────────────────────────────────────

export const CATEGORY_GLYPH: Record<ProductCategory, GlyphId> = {
  electrical:       "breaker",
  datacom:          "ethernet",
  "oem-electrical": "relay",
  av:               "display",
  security:         "camera",
  safety:           "hardhat",
};

/** Resolve the glyph for a product: subcategory match → category fallback. */
export function glyphIdFor(subcategory: string, category: ProductCategory): GlyphId {
  return SUBCATEGORY_GLYPH[subcategory] ?? CATEGORY_GLYPH[category] ?? "box";
}
