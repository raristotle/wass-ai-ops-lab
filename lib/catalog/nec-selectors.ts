/**
 * Guided engineering selectors — NEC-grounded calculators that turn an
 * engineering question ("size my conduit / wire / breaker") into a code-correct
 * answer AND a catalog search that resolves to a stocked, priced SKU. Pure +
 * deterministic; the UI feeds the result's searchQuery/subcategory to the same
 * resolver the Job Wizard uses, so the answer becomes a one-click BOM line.
 *
 * Manufacturers (Southwire, Eaton, Belden) publish these calculators as lead-gen
 * but dead-end at a generic spec — none connect the answer to a distributor's
 * in-stock product at the buyer's price. This does.
 *
 * Data is a compact, real subset of NEC Chapter 9 (Tables 4, 5, 8) and 240.6.
 * Assumes copper THHN/THWN unless told otherwise; the result notes its
 * assumptions so nothing is implied to be more precise than it is.
 */

export type AwgSize =
  | "14" | "12" | "10" | "8" | "6" | "4" | "3" | "2" | "1"
  | "1/0" | "2/0" | "3/0" | "4/0";

const AWG_ORDER: AwgSize[] = ["14", "12", "10", "8", "6", "4", "3", "2", "1", "1/0", "2/0", "3/0", "4/0"];

// NEC Ch.9 Table 5 — THHN/THWN-2 approximate area (sq in).
const THHN_AREA: Record<AwgSize, number> = {
  "14": 0.0097, "12": 0.0133, "10": 0.0211, "8": 0.0366, "6": 0.0507,
  "4": 0.0824, "3": 0.0973, "2": 0.1158, "1": 0.1562,
  "1/0": 0.1855, "2/0": 0.2223, "3/0": 0.2679, "4/0": 0.3237,
};

// NEC Ch.9 Table 8 — conductor area in circular mils (for voltage drop).
const CMIL: Record<AwgSize, number> = {
  "14": 4110, "12": 6530, "10": 10380, "8": 16510, "6": 26240,
  "4": 41740, "3": 52620, "2": 66360, "1": 83690,
  "1/0": 105600, "2/0": 133100, "3/0": 167800, "4/0": 211600,
};

// Effective copper ampacity (NEC 310.16, 75°C) with the 240.4(D) small-conductor
// limits applied for 14/12/10 — so the wire calc can floor voltage-drop sizing
// by what the load actually requires for ampacity.
const AMPACITY: Record<AwgSize, number> = {
  "14": 15, "12": 20, "10": 30, "8": 50, "6": 65, "4": 85, "3": 100,
  "2": 115, "1": 130, "1/0": 150, "2/0": 175, "3/0": 200, "4/0": 230,
};

export type ConduitType = "EMT" | "PVC";
export type TradeSize = "1/2" | "3/4" | "1" | "1-1/4" | "1-1/2" | "2" | "2-1/2" | "3";

const TRADE_ORDER: TradeSize[] = ["1/2", "3/4", "1", "1-1/4", "1-1/2", "2", "2-1/2", "3"];

// NEC Ch.9 Table 4 — 40% fill area (sq in) by conduit type & trade size.
const FILL_40: Record<ConduitType, Record<TradeSize, number>> = {
  EMT: { "1/2": 0.122, "3/4": 0.213, "1": 0.346, "1-1/4": 0.598, "1-1/2": 0.814, "2": 1.342, "2-1/2": 2.343, "3": 3.538 },
  PVC: { "1/2": 0.114, "3/4": 0.203, "1": 0.333, "1-1/4": 0.581, "1-1/2": 0.794, "2": 1.316, "2-1/2": 1.878, "3": 2.907 },
};

/** NEC 240.6(A) standard overcurrent-device ampere ratings. */
export const STANDARD_BREAKERS = [
  15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200,
  225, 250, 300, 350, 400, 450, 500, 600,
];

export interface SelectorResult {
  ok: boolean;
  /** Headline answer, e.g. "3/4\" EMT" or "10 AWG copper" or "25 A breaker". */
  answer: string;
  /** One or two sentences explaining the calc + its assumptions. */
  explanation: string;
  /** Catalog search that resolves the answer to a stocked product. */
  searchQuery: string;
  subcategory: string;
}

function fail(explanation: string): SelectorResult {
  return { ok: false, answer: "—", explanation, searchQuery: "", subcategory: "" };
}

// ── Conduit fill ────────────────────────────────────────────────────────────

