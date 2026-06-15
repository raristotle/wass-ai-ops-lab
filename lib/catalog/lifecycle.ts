/**
 * Product lifecycle status — the single most universal BOM attribute the
 * catalog lacked. Every distributor data platform (DigiKey PCNs, Octopart,
 * SiliconExpert, Z2Data) treats it as foundational, and it is the prerequisite
 * for the EOL-risk UX, BOM health scoring, and obsolescence monitoring.
 *
 * The status is derived DETERMINISTICALLY from a product's id via a string hash
 * — NOT from the catalog generator's shared PRNG. That is deliberate: consuming
 * the shared rng would shift every subsequent draw and change all generated
 * SKUs/specs/stock (breaking determinism + verified-cross round-trip tests).
 * Hashing the id adds the attribute without disturbing anything else, and the
 * curated/verified real products keep their explicit status (default Active —
 * they are the parts we actively stock and demo with live pricing).
 */

export type LifecycleStatus = "Active" | "NRND" | "LTB" | "EOL" | "Discontinued";

export const LIFECYCLE_STATUSES: LifecycleStatus[] = [
  "Active",
  "NRND",
  "LTB",
  "EOL",
  "Discontinued",
];

export interface LifecycleMeta {
  /** Full human label. */
  label: string;
  /** Compact badge text. */
  short: string;
  /** Tooltip / explanation shown on hover. */
  blurb: string;
  /** True only for parts that are recommended for new work. */
  active: boolean;
  /** Relative obsolescence severity (0 = active, 4 = discontinued) for sorting/grading. */
  severity: number;
}

export const LIFECYCLE_META: Record<LifecycleStatus, LifecycleMeta> = {
  Active: {
    label: "Active",
    short: "ACTIVE",
    blurb: "In active production — recommended for new work.",
    active: true,
    severity: 0,
  },
  NRND: {
    label: "Not recommended for new designs",
    short: "NRND",
    blurb:
      "Still available, but the manufacturer discourages designing it into new work — prefer an active equivalent.",
    active: false,
    severity: 1,
  },
  LTB: {
    label: "Last-time buy",
    short: "LAST BUY",
    blurb:
      "Approaching end of production — buy remaining stock now or move to the active successor.",
    active: false,
    severity: 2,
  },
  EOL: {
    label: "End of life",
    short: "EOL",
    blurb:
      "End of life — limited remaining availability; an active equivalent is preferred.",
    active: false,
    severity: 3,
  },
  Discontinued: {
    label: "Discontinued",
    short: "DISCONTINUED",
    blurb: "No longer manufactured — substitute an active equivalent.",
    active: false,
    severity: 4,
  },
};

/** FNV-1a 32-bit string hash — deterministic, well-distributed, no shared state. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // h *= 16777619, kept in 32-bit unsigned range via Math.imul.
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic lifecycle status for a product id. Distribution (per 100):
 * Active 85, NRND 6, LTB 4, EOL 3, Discontinued 2 — most of the catalog is
 * active, with a realistic minority of obsolescent parts to design out.
 */
export function lifecycleStatusForId(id: string): LifecycleStatus {
  const bucket = hash32(id) % 100;
  if (bucket < 85) return "Active";
  if (bucket < 91) return "NRND"; // 85–90 → 6%
  if (bucket < 95) return "LTB"; // 91–94 → 4%
  if (bucket < 98) return "EOL"; // 95–97 → 3%
  return "Discontinued"; // 98–99 → 2%
}

/** Treat an absent status as Active (curated/verified parts default active). */
export function effectiveLifecycle(status?: LifecycleStatus): LifecycleStatus {
  return status ?? "Active";
}

export function isActiveLifecycle(status?: LifecycleStatus): boolean {
  return effectiveLifecycle(status) === "Active";
}

/** Non-active: the "design-out the obsolete" set. */
export function isObsolescent(status?: LifecycleStatus): boolean {
  return !isActiveLifecycle(status);
}
