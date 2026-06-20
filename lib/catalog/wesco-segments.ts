/**
 * Wesco segment taxonomy + Segment Solution Builder (v5-S2 #7) — $0, deterministic.
 *
 * Wesco sells across three business units. We map the catalog's subcategories to
 * those segments and define curated "solution templates" — the family set that
 * makes a COMPLETE install for a use case (a branch-wiring package, a structured-
 * cabling package, …). Given what's already in a cart/quote, the builder shows a
 * COVERAGE METER and flags the empty families to attach — turning one product into
 * a full, multi-family segment package (the AOV lever Wesco reps live on).
 *
 * Pure data + pure functions. The modal resolves each gap subcategory to a concrete
 * stocked product via the existing catalog search.
 */

export type WescoSegment = "EES" | "CSS" | "UBS";

export interface SegmentInfo {
  code: WescoSegment;
  name: string;
  blurb: string;
}

export const WESCO_SEGMENTS: Record<WescoSegment, SegmentInfo> = {
  EES: {
    code: "EES",
    name: "Electrical & Electronic Solutions",
    blurb: "Construction & industrial electrical — distribution, wiring, lighting, controls, motor control.",
  },
  CSS: {
    code: "CSS",
    name: "Communications & Security Solutions",
    blurb: "Structured cabling, network, AV, and physical security.",
  },
  UBS: {
    code: "UBS",
    name: "Utility & Broadband Solutions",
    blurb: "Utility distribution, metering, transformers, and broadband.",
  },
};

/**
 * Explicit subcategory → segment map for the families we carry. Anything not listed
 * falls back to a keyword classifier (segmentForSubcategory), so new subcategories
 * still resolve sensibly.
 */
const SUBCATEGORY_SEGMENT: Record<string, WescoSegment> = {
  // ── CSS — comms & security ──
  "Ethernet Cable": "CSS",
  "Fiber Optic Cable": "CSS",
  "Network Switches": "CSS",
  "Patch Panels": "CSS",
  "Racks & Cabinets": "CSS",
  "Wireless Access Points": "CSS",
  Connectivity: "CSS",
  "IP Cameras": "CSS",
  NVRs: "CSS",
  "Access Control": "CSS",
  "Intrusion Sensors": "CSS",
  "Alarm Panels": "CSS",
  "Intercom & Entry Systems": "CSS",
  "Security Cable & Power Supplies": "CSS",
  // ── UBS — utility & broadband ──
  "Dry-Type Transformers": "UBS",
  "Meter Sockets": "UBS",
};

const CSS_KEYWORDS = ["ethernet", "fiber", "network", "patch", "rack", "datacom", "camera", "nvr", "access control", "intrusion", "alarm", "intercom", "security", "wireless access", "av "];
const UBS_KEYWORDS = ["transformer", "meter", "utility", "pole", "broadband", "padmount", "transmission"];

/** Classify a subcategory into a Wesco segment (explicit map first, then keywords; EES default). */
export function segmentForSubcategory(subcategory: string): WescoSegment {
  const explicit = SUBCATEGORY_SEGMENT[subcategory];
  if (explicit) return explicit;
  const s = subcategory.toLowerCase();
  if (CSS_KEYWORDS.some((k) => s.includes(k))) return "CSS";
  if (UBS_KEYWORDS.some((k) => s.includes(k))) return "UBS";
  return "EES";
}

export interface SolutionTemplate {
  id: string;
  segment: WescoSegment;
  name: string;
  description: string;
  /** Ordered family list (subcategory names) that makes the package complete. */
  families: string[];
}

/**
 * Curated, install-complete solution packages. Each family is a real catalog
 * subcategory so the builder can resolve a stocked product for any gap.
 */