export interface ConduitFillInput {
  conductorAwg: AwgSize;
  count: number;
  conduitType: ConduitType;
}

/** Smallest trade size that holds `count` THHN conductors within NEC fill limits. */
export function conduitFill(input: ConduitFillInput): SelectorResult {
  const { conductorAwg, count, conduitType } = input;
  if (count < 1) return fail("Enter at least one conductor.");
  const area = THHN_AREA[conductorAwg];
  const totalArea = area * count;
  // NEC Ch.9 Table 1: 1 conductor = 53%, 2 = 31%, 3+ = 40% of internal area.
  const fillFactor = count === 1 ? 0.53 : count === 2 ? 0.31 : 0.4;
  for (const size of TRADE_ORDER) {
    const internalArea = FILL_40[conduitType][size] / 0.4; // back out 100% area
    if (internalArea * fillFactor >= totalArea) {
      const pct = Math.round((totalArea / internalArea) * 100);
      return {
        ok: true,
        answer: `${size}" ${conduitType}`,
        explanation: `${count} × ${conductorAwg} AWG THHN (${(totalArea).toFixed(3)} sq in) fits ${size}" ${conduitType} at ~${pct}% fill (NEC limit ${Math.round(fillFactor * 100)}%).`,
        searchQuery: `${size} ${conduitType} conduit`,
        subcategory: "Conduit",
      };
    }
  }
  return fail(`${count} × ${conductorAwg} AWG exceeds 3" ${conduitType} capacity — split the run or size up.`);
}

// ── Voltage drop → wire size ─────────────────────────────────────────────────

export type Phase = "1ph" | "3ph";
export type Conductor = "Cu" | "Al";

export interface VoltageDropInput {
  amps: number;
  /** One-way circuit length in feet. */
  lengthFt: number;
  voltage: number;
  phase: Phase;
  material: Conductor;
  /** Target max voltage drop (%), default 3. */
  targetDropPct?: number;
}

/** Smallest conductor that keeps voltage drop within target over the run. */
export function wireSizeForVoltageDrop(input: VoltageDropInput): SelectorResult {
  const { amps, lengthFt, voltage, phase, material } = input;
  const target = input.targetDropPct ?? 3;
  if (amps <= 0 || lengthFt <= 0 || voltage <= 0) return fail("Enter load amps, length, and voltage.");
  const K = material === "Cu" ? 12.9 : 21.2; // ohm-cmil/ft
  const factor = phase === "3ph" ? Math.sqrt(3) : 2;
  const allowedVolts = (voltage * target) / 100;
  const requiredCmil = (factor * K * amps * lengthFt) / allowedVolts;

  const vdMin = AWG_ORDER.find((awg) => CMIL[awg] >= requiredCmil) ?? null;
  const ampMin = AWG_ORDER.find((awg) => AMPACITY[awg] >= amps) ?? null;
  if (!vdMin || !ampMin) {
    return fail("Load/run exceeds 4/0 in this calculator — size with a feeder study or shorten the run.");
  }
  // Final size = the larger (more circular mils) of voltage-drop and ampacity needs.
  const chosen = CMIL[vdMin] >= CMIL[ampMin] ? vdMin : ampMin;
  const governedBy = CMIL[vdMin] > CMIL[ampMin] ? "voltage drop" : "ampacity";
  const actualVolts = (factor * K * amps * lengthFt) / CMIL[chosen];
  const actualPct = Math.round((actualVolts / voltage) * 1000) / 10;
  return {
    ok: true,
    answer: `${chosen} AWG ${material}`,
    explanation: `${amps} A over ${lengthFt} ft (${phase}, ${voltage} V, ${material}) → ${chosen} AWG, governed by ${governedBy}: ~${actualPct}% drop (target ${target}%), ampacity ${AMPACITY[chosen]} A.`,
    searchQuery: `${chosen} AWG ${material === "Cu" ? "copper" : "aluminum"} THHN wire`,
    subcategory: "Wire & Cable",
  };
}

// ── Breaker / OCPD sizing ────────────────────────────────────────────────────

export interface BreakerInput {
  amps: number;
  /** Continuous load (≥3 hrs) → size at 125% per NEC 210.20(A)/215.3. */
  continuous: boolean;
}

