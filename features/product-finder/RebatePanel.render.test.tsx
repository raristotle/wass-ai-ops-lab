import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { RebatePanel } from "@/features/product-finder/RebatePanel";
import { estimateRebate, rebateForQuantity } from "@/lib/product-finder-rebates";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";

/**
 * Render-net coverage for RebatePanel (v4-S2 #6). RebatePanel is a pure,
 * props-driven leaf: it derives everything from `estimateRebate(product)` and
 * `rebateForQuantity`, reading NO Zustand state and making no network calls.
 * So these tests seed it purely via `product`/`qty` props and walk its branches:
 *   - non-rebate subcategory  → renders nothing (early `return null`)
 *   - rebate-bearing fixture  → base band, DLC badge, controls-uplift hint
 *   - controls-detected specs → controls-applied confirmation branch
 *   - qty 1 vs qty>1          → singular/plural unit label + scaled totals
 *   - lamp unit subcategory   → unit label flows through
 */

const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function prod(over: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "p1",
    sku: "SKU-1",
    name: "Test Fixture",
    brand: "Acme",
    category: "electrical",
    subcategory: "LED Troffers & Panels",
    description: "",
    unitPrice: 80,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
    ...over,
  };
}

const spec = (name: string, value: string): ProductSpec => ({ name, value });

describe("RebatePanel (component)", () => {
  it("renders nothing when the subcategory is not a rebate-bearing lighting category", () => {
    const { container } = render(<RebatePanel product={prod({ subcategory: "Circuit Breakers" })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the rebate estimate with the DLC-eligible badge and base per-fixture band", () => {
    // No controls in specs, default qty=1.
    render(<RebatePanel product={prod()} />);

    expect(screen.getByText("💰 Utility rebate estimate")).toBeInTheDocument();
    // All registry entries are dlcEligible:true → the green eligible badge shows.
    expect(screen.getByText("DLC-eligible category")).toBeInTheDocument();
    expect(screen.queryByText("Check eligibility")).not.toBeInTheDocument();

    // "Per fixture" header + base band $25–$50 for LED Troffers & Panels.
    // At qty=1 the per-unit band and the total band are the same string, so
    // scope each assertion to its own column block to avoid the dup-match.
    const perHeader = screen.getByText("Per fixture");
    const perBlock = perHeader.parentElement as HTMLElement;
    expect(within(perBlock).getByText(`${fmt$(25)}–${fmt$(50)}`)).toBeInTheDocument();

    // qty=1 → singular "Est. for 1 fixture" (no trailing 's'); total band = base.
    const totalHeader = screen.getByText("Est. for 1 fixture");
    const totalBlock = totalHeader.parentElement as HTMLElement;
    expect(within(totalBlock).getByText(`${fmt$(25)}–${fmt$(50)}`)).toBeInTheDocument();

    // No controls → the "Adding ... controls can lift this to ..." hint branch.
    const est = estimateRebate(prod());
    expect(est).not.toBeNull();
    if (!est) throw new Error("estimate expected");
    const lifted = rebateForQuantity(est, 1, true);
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent === `Adding occupancy/daylight controls can lift this to ${fmt$(lifted.low)}–${fmt$(lifted.high)}.`,
      ),
    ).toBeInTheDocument();

    // The disclaimer is always present.
    expect(screen.getByText(/Estimate only/)).toBeInTheDocument();
  });

  it("pluralizes the unit and scales the total for qty > 1", () => {
    render(<RebatePanel product={prod()} qty={4} />);
    expect(screen.getByText("Est. for 4 fixtures")).toBeInTheDocument();
    // base band x4 = $100–$200.
    expect(screen.getByText(`${fmt$(100)}–${fmt$(200)}`)).toBeInTheDocument();
  });

  it("applies the controls-incentive band when the product's specs indicate a control", () => {
    const withCtrl = prod({ specs: [spec("Sensor", "Integrated occupancy sensor")] });
    render(<RebatePanel product={withCtrl} qty={2} />);

    const est = estimateRebate(withCtrl);
    expect(est).not.toBeNull();
    if (!est) throw new Error("estimate expected");
    expect(est.controlsDetected).toBe(true);

    // Per-fixture band now reflects the controls-uplift (2.5x): $62.50–$125.
    expect(screen.getByText(`${fmt$(est.withControlsLow)}–${fmt$(est.withControlsHigh)}`)).toBeInTheDocument();

    // The "✓ Controls detected" confirmation branch shows the without-controls base.
    const base = rebateForQuantity(est, 2, false);
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          `✓ Controls detected — the higher controls-incentive band is applied (base ${fmt$(base.low)}–${fmt$(base.high)} without).`,
      ),
    ).toBeInTheDocument();
    // The "Adding controls" hint must NOT render in the controls-detected branch.
    expect(screen.queryByText(/Adding occupancy\/daylight controls/)).not.toBeInTheDocument();
  });

  it("carries the 'lamp' unit through for tube/lamp subcategories", () => {
    render(<RebatePanel product={prod({ subcategory: "Lamps & Tubes" })} qty={3} />);
    expect(screen.getByText("Per lamp")).toBeInTheDocument();
    expect(screen.getByText("Est. for 3 lamps")).toBeInTheDocument();
    // Lamps & Tubes base band is $2–$10/lamp.
    expect(screen.getByText(`${fmt$(2)}–${fmt$(10)}`)).toBeInTheDocument();
  });

  it("treats a fractional/zero qty deterministically (floored, clamped at 0)", () => {
    // rebateForQuantity floors qty and clamps at 0; qty=0 → 'Est. for 0 fixtures' $0–$0.
    render(<RebatePanel product={prod()} qty={0} />);
    const header = screen.getByText("Est. for 0 fixtures");
    // The total band sits in the same column block as the header.
    const block = header.parentElement as HTMLElement;
    expect(within(block).getByText(`${fmt$(0)}–${fmt$(0)}`)).toBeInTheDocument();
  });
});
