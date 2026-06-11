/**
 * Ask Meridian — Job Wizard templates. Pure data.
 *
 * Each job is a curated bill-of-materials skeleton: ordered steps that the
 * wizard resolves against the live catalog (searchQuery + subcategory filter,
 * branch stock preferred). Deterministic — no LLM; the conversational variant
 * is a future upgrade behind an approved API key.
 *
 * Every step's `subcategory` MUST exist in lib/catalog/taxonomy
 * ALL_SUBCATEGORIES — enforced by product-finder-jobs.test.ts.
 */

export interface JobStep {
  id: string;
  /** What the step is for, in job language ("Main breaker panel"). */
  label: string;
  /** Exact taxonomy subcategory the pick must come from. */
  subcategory: string;
  /** Search text used to rank candidates inside the subcategory. */
  searchQuery: string;
  defaultQty: number;
  /** Optional steps start unchecked in the wizard. */
  optional?: boolean;
  /** Field note shown under the step ("code requires…", sizing hints). */
  note?: string;
}

export interface JobDef {
  id: string;
  title: string;
  icon: string;
  description: string;
  steps: JobStep[];
}

export const JOB_DEFS: readonly JobDef[] = [
  {
    id: "service-upgrade-200a",
    title: "200A residential service upgrade",
    icon: "⚡",
    description: "Panel swap to 200A — load center, breakers, feeder wire, grounding, and the finish hardware.",
    steps: [
      { id: "panel", label: "Main breaker load center", subcategory: "Load Centers", searchQuery: "200A main breaker load center", defaultQty: 1 },
      { id: "branch-breakers", label: "Branch circuit breakers", subcategory: "Circuit Breakers", searchQuery: "20A 1-pole breaker", defaultQty: 10 },
      { id: "gfci-breakers", label: "GFCI breakers (wet locations)", subcategory: "Circuit Breakers", searchQuery: "GFCI", defaultQty: 2, note: "Kitchens, baths, exterior circuits" },
      { id: "feeder", label: "Feeder / branch wire", subcategory: "Wire & Cable", searchQuery: "NM-B cable", defaultQty: 2 },
      { id: "grounding", label: "Grounding & bonding", subcategory: "Grounding & Bonding", searchQuery: "ground rod", defaultQty: 2 },
      { id: "lugs", label: "Lugs & connectors", subcategory: "Lugs & Wire Connectors", searchQuery: "wire connectors", defaultQty: 1 },
      { id: "surge", label: "Whole-home surge protection", subcategory: "Surge Protective Devices", searchQuery: "whole home surge protective device", defaultQty: 1, optional: true, note: "An easy upsell — 2020 NEC requires it on dwelling services" },
    ],
  },
  {
    id: "office-network-12",
    title: "Office network — 12 drops",
    icon: "🌐",
    description: "Twelve Cat6 drops back to a patch panel: cable, terminations, faceplates, and the closet switch.",
    steps: [
      { id: "cable", label: "Cat6 cable", subcategory: "Ethernet Cable", searchQuery: "Cat6 UTP cable 1000ft", defaultQty: 1 },
      { id: "patch-panel", label: "Patch panel", subcategory: "Patch Panels", searchQuery: "24 port Cat6 patch panel", defaultQty: 1 },
      { id: "switch", label: "Network switch", subcategory: "Network Switches", searchQuery: "24 port PoE network switch", defaultQty: 1 },
      { id: "plates", label: "Faceplates / wall plates", subcategory: "Wall Plates & Covers", searchQuery: "2-gang wall plate", defaultQty: 12 },
      { id: "boxes", label: "Low-voltage boxes", subcategory: "Boxes & Covers", searchQuery: "old work box", defaultQty: 12 },
      { id: "conduit", label: "Conduit / raceway", subcategory: "Conduit", searchQuery: "3/4 EMT conduit", defaultQty: 10, optional: true },
    ],
  },
  {
    id: "warehouse-led-retrofit",
    title: "Warehouse LED high-bay retrofit",
    icon: "💡",
    description: "Swap HID bays for LED — fixtures, occupancy sensors, switching, and circuit wire.",
    steps: [
      { id: "highbays", label: "LED high-bay fixtures", subcategory: "High Bay Fixtures", searchQuery: "LED high bay fixture", defaultQty: 24 },
      { id: "sensors", label: "Occupancy sensors", subcategory: "Occupancy & Vacancy Sensors", searchQuery: "occupancy sensor high bay", defaultQty: 24, optional: true, note: "Pairs with utility rebate programs" },
      { id: "switches", label: "Switching", subcategory: "Switches", searchQuery: "industrial toggle switch 20A", defaultQty: 6 },
      { id: "wire", label: "Circuit wire", subcategory: "Wire & Cable", searchQuery: "12 AWG THHN stranded", defaultQty: 4 },
      { id: "breakers", label: "Circuit breakers", subcategory: "Circuit Breakers", searchQuery: "20A single pole breaker", defaultQty: 6 },
    ],
  },
  {
    id: "camera-install-8",
    title: "Security cameras — 8-camera install",
    icon: "🎥",
    description: "Eight IP cameras with an NVR, network cable, and the rough-in hardware.",
    steps: [
      { id: "cameras", label: "IP cameras", subcategory: "IP Cameras", searchQuery: "outdoor IP camera", defaultQty: 8 },
      { id: "nvr", label: "Network video recorder", subcategory: "NVRs", searchQuery: "16 channel NVR PoE", defaultQty: 1 },
      { id: "cable", label: "Cat6 cable", subcategory: "Ethernet Cable", searchQuery: "Cat6 cable 1000ft", defaultQty: 1 },
      { id: "conduit", label: "Conduit", subcategory: "Conduit", searchQuery: "3/4 EMT conduit", defaultQty: 12, optional: true },
      { id: "fittings", label: "Conduit fittings", subcategory: "Conduit Fittings", searchQuery: "EMT connector 3/4", defaultQty: 24, optional: true },
    ],
  },
  {
    id: "ev-charger-install",
    title: "EV charger install (Level 2)",
    icon: "🔌",
    description: "A 48A Level-2 charger on a new 60A circuit: charger, breaker, wire, and raceway.",
    steps: [
      { id: "charger", label: "Level 2 charging station", subcategory: "EV Charging Stations", searchQuery: "48A level 2 EV charging station", defaultQty: 1 },
      { id: "breaker", label: "2-pole breaker", subcategory: "Circuit Breakers", searchQuery: "60A 2-pole breaker", defaultQty: 1 },
      { id: "wire", label: "Circuit wire", subcategory: "Wire & Cable", searchQuery: "6 AWG THHN copper", defaultQty: 1, note: "6 AWG Cu for a 60A circuit" },
      { id: "conduit", label: "Conduit", subcategory: "Conduit", searchQuery: "3/4 EMT conduit", defaultQty: 5 },
      { id: "fittings", label: "Conduit fittings", subcategory: "Conduit Fittings", searchQuery: "EMT connector 3/4", defaultQty: 10 },
    ],
  },
];

export function jobById(id: string): JobDef | null {
  return JOB_DEFS.find((j) => j.id === id) ?? null;
}