export function breakerSize(input: BreakerInput): SelectorResult {
  const { amps, continuous } = input;
  if (amps <= 0) return fail("Enter the load in amps.");
  const required = continuous ? amps * 1.25 : amps;
  const breaker = STANDARD_BREAKERS.find((b) => b >= required);
  if (!breaker) return fail("Load exceeds 600 A — size with an engineered study.");
  return {
    ok: true,
    answer: `${breaker} A breaker`,
    explanation: `${amps} A ${continuous ? "continuous → ×1.25 = " + required.toFixed(1) + " A; " : "load; "}next standard size is ${breaker} A (NEC 240.6).`,
    searchQuery: `${breaker}A 1-pole circuit breaker`,
    subcategory: "Circuit Breakers",
  };
}

export const AWG_SIZES = AWG_ORDER;
export const TRADE_SIZES = TRADE_ORDER;

// ── Ampacity lookup (NEC 310.15) ─────────────────────────────────────────────

// NEC Table 310.15(B)(16) — aluminum THHN/THWN-2, 75°C (building wiring).
// #14 and smaller: not recommended for Al in building wiring — null returned.
const AMPACITY_AL: Record<AwgSize, number | null> = {
  "14": null, "12": 20, "10": 30, "8": 40, "6": 50, "4": 65, "3": 75,
  "2": 90, "1": 100, "1/0": 120, "2/0": 135, "3/0": 155, "4/0": 180,
};

/** NEC 310.15(B)(3)(a) adjustment for >3 current-carrying conductors in a raceway. */
function bundleDerateFactor(conductorCount: number): number {
  if (conductorCount <= 3) return 1.0;
  if (conductorCount <= 6) return 0.80;
  if (conductorCount <= 9) return 0.70;
  if (conductorCount <= 20) return 0.50;
  if (conductorCount <= 30) return 0.45;
  if (conductorCount <= 40) return 0.40;
  return 0.35;
}

/** NEC Table 310.15(B)(2)(a) temperature correction for 75°C conductors. */
function ambientTempCorrection(ambientC: number): number {
  if (ambientC <= 25) return 1.04;
  if (ambientC <= 30) return 1.00;
  if (ambientC <= 35) return 0.96;
  if (ambientC <= 40) return 0.91;
  if (ambientC <= 45) return 0.87;
  if (ambientC <= 50) return 0.82;
  if (ambientC <= 55) return 0.76;
  return 0.71;
}

export interface AmpacityInput {
  awg: AwgSize;
  material: Conductor;
  /** Current-carrying conductors in the raceway for bundle derating. Default 3. */
  conductorCount?: number;
  /** Ambient temperature in °C for temp correction. Default 30°C (no correction). */
  ambientC?: number;
}

/** Derated ampacity for a conductor under the given raceway/temperature conditions. */
export function ampacityLookup(input: AmpacityInput): SelectorResult {
  const { awg, material, conductorCount = 3, ambientC = 30 } = input;
  const base = material === "Cu" ? AMPACITY[awg] : AMPACITY_AL[awg];
  if (base === null || base === undefined) {
    return fail(`${awg} AWG ${material} — not recommended for building wiring. Use copper #14 minimum.`);
  }
  const bundleFactor = bundleDerateFactor(conductorCount);
  const tempFactor = ambientTempCorrection(ambientC);
  const derated = Math.floor(base * bundleFactor * tempFactor);
  const factors: string[] = [];
  if (bundleFactor < 1) factors.push(`bundle ×${bundleFactor} (${conductorCount} conductors)`);
  if (ambientC !== 30) factors.push(`temp ×${tempFactor.toFixed(2)} (${ambientC}°C)`);
  const explanation = factors.length
    ? `${awg} AWG ${material} base ${base} A × ${factors.join(", ")} = ${derated} A derated (NEC 310.15).`
    : `${awg} AWG ${material} = ${derated} A @ 75°C, 30°C ambient, ≤3 conductors (NEC 310.15).`;
  return {
    ok: true,
    answer: `${derated} A (derated)`,
    explanation,
    searchQuery: `${awg} AWG ${material === "Cu" ? "copper" : "aluminum"} THHN wire`,
    subcategory: "Wire & Cable",
  };
}

/** Standalone ampacity lookup — returns the 75°C base (no derating). */
export function wireAmpacity(awg: AwgSize, material: Conductor = "Cu"): number | null {
  if (material === "Al") return AMPACITY_AL[awg];
  return AMPACITY[awg] ?? null;
}

// ── Box fill (NEC 314.16) ─────────────────────────────────────────────────────

