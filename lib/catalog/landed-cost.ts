/**
 * Landed-cost / bid-award optimizer — electrical distribution is a margin-thin,
 * multi-source business where the win is the cheapest COMPLIANT option at the
 * right lead time, not just the lowest sticker price. For each line this scores
 * the supply options (the line's part + documented crosses + the active
 * successor) by LANDED cost — unit price + estimated freight + a lead-time
 * carrying penalty — and recommends the best award with an explainable rationale.
 * The distributor's sell-side mirror of the Coupa/Ariba bid-comparison agents.
 *
 * Pure + deterministic (inputs injected); the server route builds the options
 * from the catalog and the optional LLM rationale is an env-gated upgrade.
 */

import type { ProductCategory } from "@/features/product-finder/types";

/** Daily carrying-cost rate applied to capital tied up while waiting on stock. */
const DAILY_CARRY_RATE = 0.0006; // ~22%/yr — typical distribution carrying cost

export interface SupplyOption {
  id: string;
  label: string;
  unitPrice: number;
  qty: number;
  /** Days until the option can ship complete. */
  leadDays: number;
  /** Estimated freight per unit. */
  freightPerUnit: number;
  /** Where the option came from. */
  kind: "current" | "cross" | "successor";
}

export interface LandedCost {
  unit: number;
  line: number;
  breakdown: { price: number; freight: number; carry: number };
}

/** Landed cost for one option. */
export function landedCost(opt: SupplyOption, dailyCarryRate = DAILY_CARRY_RATE): LandedCost {
  const price = opt.unitPrice;
  const freight = opt.freightPerUnit;
  const carry = opt.unitPrice * opt.leadDays * dailyCarryRate;
  const unit = Math.round((price + freight + carry) * 100) / 100;
  return {
    unit,
    line: Math.round(unit * opt.qty * 100) / 100,
    breakdown: {
      price: Math.round(price * 100) / 100,
      freight: Math.round(freight * 100) / 100,
      carry: Math.round(carry * 100) / 100,
    },
  };
}

export interface Award {
  /** Lowest-landed-cost option. */
  best: SupplyOption;
  bestLanded: LandedCost;
  /** The line's current option (options[0]) for comparison. */
  current: SupplyOption;
  currentLanded: LandedCost;
  /** Positive when the best option beats the current line. */
  lineSavings: number;
  /** True when the recommendation differs from the current part. */
  switch: boolean;
  rationale: string;
}

/** Pick the lowest-landed-cost award. options[0] MUST be the current line. */
export function bestAward(options: SupplyOption[], dailyCarryRate = DAILY_CARRY_RATE): Award | null {
  if (options.length === 0) return null;
  const scored = options.map((o) => ({ o, landed: landedCost(o, dailyCarryRate) }));
  const current = scored[0];
  // Lowest landed line cost; tie-break to the current option to avoid churn.
  let best = current;
  for (const s of scored) {
    if (s.landed.line < best.landed.line - 0.005) best = s;
  }
  const lineSavings = Math.round((current.landed.line - best.landed.line) * 100) / 100;
  const isSwitch = best.o.id !== current.o.id && lineSavings > 0;
  const rationale = isSwitch
    ? `${best.o.label} lands ${money(lineSavings)} cheaper (${money(best.landed.unit)}/ea vs ${money(current.landed.unit)}/ea: price ${money(best.landed.breakdown.price)} + freight ${money(best.landed.breakdown.freight)} + ${best.o.leadDays}-day carry ${money(best.landed.breakdown.carry)}).`
    : `Current part is already the best landed cost (${money(current.landed.unit)}/ea).`;
  return {
    best: best.o,
    bestLanded: best.landed,
    current: current.o,
    currentLanded: current.landed,
    lineSavings,
    switch: isSwitch,
    rationale,
  };
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Deterministic freight-per-unit estimate by category + value (heavier categories cost more). */
export function estimateFreightPerUnit(category: ProductCategory, unitPrice: number): number {
  const base: Record<ProductCategory, number> = {
    electrical: 0.9, // wire/conduit/gear is heavy
    "oem-electrical": 0.6,
    datacom: 0.4,
    av: 0.5,
    security: 0.45,
    safety: 0.35,
  };
  // Freight floors at the category base and adds a small value-weighted handling component.
  return Math.round((base[category] + unitPrice * 0.01) * 100) / 100;
}
