// ── AutoBOM — sample scopes & pre-parsed mock extractions ─────────────────────
// Three realistic OFCI/electrical scope texts with deterministic mock BOM lines.
// These allow the review UI to render without running the live parser.

import type { BomExtraction, BomLine, BomSku } from "@/lib/autobom";

// ── shared SKU stubs ───────────────────────────────────────────────────────────

const SKU = {
  BR120:      { sku: "BR120",           description: "20A 1-Pole 120V Plug-On Circuit Breaker",                         manufacturer: "Eaton",               unitPrice: 8.50,    availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  QO120:      { sku: "QO120",           description: "20A 1-Pole 120V QO Circuit Breaker",                              manufacturer: "Schneider Electric",  unitPrice: 9.25,    availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  B120:       { sku: "B120",            description: "20A 1-Pole 120V Standard Circuit Breaker",                        manufacturer: "Siemens",             unitPrice: 7.80,    availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,

  BR230:      { sku: "BR230",           description: "30A 2-Pole 240V Plug-On Circuit Breaker",                         manufacturer: "Eaton",               unitPrice: 14.75,   availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  QO230:      { sku: "QO230",           description: "30A 2-Pole 240V QO Circuit Breaker",                              manufacturer: "Schneider Electric",  unitPrice: 15.90,   availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  Q2200:      { sku: "Q2200",           description: "200A 2-Pole 240V QO Circuit Breaker",                             manufacturer: "Schneider Electric",  unitPrice: 189.00,  availability: "limited",   unitOfMeasure: "EA" } satisfies BomSku,

  PRL1A100:   { sku: "PRL1A3100G",      description: "100A 3-Phase 4W 30-Circuit Main Lug Panelboard",                  manufacturer: "Eaton",               unitPrice: 425.00,  availability: "limited",   unitOfMeasure: "EA" } satisfies BomSku,
  HOM130L:    { sku: "HOM130L30PGC",    description: "100A 3-Phase 4W 30-Circuit Homeline Panelboard",                  manufacturer: "Schneider Electric",  unitPrice: 398.00,  availability: "limited",   unitOfMeasure: "EA" } satisfies BomSku,
  P400A3PH:   { sku: "P1E42M400ATS",    description: "400A 3-Phase 42-Space Main Breaker Panelboard",                   manufacturer: "Eaton",               unitPrice: 1250.00, availability: "lead-time", unitOfMeasure: "EA", leadTimeDays: 21 } satisfies BomSku,
  SQMB400:    { sku: "I-LINE-400",      description: "400A 3-Phase I-Line Main Breaker Panelboard",                     manufacturer: "Schneider Electric",  unitPrice: 1380.00, availability: "lead-time", unitOfMeasure: "EA", leadTimeDays: 28 } satisfies BomSku,

  EMT075:     { sku: "EMT-075-10",      description: '3/4" EMT Conduit 10ft Stick',                                     manufacturer: "Allied Tube",         unitPrice: 6.85,    availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  EMT100:     { sku: "EMT-100-10",      description: '1" EMT Conduit 10ft Stick',                                       manufacturer: "Allied Tube",         unitPrice: 9.50,    availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  EMT150:     { sku: "EMT-150-10",      description: '1-1/2" EMT Conduit 10ft Stick',                                   manufacturer: "Allied Tube",         unitPrice: 15.20,   availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  EMT200:     { sku: "EMT-200-10",      description: '2" EMT Conduit 10ft Stick',                                       manufacturer: "Allied Tube",         unitPrice: 22.40,   availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,

  THHN12:     { sku: "THHN-12-500",     description: "#12 AWG THHN/THWN-2 Copper Wire, 500ft Spool",                   manufacturer: "Southwire",           unitPrice: 89.00,   availability: "in-stock",  unitOfMeasure: "SPOOL" } satisfies BomSku,
  THHN10:     { sku: "THHN-10-500",     description: "#10 AWG THHN/THWN-2 Copper Wire, 500ft Spool",                   manufacturer: "Southwire",           unitPrice: 135.00,  availability: "in-stock",  unitOfMeasure: "SPOOL" } satisfies BomSku,
  THHN2:      { sku: "THHN-2-500",      description: "#2 AWG THHN/THWN-2 Copper Wire, 500ft Spool",                    manufacturer: "Southwire",           unitPrice: 389.00,  availability: "limited",   unitOfMeasure: "SPOOL" } satisfies BomSku,
  THHN4_0:    { sku: "THHN-4/0-250",    description: "#4/0 AWG THHN/THWN-2 Copper Wire, 250ft Spool",                  manufacturer: "Southwire",           unitPrice: 1125.00, availability: "limited",   unitOfMeasure: "SPOOL" } satisfies BomSku,

  HBLED200:   { sku: "HBLED-200W-UNV",  description: "200W LED High Bay Fixture, 120-277V, 5000K, 28000lm",             manufacturer: "Lithonia Lighting",   unitPrice: 189.00,  availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  HBLED150:   { sku: "HBLED-150W-UNV",  description: "150W LED High Bay Fixture, 120-277V, 5000K, 20000lm",             manufacturer: "Lithonia Lighting",   unitPrice: 155.00,  availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  HBLED240:   { sku: "HBLED-240W-UNV",  description: "240W LED High Bay Fixture, 120-277V, 5000K, 33600lm",             manufacturer: "Cree Lighting",       unitPrice: 215.00,  availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  EXITSIGN:   { sku: "EXIT-LED-BB",     description: "LED Exit Sign, Battery Backup, Single/Double Face",               manufacturer: "Lithonia Lighting",   unitPrice: 45.00,   availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  MOTION360:  { sku: "MS-OPS5M-WH",     description: "360° Passive Infrared Occupancy Sensor, 120-277V",               manufacturer: "Leviton",             unitPrice: 28.50,   availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,

  UPS10KVA:   { sku: "SRT10KXLT",       description: "10kVA Smart-UPS SRT Online Double-Conversion, 208V",              manufacturer: "APC by Schneider",    unitPrice: 4850.00, availability: "lead-time", unitOfMeasure: "EA", leadTimeDays: 14 } satisfies BomSku,
  UPS10GXT:   { sku: "GXT5-10000RT208", description: "10kVA Liebert GXT5 Online UPS, 208V, 10U Rack",                  manufacturer: "Vertiv",              unitPrice: 5125.00, availability: "lead-time", unitOfMeasure: "EA", leadTimeDays: 21 } satisfies BomSku,
  PDU200:     { sku: "AP7900B",         description: "Metered PDU, 200A, 30A L6-30R ×12 Outlets, 208V",                manufacturer: "APC by Schneider",    unitPrice: 1250.00, availability: "limited",   unitOfMeasure: "EA" } satisfies BomSku,
  GBUS:       { sku: "GGB-4/0-12",      description: "Ground Bus Bar, 4/0 AWG Cable, 12-Port",                          manufacturer: "Panduit",             unitPrice: 89.00,   availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
  C13C14_6FT: { sku: "APC-AP9870",      description: "C13 to C14 PDU Power Cord, 6ft, 15A, 250V",                      manufacturer: "APC by Schneider",    unitPrice: 7.25,    availability: "in-stock",  unitOfMeasure: "EA" } satisfies BomSku,
};

// ── helper ─────────────────────────────────────────────────────────────────────

let _seq = 0;
function lid(): string { return `BL-${String(++_seq).padStart(4, "0")}`; }

// ── Scope A — electrical rough-in ─────────────────────────────────────────────

export const SCOPE_A_TEXT = `\
100A, 3-phase, 4-wire panelboard, 240/120V, 30-circuit spaces
(20) 20A single-pole circuit breakers
(4) 30A 2-pole circuit breakers for HVAC disconnects
3/4" EMT conduit — 200 linear feet with fittings
#12 AWG THHN wire, 4 colors (B/W/R/G), 500ft each
#10 AWG THHN wire, black, 1 spool 500ft
Mounting hardware and miscellaneous fasteners`;

const SCOPE_A_LINES: BomLine[] = [
  {
    id: lid(), lineNumber: 1,
    rawText:      "100A, 3-phase, 4-wire panelboard, 240/120V, 30-circuit spaces",
    parsedIntent: "100A 3-phase panelboard with 30 circuit spaces, 240/120V",
    category:     "Panelboards",
    quantity: 1, unit: "EA",
    suggestedSku:    SKU.PRL1A100,
    confidence: 77, confidenceLevel: "medium",
    confidenceReasons: ["Amperage and phase specified (+20)", "Circuit count specified (+10)", "Voltage specified (+10)", "Missing: NEMA rating, mounting type (-23)"],
    alternates:  [SKU.HOM130L],
    missingInfo: ["NEMA enclosure rating (NEMA 1 vs 3R)", "Surface vs flush mount", "Main lug vs main breaker"],
    status: "pending", tags: ["electrical", "css"],
  },
  {
    id: lid(), lineNumber: 2,
    rawText:      "(20) 20A single-pole circuit breakers",
    parsedIntent: "20A 1-pole 120V circuit breakers, qty 20",
    category:     "Circuit Breakers",
    quantity: 20, unit: "EA",
    suggestedSku:    SKU.BR120,
    confidence: 86, confidenceLevel: "high",
    confidenceReasons: ["Amperage specified (+20)", "Pole count specified (+15)", "Quantity specified (+10)", "Missing: panel family (-19)"],
    alternates:  [SKU.QO120, SKU.B120],
    missingInfo: ["Panel family (Eaton BR, Square D QO, Siemens) — match to panelboard in Line 1"],
    status: "pending", tags: ["electrical"],
  },
  {
    id: lid(), lineNumber: 3,
    rawText:      "(4) 30A 2-pole circuit breakers for HVAC disconnects",
    parsedIntent: "30A 2-pole 240V circuit breakers, qty 4, HVAC application",
    category:     "Circuit Breakers",
    quantity: 4, unit: "EA",
    suggestedSku:    SKU.BR230,
    confidence: 88, confidenceLevel: "high",
    confidenceReasons: ["Amperage specified (+20)", "Pole count specified (+15)", "Quantity specified (+10)", "Application context noted (+5)"],
    alternates:  [SKU.QO230],
    missingInfo: ["Confirm HACR rating required for HVAC loads"],
    status: "pending", tags: ["electrical", "hvac"],
  },
  {
    id: lid(), lineNumber: 4,
    rawText:      '3/4" EMT conduit — 200 linear feet with fittings',
    parsedIntent: '3/4" EMT conduit, 200 LF (= 20 sticks of 10ft)',
    category:     "Conduit",
    quantity: 20, unit: "EA",
    suggestedSku:    SKU.EMT075,
    confidence: 91, confidenceLevel: "high",
    confidenceReasons: ["Trade size specified (+25)", "Linear footage → stick count calculated (+10)", "EMT type confirmed (+10)"],
    alternates:  [SKU.EMT100],
    missingInfo: ["Confirm fittings scope: couplings, connectors, and LBs to be quoted separately"],
    status: "pending", tags: ["electrical"],
  },
  {
    id: lid(), lineNumber: 5,
    rawText:      "#12 AWG THHN wire, 4 colors (B/W/R/G), 500ft each",
    parsedIntent: "#12 AWG THHN wire, 4 spools × 500ft (2,000ft total)",
    category:     "Wire & Cable",
    quantity: 4, unit: "SPOOL",
    suggestedSku:    SKU.THHN12,
    confidence: 90, confidenceLevel: "high",
    confidenceReasons: ["Gauge specified (#12 AWG) (+25)", "Insulation type specified (THHN) (+15)", "Color count and footage specified (+10)"],
    alternates:  [],
    missingInfo: [],
    status: "pending", tags: ["electrical"],
  },
  {
    id: lid(), lineNumber: 6,
    rawText:      "#10 AWG THHN wire, black, 1 spool 500ft",
    parsedIntent: "#10 AWG THHN wire, black, 500ft spool",
    category:     "Wire & Cable",
    quantity: 1, unit: "SPOOL",
    suggestedSku:    SKU.THHN10,
    confidence: 92, confidenceLevel: "high",
    confidenceReasons: ["Gauge specified (#10 AWG) (+25)", "Insulation type specified (+15)", "Quantity and footage specified (+12)"],
    alternates:  [],
    missingInfo: [],
    status: "pending", tags: ["electrical"],
  },
  {
    id: lid(), lineNumber: 7,
    rawText:      "Mounting hardware and miscellaneous fasteners",
    parsedIntent: "Miscellaneous mounting hardware — no specific SKU match",
    category:     "Uncategorized",
    quantity: null, unit: null,
    suggestedSku:    null,
    confidence: 15, confidenceLevel: "unknown",
    confidenceReasons: ["No specific product or specification mentioned (0)", "Generic description — manual selection required (-85)"],
    alternates:  [],
    missingInfo: ["Item type (strut, beam clamps, threaded rod, anchors?)", "Quantity estimate", "Material spec (steel, stainless, zinc)"],
    status: "flagged", tags: [],
  },
];

export const MOCK_EXTRACTION_A: BomExtraction = {
  id: "BOM-A-001",
  projectName: "Northgate Medical HPC — Electrical Rough-In",
  sourceText:  SCOPE_A_TEXT,
  lines:       SCOPE_A_LINES,
  extractedAt: "2026-05-22T08:00:00Z",
  parserVersion: "mock-v0",
};

// ── Scope B — warehouse lighting retrofit ──────────────────────────────────────

export const SCOPE_B_TEXT = `\
Replace all existing HID fixtures with LED equivalents
(50) LED high bay fixtures — 200W, suitable for 30ft ceiling height
Emergency exit signs with battery backup, qty 8
Occupancy sensors for main warehouse aisles, 360-degree coverage, qty 12
(4) dimmer switches for office transition zones
Electrical connections and whips for each fixture`;

const SCOPE_B_LINES: BomLine[] = [
  {
    id: lid(), lineNumber: 1,
    rawText:      "Replace all existing HID fixtures with LED equivalents",
    parsedIntent: "Retrofit HID (metal halide / high-pressure sodium) with LED — generic directive, not a material line",
    category:     "Uncategorized",
    quantity: null, unit: null,
    suggestedSku:    null,
    confidence: 20, confidenceLevel: "unknown",
    confidenceReasons: ["Scope instruction, not a specific material line (0)", "No quantity or specification (-80)"],
    alternates:  [],
    missingInfo: ["Specific fixture model/wattage", "Quantity", "Mounting style (pendant, surface, hook)"],
    status: "flagged", tags: ["lighting"],
  },
  {
    id: lid(), lineNumber: 2,
    rawText:      "(50) LED high bay fixtures — 200W, suitable for 30ft ceiling height",
    parsedIntent: "200W LED high bay fixture, qty 50, commercial warehouse",
    category:     "Lighting",
    quantity: 50, unit: "EA",
    suggestedSku:    SKU.HBLED200,
    confidence: 85, confidenceLevel: "high",
    confidenceReasons: ["Quantity specified (+15)", "Wattage specified 200W (+20)", "Fixture type (high bay) (+15)", "Application height noted (+5)"],
    alternates:  [SKU.HBLED240, SKU.HBLED150],
    missingInfo: ["Confirm color temperature (5000K default)", "Mounting type (hook vs. aircraft cable vs. rigid)"],
    status: "pending", tags: ["lighting"],
  },
  {
    id: lid(), lineNumber: 3,
    rawText:      "Emergency exit signs with battery backup, qty 8",
    parsedIntent: "LED exit sign with integrated battery backup, qty 8",
    category:     "Lighting",
    quantity: 8, unit: "EA",
    suggestedSku:    SKU.EXITSIGN,
    confidence: 82, confidenceLevel: "high",
    confidenceReasons: ["Quantity specified (+15)", "Battery backup specified (+15)", "Product type clear (exit sign) (+15)"],
    alternates:  [],
    missingInfo: ["Single vs. double face", "Chevron / directional arrows required?"],
    status: "pending", tags: ["lighting", "life-safety"],
  },
  {
    id: lid(), lineNumber: 4,
    rawText:      "Occupancy sensors for main warehouse aisles, 360-degree coverage, qty 12",
    parsedIntent: "360° occupancy/motion sensor for warehouse aisle lighting control, qty 12",
    category:     "Wiring Devices",
    quantity: 12, unit: "EA",
    suggestedSku:    SKU.MOTION360,
    confidence: 78, confidenceLevel: "medium",
    confidenceReasons: ["Quantity specified (+15)", "Coverage angle specified (+10)", "Application context (+5)", "Missing: voltage/load type (-22)"],
    alternates:  [],
    missingInfo: ["Voltage (120V or 277V for high bay circuit?)", "Load type (LED-compatible?)", "Mounting height spec"],
    status: "pending", tags: ["lighting", "controls"],
  },
  {
    id: lid(), lineNumber: 5,
    rawText:      "(4) dimmer switches for office transition zones",
    parsedIntent: "Dimmer switches for office/warehouse transition lighting, qty 4",
    category:     "Wiring Devices",
    quantity: 4, unit: "EA",
    suggestedSku:    null,
    confidence: 38, confidenceLevel: "low",
    confidenceReasons: ["Quantity specified (+10)", "Missing: amperage rating (-20)", "Missing: compatible load type (-20)", "LED-compatible dimmer required? (-12)"],
    alternates:  [],
    missingInfo: ["Amperage rating (600W / 1000W)", "LED vs. incandescent compatible", "Single-pole or 3-way", "SPST or DPST"],
    status: "flagged", tags: ["lighting", "controls"],
  },
  {
    id: lid(), lineNumber: 6,
    rawText:      "Electrical connections and whips for each fixture",
    parsedIntent: "Electrical whips / flexible conduit connections for 50 high bay fixtures",
    category:     "Conduit Fittings",
    quantity: 50, unit: "EA",
    suggestedSku:    null,
    confidence: 44, confidenceLevel: "low",
    confidenceReasons: ["Implied quantity (matches fixture count) (+10)", "Product type inferred (-15)", "No conduit size specified (-31)"],
    alternates:  [],
    missingInfo: ["Whip conduit size (trade size)", "Conduit type (MC, flexible EMT, LFMC)", "Whip length"],
    status: "flagged", tags: ["electrical", "lighting"],
  },
];

export const MOCK_EXTRACTION_B: BomExtraction = {
  id: "BOM-B-001",
  projectName: "Warehouse Lighting Retrofit — Building 4",
  sourceText:  SCOPE_B_TEXT,
  lines:       SCOPE_B_LINES,
  extractedAt: "2026-05-22T09:15:00Z",
  parserVersion: "mock-v0",
};

// ── Scope C — data center power distribution ───────────────────────────────────

export const SCOPE_C_TEXT = `\
400A, 480V, 3-phase main distribution panelboard — NEMA 1
(2) 200A 3-pole 480V circuit breakers for downstream distribution
(1) 200A metered rack PDU, 30A L6-30R receptacles, 12 outlets, 208V
#2 AWG THHN, 4-conductor set, 100ft per run, qty 2 runs
2" EMT conduit, 50ft total
Equipment ground bus, 4/0 AWG ground cable, 25ft
(1) 10kVA online double-conversion UPS, 208V output
(20) C13 to C14 power cords, 6ft`;

const SCOPE_C_LINES: BomLine[] = [
  {
    id: lid(), lineNumber: 1,
    rawText:      "400A, 480V, 3-phase main distribution panelboard — NEMA 1",
    parsedIntent: "400A 3-phase NEMA 1 main distribution panelboard, 480V",
    category:     "Panelboards",
    quantity: 1, unit: "EA",
    suggestedSku:    SKU.P400A3PH,
    confidence: 83, confidenceLevel: "high",
    confidenceReasons: ["Amperage 400A specified (+20)", "Voltage 480V specified (+15)", "Phase count specified (+10)", "NEMA rating specified (+10)"],
    alternates:  [SKU.SQMB400],
    missingInfo: ["Number of circuit spaces needed", "Main breaker vs main lug"],
    status: "pending", tags: ["electrical", "dc", "css"],
  },
  {
    id: lid(), lineNumber: 2,
    rawText:      "(2) 200A 3-pole 480V circuit breakers for downstream distribution",
    parsedIntent: "200A 3-pole 480V branch circuit breakers, qty 2",
    category:     "Circuit Breakers",
    quantity: 2, unit: "EA",
    suggestedSku:    SKU.Q2200,
    confidence: 80, confidenceLevel: "high",
    confidenceReasons: ["Amperage 200A specified (+20)", "Pole count 3-pole specified (+15)", "Voltage 480V specified (+15)", "Missing: interrupting rating (-30)"],
    alternates:  [],
    missingInfo: ["Interrupting rating (10kAIC, 22kAIC, 65kAIC?)", "Panel family to match Line 1"],
    status: "pending", tags: ["electrical", "dc"],
  },
  {
    id: lid(), lineNumber: 3,
    rawText:      "(1) 200A metered rack PDU, 30A L6-30R receptacles, 12 outlets, 208V",
    parsedIntent: "Metered rack-mount PDU, 200A, 208V, 12×30A L6-30R outlets",
    category:     "Power Infrastructure",
    quantity: 1, unit: "EA",
    suggestedSku:    SKU.PDU200,
    confidence: 88, confidenceLevel: "high",
    confidenceReasons: ["Outlet type L6-30R specified (+20)", "Outlet count specified (+10)", "Voltage 208V specified (+15)", "Metered requirement noted (+10)"],
    alternates:  [],
    missingInfo: ["1U vs. 2U vs. 0U vertical mount"],
    status: "pending", tags: ["dc", "power-distribution"],
  },
  {
    id: lid(), lineNumber: 4,
    rawText:      "#2 AWG THHN, 4-conductor set, 100ft per run, qty 2 runs",
    parsedIntent: "#2 AWG THHN wire, 4 conductors × 100ft per run, 2 runs = 8 spools",
    category:     "Wire & Cable",
    quantity: 2, unit: "SET",
    suggestedSku:    SKU.THHN2,
    confidence: 82, confidenceLevel: "high",
    confidenceReasons: ["Gauge #2 AWG specified (+25)", "THHN insulation specified (+15)", "Run length and count noted (+10)"],
    alternates:  [],
    missingInfo: ["Color schedule for 4 conductors (standard 3Ø: brown/orange/yellow + grey/green)"],
    status: "pending", tags: ["electrical", "dc"],
  },
  {
    id: lid(), lineNumber: 5,
    rawText:      "2\" EMT conduit, 50ft total",
    parsedIntent: '2" EMT conduit, 50 LF (= 5 sticks of 10ft)',
    category:     "Conduit",
    quantity: 5, unit: "EA",
    suggestedSku:    SKU.EMT200,
    confidence: 90, confidenceLevel: "high",
    confidenceReasons: ["Trade size 2\" specified (+25)", "Linear footage specified (+10)", "EMT type confirmed (+10)"],
    alternates:  [SKU.EMT150],
    missingInfo: [],
    status: "pending", tags: ["electrical", "dc"],
  },
  {
    id: lid(), lineNumber: 6,
    rawText:      "Equipment ground bus, 4/0 AWG ground cable, 25ft",
    parsedIntent: "Equipment ground bus bar with 4/0 AWG ground conductor, 25ft",
    category:     "Data Center Infrastructure",
    quantity: 1, unit: "EA",
    suggestedSku:    SKU.GBUS,
    confidence: 68, confidenceLevel: "medium",
    confidenceReasons: ["Cable gauge 4/0 AWG specified (+15)", "Length specified (+10)", "Ground bus type unclear (-37)"],
    alternates:  [],
    missingInfo: ["Bus bar port count", "Wall-mount vs. rack-mount bus bar", "Copper vs. aluminum lugs"],
    status: "pending", tags: ["electrical", "dc", "grounding"],
  },
  {
    id: lid(), lineNumber: 7,
    rawText:      "(1) 10kVA online double-conversion UPS, 208V output",
    parsedIntent: "10kVA online double-conversion UPS, 208V, rack-mount",
    category:     "Power Infrastructure",
    quantity: 1, unit: "EA",
    suggestedSku:    SKU.UPS10KVA,
    confidence: 80, confidenceLevel: "high",
    confidenceReasons: ["kVA rating 10kVA specified (+20)", "UPS topology (online double-conversion) specified (+20)", "Voltage 208V specified (+15)", "Missing: rack size, runtime (+??)"],
    alternates:  [SKU.UPS10GXT],
    missingInfo: ["Target runtime at full load (10 min, 20 min?)", "Rack unit height constraint (6U, 8U, 10U?)", "Input voltage (120V, 208V, or 480V input?)"],
    status: "pending", tags: ["dc", "power-infrastructure"],
  },
  {
    id: lid(), lineNumber: 8,
    rawText:      "(20) C13 to C14 power cords, 6ft",
    parsedIntent: "IEC C13 to C14 patch power cords, 6ft, qty 20",
    category:     "Data Center Infrastructure",
    quantity: 20, unit: "EA",
    suggestedSku:    SKU.C13C14_6FT,
    confidence: 95, confidenceLevel: "high",
    confidenceReasons: ["Connector type C13/C14 specified (+25)", "Length 6ft specified (+20)", "Quantity specified (+15)"],
    alternates:  [],
    missingInfo: [],
    status: "pending", tags: ["dc"],
  },
];

export const MOCK_EXTRACTION_C: BomExtraction = {
  id: "BOM-C-001",
  projectName: "Data Center Power Infrastructure — DC-001",
  sourceText:  SCOPE_C_TEXT,
  lines:       SCOPE_C_LINES,
  extractedAt: "2026-05-22T10:30:00Z",
  parserVersion: "mock-v0",
};

// ── All sample scopes (for selector) ──────────────────────────────────────────

export const MOCK_SCOPES = [
  {
    key: "scope-a",
    label: "Electrical Rough-In",
    subLabel: "Northgate Medical HPC — panel, breakers, conduit, wire",
    extraction: MOCK_EXTRACTION_A,
  },
  {
    key: "scope-b",
    label: "Lighting Retrofit",
    subLabel: "Warehouse Building 4 — LED high bay, sensors, controls",
    extraction: MOCK_EXTRACTION_B,
  },
  {
    key: "scope-c",
    label: "DC Power Distribution",
    subLabel: "DC-001 — panelboard, PDU, UPS, cabling",
    extraction: MOCK_EXTRACTION_C,
  },
] as const;

export type MockScopeKey = (typeof MOCK_SCOPES)[number]["key"];