// NEC 314.16(B)(1) — volume per conductor equivalent (cu in) for #14 through #6.
const BOX_FILL_VOL: Partial<Record<AwgSize, number>> = {
  "14": 2.00, "12": 2.25, "10": 2.50, "8": 3.00, "6": 5.00,
};

// Standard device boxes sorted by volume (cu in) for "smallest that fits" lookup.
const STANDARD_BOXES = [
  { volume: 15.5, desc: '4" octagon (1-1/2" deep)' },
  { volume: 18.0, desc: "single-gang plastic (standard depth)" },
  { volume: 20.3, desc: "single-gang plastic (deep)" },
  { volume: 21.0, desc: '4" square (1-1/2" deep)' },
  { volume: 22.5, desc: "single-gang old-work (2-1/2\" deep)" },
  { volume: 25.5, desc: "2-gang plastic" },
  { volume: 29.5, desc: '4" square (2-1/8" deep)' },
  { volume: 34.0, desc: "2-gang old-work" },
  { volume: 42.0, desc: "3-gang plastic" },
];

export interface BoxFillInput {
  /**
   * Conductors entering the box by AWG. Largest AWG present is used for
   * device/clamp/ground allowances per NEC 314.16(B).
   * Maximum conductor size: #6 AWG — use a pull box (NEC 314.28) for larger.
   */
  conductors: { awg: AwgSize; count: number }[];
  /** Number of single-pole devices (switches / receptacles). Each = 2 allowances. */
  devices: number;
  /** True if internal cable clamps are present (1 allowance at largest conductor). */
  hasClamp: boolean;
  /** Number of equipment grounding conductors (all together = 1 allowance at largest). */
  groundWires: number;
}

/** Minimum box volume and recommended box per NEC 314.16. */
export function boxFill(input: BoxFillInput): SelectorResult {
  const { conductors, devices, hasClamp, groundWires } = input;
  if (conductors.length === 0 || conductors.every((c) => c.count === 0)) {
    return fail("Enter at least one conductor.");
  }
  // Guard: #4 AWG and larger require NEC 314.28 pull boxes, not 314.16.
  const AWG6_IDX = AWG_ORDER.indexOf("6");
  for (const { awg } of conductors) {
    if (AWG_ORDER.indexOf(awg) > AWG6_IDX) {
      return fail(`Conductors larger than #6 AWG (e.g. ${awg}) require NEC 314.28 pull-box sizing — this calculator covers #14–#6 only.`);
    }
    if (!BOX_FILL_VOL[awg]) {
      return fail(`AWG size ${awg} is not in NEC 314.16(B) table — use #6 AWG or smaller.`);
    }
  }
  // Largest AWG among conductors (highest index = largest diameter).
  const largest = conductors.reduce<AwgSize>(
    (best, c) => (AWG_ORDER.indexOf(c.awg) > AWG_ORDER.indexOf(best) ? c.awg : best),
    conductors[0].awg,
  );
  const largeVol = BOX_FILL_VOL[largest] ?? 0;

  // Conductor allowances
  const conductorVol = conductors.reduce(
    (sum, { awg, count }) => sum + (BOX_FILL_VOL[awg] ?? 0) * count, 0,
  );
  // Device allowances (2 per device, at largest conductor size)
  const deviceVol = devices * 2 * largeVol;
  // Clamp allowance (1 set = 1 allowance at largest conductor)
  const clampVol = hasClamp ? largeVol : 0;
  // Ground allowance (all combined = 1 allowance at largest ground size)
  const groundVol = groundWires > 0 ? largeVol : 0;

  const total = conductorVol + deviceVol + clampVol + groundVol;
  const box = STANDARD_BOXES.find((b) => b.volume >= total);
  const answer = box ? `${box.volume} cu in — ${box.desc}` : "4-gang box or larger (>42 cu in)";
  const breakdown = [
    `conductors ${conductorVol.toFixed(2)} cu in`,
    devices > 0 ? `${devices} device(s) ${deviceVol.toFixed(2)} cu in` : "",
    hasClamp ? `clamps ${clampVol.toFixed(2)} cu in` : "",
    groundWires > 0 ? `${groundWires} ground(s) ${groundVol.toFixed(2)} cu in` : "",
  ].filter(Boolean).join(", ");
  return {
    ok: true,
    answer,
    explanation: `Total: ${total.toFixed(2)} cu in (${breakdown}). Minimum box: ${answer} (NEC 314.16).`,
    searchQuery: box ? `${Math.ceil(box.volume)} cubic inch device box` : "large junction box",
    subcategory: "Boxes & Covers",
  };
}
