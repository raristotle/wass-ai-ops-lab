/**
 * Spec-rule companion inference (v5-S1 #4) — DETERMINISTIC, engineering-mandatory
 * companion edges with a stated reason. Where the shipped affinity map
 * (goeswith.ts) only says "these subcategories go together," this engine adds the
 * two things that make a cross-sell defensible to a rep and a customer:
 *
 *   1. a RELATION — "required" (the install/spec is incomplete without it) vs
 *      "recommended" (strongly associated, commonly attached), and
 *   2. a WHY — the engineering reason, so the rep can justify the add-on.
 *
 * These edges fire on every product (no order history needed), so they capture
 * attach on the long-tail SKUs that behavioral data never sees. They are merged
 * with the behavioral market-basket lift and the affinity map in companion-graph.ts.
 *
 * "required" is used CONSERVATIVELY — only where the product genuinely cannot be
 * installed/used to spec without the companion (a switch needs a wall plate; a
 * conduit run needs fittings). Everything else is "recommended". $0, pure data.
 */

import type { CatalogProduct } from "@/features/product-finder/types";

export type CompanionRelation = "required" | "recommended";

export interface CompanionRule {
  /** Source subcategory (exact TAXONOMY name). */
  from: string;
  /** Companion subcategory (exact TAXONOMY name). */
  to: string;
  relation: CompanionRelation;
  /** Engineering reason a rep/customer can stand behind. */
  why: string;
  /**
   * Optional spec hint: given the source product, the spec name/value the
   * companion should ideally match (e.g. a 2-gang switch → a 2-gang wall plate).
   * Used to RANK the companion products, never to hide them.
   */
  specHint?: (source: CatalogProduct) => { name: string; value: string } | null;
}

/** Read a spec value off a product (case-insensitive name match), or null. */
export function specValue(product: CatalogProduct, name: string): string | null {
  const s = (product.specs ?? []).find((x) => x.name.toLowerCase() === name.toLowerCase());
  return s ? s.value : null;
}

// Gang count is the dominant spec match for devices ↔ plates/boxes.
const gangHint = (name: string) => (source: CatalogProduct) => {
  const v = specValue(source, "Gang") ?? specValue(source, "Gangs");
  return v ? { name, value: v } : null;
};

/**
 * The companion rule set. Conservative "required" edges first, then the broader
 * "recommended" attach edges. Authored once against the catalog taxonomy.
 */
