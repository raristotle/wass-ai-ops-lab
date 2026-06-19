/**
 * Per-subcategory US Harmonized Tariff Schedule (HTS) classification + duty model
 * (DI-7) — REAL, web-verified codes and rates, replacing the old chapter-level
 * approximation. Every entry was verified against the official USITC HTS
 * (hts.usitc.gov / reststop API, 2026 revision) and the USTR Section 301 lists /
 * Chapter 99 (heading 9903.88) during the dataset-ingestion research sweep.
 *
 * For each catalog subcategory we pick the REPRESENTATIVE subheading (a subcategory
 * can span several real codes by material/voltage/construction; the notes call out
 * the alternatives). Fields:
 *   - hts          : the 8-digit HTS subheading, dotted (e.g. "8536.20.00").
 *   - mfnDutyPct   : the General (Column 1) ad-valorem rate as a fraction (0 = Free).
 *   - section301Pct: the China-origin Section 301 surcharge as a fraction. This is
 *                    PER-SUBCATEGORY (not a flat chapter rate) — e.g. datacom 8517
 *                    and ADP displays/sensors are List 4A at 7.5%, while most of
 *                    chapter 85 is List 3 at 25%.
 *   - section232   : true when the code is a steel article (ch. 73) that also carries
 *                    a Section 232 steel surcharge on most-origin imports.
 *   - confidence   : research confidence for this mapping.
 *
 * IMPORTANT (documented honestly): these are the HTS General duty + Section 301
 * layer only. They do NOT model FTA preferences (USMCA/Korea are often Free),
 * product-specific 301 exclusions, the compound specific duties on some clock-based
 * timers (9107), or any IEEPA/reciprocal overlay. The values are advisory and a
 * customs broker confirms a binding classification. Re-verify against the live HTS
 * revision before relying on a specific rate (HTS revises ~3×/year).
 */

export interface HtsCodeEntry {
  subcategory: string;
  /** 8-digit HTS subheading, dotted. */
  hts: string;
  description: string;
  /** General (Column 1) ad-valorem duty, as a fraction. */
  mfnDutyPct: number;
  /** China-origin Section 301 surcharge, as a fraction. */
  section301Pct: number;
  /** Steel article (ch. 73) also exposed to a Section 232 steel surcharge. */
  section232: boolean;
  confidence: "high" | "medium" | "low";
  note?: string;
}

/** Reviewed against the live USITC HTS + USTR Section 301 lists on this date. */
export const HTS_TABLE_REVIEWED = "2026-06";

