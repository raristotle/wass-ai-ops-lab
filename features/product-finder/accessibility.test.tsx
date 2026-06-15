import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { GuidedSelectorsModal } from "@/features/product-finder/GuidedSelectorsModal";
import { RfqImportModal } from "@/features/product-finder/RfqImportModal";
import { ReturnModal } from "@/features/product-finder/ReturnModal";
import { BomIntelligenceModal } from "@/features/product-finder/BomIntelligenceModal";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

/**
 * WCAG 2.2 AA structural conformance — axe-core runs over the render-critical
 * modals on the jsdom render-test net (axe skips color-contrast in jsdom, which
 * has no layout; contrast is governed by the brand palette in CLAUDE.md). This
 * is the CI-enforced accessibility bar for the new feature surfaces.
 */
async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container);
  const summary = results.violations.map((v) => `${v.id} x${v.nodes.length}`).join(", ");
  expect(results.violations, `axe violations: ${summary}`).toHaveLength(0);
}

describe("accessibility (axe) — feature modals have no WCAG violations", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ rows: [], items: [] }) })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    useProductFinder.setState({ guidedOpen: false, rfqOpen: false, returnModalOrderId: null, bomIqOpen: false, orders: [], cart: {} });
  });

  it("Guided selectors modal", async () => {
    useProductFinder.setState({ guidedOpen: true });
    const { container } = render(<GuidedSelectorsModal />);
    await expectNoViolations(container);
  });

  it("Inbound RFQ modal", async () => {
    useProductFinder.setState({ rfqOpen: true });
    const { container } = render(<RfqImportModal />);
    await expectNoViolations(container);
  });

  it("Returns / RMA modal", async () => {
    useProductFinder.setState({
      orders: [{ id: "o1", placedAt: 1_700_000_000_000, lines: [{ product: prod("A"), qty: 2 }], total: 40, customerId: null, customerName: null }],
      returnModalOrderId: "o1",
    });
    const { container } = render(<ReturnModal />);
    await expectNoViolations(container);
  });

  it("BOM intelligence modal (empty basket)", async () => {
    useProductFinder.setState({ bomIqOpen: true, cart: {} });
    const { container } = render(<BomIntelligenceModal />);
    await expectNoViolations(container);
  });
});