export const COMPANION_RULES: readonly CompanionRule[] = [
  // ── Required: the install is incomplete without it ───────────────────────────
  { from: "Switches", to: "Wall Plates & Covers", relation: "required", why: "A wall switch needs a faceplate to finish and cover the opening.", specHint: gangHint("Gang") },
  { from: "Receptacles & Outlets", to: "Wall Plates & Covers", relation: "required", why: "A receptacle needs a faceplate to finish and cover the opening.", specHint: gangHint("Gang") },
  { from: "Combination Devices", to: "Wall Plates & Covers", relation: "required", why: "A combination device needs a matching faceplate.", specHint: gangHint("Gang") },
  { from: "Dimmers & Lighting Controls", to: "Wall Plates & Covers", relation: "required", why: "A dimmer/control needs a faceplate to finish the opening." },
  { from: "Conduit", to: "Conduit Fittings", relation: "required", why: "A conduit run can't be terminated or coupled without fittings." },
  { from: "Flexible Conduit & Liquidtight", to: "Conduit Fittings", relation: "required", why: "Flex/liquidtight runs need connectors at every box and termination." },
  { from: "Wire & Cable", to: "Lugs & Wire Connectors", relation: "required", why: "Conductors must be terminated — every wire run needs connectors/lugs." },
  { from: "Cable Tray", to: "Strut & Channel", relation: "required", why: "Cable tray must be supported on strut/channel at code intervals." },

  // ── Recommended: strongly attached, commonly forgotten ───────────────────────
  { from: "Circuit Breakers", to: "Load Centers", relation: "recommended", why: "Breakers install into a load center / panelboard." },
  { from: "Circuit Breakers", to: "Lugs & Wire Connectors", relation: "recommended", why: "Branch terminations need lugs/connectors." },
  { from: "Load Centers", to: "Circuit Breakers", relation: "recommended", why: "A load center is populated with branch breakers." },
  { from: "Load Centers", to: "Surge Protective Devices", relation: "recommended", why: "Panels are commonly protected with a panel-mount SPD." },
  { from: "Load Centers", to: "Lugs & Wire Connectors", relation: "recommended", why: "Feeder and branch terminations need lugs." },
  { from: "Panelboards", to: "Circuit Breakers", relation: "recommended", why: "Panelboards are populated with branch breakers." },
  { from: "Panelboards", to: "Surge Protective Devices", relation: "recommended", why: "Panelboards are commonly protected with an SPD." },
  { from: "Safety Switches & Disconnects", to: "Fuses", relation: "recommended", why: "Fusible disconnects need the matching fuse class/rating." },
  { from: "Safety Switches & Disconnects", to: "Lugs & Wire Connectors", relation: "recommended", why: "Line/load terminations need lugs." },
  { from: "Fuses", to: "Safety Switches & Disconnects", relation: "recommended", why: "Fuses seat in a fused disconnect/switch." },
  { from: "Conduit", to: "Boxes & Covers", relation: "recommended", why: "Runs land in boxes; covers finish them." },
  { from: "Conduit", to: "Strut & Channel", relation: "recommended", why: "Conduit racks are supported on strut." },
  { from: "Conduit Fittings", to: "Conduit", relation: "recommended", why: "Fittings join conduit sections." },
  { from: "Wire & Cable", to: "Conduit", relation: "recommended", why: "Conductors are pulled through conduit." },
  { from: "Boxes & Covers", to: "Wall Plates & Covers", relation: "recommended", why: "Device boxes finish with a matching plate/cover." },
  { from: "Lugs & Wire Connectors", to: "Grounding & Bonding", relation: "recommended", why: "Terminations pair with grounding/bonding hardware." },
  { from: "Grounding & Bonding", to: "Lugs & Wire Connectors", relation: "recommended", why: "Grounding electrodes/conductors terminate on lugs." },
  { from: "Strut & Channel", to: "Cable Tray", relation: "recommended", why: "Strut supports tray and conduit racks." },
  { from: "Enclosures", to: "Strut & Channel", relation: "recommended", why: "Enclosures mount on strut/back-panels." },

  // ── Lighting ─────────────────────────────────────────────────────────────────
  { from: "LED Troffers & Panels", to: "Occupancy & Vacancy Sensors", relation: "recommended", why: "Code-driven controls (occupancy) attach to most commercial fixtures." },
  { from: "LED Troffers & Panels", to: "Dimmers & Lighting Controls", relation: "recommended", why: "Dimming controls pair with 0-10V fixtures." },
  { from: "High Bay Fixtures", to: "Occupancy & Vacancy Sensors", relation: "recommended", why: "High-bay layouts attach occupancy/daylight controls." },
  { from: "LED Downlights", to: "Dimmers & Lighting Controls", relation: "recommended", why: "Downlights are commonly dimmed." },
  { from: "Strip & Wrap Fixtures", to: "Lamps & Tubes", relation: "recommended", why: "Retrofit strips pair with TLED lamps." },
  { from: "Outdoor & Area Lighting", to: "Photo Controls", relation: "recommended", why: "Area/wall-pack fixtures attach photocells for dusk-to-dawn." },
  { from: "Lamps & Tubes", to: "Drivers & Ballasts", relation: "recommended", why: "Lamp retrofits may need a compatible driver/ballast." },

  // ── Controls / power ─────────────────────────────────────────────────────────
  { from: "Motor Starters & Controls", to: "Contactors", relation: "recommended", why: "Motor control builds pair starters with contactors." },
  { from: "Motor Starters & Controls", to: "Safety Switches & Disconnects", relation: "recommended", why: "Motor circuits need a local disconnecting means." },
  { from: "Contactors", to: "Timers & Time Switches", relation: "recommended", why: "Lighting/load contactors pair with time switches." },
  { from: "EV Charging Stations", to: "Safety Switches & Disconnects", relation: "recommended", why: "EVSE circuits need a disconnecting means." },
  { from: "EV Charging Stations", to: "Wire & Cable", relation: "recommended", why: "EVSE installs need the feeder conductors." },

  // ── Datacom ──────────────────────────────────────────────────────────────────
  { from: "Ethernet Cable", to: "Patch Panels", relation: "recommended", why: "Horizontal runs terminate on patch panels." },
  { from: "Ethernet Cable", to: "Connectivity", relation: "recommended", why: "Runs terminate with jacks/plugs/keystones." },
  { from: "Network Switches", to: "Racks & Cabinets", relation: "recommended", why: "Switches mount in racks/cabinets." },
  { from: "Patch Panels", to: "Racks & Cabinets", relation: "recommended", why: "Patch panels mount in racks." },
  { from: "Wireless Access Points", to: "Network Switches", relation: "recommended", why: "APs uplink to (PoE) switches." },
  { from: "Fiber Optic Cable", to: "Patch Panels", relation: "recommended", why: "Fiber terminates in LIU/patch panels." },
  { from: "Racks & Cabinets", to: "UPS & Power Protection", relation: "recommended", why: "Racks pair with rack-mount UPS/PDUs." },

  // ── Security ─────────────────────────────────────────────────────────────────
  { from: "IP Cameras", to: "NVRs", relation: "recommended", why: "IP cameras record to an NVR." },
  { from: "IP Cameras", to: "Network Switches", relation: "recommended", why: "IP cameras uplink to PoE switches." },
  { from: "NVRs", to: "Racks & Cabinets", relation: "recommended", why: "NVRs mount in the head-end rack." },
  { from: "Access Control", to: "Intercom & Entry Systems", relation: "recommended", why: "Access control pairs with entry/intercom." },
  { from: "Intrusion Sensors", to: "Alarm Panels", relation: "recommended", why: "Sensors report to an alarm panel." },

  // ── Safety / PPE bundles ─────────────────────────────────────────────────────
  { from: "Hard Hats", to: "Safety Glasses", relation: "recommended", why: "Head + eye protection are issued together." },
  { from: "Hard Hats", to: "Hi-Vis Apparel", relation: "recommended", why: "Site PPE kits bundle head + hi-vis." },
  { from: "Safety Glasses", to: "Gloves", relation: "recommended", why: "Eye + hand protection are issued together." },
  { from: "Fall Protection", to: "Hard Hats", relation: "recommended", why: "At-height PPE kits bundle fall + head protection." },
  { from: "Hearing Protection", to: "Respiratory Protection", relation: "recommended", why: "Loud/dusty environments need both." },
];

const RULES_BY_FROM: Map<string, CompanionRule[]> = (() => {
  const m = new Map<string, CompanionRule[]>();
  for (const r of COMPANION_RULES) {
    const list = m.get(r.from) ?? [];
    list.push(r);
    m.set(r.from, list);
  }
  return m;
})();

/** Companion rules whose source subcategory matches the product. */
export function companionRulesFor(product: CatalogProduct): CompanionRule[] {
  return RULES_BY_FROM.get(product.subcategory) ?? [];
}

/** Distinct companion subcategories required by a product's subcategory. */
export function requiredCompanionSubcategories(product: CatalogProduct): string[] {
  return companionRulesFor(product)
    .filter((r) => r.relation === "required")
    .map((r) => r.to);
}
