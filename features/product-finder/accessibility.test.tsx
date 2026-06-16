import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { GuidedSelectorsModal } from "@/features/product-finder/GuidedSelectorsModal";
import { RfqImportModal } from "@/features/product-finder/RfqImportModal";
import { ReturnModal } from "@/features/product-finder/ReturnModal";
import { BomIntelligenceModal } from "@/features/product-finder/BomIntelligenceModal";
import { JobsModal } from "@/features/product-finder/JobsModal";
import { VmiModal } from "@/features/product-finder/VmiModal";
import { QuickOrderModal } from "@/features/product-finder/QuickOrderModal";
import { CATALOG_PRODUCTS } from "@/data/mock/catalog-products";
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
    useProductFinder.setState({ guidedOpen: false, rfqOpen: false, returnModalOrderId: null, bomIqOpen: false, jobsOpen: false, vmiOpen: false, quickOrderOpen: false, orders: [], cart: {} });
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

  it("Job workspace modal (no jobs)", async () => {
    useProductFinder.setState({ jobsOpen: true });
    const { container } = render(<JobsModal />);
    await expectNoViolations(container);
  });

  it("VMI modal (no policies)", async () => {
    useProductFinder.setState({ vmiOpen: true });
    const { container } = render(<VmiModal />);
    await expectNoViolations(container);
  });

  it("Quick-Order Pad modal (empty)", async () => {
    useProductFinder.setState({ quickOrderOpen: true, orders: [], savedBaskets: [] });
    const { container } = render(<QuickOrderModal />);
    await expectNoViolations(container);
  });

  it("Quick-Order Pad modal (resolved list + recall, populated)", async () => {
    const realSku = CATALOG_PRODUCTS[0].sku;
    useProductFinder.setState({
      quickOrderOpen: true,
      orders: [{ id: "o1", placedAt: 1_700_000_000_000, lines: [{ product: prod("A"), qty: 2 }], total: 40, customerId: null, customerName: null }],
      savedBaskets: [{ id: "b1", name: "Standard kit", lines: [{ product: prod("A"), qty: 1 }], savedAt: 1_700_000_000_000 }],
    });
    const { container, getByLabelText, getByText } = render(<QuickOrderModal />);
    fireEvent.change(getByLabelText(/SKUs/i), { target: { value: `${realSku} 3\nNOPE-XYZ 1` } });
    fireEvent.click(getByText("Resolve list"));
    await expectNoViolations(container);
  });
});

describe("keyboard: Escape closes the new dialogs (WCAG 2.1.2/2.4.3)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useProductFinder.setState({ guidedOpen: false, rfqOpen: false, returnModalOrderId: null, bomIqOpen: false, jobsOpen: false, vmiOpen: false, quickOrderOpen: false, orders: [] });
  });

  it("Escape closes the Guided selectors modal", () => {
    useProductFinder.setState({ guidedOpen: true });
    render(<GuidedSelectorsModal />);
    expect(useProductFinder.getState().guidedOpen).toBe(true);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useProductFinder.getState().guidedOpen).toBe(false);
  });

  it("Escape closes the RFQ modal", () => {
    useProductFinder.setState({ rfqOpen: true });
    render(<RfqImportModal />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useProductFinder.getState().rfqOpen).toBe(false);
  });

  it("Escape closes the Returns/RMA modal", () => {
    useProductFinder.setState({
      orders: [{ id: "o1", placedAt: 1_700_000_000_000, lines: [{ product: prod("A"), qty: 2 }], total: 40, customerId: null, customerName: null }],
      returnModalOrderId: "o1",
    });
    render(<ReturnModal />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useProductFinder.getState().returnModalOrderId).toBeNull();
  });

  it("Escape closes the Job workspace modal", () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ jobs: [], backend: "memory" }) })));
    useProductFinder.setState({ jobsOpen: true });
    render(<JobsModal />);
    expect(useProductFinder.getState().jobsOpen).toBe(true);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useProductFinder.getState().jobsOpen).toBe(false);
  });

  it("Escape closes the VMI modal", () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ lines: [], backend: "memory" }) })));
    useProductFinder.setState({ vmiOpen: true });
    render(<VmiModal />);
    expect(useProductFinder.getState().vmiOpen).toBe(true);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useProductFinder.getState().vmiOpen).toBe(false);
  });

  it("Escape closes the Quick-Order Pad", () => {
    useProductFinder.setState({ quickOrderOpen: true });
    render(<QuickOrderModal />);
    expect(useProductFinder.getState().quickOrderOpen).toBe(true);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useProductFinder.getState().quickOrderOpen).toBe(false);
  });
});