export const SOLUTION_TEMPLATES: readonly SolutionTemplate[] = [
  {
    id: "ees-branch-wiring",
    segment: "EES",
    name: "Branch Wiring Package",
    description: "A complete device-and-rough-in package for a branch circuit.",
    families: ["Switches", "Receptacles & Outlets", "Wall Plates & Covers", "Boxes & Covers", "Wire & Cable", "Conduit", "Conduit Fittings"],
  },
  {
    id: "ees-power-distribution",
    segment: "EES",
    name: "Power Distribution Package",
    description: "Panel, protection, and feeder package for a distribution build-out.",
    families: ["Panelboards", "Circuit Breakers", "Lugs & Wire Connectors", "Grounding & Bonding", "Surge Protective Devices", "Wire & Cable"],
  },
  {
    id: "ees-lighting-controls",
    segment: "EES",
    name: "Lighting & Controls Package",
    description: "Fixtures plus the controls and wiring that commission them.",
    families: ["LED Troffers & Panels", "Drivers & Ballasts", "Occupancy & Vacancy Sensors", "Dimmers & Lighting Controls", "Wire & Cable"],
  },
  {
    id: "ees-motor-control",
    segment: "EES",
    name: "Motor Control Package",
    description: "Starter, disconnect, and protection package for a motor branch.",
    families: ["Motor Starters & Controls", "Contactors", "Safety Switches & Disconnects", "Fuses", "Conduit", "Wire & Cable"],
  },
  {
    id: "css-structured-cabling",
    segment: "CSS",
    name: "Structured Cabling Package",
    description: "End-to-end horizontal cabling for a telecom room / drop.",
    families: ["Ethernet Cable", "Patch Panels", "Racks & Cabinets", "Network Switches", "Connectivity"],
  },
  {
    id: "css-physical-security",
    segment: "CSS",
    name: "Physical Security Package",
    description: "Cameras, recording, access, and the cabling that powers them.",
    families: ["IP Cameras", "NVRs", "Access Control", "Security Cable & Power Supplies", "Network Switches"],
  },
  {
    id: "ubs-service-entrance",
    segment: "UBS",
    name: "Service Entrance & Metering Package",
    description: "Metering, transformation, and grounding for a service entrance.",
    families: ["Meter Sockets", "Dry-Type Transformers", "Load Centers", "Grounding & Bonding", "Lugs & Wire Connectors"],
  },
];

/** Templates whose family set includes a given subcategory (the seed's relevant packages). */
export function templatesForSubcategory(subcategory: string): SolutionTemplate[] {
  return SOLUTION_TEMPLATES.filter((t) => t.families.includes(subcategory));
}

export interface FamilyCoverage {
  subcategory: string;
  covered: boolean;
}

export interface SolutionCoverage {
  template: SolutionTemplate;
  families: FamilyCoverage[];
  coveredCount: number;
  totalCount: number;
  /** 0..100. */
  coveragePct: number;
  /** Empty families to attach. */
  gaps: string[];
}

/** Coverage of one template against the subcategories already in the cart/quote. */
export function solutionCoverage(template: SolutionTemplate, cartSubcategories: Iterable<string>): SolutionCoverage {
  const owned = new Set(cartSubcategories);
  const families = template.families.map((subcategory) => ({ subcategory, covered: owned.has(subcategory) }));
  const coveredCount = families.filter((f) => f.covered).length;
  const totalCount = families.length;
  return {
    template,
    families,
    coveredCount,
    totalCount,
    coveragePct: totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0,
    gaps: families.filter((f) => !f.covered).map((f) => f.subcategory),
  };
}

/**
 * The best solution template for a seed subcategory given the current cart — the
 * template that the seed belongs to with the MOST already-covered families (the
 * package the rep is closest to completing). Returns null if the seed isn't part
 * of any template.
 */
export function bestSolutionFor(seedSubcategory: string, cartSubcategories: Iterable<string>): SolutionCoverage | null {
  const owned = [...cartSubcategories];
  const candidates = templatesForSubcategory(seedSubcategory).map((t) => solutionCoverage(t, owned));
  if (candidates.length === 0) return null;
  // Most covered first; tie-break to the smaller package (faster to complete).
  candidates.sort((a, b) => b.coveredCount - a.coveredCount || a.totalCount - b.totalCount);
  return candidates[0];
}