export const HTS_CODE_ENTRIES: readonly HtsCodeEntry[] = [
  // ── Circuit protection (heading 8536, List 3 / +25%) ──────────────────────────
  { subcategory: "Circuit Breakers", hts: "8536.20.00", description: "Automatic circuit breakers, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Fuses", hts: "8536.10.00", description: "Fuses, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Surge Protective Devices", hts: "8536.30.80", description: "Other apparatus for protecting electrical circuits, ≤1,000 V (surge suppressors)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high", note: ">1000V arresters are 8535.40.00 at 2.7%." },
  { subcategory: "Safety Switches & Disconnects", hts: "8536.50.90", description: "Other switches, ≤1,000 V (safety/disconnect switches)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },

  // ── Switchgear / panels (heading 8537 / 8536) ────────────────────────────────
  { subcategory: "Load Centers", hts: "8537.10.91", description: "Boards/panels for electric control/distribution, ≤1,000 V (load centers)", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Panelboards", hts: "8537.10.91", description: "Boards/panels for electric control/distribution, ≤1,000 V (panelboards)", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Meter Sockets", hts: "8537.10.91", description: "Boards/panels with metering & switching apparatus, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Motor Starters & Controls", hts: "8536.50.40", description: "Motor starters / motor-control switches, ≤1,000 V", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "medium", note: "A board-mounted starter assembly is 8537.10.91 at 2.7%." },
  { subcategory: "Contactors", hts: "8536.49.00", description: "Relays/contactors for a voltage exceeding 60 V, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "medium" },

  // ── Transformers / power conversion (heading 8504, List 1 or 3 — all +25%) ────
  { subcategory: "Dry-Type Transformers", hts: "8504.32.00", description: "Transformers, power handling 1–16 kVA", mfnDutyPct: 0.024, section301Pct: 0.25, section232: false, confidence: "high", note: "<1 kVA = 8504.31.40 (6.6%); >16 kVA = 8504.33/.34 (1.6%)." },
  { subcategory: "Power Supplies", hts: "8504.40.95", description: "Static converters (AC-DC power supplies)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Drivers & Ballasts", hts: "8504.40.95", description: "LED drivers (static converters)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "medium", note: "Magnetic ballasts are 8504.10.00 at 3%." },
  { subcategory: "UPS & Power Protection", hts: "8504.40.95", description: "Static converters (UPS / standby power)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },

  // ── Wire & cable (heading 8544, List 3 / +25%) ───────────────────────────────
  { subcategory: "Wire & Cable", hts: "8544.49.30", description: "Insulated conductors, ≤1,000 V, no connectors, of copper (building wire)", mfnDutyPct: 0.053, section301Pct: 0.25, section232: false, confidence: "high", note: "Non-copper hookup wire = 8544.49.90 (3.9%)." },
  { subcategory: "Ethernet Cable", hts: "8544.42.20", description: "Insulated conductors, ≤1,000 V, with connectors, telecom (patch cords)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high", note: "Bulk (no connectors) = 8544.49.10 (Free)." },
  { subcategory: "Security Cable & Power Supplies", hts: "8544.20.00", description: "Coaxial cable & other coaxial conductors", mfnDutyPct: 0.053, section301Pct: 0.25, section232: false, confidence: "high", note: "Power cords = 8544.42.90 (2.6%)." },

  // ── Fiber optic / connectivity (heading 8544.70) ─────────────────────────────
  { subcategory: "Fiber Optic Cable", hts: "8544.70.00", description: "Optical fiber cables of individually sheathed fibers", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high", note: "Raw fiber/bundles = 9001.10.00 (6.7%)." },
  { subcategory: "Connectivity", hts: "8544.42.20", description: "Connectorized telecom patch/connectivity cabling", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "medium" },

  // ── Conduit / raceway (ch. 73 steel + ch. 39 plastic + 8547/8538) ────────────
  { subcategory: "Conduit", hts: "7306.30.50", description: "Welded steel tube (EMT/rigid electrical conduit)", mfnDutyPct: 0, section301Pct: 0.25, section232: true, confidence: "high", note: "Insulation-lined metal conduit = 8547.90.00 (4.6%); PVC = 3917.23.00 (3.1%)." },
  { subcategory: "Conduit Fittings", hts: "8547.90.00", description: "Electrical conduit fittings of base metal lined with insulating material", mfnDutyPct: 0.046, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Flexible Conduit & Liquidtight", hts: "8547.90.00", description: "Flexible metallic conduit / liquidtight (insulated metal conduit)", mfnDutyPct: 0.046, section301Pct: 0.25, section232: false, confidence: "medium", note: "Nonmetallic flex = 3917.21/.23 (3.1%)." },
  { subcategory: "Cable Tray", hts: "7308.90.95", description: "Structures & parts of structures of steel (cable tray)", mfnDutyPct: 0, section301Pct: 0.25, section232: true, confidence: "high" },
  { subcategory: "Strut & Channel", hts: "7326.90.86", description: "Other articles of iron or steel (strut/channel)", mfnDutyPct: 0.029, section301Pct: 0.25, section232: true, confidence: "high" },
  { subcategory: "Boxes & Covers", hts: "8538.90.60", description: "Parts for switching apparatus (metal device/junction boxes)", mfnDutyPct: 0.035, section301Pct: 0.25, section232: false, confidence: "medium", note: "Plastic boxes = 3926.90.99 (5.3%)." },
  { subcategory: "Enclosures", hts: "8538.10.00", description: "Boards/cabinets for goods of 8537, not equipped (empty enclosures)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high", note: "Molded plastic enclosures = 8538.90.60 (3.5%)." },

  // ── Wiring devices (heading 8536, List 3 / +25%) ─────────────────────────────
  { subcategory: "Wiring Devices", hts: "8536.69.80", description: "Plugs and sockets, other, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Receptacles & Outlets", hts: "8536.69.80", description: "Plugs and sockets, other (receptacles/outlets), ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Switches", hts: "8536.50.90", description: "Other switches, ≤1,000 V", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Combination Devices", hts: "8536.90.85", description: "Other apparatus for connections in electrical circuits, ≤1,000 V", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Cord Plugs & Connectors", hts: "8536.69.40", description: "Coaxial/cylindrical/PCB/ribbon connectors, ≤1,000 V", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high", note: "General attachment plugs = 8536.69.80 (2.7%)." },
  { subcategory: "Industrial Plugs & Receptacles", hts: "8536.69.80", description: "Pin-and-sleeve industrial plugs & receptacles, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Push Buttons", hts: "8536.50.90", description: "Push-button switches, ≤1,000 V", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Dimmers & Lighting Controls", hts: "8536.90.85", description: "Wiring apparatus for lighting control, ≤1,000 V", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "medium", note: "A solid-state dimmer module can classify in 8537." },

  // ── Grounding / terminals / plates ───────────────────────────────────────────
  { subcategory: "Grounding & Bonding", hts: "8536.90.40", description: "Terminals, splices and couplings (grounding lugs/bonding connectors)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Lugs & Wire Connectors", hts: "8536.90.40", description: "Terminals, electrical splices and couplings", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Terminal Blocks", hts: "8536.90.85", description: "Other connection apparatus (terminal blocks)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Wall Plates & Covers", hts: "3925.90.00", description: "Builders' ware of plastics (wall plates/face plates)", mfnDutyPct: 0.053, section301Pct: 0.25, section232: false, confidence: "high", note: "Metal cover parts = 8538.90.60 (3.5%)." },

  // ── Lighting (heading 9405 luminaires; 8539 lamps; 8536.61 lampholders) ───────
  { subcategory: "LED Troffers & Panels", hts: "9405.11.60", description: "LED ceiling/wall luminaires, of base metal (other than brass)", mfnDutyPct: 0.076, section301Pct: 0.25, section232: false, confidence: "high", note: "Plastic-bodied = 9405.11.80 (3.9%)." },
  { subcategory: "High Bay Fixtures", hts: "9405.41.84", description: "Other LED luminaires, other", mfnDutyPct: 0.039, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Strip & Wrap Fixtures", hts: "9405.42.84", description: "Other LED luminaires, other", mfnDutyPct: 0.039, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "LED Downlights", hts: "9405.11.80", description: "LED ceiling/wall luminaires, other", mfnDutyPct: 0.039, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Outdoor & Area Lighting", hts: "9405.42.60", description: "Other LED luminaires, of base metal (other than brass)", mfnDutyPct: 0.06, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Exit & Emergency Lighting", hts: "9405.49.00", description: "Other electric luminaires (non-LED-only)", mfnDutyPct: 0.039, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Lamps & Tubes", hts: "8539.52.00", description: "Light-emitting diode (LED) lamps", mfnDutyPct: 0.02, section301Pct: 0.075, section232: false, confidence: "medium", note: "List 4A (+7.5%) PROVISIONAL — carved from 8539.50 in the 2022 HS revision; a broker should confirm against Chapter 99 note 20." },
  { subcategory: "Lighting Accessories", hts: "8536.61.00", description: "Lamp-holders, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "high" },

  // ── Controls & automation (mixed: 8536/8537 List 3; 9031/9107 List 4A) ───────
  { subcategory: "Timers & Time Switches", hts: "9107.00.80", description: "Time switches with clock movement, valued over $5", mfnDutyPct: 0.064, section301Pct: 0.075, section232: false, confidence: "medium", note: "9107 also has compound specific duties (45¢ each + 2.5¢/jewel) not modeled here; digital timers without a clock movement are 8536.50 (Free, +25%)." },
  { subcategory: "Photo Controls", hts: "8536.50.90", description: "Photoelectric switching apparatus, ≤1,000 V", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Occupancy & Vacancy Sensors", hts: "9031.80.80", description: "Measuring/checking instruments, other (electronic occupancy sensors)", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "medium", note: "A wall-box occupancy switch with integral switching can be 8536.50 (Free, +25%)." },
  { subcategory: "Relays", hts: "8536.49.00", description: "Relays for a voltage exceeding 60 V, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "high", note: "≤60 V relays = 8536.41.00 (2.7%)." },
  { subcategory: "PLCs & I/O Modules", hts: "8537.10.91", description: "Programmable controllers / control panels, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Sensors & Proximity Switches", hts: "9031.80.80", description: "Electronic proximity/photoelectric sensors (measuring instruments)", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "medium", note: "A mechanical limit/proximity switch is 8536.50 (Free, +25%)." },
  { subcategory: "EV Charging Stations", hts: "8504.40.95", description: "EV charging power modules (static converters)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Generators & Transfer Switches", hts: "8502.20.00", description: "Generating sets, spark-ignition engine", mfnDutyPct: 0.02, section301Pct: 0.25, section232: false, confidence: "medium", note: "The transfer-switch portion is 8537.10.91 (2.7%)." },
  { subcategory: "Automatic Transfer Switch", hts: "8537.10.91", description: "Transfer switch on a board/panel, ≤1,000 V", mfnDutyPct: 0.027, section301Pct: 0.25, section232: false, confidence: "medium" },

  // ── Datacom / networking (heading 8517 List 4A +7.5%; racks ch. 94 List 3) ────
  { subcategory: "Patch Panels", hts: "8517.62.00", description: "Data cross-connect apparatus of a communications network", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "high" },
  { subcategory: "Network Switches", hts: "8517.62.00", description: "Switching and routing apparatus", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "high" },
  { subcategory: "Racks & Cabinets", hts: "9403.20.00", description: "Steel racks/cabinets (metal furniture)", mfnDutyPct: 0, section301Pct: 0.25, section232: true, confidence: "high", note: "Racks are List 3 (+25%) — NOT the 8517 +7.5% — and steel (Section 232)." },
  { subcategory: "Wireless Access Points", hts: "8517.62.00", description: "WLAN radio apparatus (access points)", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "high" },

  // ── AV / security. NOTE heading 8518 is SPLIT for Section 301: the audio
  //    capture/reproduction subheadings (8518.10 mics, 8518.21/.22/.29 loudspeakers)
  //    are List 4A (+7.5%, 9903.88.15); only amplifiers (8518.40) are List 3 (+25%).
  //    8521/8525/8531 are List 3 (+25%); 8528 ADP displays/projectors are List 4A.
  { subcategory: "Displays", hts: "8528.52.00", description: "Monitors capable of connecting to an ADP machine", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "high", note: "Non-ADP displays = 8528.59 at up to 5% MFN." },
  { subcategory: "Projectors", hts: "8528.62.00", description: "Projectors capable of connecting to an ADP machine", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "high" },
  { subcategory: "Speakers", hts: "8518.22.00", description: "Multiple loudspeakers in a single enclosure", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "high", note: "8518 audio subheadings (.10/.21/.22/.29) are List 4A (+7.5%), not List 3 — only amplifiers (8518.40) are List 3." },
  { subcategory: "Amplifiers & DSP", hts: "8518.40.20", description: "Audio-frequency electric amplifiers, other", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high", note: "Amplifiers (8518.40) ARE List 3 (+25%), unlike the rest of heading 8518." },
  { subcategory: "Microphones & Audio Capture", hts: "8518.10.80", description: "Microphones and stands therefor", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "high", note: "8518.10 is List 4A (+7.5%), 9903.88.15." },
  { subcategory: "Video Conferencing", hts: "8517.62.00", description: "VTC codecs/endpoints (data reception/transmission)", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "medium" },
  { subcategory: "IP Cameras", hts: "8525.89.30", description: "Television cameras, other (network/IP cameras)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "NVRs", hts: "8521.90.00", description: "Video recording/reproducing apparatus (NVR/DVR)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Access Control", hts: "8531.10.00", description: "Burglar/fire alarm & similar signaling apparatus", mfnDutyPct: 0.013, section301Pct: 0.25, section232: false, confidence: "medium", note: "IP/SIP access devices may be 8517.62 (Free, +7.5%)." },
  { subcategory: "Intrusion Sensors", hts: "8531.10.00", description: "Burglar alarm sensors & similar signaling apparatus", mfnDutyPct: 0.013, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Alarm Panels", hts: "8531.10.00", description: "Burglar/fire alarm control panels", mfnDutyPct: 0.013, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Intercom & Entry Systems", hts: "8517.62.00", description: "IP intercom / entry communication apparatus", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "medium", note: "Non-IP audio intercom may be 8531.10 (1.3%, +25%)." },
  { subcategory: "Display & Projector Mounts", hts: "8302.50.00", description: "Base-metal mountings/brackets (mounts)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "low", note: "Mounts classify by material (e.g. aluminum 7616.99); not electronics — verify per SKU." },
  { subcategory: "Signal Extenders", hts: "8517.62.00", description: "AV-over-IP / network signal extenders", mfnDutyPct: 0, section301Pct: 0.075, section232: false, confidence: "low", note: "Non-networked baluns/extenders may be 8543.70." },

  // ── Safety / PPE (multi-chapter; apparel/textiles List 4A +7.5%, rest List 3) ─
  { subcategory: "Hard Hats", hts: "6506.10.30", description: "Safety headgear of reinforced/laminated plastics (hard hats)", mfnDutyPct: 0, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Safety Glasses", hts: "9004.90.00", description: "Spectacles/goggles, other than for correcting vision", mfnDutyPct: 0.025, section301Pct: 0.25, section232: false, confidence: "high" },
  { subcategory: "Gloves", hts: "6116.10.55", description: "Knit gloves coated with plastics/rubber (coated work gloves)", mfnDutyPct: 0.132, section301Pct: 0.075, section232: false, confidence: "medium", note: "Rubber gloves = 4015.19 (3–14%); leather = 4203.29.18 (14%). MFN varies widely by material." },
  { subcategory: "Hi-Vis Apparel", hts: "6110.30.30", description: "Knit pullovers/sweatshirts of man-made fibers (hi-vis tops)", mfnDutyPct: 0.32, section301Pct: 0.075, section232: false, confidence: "medium", note: "Woven hi-vis vests = 6211.33.90 (16%)." },
  { subcategory: "Fall Protection", hts: "6307.90.98", description: "Other made-up textile articles (webbing harnesses/lanyards)", mfnDutyPct: 0.07, section301Pct: 0.075, section232: false, confidence: "medium", note: "Leather components = 4205.00.80 (Free)." },
  { subcategory: "Hearing Protection", hts: "3926.90.99", description: "Other articles of plastics (ear-muff shells/ear plugs)", mfnDutyPct: 0.053, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Respiratory Protection", hts: "9020.00.90", description: "Other breathing appliances & gas masks (respirators)", mfnDutyPct: 0.025, section301Pct: 0.25, section232: false, confidence: "medium" },
  { subcategory: "Lockout/Tagout", hts: "3926.90.99", description: "Other articles of plastics (lockout devices/tags)", mfnDutyPct: 0.053, section301Pct: 0.25, section232: false, confidence: "medium" },
];
