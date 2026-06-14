// GENERATED FILE — do not hand-edit.
// Built by scripts/ingest-xref-sources.mjs from data/real/research/xref-sources-raw.json
// (the user-supplied "Top 1000 Product Cross-Reference Source Records" workbook, 2026-06-12 vintage,
// deduped from 1166 per-section rows to one entry per source URL).
// Regenerate with:  node scripts/ingest-xref-sources.mjs
import type { CrossSourceEntry } from "@/lib/catalog/cross-sources";

export const CROSS_SOURCE_WORKBOOK_ROWS = 1166;

export const CROSS_SOURCE_ENTRIES: CrossSourceEntry[] = [
 {
  "id": "xref-src-001",
  "name": "Z2Data Cross References / Part Risk Manager",
  "url": "https://www.z2data.com/part-risk-manager-features/cross-references",
  "domain": "z2data.com",
  "format": "Paid SaaS/database/API",
  "access": "licensed",
  "kind": "api-database",
  "ingestStatus": "requires-license",
  "qualityScore": 100,
  "volumeScore": 100,
  "categories": [
   "Electronic components"
  ],
  "sections": [
   "Analog",
   "Connectors",
   "ICs",
   "Lifecycle/EOL alternates",
   "MCUs/MPUs",
   "Optoelectronics",
   "Passives",
   "Power semiconductors",
   "Relays",
   "Sensors"
  ],
  "recordCount": 11,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-002",
  "name": "SiliconExpert P5 / API / Part Search",
  "url": "https://www.siliconexpert.com/",
  "domain": "siliconexpert.com",
  "format": "Paid SaaS/database/API",
  "access": "licensed",
  "kind": "api-database",
  "ingestStatus": "requires-license",
  "qualityScore": 99,
  "volumeScore": 98,
  "categories": [
   "Electronic components"
  ],
  "sections": [
   "Analog",
   "Connectors",
   "ICs",
   "Lifecycle/EOL alternates",
   "MCUs/MPUs",
   "Optoelectronics",
   "Passives",
   "Power semiconductors",
   "Relays",
   "Sensors"
  ],
  "recordCount": 11,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-003",
  "name": "Nexar / Octopart API",
  "url": "https://nexar.com/api",
  "domain": "nexar.com",
  "format": "API / data platform",
  "access": "free",
  "kind": "api-database",
  "ingestStatus": "requires-api-key",
  "qualityScore": 95,
  "volumeScore": 96,
  "categories": [
   "Electronic components"
  ],
  "sections": [
   "Analog",
   "Connectors",
   "ICs",
   "Lifecycle/EOL alternates",
   "MCUs/MPUs",
   "Optoelectronics",
   "Passives",
   "Power semiconductors",
   "Relays",
   "Sensors"
  ],
  "recordCount": 11,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-004",
  "name": "Bussmann Cross Reference Tool",
  "url": "https://crossreferencetool.cooperbussmann.com/",
  "domain": "crossreferencetool.cooperbussmann.com",
  "format": "HTML app/tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 94,
  "volumeScore": 87,
  "categories": [
   "Circuit protection"
  ],
  "sections": [
   "Class CC fuses",
   "Class J fuses",
   "Class RK fuses",
   "Disconnect switches",
   "Fuse holders/blocks",
   "Medium-voltage fuses",
   "Midget fuses",
   "Semiconductor fuses",
   "Surge protection"
  ],
  "recordCount": 10,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-005",
  "name": "Octopart",
  "url": "https://octopart.com/",
  "domain": "octopart.com",
  "format": "Web database/API-backed",
  "access": "free",
  "kind": "api-database",
  "ingestStatus": "requires-api-key",
  "qualityScore": 94,
  "volumeScore": 95,
  "categories": [
   "Electronic components"
  ],
  "sections": [
   "Analog",
   "Connectors",
   "ICs",
   "Lifecycle/EOL alternates",
   "MCUs/MPUs",
   "Optoelectronics",
   "Passives",
   "Power semiconductors",
   "Relays",
   "Sensors"
  ],
  "recordCount": 11,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-006",
  "name": "Eaton Bussmann Competitor Cross Reference",
  "url": "https://www.eaton.com/us/en-us/products/electrical-circuit-protection/fuses/c...",
  "domain": "eaton.com",
  "format": "HTML tool/PDF guide",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 94,
  "volumeScore": 87,
  "categories": [
   "Circuit protection"
  ],
  "sections": [
   "Class CC fuses",
   "Class J fuses",
   "Class RK fuses",
   "Disconnect switches",
   "Fuse holders/blocks",
   "Medium-voltage fuses",
   "Midget fuses",
   "Semiconductor fuses",
   "Surge protection"
  ],
  "recordCount": 10,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-007",
  "name": "Schneider Electric Product Substitution / Competitive Cross",
  "url": "https://www.se.com/us/en/work/support/resources-and-tools/calculators-and-onl...",
  "domain": "se.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 94,
  "volumeScore": 90,
  "categories": [
   "Power distribution and controls"
  ],
  "sections": [
   "Breakers",
   "Contactors/starters",
   "Load centers",
   "Metering",
   "Motor controls",
   "Panelboards/switchboards",
   "Safety switches",
   "Surge protection"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-008",
  "name": "Schneider Electric Cross Reference Tool",
  "url": "https://tools.se.app/xref/cross_en_ca.html",
  "domain": "tools.se.app",
  "format": "HTML app/tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 93,
  "volumeScore": 88,
  "categories": [
   "Power distribution and controls"
  ],
  "sections": [
   "Breakers",
   "Contactors/starters",
   "Load centers",
   "Metering",
   "Motor controls",
   "Panelboards/switchboards",
   "Safety switches",
   "Surge protection"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-009",
  "name": "Mersen Cross Reference",
  "url": "https://us.mersen.com/en/resources/cross-reference",
  "domain": "us.mersen.com",
  "format": "HTML search tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 93,
  "volumeScore": 86,
  "categories": [
   "Circuit protection"
  ],
  "sections": [
   "Class CC fuses",
   "Class J fuses",
   "Class RK fuses",
   "Disconnect switches",
   "Fuse holders/blocks",
   "Medium-voltage fuses",
   "Midget fuses",
   "Semiconductor fuses",
   "Surge protection"
  ],
  "recordCount": 10,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-010",
  "name": "Eaton Cross-Reference Search",
  "url": "https://www.eaton.com/us/en-us/cross-reference-search.html",
  "domain": "eaton.com",
  "format": "HTML tool",
  "access": "licensed",
  "kind": "interactive-tool",
  "ingestStatus": "requires-license",
  "qualityScore": 93,
  "volumeScore": 88,
  "categories": [
   "Power distribution, industrial, circuit protection"
  ],
  "sections": [
   "Broad Eaton electrical portfolio"
  ],
  "recordCount": 2,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-011",
  "name": "Southwire Product Cross Reference - Building wire",
  "url": "https://www.southwire.com/cross-reference",
  "domain": "southwire.com",
  "format": "HTML cross-reference tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 93,
  "volumeScore": 88,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Building wire",
   "Industrial power cable",
   "MC/AC cable",
   "Portable cord",
   "Utility cable"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-012",
  "name": "Leviton Manufacturer Cross Reference - Wiring devices",
  "url": "https://leviton.com/manufacturer-cross-reference",
  "domain": "leviton.com",
  "format": "HTML cross-reference tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 86,
  "categories": [
   "Wiring devices and lighting controls"
  ],
  "sections": [
   "Dimmers",
   "GFCI/AFCI",
   "Pin and sleeve",
   "Switches",
   "Wiring devices"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-013",
  "name": "Honeywell NOTIFIER Device Compatibility Manual",
  "url": "https://prod-edam.honeywell.com/content/dam/honeywell-edam/hbt/en-us/document...",
  "domain": "prod-edam.honeywell.com",
  "format": "PDF manual/table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 84,
  "categories": [
   "Fire alarm"
  ],
  "sections": [
   "Bases",
   "Compatibility manuals",
   "Detectors",
   "Modules",
   "Notification appliances",
   "Panels",
   "Power supplies",
   "Pull stations"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-014",
  "name": "APC UPS Replacement Battery Selector - Smart-UPS RBCs",
  "url": "https://www.apc.com/us/en/tools/ups_replacement_battery_selector/",
  "domain": "apc.com",
  "format": "HTML selector tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 82,
  "categories": [
   "UPS replacement batteries"
  ],
  "sections": [
   "Back-UPS RBCs",
   "Lithium/VRLA replacements",
   "Rack UPS batteries",
   "Smart-UPS RBCs",
   "Tower UPS batteries"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-015",
  "name": "Hammond Competitor Cross-Reference Search",
  "url": "https://www.hammfg.com/search/cross-reference",
  "domain": "hammfg.com",
  "format": "HTML search tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "ingested",
  "qualityScore": 92,
  "volumeScore": 90,
  "categories": [
   "Enclosures"
  ],
  "sections": [
   "Accessories",
   "Climate control",
   "Freestanding enclosures",
   "Junction boxes",
   "NEMA 4X",
   "Panels",
   "Stainless enclosures",
   "Wall-mount enclosures"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false,
  "ingestNote": "1 SKU-level pairs extracted (enclosures) on 2026-06-11"
 },
 {
  "id": "xref-src-016",
  "name": "Burndy Competitor Part Cross Reference - Compression lugs",
  "url": "https://www.hubbell.com/burndy/en/part-cross-reference",
  "domain": "hubbell.com",
  "format": "HTML cross-reference tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 84,
  "categories": [
   "Connectors, lugs, grounding"
  ],
  "sections": [
   "Compression lugs",
   "Grounding connectors",
   "Mechanical lugs",
   "Splices",
   "Tools/dies"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-017",
  "name": "Hubbell Competitor Part Cross Reference",
  "url": "https://www.hubbell.com/hubbell/en/part-cross-reference",
  "domain": "hubbell.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 86,
  "categories": [
   "Electrical infrastructure"
  ],
  "sections": [
   "Boxes",
   "Cable management",
   "Conduit/fittings",
   "Grounding/bonding",
   "Lighting controls",
   "Lugs/connectors",
   "Utility products",
   "Wiring devices"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-018",
  "name": "Legrand Product Cross Reference",
  "url": "https://www.legrand.us/tools/product-cross-reference",
  "domain": "legrand.us",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 86,
  "categories": [
   "Wiring devices, lighting controls, AV"
  ],
  "sections": [
   "C2G cabling",
   "Lighting controls",
   "On-Q",
   "Plugs/connectors",
   "Receptacles",
   "Switches",
   "Wattstopper",
   "Wiremold raceway"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-019",
  "name": "Lutron LED Bulb Compatibility Tool - C·L dimmers",
  "url": "https://www.lutron.com/compatibility",
  "domain": "lutron.com",
  "format": "HTML compatibility tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 82,
  "categories": [
   "Lighting controls"
  ],
  "sections": [
   "C·L dimmers",
   "Diva LED+",
   "Maestro LED+",
   "RA2/Caséta compatibility",
   "Sunnata LED+"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-020",
  "name": "Renesas Cross-Reference Search",
  "url": "https://www.renesas.com/en/support/cross-reference",
  "domain": "renesas.com",
  "format": "HTML search/upload tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 78,
  "categories": [
   "Semiconductors"
  ],
  "sections": [
   "Analog ICs",
   "Automotive-grade parts",
   "Discrete semiconductors",
   "Embedded MCUs",
   "Interface",
   "Interfaces",
   "MCUs/MPUs",
   "Power ICs",
   "Power management",
   "RF",
   "Timing"
  ],
  "recordCount": 14,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-021",
  "name": "Rockwell Product Replacement Lookup - Contactors",
  "url": "https://www.rockwellautomation.com/en-us/support/product/product-compatibilit...",
  "domain": "rockwellautomation.com",
  "format": "HTML tool / CrossWorks",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 86,
  "categories": [
   "Controls and automation"
  ],
  "sections": [
   "Circuit breakers",
   "Contactors",
   "Overload relays",
   "PLC/IO modules",
   "Pushbuttons"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-022",
  "name": "TI Cross-Reference Search",
  "url": "https://www.ti.com/cross-reference-search",
  "domain": "ti.com",
  "format": "HTML tool / upload",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 92,
  "volumeScore": 80,
  "categories": [
   "Semiconductors"
  ],
  "sections": [
   "Analog ICs",
   "Automotive-grade parts",
   "Discrete semiconductors",
   "Embedded MCUs",
   "Interface",
   "Power management",
   "RF",
   "Timing"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-023",
  "name": "ABB Competitor Lookup",
  "url": "https://empower.abb.com/ecatalog/ec/EN_NA/competitors/sub-detail/",
  "domain": "empower.abb.com",
  "format": "HTML table/tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 91,
  "volumeScore": 83,
  "categories": [
   "Electrical products"
  ],
  "sections": [
   "Boxes/fittings",
   "Cable tray",
   "Conduit bodies",
   "Hazardous location products",
   "Lugs/connectors",
   "Power distribution",
   "Wiring devices"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-024",
  "name": "3M Reusable Respirator Cartridge/Filter Selection Poster",
  "url": "https://multimedia.3m.com/mws/media/40744O/reusable-resp-cartridge-and-filter...",
  "domain": "multimedia.3m.com",
  "format": "PDF selection/compatibility guide",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 91,
  "volumeScore": 76,
  "categories": [
   "Respiratory protection"
  ],
  "sections": [
   "6000 half-face",
   "7500 half-face",
   "7800S full-face",
   "Cartridge/filter holders",
   "Cartridges",
   "Filters",
   "Full-face respirators",
   "Half-face respirators",
   "Replacement parts",
   "Replacement straps/valves",
   "Retainers/adapters"
  ],
  "recordCount": 12,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-025",
  "name": "3M Cartridge and Filter Guide",
  "url": "https://multimedia.3m.com/mws/media/565214O/cartridge-and-filter-guide-brochu...",
  "domain": "multimedia.3m.com",
  "format": "PDF guide",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 91,
  "volumeScore": 76,
  "categories": [
   "Respiratory protection"
  ],
  "sections": [
   "Adapters",
   "Bayonet cartridges",
   "Cartridges",
   "Facepiece compatibility",
   "Filter retainers",
   "Filters",
   "Full-face respirators",
   "Half-face respirators",
   "Particulate filters",
   "Replacement parts",
   "Retainers/adapters"
  ],
  "recordCount": 12,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-026",
  "name": "Alpha Wire Cross-Reference Charts",
  "url": "https://www.alphawire.com/resource-center/tools/cross-reference-charts",
  "domain": "alphawire.com",
  "format": "HTML page + PDF",
  "access": "free",
  "kind": "document",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 91,
  "volumeScore": 88,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Control cable",
   "Electronic cable",
   "Fire alarm cable",
   "Instrumentation cable",
   "Low-voltage cable",
   "Security cable",
   "Tray cable",
   "VFD/motor cable"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-027",
  "name": "DigiKey Component Cross Reference Tool",
  "url": "https://www.digikey.com/en/cross-reference",
  "domain": "digikey.com",
  "format": "HTML app/tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 91,
  "volumeScore": 88,
  "categories": [
   "Electronic components"
  ],
  "sections": [
   "Analog",
   "Connectors",
   "ICs",
   "MCUs/MPUs",
   "Passives",
   "Power semiconductors",
   "Relays",
   "Sensors"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-028",
  "name": "Littelfuse Cross Reference",
  "url": "https://www.littelfuse.com/crossreference",
  "domain": "littelfuse.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 91,
  "volumeScore": 84,
  "categories": [
   "Circuit protection"
  ],
  "sections": [
   "Class CC fuses",
   "Class J fuses",
   "Class RK fuses",
   "Disconnect switches",
   "Fuse holders/blocks",
   "Medium-voltage fuses",
   "Midget fuses",
   "Semiconductor fuses"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-029",
  "name": "Molex Cross-Reference Search Tool",
  "url": "https://www.molex.com/en-us/cross-reference",
  "domain": "molex.com",
  "format": "HTML tool / batch input",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 91,
  "volumeScore": 85,
  "categories": [
   "Connectors"
  ],
  "sections": [
   "Backshells",
   "Board-to-board",
   "Cable assemblies",
   "Circular",
   "RF/coax",
   "Rectangular",
   "Terminals/contacts",
   "Wire-to-board"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-030",
  "name": "Signify Download Center - LED Driver/Ballast Cross Reference Tools",
  "url": "https://www.na.mytechnology.portal.signify.com/public-dashboard/public-downlo...",
  "domain": "na.mytechnology.portal.signify.com",
  "format": "Excel/PDF download center",
  "access": "free",
  "kind": "document",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 91,
  "volumeScore": 84,
  "categories": [
   "Lighting"
  ],
  "sections": [
   "Automotive bulbs",
   "Emergency lighting",
   "Fluorescent ballasts",
   "HID ballasts",
   "LED drivers",
   "Lamp replacements",
   "TLED retrofit"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-031",
  "name": "Phoenix Contact Cross Reference Search",
  "url": "https://www.phoenixcontact.com/en-us/products/cross-reference-search",
  "domain": "phoenixcontact.com",
  "format": "HTML search tool",
  "access": "registration",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 91,
  "volumeScore": 82,
  "categories": [
   "Terminal blocks, automation, power supplies"
  ],
  "sections": [
   "Industrial Ethernet",
   "PCB connectors",
   "PLC I/O",
   "Power supplies",
   "Relays",
   "Surge protection",
   "Terminal blocks"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-032",
  "name": "Signify / Advance Ballast Cross Reference Guides",
  "url": "https://www.signify.com/advance/en-us/solutions/ballasts",
  "domain": "signify.com",
  "format": "HTML download hub",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 91,
  "volumeScore": 85,
  "categories": [
   "Lighting"
  ],
  "sections": [
   "Automotive bulbs",
   "Emergency lighting",
   "Fluorescent ballasts",
   "HID ballasts",
   "LED drivers",
   "Lamp replacements",
   "TLED retrofit"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-033",
  "name": "TE Connectivity Product Cross Reference",
  "url": "https://www.te.com/commerce/pcr/",
  "domain": "te.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 91,
  "volumeScore": 86,
  "categories": [
   "Connectors"
  ],
  "sections": [
   "Backshells",
   "Board-to-board",
   "Cable assemblies",
   "Circular",
   "RF/coax",
   "Rectangular",
   "Terminals/contacts",
   "Wire-to-board"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-034",
  "name": "WAGO Cross Reference Search",
  "url": "https://www.wago.com/us/crossreferences",
  "domain": "wago.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 91,
  "volumeScore": 82,
  "categories": [
   "Terminal blocks and connectors"
  ],
  "sections": [
   "DIN rail terminal blocks",
   "I/O terminals",
   "Jumpers/markers",
   "Lever connectors",
   "PCB terminal blocks",
   "Power terminals",
   "Relays/interfaces"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-035",
  "name": "Omron Cross Reference List - Relay series",
  "url": "https://components.omron.com/us-en/technical-support/cross-reference/cross-re...",
  "domain": "components.omron.com",
  "format": "HTML cross-reference list/tables",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 90,
  "volumeScore": 80,
  "categories": [
   "Relays, switches, connectors, sensors"
  ],
  "sections": [
   "Automotive switches",
   "Connectors",
   "Optical sensors",
   "Relay series",
   "Tactile switches"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-036",
  "name": "Leviton Quick Search Cross-Reference",
  "url": "https://leviton.idea4industry.com/",
  "domain": "leviton.idea4industry.com",
  "format": "HTML app/tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 90,
  "volumeScore": 82,
  "categories": [
   "Wiring devices and datacom"
  ],
  "sections": [
   "EV charging devices",
   "GFCI/AFCI",
   "Industrial devices",
   "Network jacks",
   "Patch panels",
   "Receptacles",
   "Switches"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-037",
  "name": "Belden Connector Cross Reference",
  "url": "https://tools.belden.com/connector-cross-reference/",
  "domain": "tools.belden.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 90,
  "volumeScore": 78,
  "categories": [
   "Cable connectors"
  ],
  "sections": [
   "Audio/video connectors",
   "Belden compatible connectors",
   "Broadcast cable connectors",
   "CCTV/security connectors",
   "Coax connectors",
   "Fiber connectors",
   "Industrial Ethernet connectors",
   "Industrial cable connectors",
   "Network cable connectors",
   "RJ45 connectors"
  ],
  "recordCount": 11,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-038",
  "name": "PIP Interactive Cross-Reference",
  "url": "https://us.pipglobal.com/en/cross-reference/",
  "domain": "us.pipglobal.com",
  "format": "HTML interactive tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 90,
  "volumeScore": 84,
  "categories": [
   "Hand protection and PPE"
  ],
  "sections": [
   "Chemical gloves",
   "Coated gloves",
   "Cold/weather gloves",
   "Cut-resistant gloves",
   "Disposable gloves",
   "Sleeves"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-039",
  "name": "Alpha Wire Cross Reference Guide PDF",
  "url": "https://www.alphawire.com/-/media/project/alphawire/alphawire/content/competi...",
  "domain": "alphawire.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 90,
  "volumeScore": 88,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Control cable",
   "Electronic cable",
   "Fire alarm cable",
   "Instrumentation cable",
   "Low-voltage cable",
   "Security cable",
   "Tray cable",
   "VFD/motor cable"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-040",
  "name": "Eaton Crouse-Hinds MTL Obsolete Cross Reference",
  "url": "https://www.eaton.com/us/en-us/support/education-training/process-safety-mtl-...",
  "domain": "eaton.com",
  "format": "HTML list/tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 90,
  "volumeScore": 70,
  "categories": [
   "Process safety"
  ],
  "sections": [
   "MTL discontinued/obsolete products"
  ],
  "recordCount": 2,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-041",
  "name": "Genetec Supported Device List - Cameras",
  "url": "https://www.genetec.com/supported-device-list",
  "domain": "genetec.com",
  "format": "HTML supported device list",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingestible",
  "qualityScore": 90,
  "volumeScore": 86,
  "categories": [
   "Video/access control compatibility"
  ],
  "sections": [
   "Cameras",
   "Cloud devices",
   "Encoders",
   "Intercoms",
   "Storage devices"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-042",
  "name": "Hubbell Wiegmann Part Cross Reference",
  "url": "https://www.hubbell.com/wiegmann/en/part-cross-reference",
  "domain": "hubbell.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 90,
  "volumeScore": 78,
  "categories": [
   "Enclosures"
  ],
  "sections": [
   "Climate control",
   "Freestanding enclosures",
   "Junction boxes",
   "NEMA 4X",
   "Panels",
   "Stainless enclosures",
   "Wall-mount enclosures"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-043",
  "name": "Mersen Pocket Cross Reference Guide",
  "url": "https://www.mersen.com/sites/default/files/files_imported_ep/BR-Pocket-Cross-...",
  "domain": "mersen.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingested",
  "qualityScore": 90,
  "volumeScore": 82,
  "categories": [
   "Circuit protection"
  ],
  "sections": [
   "Class CC fuses",
   "Class J fuses",
   "Class RK fuses",
   "Disconnect switches",
   "Fuse holders/blocks",
   "Medium-voltage fuses",
   "Midget fuses",
   "Semiconductor fuses"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true,
  "ingestNote": "16 SKU-level pairs extracted (fuses) on 2026-06-11"
 },
 {
  "id": "xref-src-044",
  "name": "Mersen Amp-Trap 2000 Cross Reference Chart",
  "url": "https://www.mersen.com/sites/default/files/files_imported_ep/CHT-Fuse-Cross-R...",
  "domain": "mersen.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingested",
  "qualityScore": 90,
  "volumeScore": 75,
  "categories": [
   "Circuit protection"
  ],
  "sections": [
   "Class CC fuses",
   "Class J fuses",
   "Class RK fuses",
   "Fuse holders/blocks",
   "Medium-voltage fuses",
   "Midget fuses",
   "Semiconductor fuses"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true,
  "ingestNote": "7 SKU-level pairs extracted (fuses) on 2026-06-11"
 },
 {
  "id": "xref-src-045",
  "name": "Omron Cross Reference",
  "url": "https://components.omron.com/us-en/technical-support/cross-reference",
  "domain": "components.omron.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 89,
  "volumeScore": 78,
  "categories": [
   "Relays, switches, connectors",
   "Relays, switches, connectors, sensors"
  ],
  "sections": [
   "Connectors",
   "Limit switches",
   "Microswitches",
   "PCB relays",
   "Power relays",
   "Sensors",
   "Signal relays",
   "Sockets",
   "Switches"
  ],
  "recordCount": 12,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-046",
  "name": "Carol Electronics to Belden Cross Reference Guide",
  "url": "https://na.prysmian.com/sites/default/files/atoms/files/ELE-0003-0720_Carol-E...",
  "domain": "na.prysmian.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingested",
  "qualityScore": 89,
  "volumeScore": 85,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Control cable",
   "Electronic cable",
   "Fire alarm cable",
   "Instrumentation cable",
   "Low-voltage cable",
   "Security cable",
   "Tray cable",
   "VFD/motor cable"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true,
  "ingestNote": "4 SKU-level pairs extracted (cable) on 2026-06-11"
 },
 {
  "id": "xref-src-047",
  "name": "Prysmian Datacom Cable Catalog Cross Reference",
  "url": "https://na.prysmian.com/sites/na.prysmian.com/files/2025-01/DAT-0001-0324_Dat...",
  "domain": "na.prysmian.com",
  "format": "PDF catalog/table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 89,
  "volumeScore": 82,
  "categories": [
   "Cable"
  ],
  "sections": [
   "AV cable",
   "DMX/control cable",
   "Ethernet cable",
   "Fiber optic cable",
   "Fire alarm cable",
   "Low-skew cable",
   "Security/control cable",
   "UTP copper"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-048",
  "name": "Amphenol CS Cross Reference Search",
  "url": "https://www.amphenol-cs.com/crossreference",
  "domain": "amphenol-cs.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 89,
  "volumeScore": 75,
  "categories": [
   "Connectors"
  ],
  "sections": [
   "Backshells",
   "Board-to-board",
   "Circular",
   "RF/coax",
   "Rectangular",
   "Terminals/contacts",
   "Wire-to-board"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-049",
  "name": "Amphenol RF Competitor Cross Reference",
  "url": "https://www.amphenolrf.com/en-us/engineering-center/engineering-resources/com...",
  "domain": "amphenolrf.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 89,
  "volumeScore": 74,
  "categories": [
   "RF connectors"
  ],
  "sections": [
   "BNC/TNC",
   "MCX/MMCX",
   "N-Type",
   "RF adapters",
   "RF cable assemblies",
   "SMA/SMB"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-050",
  "name": "IDEC Product Cross Reference",
  "url": "https://www.idec.com/en-us/content/resources-documents/product-cross-reference",
  "domain": "idec.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 89,
  "volumeScore": 78,
  "categories": [
   "Industrial controls and safety"
  ],
  "sections": [
   "Emergency stops",
   "Light curtains",
   "PLC/HMI",
   "Pilot devices",
   "Relays",
   "Safety relays",
   "Sensors"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-051",
  "name": "SYLVANIA QUICKCROSS",
  "url": "https://assets3.ledvanceus.com/media/resource/original/asset-13111858",
  "domain": "assets3.ledvanceus.com",
  "format": "PDF guide",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingested",
  "qualityScore": 88,
  "volumeScore": 82,
  "categories": [
   "Lighting"
  ],
  "sections": [
   "Automotive bulbs",
   "Emergency lighting",
   "Fluorescent ballasts",
   "HID ballasts",
   "LED drivers",
   "Lamp replacements",
   "TLED retrofit"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false,
  "ingestNote": "13 SKU-level pairs extracted (lighting) on 2026-06-11"
 },
 {
  "id": "xref-src-052",
  "name": "NSI Polaris Pin/Splice/Tap Cross Reference PDF - Compression splices",
  "url": "https://globalresourceswebsite.blob.core.windows.net/productshopify/NSI-WRD9/...",
  "domain": "globalresourceswebsite.blob.core.windows.net",
  "format": "PDF cross-reference table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 76,
  "categories": [
   "Connectors, lugs, taps"
  ],
  "sections": [
   "Compression splices",
   "Mechanical adapters",
   "Pin terminals",
   "Set-screw connectors",
   "Taps"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-053",
  "name": "Hanwha Vision Mount Selector - Camera mounts",
  "url": "https://hanwhavisionamerica.com/resources/tools/accessory-and-mount-selector/",
  "domain": "hanwhavisionamerica.com",
  "format": "Excel worksheet/tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 76,
  "categories": [
   "Video surveillance accessories"
  ],
  "sections": [
   "Adapters",
   "Camera mounts",
   "Gangbox compatibility",
   "Optional accessories",
   "Wall/ceiling mounts"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-054",
  "name": "NSI Cross-Reference Tool - Polaris insulated connectors",
  "url": "https://nsiindustries.com/resources/cross-reference/",
  "domain": "nsiindustries.com",
  "format": "HTML cross-reference tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 80,
  "categories": [
   "Connectors, lugs, taps"
  ],
  "sections": [
   "Grounding products",
   "Mechanical lugs",
   "Polaris insulated connectors",
   "Splices",
   "Time controls"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-055",
  "name": "Eaton/Tripp Lite UPS Battery Finder - SmartOnline replacement batteries",
  "url": "https://tripplite.eaton.com/products/battery-finder",
  "domain": "tripplite.eaton.com",
  "format": "HTML battery finder",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 78,
  "categories": [
   "UPS replacement batteries"
  ],
  "sections": [
   "LCD UPS batteries",
   "Major brand UPS battery finder",
   "Rackmount UPS batteries",
   "SmartOnline replacement batteries",
   "SmartPro replacement batteries"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-056",
  "name": "3M Respirator Selection Center - Reusable respirators",
  "url": "https://www.3m.com/3M/en_US/respiratory-protection-us/support/center-for-resp...",
  "domain": "3m.com",
  "format": "HTML selector/reference hub",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 80,
  "categories": [
   "Respiratory protection"
  ],
  "sections": [
   "Cartridge selection",
   "Chemical hazards",
   "PAPR considerations",
   "Particulate hazards",
   "Reusable respirators"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-057",
  "name": "APC UPS Replacement Batteries Product Selector - APC Replacement Battery Cart...",
  "url": "https://www.apc.com/us/en/product-subcategory/88979-ups-replacement-batteries/",
  "domain": "apc.com",
  "format": "HTML product selector",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 80,
  "categories": [
   "UPS replacement batteries"
  ],
  "sections": [
   "APC Replacement Battery Cartridges",
   "Back-UPS batteries",
   "On-line UPS batteries",
   "RBC lifecycle",
   "Smart-UPS batteries"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-058",
  "name": "Philips InstantFit Ballast Compatibility Guide",
  "url": "https://www.assets.signify.com/is/content/PhilipsLighting/Assets/philips-ligh...",
  "domain": "assets.signify.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 82,
  "categories": [
   "Lighting"
  ],
  "sections": [
   "Automotive bulbs",
   "Emergency lighting",
   "Fluorescent ballasts",
   "HID ballasts",
   "LED drivers",
   "Lamp replacements",
   "TLED retrofit"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-059",
  "name": "Philips Advance ULT Cross Reference Guide",
  "url": "https://www.assets.signify.com/is/content/Signify/Assets/advance/20190931-cro...",
  "domain": "assets.signify.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingested",
  "qualityScore": 88,
  "volumeScore": 80,
  "categories": [
   "Lighting"
  ],
  "sections": [
   "Automotive bulbs",
   "Emergency lighting",
   "Fluorescent ballasts",
   "HID ballasts",
   "LED drivers",
   "Lamp replacements",
   "TLED retrofit"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true,
  "ingestNote": "37 SKU-level pairs extracted (lighting) on 2026-06-11"
 },
 {
  "id": "xref-src-060",
  "name": "ETC Cable Cross Database",
  "url": "https://www.etcconnect.com/cablecross/",
  "domain": "etcconnect.com",
  "format": "HTML database/table",
  "access": "free",
  "kind": "api-database",
  "ingestStatus": "requires-api-key",
  "qualityScore": 88,
  "volumeScore": 84,
  "categories": [
   "Cable"
  ],
  "sections": [
   "AV cable",
   "DMX/control cable",
   "Ethernet cable",
   "Fiber optic cable",
   "Fire alarm cable",
   "Low-skew cable",
   "Security/control cable",
   "UTP copper"
  ],
  "recordCount": 9,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-061",
  "name": "Genetec Security Center Supported Hardware PDF - Serial devices",
  "url": "https://www.genetec.com/binaries/content/assets/genetec/en-genetec-security-c...",
  "domain": "genetec.com",
  "format": "PDF compatibility matrix",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 82,
  "categories": [
   "Video/access control compatibility"
  ],
  "sections": [
   "Access controllers",
   "Cameras",
   "Firmware/version notes",
   "Keypads",
   "Serial devices"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-062",
  "name": "Genetec Security Center SaaS Supported Devices PDF - Direct-to-cloud cameras",
  "url": "https://www.genetec.com/binaries/content/assets/genetec/security-center-saas-...",
  "domain": "genetec.com",
  "format": "PDF compatibility matrix",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 78,
  "categories": [
   "Cloud security compatibility"
  ],
  "sections": [
   "Access controllers",
   "Connection type",
   "Direct-to-cloud cameras",
   "Firmware compatibility",
   "Synergis Cloud Link"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-063",
  "name": "Hoffman to Hammond Cross Reference",
  "url": "https://www.hammfg.com/pdf/Hoffman2HammondXRef.pdf",
  "domain": "hammfg.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingested",
  "qualityScore": 88,
  "volumeScore": 86,
  "categories": [
   "Enclosures"
  ],
  "sections": [
   "Accessories",
   "Climate control",
   "Disconnect enclosures",
   "Freestanding enclosures",
   "Junction boxes",
   "Mild steel wall-mount",
   "NEMA 4X",
   "Panels",
   "Stainless enclosures",
   "Wall-mount enclosures"
  ],
  "recordCount": 14,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false,
  "ingestNote": "17 SKU-level pairs extracted (enclosures) on 2026-06-11"
 },
 {
  "id": "xref-src-064",
  "name": "Hikvision Bracket Cross Reference List",
  "url": "https://www.hikvision.com/us-en/products/Accessories/Bracket-Cross-Reference-...",
  "domain": "hikvision.com",
  "format": "HTML table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 72,
  "categories": [
   "Video surveillance"
  ],
  "sections": [
   "Camera brackets",
   "Junction boxes",
   "PTZ accessories",
   "Pole mounts",
   "Wall mounts"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-065",
  "name": "Milestone Supported Devices - IP cameras",
  "url": "https://www.milestonesys.com/community/business-partner-tools/supported-devices/",
  "domain": "milestonesys.com",
  "format": "HTML device compatibility database",
  "access": "free",
  "kind": "api-database",
  "ingestStatus": "requires-api-key",
  "qualityScore": 88,
  "volumeScore": 86,
  "categories": [
   "VMS/device compatibility"
  ],
  "sections": [
   "Device packs",
   "Encoders",
   "Firmware/driver support",
   "IP cameras",
   "VMS licensing"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-066",
  "name": "West Penn Wire Cross Reference - Security cable",
  "url": "https://www.westpennwire.com/cross-reference.php",
  "domain": "westpennwire.com",
  "format": "HTML cross-reference tool/table",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 88,
  "volumeScore": 82,
  "categories": [
   "Low-voltage wire and cable"
  ],
  "sections": [
   "AV cable",
   "Audio/speaker cable",
   "Fire alarm cable",
   "Networking cable",
   "Security cable"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-067",
  "name": "Ansell Chemical Resistance Guide",
  "url": "https://cdn.mscdirect.com/global/media/pdf/search/ansell/ansell-chemical-glov...",
  "domain": "cdn.mscdirect.com",
  "format": "PDF compatibility table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 87,
  "volumeScore": 78,
  "categories": [
   "Hand protection"
  ],
  "sections": [
   "ANSI cut levels",
   "Chemical gloves",
   "Coated gloves",
   "Cut-resistant gloves",
   "Leather gloves",
   "Nitrile gloves",
   "Sleeves"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-068",
  "name": "Curtis Industries Terminal Block Cross Reference",
  "url": "https://www.curtisind.com/terminal-block-cross-reference/",
  "domain": "curtisind.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 87,
  "volumeScore": 76,
  "categories": [
   "Terminal blocks"
  ],
  "sections": [
   "Barrier blocks",
   "DIN terminal blocks",
   "Distribution blocks",
   "Euroblocks",
   "Fuse terminal blocks",
   "PCB terminal blocks"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-069",
  "name": "Leviton Selector Tools - Manufacturer cross-reference",
  "url": "https://leviton.com/support/partners/contractors/selector-tools",
  "domain": "leviton.com",
  "format": "HTML tool hub",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 78,
  "categories": [
   "Wiring devices and controls"
  ],
  "sections": [
   "LEV Series pin and sleeve",
   "Lev-Lok savings/calculator",
   "Lighting controls",
   "Manufacturer cross-reference",
   "Network solutions selectors"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-070",
  "name": "Rockwell Bulletin 100-D/G to 100-E Migration Profile - 100-D contactors",
  "url": "https://literature.rockwellautomation.com/idc/groups/literature/documents/pp/...",
  "domain": "literature.rockwellautomation.com",
  "format": "PDF migration table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingested",
  "qualityScore": 86,
  "volumeScore": 68,
  "categories": [
   "Contactors and starters",
   "Motor protection/circuit breakers",
   "NEMA contactors/starters"
  ],
  "sections": [
   "100-D contactors",
   "100-E replacements",
   "100-G contactors",
   "Auxiliary options",
   "Coil voltage conversion",
   "Coil voltage mapping",
   "Direct replacement classes",
   "Direct replacement notes",
   "Discontinued products",
   "Enclosed MPCBs",
   "Modernization notes",
   "Motor protection",
   "NEMA size mapping",
   "Panel hardware",
   "Starter migration"
  ],
  "recordCount": 16,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true,
  "ingestNote": "2 SKU-level pairs extracted (controls) on 2026-06-11"
 },
 {
  "id": "xref-src-071",
  "name": "Acre Access Control Reader Compatibility Chart",
  "url": "https://products.acresecurity.com/access-control-reader-compatibility-chart-p...",
  "domain": "products.acresecurity.com",
  "format": "HTML chart/tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 74,
  "categories": [
   "Access control"
  ],
  "sections": [
   "Controllers",
   "Credentials",
   "Ethernet switches",
   "Power supplies",
   "Readers",
   "SFPs"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-072",
  "name": "Cisco Transceiver Module Compatibility Matrix - SFP",
  "url": "https://tmgmatrix.cisco.com/",
  "domain": "tmgmatrix.cisco.com",
  "format": "Web compatibility matrix",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingestible",
  "qualityScore": 86,
  "volumeScore": 80,
  "categories": [
   "Optical transceivers"
  ],
  "sections": [
   "DAC/AOC",
   "QSFP",
   "SFP",
   "SFP+",
   "Switch family compatibility"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-073",
  "name": "Eaton UPS Selector Replace Tool - Battery replacement",
  "url": "https://upsselector.eaton.com/Replace",
  "domain": "upsselector.eaton.com",
  "format": "HTML selector tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 74,
  "categories": [
   "UPS replacement batteries"
  ],
  "sections": [
   "Battery replacement",
   "Power rating selection",
   "Rack/tower UPS",
   "Runtime matching",
   "UPS replacement"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-074",
  "name": "3M Cartridges and Filters Catalog - Bayonet filters",
  "url": "https://www.3m.com/3M/en_US/p/c/ppe/respiratory-protection/reusable-respirato...",
  "domain": "3m.com",
  "format": "HTML product catalog with compatibility filters",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 86,
  "volumeScore": 76,
  "categories": [
   "Respiratory protection"
  ],
  "sections": [
   "Bayonet filters",
   "Compatible respirators",
   "Gas/vapor cartridges",
   "Particulate filters",
   "Secure Click filters"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-075",
  "name": "Atkore Online Tools - Cable cleats selector",
  "url": "https://www.atkore.com/resources/online-tools",
  "domain": "atkore.com",
  "format": "HTML tools/selectors",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 76,
  "categories": [
   "Conduit, cable tray, strut, cable cleats"
  ],
  "sections": [
   "Cable cleats selector",
   "Cable tray supports",
   "Conduit fill/labor tools",
   "Strut families",
   "Wire basket hardware calculator"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-076",
  "name": "Axis Accessory Selector - Camera mounts",
  "url": "https://www.axis.com/support/tools/accessory-selector",
  "domain": "axis.com",
  "format": "HTML accessory selector",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 76,
  "categories": [
   "Video surveillance accessories"
  ],
  "sections": [
   "Camera mounts",
   "Explosion-protected accessories",
   "Housings",
   "Lens/accessory matching",
   "Power accessories"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-077",
  "name": "ILSCO Product Cross Reference - Compression lugs",
  "url": "https://www.ilsco.com/Ilsco/ccrz__CCPage?pageKey=PCR",
  "domain": "ilsco.com",
  "format": "HTML cross-reference form",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 74,
  "categories": [
   "Connectors, lugs, grounding"
  ],
  "sections": [
   "Compression lugs",
   "Grounding",
   "Mechanical lugs",
   "Splices",
   "Tools/dies"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-078",
  "name": "MacLean Power Systems Cross Reference - Pole-line hardware",
  "url": "https://www.macleanpower.com/cross-reference",
  "domain": "macleanpower.com",
  "format": "HTML cross-reference/search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 72,
  "categories": [
   "Utility hardware"
  ],
  "sections": [
   "Anchors",
   "Distribution hardware",
   "Insulators",
   "Pole-line hardware",
   "Safety products"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-079",
  "name": "nVent ERIFLEX Flexibar Cross Reference Table - Flexibar PVC",
  "url": "https://www.nvent.com/sites/default/files/dam//h86684-usen.pdf",
  "domain": "nvent.com",
  "format": "PDF cross-reference table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingestible",
  "qualityScore": 86,
  "volumeScore": 64,
  "categories": [
   "Power distribution components"
  ],
  "sections": [
   "Control panel power",
   "Flexibar PVC",
   "Power distribution blocks",
   "Replacement/phase-out ranges",
   "Tinned copper flexibar"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-080",
  "name": "Penn-Union Product Cross-Reference Tool - Compression connectors",
  "url": "https://www.penn-union.com/cross-reference/",
  "domain": "penn-union.com",
  "format": "HTML cross-reference tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 74,
  "categories": [
   "Connectors, lugs, grounding"
  ],
  "sections": [
   "Cable accessories",
   "Compression connectors",
   "Grounding",
   "Mechanical connectors",
   "Splices"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-081",
  "name": "Priority Wire Specialty Wire Item Cross Reference",
  "url": "https://www.prioritywire.com/item_cross_ref.php",
  "domain": "prioritywire.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 76,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Control cable",
   "Electronic cable",
   "Fire alarm cable",
   "Instrumentation cable",
   "Low-voltage cable",
   "Security cable",
   "Tray cable"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-082",
  "name": "SATCO LED T8 Ballast Compatibility Chart - Instant-start ballasts",
  "url": "https://www.satco.com/website_pdfs/Satco_LEDT8_BallastCompatibilityChart_M.pdf",
  "domain": "satco.com",
  "format": "PDF compatibility table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingestible",
  "qualityScore": 86,
  "volumeScore": 76,
  "categories": [
   "LED lamps and ballast compatibility"
  ],
  "sections": [
   "Ballast factor matching",
   "Emergency ballasts",
   "Instant-start ballasts",
   "Rapid-start ballasts",
   "T8 LED tubes"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-083",
  "name": "Schneider Universal Enclosures Cross Reference",
  "url": "https://www.se.com/us/en/download/document/9993BR1801R02_19/",
  "domain": "se.com",
  "format": "PDF/handout download page",
  "access": "free",
  "kind": "document",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 86,
  "volumeScore": 62,
  "categories": [
   "Enclosures"
  ],
  "sections": [
   "Freestanding enclosures",
   "Junction boxes",
   "NEMA 4X",
   "Stainless enclosures",
   "Wall-mount enclosures"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-084",
  "name": "Vertiv GXT5 Replacement Battery Kits - GXT5-36VBATKIT",
  "url": "https://www.vertiv.com/en-emea/products/critical-power/ups/gxt5-accessories/r...",
  "domain": "vertiv.com",
  "format": "HTML compatibility table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 86,
  "volumeScore": 68,
  "categories": [
   "UPS replacement batteries"
  ],
  "sections": [
   "GXT5-192VBATKIT",
   "GXT5-36VBATKIT",
   "GXT5-384VBATKIT",
   "GXT5-48VBATKIT",
   "GXT5-72VBATKIT"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-085",
  "name": "Appleton / Emerson Cross Reference",
  "url": "https://www.appleton.emerson.com/solahd",
  "domain": "appleton.emerson.com",
  "format": "HTML tool/link",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 85,
  "volumeScore": 70,
  "categories": [
   "Power, hazardous location and industrial electrical"
  ],
  "sections": [
   "Appleton fittings",
   "Hazardous location enclosures",
   "Lighting",
   "Receptacles",
   "SolaHD power supplies",
   "Transformers"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-086",
  "name": "Majestic Glove Cut-Resistant Comparison Tool",
  "url": "https://www.majesticglove.com/comparison",
  "domain": "majesticglove.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 85,
  "volumeScore": 74,
  "categories": [
   "Hand protection"
  ],
  "sections": [
   "Chemical gloves",
   "Coated gloves",
   "Cut-resistant gloves",
   "Leather gloves",
   "Nitrile gloves",
   "Sleeves"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-087",
  "name": "MSA Gas Detection Handbook - Combustible gas",
  "url": "https://assetlibrary.msasafety.com/m/3047d802291b5f5d/original/MSA-Gas-Detect...",
  "domain": "assetlibrary.msasafety.com",
  "format": "PDF handbook/reference tables",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 70,
  "categories": [
   "Gas detection"
  ],
  "sections": [
   "Calibration reference",
   "Combustible gas",
   "Exposure limits",
   "Sensor principles",
   "Toxic gas"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-088",
  "name": "Belden to General Cable Carol Cross Reference Index",
  "url": "https://docs.galco.com/techdoc/gncc/wire_hookup_cr.pdf",
  "domain": "docs.galco.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingested",
  "qualityScore": 84,
  "volumeScore": 84,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Control cable",
   "Electronic cable",
   "Fire alarm cable",
   "Instrumentation cable",
   "Low-voltage cable",
   "Security cable",
   "Tray cable"
  ],
  "recordCount": 8,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false,
  "ingestNote": "4 SKU-level pairs extracted (cable) on 2026-06-11"
 },
 {
  "id": "xref-src-089",
  "name": "Olympic Wire Competitor Cross Reference Guide - Alpha equivalents",
  "url": "https://olympicwire.com/pages/competitor-cross-reference-guide",
  "domain": "olympicwire.com",
  "format": "HTML cross-reference guide",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingestible",
  "qualityScore": 84,
  "volumeScore": 70,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Alpha equivalents",
   "Belden equivalents",
   "Control cable",
   "General Cable equivalents",
   "Instrumentation cable"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-090",
  "name": "Preformed Line Products Verizon Cross-Reference Catalog - Fiber optic closures",
  "url": "https://plp.com/images/pdfs/CO-ML-1298-2_Verizon_Cross-Ref_Cat.pdf",
  "domain": "plp.com",
  "format": "PDF catalog/cross-reference",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingestible",
  "qualityScore": 84,
  "volumeScore": 70,
  "categories": [
   "Fiber/copper/overhead products"
  ],
  "sections": [
   "ADSS hardware",
   "Copper closures",
   "Fiber optic closures",
   "MMID/SSI mappings",
   "Overhead hardware"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-091",
  "name": "Sentinel Connector Cable Cross Reference Guide",
  "url": "https://sentinelconn.com/plug-criteria-guide/cable-cross-reference-guide/",
  "domain": "sentinelconn.com",
  "format": "HTML guide/table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingestible",
  "qualityScore": 84,
  "volumeScore": 78,
  "categories": [
   "Structured cable/connectors"
  ],
  "sections": [
   "AV/control cable",
   "Cable-to-plug compatibility",
   "Category cable",
   "Patch cords",
   "RJ45 plugs"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-092",
  "name": "AutomationDirect PLC Part Number Cross-Reference",
  "url": "https://support.automationdirect.com/docs/xref.html",
  "domain": "support.automationdirect.com",
  "format": "HTML table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingestible",
  "qualityScore": 84,
  "volumeScore": 68,
  "categories": [
   "PLCs and automation"
  ],
  "sections": [
   "Communications modules",
   "I/O modules",
   "Legacy PLC CPUs",
   "Power supplies",
   "Programming software"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-093",
  "name": "Ansell Glove Finder",
  "url": "https://www.ansell.com/us/en/glove-finder",
  "domain": "ansell.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 72,
  "categories": [
   "Hand protection"
  ],
  "sections": [
   "Chemical gloves",
   "Coated gloves",
   "Cut protection",
   "Cut-resistant gloves",
   "Disposable gloves",
   "Leather gloves",
   "Mechanical protection",
   "Nitrile gloves",
   "Sleeves",
   "Thermal protection"
  ],
  "recordCount": 12,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-094",
  "name": "Axis Camera Station Device Compatibility Tool - Third-party cameras",
  "url": "https://www.axis.com/products/axis-camera-station-device-compatibility-tool",
  "domain": "axis.com",
  "format": "Tool/download compatibility database",
  "access": "free",
  "kind": "api-database",
  "ingestStatus": "requires-api-key",
  "qualityScore": 84,
  "volumeScore": 70,
  "categories": [
   "VMS/device compatibility"
  ],
  "sections": [
   "AXIS Camera Station 5+",
   "Device firmware",
   "Encoders",
   "ONVIF devices",
   "Third-party cameras"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-095",
  "name": "Axis Product Selector - Network cameras",
  "url": "https://www.axis.com/support/tools/product-selector",
  "domain": "axis.com",
  "format": "HTML selector tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 78,
  "categories": [
   "Video surveillance/access/audio"
  ],
  "sections": [
   "Access control",
   "Accessories",
   "Intercoms",
   "Network audio",
   "Network cameras"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-096",
  "name": "Legrand AV Chief Mount Finder - Flat-panel mounts",
  "url": "https://www.legrandav.com/tools_and_training/tools/mountfinder",
  "domain": "legrandav.com",
  "format": "HTML compatibility finder",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 72,
  "categories": [
   "Mounts and display accessories"
  ],
  "sections": [
   "Accessory compatibility",
   "Ceiling mounts",
   "Flat-panel mounts",
   "Projector mounts",
   "Video wall mounts"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-097",
  "name": "Lutron Archive CFL/LED Bulb List - CFL compatibility",
  "url": "https://www.lutron.com/ArchiveCFLLEDBulblist",
  "domain": "lutron.com",
  "format": "PDF compatibility list",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingestible",
  "qualityScore": 84,
  "volumeScore": 72,
  "categories": [
   "Lighting controls"
  ],
  "sections": [
   "Bulb-to-dimmer lookup",
   "CFL compatibility",
   "Dimmer-to-bulb mapping",
   "LED compatibility",
   "UL-tested notes"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-098",
  "name": "Nexperia Cross Reference - Diodes",
  "url": "https://www.nexperia.com/products/cross-reference",
  "domain": "nexperia.com",
  "format": "HTML cross-reference/search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 76,
  "categories": [
   "Discrete semiconductors"
  ],
  "sections": [
   "Diodes",
   "ESD protection",
   "Logic",
   "MOSFETs",
   "Transistors"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-099",
  "name": "onsemi Cross Reference - Discrete semiconductors",
  "url": "https://www.onsemi.com/support/cross-reference",
  "domain": "onsemi.com",
  "format": "HTML cross-reference/search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 78,
  "categories": [
   "Semiconductors"
  ],
  "sections": [
   "Analog/power ICs",
   "Diodes",
   "Discrete semiconductors",
   "Power MOSFETs",
   "Sensors"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-100",
  "name": "OptiFuse Cross Reference",
  "url": "https://www.optifuse.com/cross-reference/",
  "domain": "optifuse.com",
  "format": "HTML search tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 75,
  "categories": [
   "Circuit protection"
  ],
  "sections": [
   "Class CC fuses",
   "Class J fuses",
   "Class RK fuses",
   "Medium-voltage fuses",
   "Midget fuses",
   "Semiconductor fuses"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-101",
  "name": "Panduit Aerospace/Military Cable Tie Cross Reference PDF - MS3367 equivalents",
  "url": "https://www.panduit.com/content/dam/panduit/en/products/media/7/47/047/0047/4...",
  "domain": "panduit.com",
  "format": "PDF cross-reference table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 68,
  "categories": [
   "Cable ties and identification"
  ],
  "sections": [
   "Barb Ty",
   "MS3367 equivalents",
   "MS3368 equivalents",
   "Pan-Ty",
   "Sta-Strap"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-102",
  "name": "PULS Power Supplies Competitor Cross Reference",
  "url": "https://www.rmelecspec.com/wp-content/uploads/2016/09/Competitor-Cross-Refere...",
  "domain": "rmelecspec.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 72,
  "categories": [
   "Power supplies"
  ],
  "sections": [
   "DC-UPS",
   "DIN rail 24VDC",
   "Industrial transformers",
   "Redundancy modules",
   "Surge/line conditioning"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-103",
  "name": "Southwire Technical References - Cable installation",
  "url": "https://www.southwire.com/services/cabletech-support-services/Technical-Refer...",
  "domain": "southwire.com",
  "format": "HTML reference hub + PDFs",
  "access": "free",
  "kind": "document",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 84,
  "volumeScore": 82,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Ampacity/spec support",
   "Cable installation",
   "DLO cable",
   "Medium-voltage cable",
   "VFD cable application"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-104",
  "name": "STMicroelectronics Cross Reference - Microcontrollers",
  "url": "https://www.st.com/content/st_com/en/support/cross-reference.html",
  "domain": "st.com",
  "format": "HTML cross-reference/search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 78,
  "categories": [
   "Semiconductors"
  ],
  "sections": [
   "Analog",
   "Discrete power",
   "MEMS sensors",
   "Microcontrollers",
   "Power management"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-105",
  "name": "Watson Gloves Crossover Selector",
  "url": "https://www.watsongloves.com/crossover-form/",
  "domain": "watsongloves.com",
  "format": "HTML interactive selector/form",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 84,
  "volumeScore": 75,
  "categories": [
   "Hand protection"
  ],
  "sections": [
   "Chemical gloves",
   "Coated gloves",
   "Cut-resistant gloves",
   "Leather gloves",
   "Nitrile gloves",
   "Sleeves"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-106",
  "name": "Samtec Cross Reference Support",
  "url": "https://www.samtec.com/support/cross-reference/",
  "domain": "samtec.com",
  "format": "Request/support workflow",
  "access": "registration",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 83,
  "volumeScore": 60,
  "categories": [
   "Connectors"
  ],
  "sections": [
   "Wire-to-board"
  ],
  "recordCount": 2,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-107",
  "name": "AutomationDirect DINnectors Phoenix Contact Cross Reference",
  "url": "https://cdn.automationdirect.com/static/specs/dinxrefphoenix.pdf",
  "domain": "cdn.automationdirect.com",
  "format": "PDF table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "ingested",
  "qualityScore": 82,
  "volumeScore": 70,
  "categories": [
   "Terminal blocks"
  ],
  "sections": [
   "Barrier blocks",
   "DIN terminal blocks",
   "Euroblocks",
   "Fuse terminal blocks",
   "PCB terminal blocks"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false,
  "ingestNote": "4 SKU-level pairs extracted (controls) on 2026-06-11"
 },
 {
  "id": "xref-src-108",
  "name": "MSA ULTIMA X5000 Manual - Sensor setup",
  "url": "https://docs.msasafety.com/x5000/en-us/ULTIMA%20X5000%20Gas%20monitor/PDF/PDF...",
  "domain": "docs.msasafety.com",
  "format": "PDF manual/reference",
  "access": "free",
  "kind": "document",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 82,
  "volumeScore": 62,
  "categories": [
   "Fixed gas detection"
  ],
  "sections": [
   "Calibration gases",
   "Combustible gas cross-reference",
   "Replacement sensors",
   "Sensor setup",
   "Span value"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-109",
  "name": "Euroblock Terminal Block Cross Reference",
  "url": "https://euro-block.it/en/cross-reference",
  "domain": "euro-block.it",
  "format": "HTML tool/login",
  "access": "registration",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 82,
  "volumeScore": 70,
  "categories": [
   "Terminal blocks"
  ],
  "sections": [
   "Barrier blocks",
   "DIN terminal blocks",
   "Euroblocks",
   "Fuse terminal blocks",
   "PCB terminal blocks"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-110",
  "name": "Finder Relay Cross Reference - General purpose relays",
  "url": "https://www.findernet.com/en/worldwide/cross-reference/",
  "domain": "findernet.com",
  "format": "HTML cross-reference/search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 82,
  "volumeScore": 70,
  "categories": [
   "Relays"
  ],
  "sections": [
   "General purpose relays",
   "Industrial relays",
   "Interface relays",
   "Sockets",
   "Timers"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-111",
  "name": "Lake Cable Belden Broadcast Cross Reference - Broadcast coax",
  "url": "https://www.lakecable.com/belden-broadcast-cross-reference",
  "domain": "lakecable.com",
  "format": "HTML cross-reference table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingested",
  "qualityScore": 82,
  "volumeScore": 74,
  "categories": [
   "Broadcast and low-voltage cable"
  ],
  "sections": [
   "Access control",
   "Broadcast coax",
   "Building management cable",
   "Fire alarm",
   "SDI video"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false,
  "ingestNote": "2 SKU-level pairs extracted (cable) on 2026-06-11"
 },
 {
  "id": "xref-src-112",
  "name": "Milnec Connector Cross Reference",
  "url": "https://www.milnec.com/connector-cross-reference/",
  "domain": "milnec.com",
  "format": "HTML table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingestible",
  "qualityScore": 82,
  "volumeScore": 75,
  "categories": [
   "Connectors"
  ],
  "sections": [
   "Board-to-board",
   "Circular",
   "RF/coax",
   "Rectangular",
   "Terminals/contacts",
   "Wire-to-board"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-113",
  "name": "Murata Products Cross Reference - Capacitors",
  "url": "https://www.murata.com/en-us/tool/crossreference",
  "domain": "murata.com",
  "format": "HTML cross-reference/search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 82,
  "volumeScore": 74,
  "categories": [
   "Passives and RF components"
  ],
  "sections": [
   "Capacitors",
   "EMI filters",
   "Inductors",
   "RF modules",
   "Timing devices"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-114",
  "name": "nVent HOFFMAN CPQ Tools - PDU model selection",
  "url": "https://www.nvent.com/en-us/hoffman/cpq",
  "domain": "nvent.com",
  "format": "HTML CPQ/product selector tools",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 82,
  "volumeScore": 70,
  "categories": [
   "Enclosures and thermal management"
  ],
  "sections": [
   "Climate control selection",
   "Cooling accessories",
   "Enclosure configuration",
   "PDU model selection",
   "Rack/enclosure matching"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-115",
  "name": "Peerless-AV Mount Finder - TV/display mounts",
  "url": "https://www.peerless-av.com/pages/mountfinder",
  "domain": "peerless-av.com",
  "format": "HTML compatibility finder",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 82,
  "volumeScore": 70,
  "categories": [
   "Mounts and display accessories"
  ],
  "sections": [
   "Kiosk mounts",
   "Outdoor displays",
   "Projector mounts",
   "TV/display mounts",
   "Video wall mounting"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-116",
  "name": "Simplex Product Catalog",
  "url": "https://www.simplexfire.com/-/media/project/jci-global/fire-detection/simplex...",
  "domain": "simplexfire.com",
  "format": "PDF catalog",
  "access": "free",
  "kind": "document",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 82,
  "volumeScore": 70,
  "categories": [
   "Fire alarm"
  ],
  "sections": [
   "Bases",
   "Detectors",
   "Modules",
   "Notification appliances",
   "Panels"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": true
 },
 {
  "id": "xref-src-117",
  "name": "Southwire Manuals and Catalogs - Power cable manual",
  "url": "https://www.southwire.com/manuals-and-catalogs",
  "domain": "southwire.com",
  "format": "HTML download hub + PDFs",
  "access": "free",
  "kind": "document",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 82,
  "volumeScore": 80,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "ACSS/ACSS-TW guide",
   "Installation guides",
   "Power cable manual",
   "Product catalogs",
   "Specification matching"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-118",
  "name": "Vishay Cross Reference - Resistors",
  "url": "https://www.vishay.com/en/cross-reference/",
  "domain": "vishay.com",
  "format": "HTML cross-reference/search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 82,
  "volumeScore": 74,
  "categories": [
   "Discrete/passive components"
  ],
  "sections": [
   "Capacitors",
   "Diodes",
   "MOSFETs",
   "Optoelectronics",
   "Resistors"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-119",
  "name": "ADC Cable Cross Reference",
  "url": "https://adcable.com/technical-info/cable-cross-reference.html",
  "domain": "adcable.com",
  "format": "HTML table/tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 80,
  "volumeScore": 70,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Control cable",
   "Electronic cable",
   "Fire alarm cable",
   "Instrumentation cable",
   "Security cable"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-120",
  "name": "Hanwha DesignPro Accessory Compatibility - Compatible accessories",
  "url": "https://support.hanwhavision.com/hc/en-001/articles/47256875133459-DesignPro-...",
  "domain": "support.hanwhavision.com",
  "format": "HTML support article/tool workflow",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 80,
  "volumeScore": 68,
  "categories": [
   "Video surveillance design tools"
  ],
  "sections": [
   "Camera accessories",
   "Compatible accessories",
   "DesignPro workflow",
   "Device list",
   "Mount selection"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-121",
  "name": "LEDtronics Cross Reference Tool",
  "url": "https://web.ledtronics.com/cross_reference_tool",
  "domain": "web.ledtronics.com",
  "format": "HTML tool",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 80,
  "volumeScore": 75,
  "categories": [
   "Lighting"
  ],
  "sections": [
   "Automotive bulbs",
   "Fluorescent ballasts",
   "HID ballasts",
   "LED drivers",
   "Lamp replacements",
   "TLED retrofit"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-122",
  "name": "Consolidated Wire Cross-Reference Cable Guide",
  "url": "https://www.conwire.com/blog/cross-reference-wire-cable-guide/",
  "domain": "conwire.com",
  "format": "HTML/blog tool/guide",
  "access": "registration",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 80,
  "volumeScore": 70,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Control cable",
   "Electronic cable",
   "Fire alarm cable",
   "Instrumentation cable",
   "Security cable"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-123",
  "name": "Daburn Belden Cross Reference",
  "url": "https://www.daburn.com/belden-cross-reference.aspx",
  "domain": "daburn.com",
  "format": "HTML table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingestible",
  "qualityScore": 80,
  "volumeScore": 70,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Control cable",
   "Electronic cable",
   "Fire alarm cable",
   "Instrumentation cable",
   "Security cable"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-124",
  "name": "Keystone LED HID Replacement Lamps - Corn cob",
  "url": "https://www.keystonetech.com/all-products/lamps/led-hid-replacement",
  "domain": "keystonetech.com",
  "format": "HTML product hierarchy",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 80,
  "volumeScore": 78,
  "categories": [
   "LED HID replacement"
  ],
  "sections": [
   "Corn cob",
   "High-output corn cob",
   "Omni-directional",
   "PAR",
   "Vertical/horizontal lamps"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-125",
  "name": "Lake Cable Belden Cable Cross Reference",
  "url": "https://www.lakecable.com/belden-cable-cross-reference",
  "domain": "lakecable.com",
  "format": "HTML table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingested",
  "qualityScore": 80,
  "volumeScore": 72,
  "categories": [
   "Wire and cable"
  ],
  "sections": [
   "Control cable",
   "Electronic cable",
   "Fire alarm cable",
   "Instrumentation cable",
   "Security cable"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false,
  "ingestNote": "4 SKU-level pairs extracted (cable) on 2026-06-11"
 },
 {
  "id": "xref-src-126",
  "name": "Lake Cable General Cable Cross Reference - General Cable equivalents",
  "url": "https://www.lakecable.com/general-cable-cross-reference",
  "domain": "lakecable.com",
  "format": "HTML cross-reference table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingested",
  "qualityScore": 80,
  "volumeScore": 72,
  "categories": [
   "Low-voltage wire and cable"
  ],
  "sections": [
   "Control cable",
   "Fire alarm cable",
   "General Cable equivalents",
   "Instrumentation cable",
   "Security cable"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false,
  "ingestNote": "2 SKU-level pairs extracted (cable) on 2026-06-11"
 },
 {
  "id": "xref-src-127",
  "name": "Lake Cable West Penn Cross Reference - West Penn equivalents",
  "url": "https://www.lakecable.com/west-penn-cross-reference",
  "domain": "lakecable.com",
  "format": "HTML cross-reference table",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingestible",
  "qualityScore": 80,
  "volumeScore": 72,
  "categories": [
   "Low-voltage wire and cable"
  ],
  "sections": [
   "AV cable",
   "Fire alarm",
   "Security cable",
   "Speaker cable",
   "West Penn equivalents"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-128",
  "name": "LightBulbs.com Cross Reference Guide",
  "url": "https://www.lightbulbs.com/light-bulbs-cross-reference",
  "domain": "lightbulbs.com",
  "format": "HTML guide/database",
  "access": "free",
  "kind": "api-database",
  "ingestStatus": "requires-api-key",
  "qualityScore": 80,
  "volumeScore": 82,
  "categories": [
   "Lighting"
  ],
  "sections": [
   "Automotive bulbs",
   "Fluorescent ballasts",
   "HID ballasts",
   "LED drivers",
   "Lamp replacements",
   "TLED retrofit"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-129",
  "name": "Conversions Tech Cross-Reference Hub",
  "url": "https://conversionstech.com/pages/cross-reference-hub",
  "domain": "conversionstech.com",
  "format": "HTML hub",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 78,
  "volumeScore": 74,
  "categories": [
   "Connectors/lugs/terminals"
  ],
  "sections": [
   "Compression lugs",
   "Grounding connectors",
   "Mechanical lugs",
   "Splices",
   "Terminals"
  ],
  "recordCount": 6,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-130",
  "name": "Liberty AV Product Selectors - Bulk cable selector",
  "url": "https://secure.libertycable.com/",
  "domain": "secure.libertycable.com",
  "format": "Portal/product selector tools",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 78,
  "volumeScore": 76,
  "categories": [
   "AV cable and devices"
  ],
  "sections": [
   "Bulk cable selector",
   "Extender matrix",
   "Plate/panel selector",
   "Pre-made cable selector",
   "Wire schedule"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-131",
  "name": "Atkore Strut and Fittings - Channel",
  "url": "https://www.atkore.com/products/strut-and-fittings",
  "domain": "atkore.com",
  "format": "HTML product hierarchy",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 78,
  "volumeScore": 76,
  "categories": [
   "Strut and fittings"
  ],
  "sections": [
   "Channel",
   "Fittings",
   "Hardware",
   "Pipe clamps",
   "Seismic bracing"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-132",
  "name": "CommScope Product Type Catalog - Twisted-pair cables",
  "url": "https://www.commscope.com/product-type/",
  "domain": "commscope.com",
  "format": "HTML product hierarchy",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 78,
  "volumeScore": 86,
  "categories": [
   "Copper/fiber connectivity"
  ],
  "sections": [
   "Coaxial cable assemblies",
   "Fiber cable assemblies",
   "Patch panels",
   "Racks/cabinets",
   "Twisted-pair cables"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-133",
  "name": "CommScope SYSTIMAX Source - Cat 6A copper",
  "url": "https://www.commscope.com/systimax/",
  "domain": "commscope.com",
  "format": "HTML product hierarchy",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 78,
  "volumeScore": 76,
  "categories": [
   "Structured cabling"
  ],
  "sections": [
   "Cat 6A copper",
   "Data center cabling",
   "Fiber panels",
   "Intelligent infrastructure",
   "Patch cords"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-134",
  "name": "Middle Atlantic Configurator/Design Tools - Rack selection",
  "url": "https://www.legrandav.com/tools_and_training/tools",
  "domain": "legrandav.com",
  "format": "HTML tools hub",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 78,
  "volumeScore": 70,
  "categories": [
   "Racks and infrastructure"
  ],
  "sections": [
   "AV furniture",
   "Power distribution",
   "Rack accessories",
   "Rack selection",
   "Thermal management"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-135",
  "name": "nVent HOFFMAN Replacement and Spare Parts Catalog - Enclosure doors",
  "url": "https://www.nvent.com/sites/default/files/dam//hoffman-cat-h87645-replacement...",
  "domain": "nvent.com",
  "format": "PDF catalog/table",
  "access": "free",
  "kind": "pdf-table",
  "ingestStatus": "requires-browser",
  "qualityScore": 78,
  "volumeScore": 70,
  "categories": [
   "Enclosures"
  ],
  "sections": [
   "Cooling/spares",
   "Enclosure doors",
   "Gaskets",
   "Latches",
   "Panels"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-136",
  "name": "Vertiv Product Selectors - UPS selector",
  "url": "https://www.vertiv.com/en-us/support/tools-applications/product-selectors/",
  "domain": "vertiv.com",
  "format": "HTML product selector hub",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 78,
  "volumeScore": 74,
  "categories": [
   "UPS and infrastructure selectors"
  ],
  "sections": [
   "Accessories",
   "Battery/runtime tools",
   "Cooling selector",
   "Rack PDU selector",
   "UPS selector"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-137",
  "name": "CommScope Uniprise Source - Copper cable",
  "url": "https://www.commscope.com/network-type/enterprise-networks-structured-cabling...",
  "domain": "commscope.com",
  "format": "HTML product hierarchy",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 77,
  "volumeScore": 72,
  "categories": [
   "Structured cabling"
  ],
  "sections": [
   "Cable assemblies",
   "Copper cable",
   "Fiber connectivity",
   "Jacks/connectors",
   "Patch panels"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-138",
  "name": "Bosch Security Product Selector - Video cameras",
  "url": "https://commerce.boschsecurity.com/us/en/",
  "domain": "commerce.boschsecurity.com",
  "format": "HTML product catalog/search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 76,
  "volumeScore": 78,
  "categories": [
   "Security cameras, intrusion, fire"
  ],
  "sections": [
   "Access control",
   "Audio systems",
   "Fire detection",
   "Intrusion panels",
   "Video cameras"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-139",
  "name": "Parts-CrossReference.com",
  "url": "https://parts-crossreference.com/",
  "domain": "parts-crossreference.com",
  "format": "Subscription database",
  "access": "licensed",
  "kind": "api-database",
  "ingestStatus": "requires-license",
  "qualityScore": 76,
  "volumeScore": 90,
  "categories": [
   "Industrial equipment parts"
  ],
  "sections": [
   "Agricultural parts",
   "Construction equipment",
   "Filters",
   "Forklift parts",
   "Hydraulics",
   "Industrial MRO"
  ],
  "recordCount": 7,
  "batch": "Initial 500",
  "lastChecked": "2026-06-12",
  "urlTruncated": false
 },
 {
  "id": "xref-src-140",
  "name": "PLP Communications Product Source - ADSS hardware",
  "url": "https://plp.com/communications",
  "domain": "plp.com",
  "format": "HTML product hierarchy",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 76,
  "volumeScore": 74,
  "categories": [
   "Fiber and copper communications"
  ],
  "sections": [
   "ADSS hardware",
   "Buried service wire closures",
   "Copper closures",
   "Fiber closures",
   "Pedestals"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-141",
  "name": "TDK Product Center - Capacitors",
  "url": "https://product.tdk.com/en/search/",
  "domain": "product.tdk.com",
  "format": "HTML product search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 76,
  "volumeScore": 78,
  "categories": [
   "Passives and sensors"
  ],
  "sections": [
   "Capacitors",
   "Ferrites",
   "Inductors",
   "Power supplies",
   "Sensors"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-142",
  "name": "MSA ALTAIR Family Gas Detectors - Single-gas detectors",
  "url": "https://us.msasafety.com/altair-family-gas-detectors?locale=en",
  "domain": "us.msasafety.com",
  "format": "HTML product family",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 76,
  "volumeScore": 72,
  "categories": [
   "Portable gas detection"
  ],
  "sections": [
   "Four-gas detectors",
   "Multigas detectors",
   "Sensor families",
   "Single-gas detectors",
   "Two-gas detectors"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-143",
  "name": "Atkore Allied Tube & Conduit Brand Source - EMT conduit",
  "url": "https://www.atkore.com/about-us/brands/allied-tube-conduit",
  "domain": "atkore.com",
  "format": "HTML brand/product page",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 76,
  "volumeScore": 78,
  "categories": [
   "Conduit and mechanical tube"
  ],
  "sections": [
   "EMT conduit",
   "Fittings",
   "IMC",
   "Mechanical tube",
   "Rigid conduit"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-144",
  "name": "Banner Engineering Product Selector - Photoelectric sensors",
  "url": "https://www.bannerengineering.com/us/en/products.html",
  "domain": "bannerengineering.com",
  "format": "HTML product selector",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 76,
  "volumeScore": 76,
  "categories": [
   "Sensors and machine safety"
  ],
  "sections": [
   "Lighting/indicators",
   "Machine safety",
   "Measurement sensors",
   "Photoelectric sensors",
   "Wireless IO"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-145",
  "name": "Infineon Product Finder - Power MOSFETs",
  "url": "https://www.infineon.com/cms/en/product/",
  "domain": "infineon.com",
  "format": "HTML product finder/catalog",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 76,
  "volumeScore": 80,
  "categories": [
   "Semiconductors and power electronics"
  ],
  "sections": [
   "Gate drivers",
   "IGBTs",
   "Microcontrollers",
   "Power MOSFETs",
   "Sensors"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-146",
  "name": "Keystone Fluorescent Ballasts - T8 ballasts",
  "url": "https://www.keystonetech.com/all-products/power-supplies/ballasts/fluorescent",
  "domain": "keystonetech.com",
  "format": "HTML product catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 76,
  "volumeScore": 74,
  "categories": [
   "Ballasts and LED drivers"
  ],
  "sections": [
   "Compact fluorescent",
   "Replacement ballast attributes",
   "Residential/commercial ballasts",
   "T5 ballasts",
   "T8 ballasts"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-147",
  "name": "MacLean Power Systems Products - Cutouts/arresters",
  "url": "https://www.macleanpower.com/products/",
  "domain": "macleanpower.com",
  "format": "HTML product hierarchy",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 76,
  "volumeScore": 76,
  "categories": [
   "Utility hardware"
  ],
  "sections": [
   "Cutouts/arresters",
   "Distribution insulators",
   "Fiberglass utility",
   "Pole-line hardware",
   "Switchgear"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-148",
  "name": "Panduit Electrical Infrastructure Solutions Catalog - Power connectors",
  "url": "https://www.panduit.com/content/dam/panduit/en/solutions/iei-catalog-2023-web...",
  "domain": "panduit.com",
  "format": "PDF catalog",
  "access": "free",
  "kind": "document",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 76,
  "volumeScore": 78,
  "categories": [
   "Connectivity and wire management"
  ],
  "sections": [
   "Cable management",
   "Control panel products",
   "Identification",
   "Power connectors",
   "Terminals"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": true
 },
 {
  "id": "xref-src-149",
  "name": "Panduit Product Search - Cable ties",
  "url": "https://www.panduit.com/en/search.html",
  "domain": "panduit.com",
  "format": "HTML search/selector",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 76,
  "volumeScore": 78,
  "categories": [
   "Connectivity and wire management"
  ],
  "sections": [
   "Cable ties",
   "Control panel products",
   "Copper connectivity",
   "Fiber connectivity",
   "Labels"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-150",
  "name": "SATCO LED Lamps - LED T8",
  "url": "https://www.satco.com/lamps/led-lamps",
  "domain": "satco.com",
  "format": "HTML product catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 76,
  "volumeScore": 80,
  "categories": [
   "LED lamps"
  ],
  "sections": [
   "A-lamps",
   "CFL replacement",
   "LED HID replacement",
   "LED T8",
   "PAR/BR lamps"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-151",
  "name": "SHOWA Glove Finder - Chemical protection",
  "url": "https://www.showagroup.com/us/en/shop",
  "domain": "showagroup.com",
  "format": "HTML product selector/catalog",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 76,
  "volumeScore": 72,
  "categories": [
   "Hand protection"
  ],
  "sections": [
   "Chemical protection",
   "Cut resistance",
   "Disposable gloves",
   "Grip coatings",
   "Thermal protection"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-152",
  "name": "SICK Product Finder - Photoelectric sensors",
  "url": "https://www.sick.com/us/en/product-selection/c/g102263",
  "domain": "sick.com",
  "format": "HTML product selector",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 76,
  "volumeScore": 76,
  "categories": [
   "Sensors and safety"
  ],
  "sections": [
   "Encoders",
   "Machine vision",
   "Photoelectric sensors",
   "Proximity sensors",
   "Safety scanners"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-153",
  "name": "AFL Product Catalog - Fiber cable",
  "url": "https://www.aflglobal.com/products",
  "domain": "aflglobal.com",
  "format": "HTML catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 74,
  "volumeScore": 76,
  "categories": [
   "Fiber optic products"
  ],
  "sections": [
   "Closures",
   "Connectors",
   "Fiber cable",
   "Fusion splicers",
   "Test equipment"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-154",
  "name": "Crestron Product Catalog - DM NVX",
  "url": "https://www.crestron.com/Products",
  "domain": "crestron.com",
  "format": "HTML catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 74,
  "volumeScore": 78,
  "categories": [
   "AV control and distribution"
  ],
  "sections": [
   "AV switchers",
   "Control processors",
   "DM NVX",
   "Room scheduling",
   "Touch panels"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-155",
  "name": "Extron Product Finder - Switchers",
  "url": "https://www.extron.com/product/listbytype.aspx",
  "domain": "extron.com",
  "format": "HTML catalog/product finder",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 74,
  "volumeScore": 76,
  "categories": [
   "AV switching, extension, control"
  ],
  "sections": [
   "Audio DSP",
   "Control systems",
   "Extenders",
   "Signal converters",
   "Switchers"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-156",
  "name": "Fluke Product Selector - Digital multimeters",
  "url": "https://www.fluke.com/en-us/products",
  "domain": "fluke.com",
  "format": "HTML catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 74,
  "volumeScore": 76,
  "categories": [
   "Test instruments"
  ],
  "sections": [
   "Clamp meters",
   "Digital multimeters",
   "Power quality",
   "Test leads/accessories",
   "Thermal cameras"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-157",
  "name": "Kramer Product Finder - Switchers",
  "url": "https://www.kramerav.com/us/product/",
  "domain": "kramerav.com",
  "format": "HTML catalog/product finder",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 74,
  "volumeScore": 74,
  "categories": [
   "AV switching, extension, collaboration"
  ],
  "sections": [
   "AV over IP",
   "Cables",
   "Collaboration",
   "Extenders",
   "Switchers"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-158",
  "name": "RAB LED HID Replacement - Corn cob lamps",
  "url": "https://www.rablighting.com/led-hid-replacement",
  "domain": "rablighting.com",
  "format": "HTML product/catalog source",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 74,
  "volumeScore": 74,
  "categories": [
   "LED HID replacement"
  ],
  "sections": [
   "Area lights",
   "Corn cob lamps",
   "High-bay retrofits",
   "Post top retrofits",
   "Wall packs"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-159",
  "name": "Allegion Product Catalog - Schlage locks",
  "url": "https://us.allegion.com/en/home/products.html",
  "domain": "us.allegion.com",
  "format": "HTML product catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 72,
  "volumeScore": 78,
  "categories": [
   "Locks, exit devices, credentials"
  ],
  "sections": [
   "Electronic access",
   "Falcon hardware",
   "LCN closers",
   "Schlage locks",
   "Von Duprin exit devices"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-160",
  "name": "Acuity Brands Product Selector - Troffers",
  "url": "https://www.acuitybrands.com/products",
  "domain": "acuitybrands.com",
  "format": "HTML product catalog/search",
  "access": "free",
  "kind": "interactive-tool",
  "ingestStatus": "requires-browser",
  "qualityScore": 72,
  "volumeScore": 78,
  "categories": [
   "Lighting fixtures and controls"
  ],
  "sections": [
   "Controls",
   "Emergency lighting",
   "High bays",
   "Outdoor fixtures",
   "Troffers"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-161",
  "name": "ASSA ABLOY Door Security Solutions - Electric strikes",
  "url": "https://www.assaabloydss.com/en",
  "domain": "assaabloydss.com",
  "format": "HTML product catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 72,
  "volumeScore": 78,
  "categories": [
   "Locks, cylinders, door hardware"
  ],
  "sections": [
   "Cylinders",
   "Door closers",
   "Electric strikes",
   "Exit devices",
   "Maglocks"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-162",
  "name": "Brady Label Materials - Arc flash labels",
  "url": "https://www.bradyid.com/labels",
  "domain": "bradyid.com",
  "format": "HTML product catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 72,
  "volumeScore": 78,
  "categories": [
   "Labels and identification"
  ],
  "sections": [
   "Arc flash labels",
   "Lockout labels",
   "Panel labels",
   "Printer labels",
   "Wire markers"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-163",
  "name": "Cooper Lighting Product Catalog - Indoor fixtures",
  "url": "https://www.cooperlighting.com/global/products",
  "domain": "cooperlighting.com",
  "format": "HTML catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 72,
  "volumeScore": 76,
  "categories": [
   "Lighting fixtures and controls"
  ],
  "sections": [
   "Emergency lighting",
   "Indoor fixtures",
   "Industrial lighting",
   "Lighting controls",
   "Outdoor fixtures"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-164",
  "name": "FS Transceiver Compatibility - Cisco-compatible optics",
  "url": "https://www.fs.com/c/transceiver-modules-9",
  "domain": "fs.com",
  "format": "HTML catalog/compatibility tables",
  "access": "free",
  "kind": "html-table",
  "ingestStatus": "ingestible",
  "qualityScore": 72,
  "volumeScore": 84,
  "categories": [
   "Optical transceivers"
  ],
  "sections": [
   "Arista-compatible optics",
   "Cisco-compatible optics",
   "Dell-compatible optics",
   "HPE-compatible optics",
   "Juniper-compatible optics"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-165",
  "name": "HID Reader and Credential Compatibility - iCLASS SE readers",
  "url": "https://www.hidglobal.com/",
  "domain": "hidglobal.com",
  "format": "HTML catalog/support source",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 72,
  "volumeScore": 78,
  "categories": [
   "Readers and credentials"
  ],
  "sections": [
   "Mobile credentials",
   "Prox credentials",
   "Reader wiring/accessories",
   "Smart cards",
   "iCLASS SE readers"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 },
 {
  "id": "xref-src-166",
  "name": "Milwaukee Tool Product Catalog - M18 platform",
  "url": "https://www.milwaukeetool.com/Products",
  "domain": "milwaukeetool.com",
  "format": "HTML catalog",
  "access": "free",
  "kind": "catalog-page",
  "ingestStatus": "no-direct-crosses",
  "qualityScore": 72,
  "volumeScore": 80,
  "categories": [
   "Power tools and accessories"
  ],
  "sections": [
   "Accessories",
   "Electrical tools",
   "Lighting",
   "M12 platform",
   "M18 platform"
  ],
  "recordCount": 6,
  "batch": "Next 500",
  "lastChecked": "2026-06-11",
  "urlTruncated": false
 }
];
