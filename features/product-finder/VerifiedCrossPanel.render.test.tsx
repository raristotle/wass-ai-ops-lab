import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VerifiedCrossPanel } from "@/features/product-finder/VerifiedCrossPanel";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct, ProductDataSource } from "@/features/product-finder/types";
import type { VerifiedCrossResult } from "@/lib/catalog/verified-crosses";
import type { BrandNode } from "@/lib/catalog/brand-hierarchy";

// ── Builders ─────────────────────────────────────────────────────────────────

function prod(id: string, dataSource?: ProductDataSource, overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id,
    sku: id,
    name: `Product ${id}`,
    brand: "Square D",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 20,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
    dataSource,
    ...overrides,
  };
}

function cross(overrides: Partial<VerifiedCrossResult> = {}): VerifiedCrossResult {
  return {
    originalSku: "QO120",
    substituteSku: "BR120",
    substituteBrand: "Eaton",
    relation: "equivalent",
    substituteProduct: null,
    matchReason: "Documented equivalent per manufacturer cross-reference",
    matchingAttributes: [],
    missingAttributes: [],
    conflictingAttributes: [],
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://example.com/cross",
    confidence: 97,
    warnings: [],
    productionReady: true,
    ...overrides,
  };
}

const hierarchy: BrandNode = {
  brand: "Square D",
  division: "Schneider Electric",
  parentCompany: "Schneider Electric",
  sourceUrl: "https://example.com/brand",
  verifiedAt: "2026-01-01",
};

/** Stub global fetch so apiGetProduct(product.id) resolves to a ProductDetail. */
function stubDetail(detail: { verifiedCrosses?: VerifiedCrossResult[]; brandHierarchy?: BrandNode | null }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => detail })),
  );
}

describe("VerifiedCrossPanel (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ detailModalProduct: null, cart: {} });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    useProductFinder.setState({ detailModalProduct: null, cart: {} });
  });

  it("renders nothing for a non-verified product without ever fetching", () => {
    // dataSource undefined (simulated) → effect early-returns, crosses=[], no hierarchy.
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { container } = render(<VerifiedCrossPanel product={prod("QO120", "simulated")} />);
    expect(container).toBeEmptyDOMElement();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders nothing when the product is verified but has no crosses and no differing hierarchy", async () => {
    stubDetail({ verifiedCrosses: [], brandHierarchy: null });
    const { container } = render(<VerifiedCrossPanel product={prod("QO120", "verified")} />);
    // After the async resolve settles, the component returns null.
    await waitFor(() => expect((globalThis.fetch as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders the panel header and a stocked cross with working View + Add handlers", async () => {
    const substitute = prod("BR120", "verified", { brand: "Eaton", name: "Eaton BR120 breaker" });
    stubDetail({
      verifiedCrosses: [
        cross({
          substituteProduct: substitute,
          matchingAttributes: ["Amp Rating", "Poles"],
          confidence: 96.4,
        }),
      ],
      brandHierarchy: null,
    });

    render(<VerifiedCrossPanel product={prod("QO120", "verified")} />);

    // Header + source attribution render once crosses resolve.
    expect(await screen.findByText("Verified cross-references")).toBeInTheDocument();
    expect(screen.getByText("browse all")).toBeInTheDocument();
    // The cross row: brand+sku, match reason, rounded confidence badge, matching attrs.
    expect(screen.getByText("Eaton BR120")).toBeInTheDocument();
    expect(screen.getByText(/Documented equivalent/)).toBeInTheDocument();
    expect(screen.getByText("96%")).toBeInTheDocument(); // 96.4 → toFixed(0)
    expect(screen.getByText(/matches: Amp Rating, Poles/)).toBeInTheDocument();

    // View → setDetailModalProduct(substitute).
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(useProductFinder.getState().detailModalProduct?.id).toBe("BR120");

    // + Add → addToCart(substitute, 1).
    fireEvent.click(screen.getByRole("button", { name: "+ Add" }));
    expect(useProductFinder.getState().cart["BR120"]?.qty).toBe(1);
  });

  it("renders an unstocked cross with the not-stocked badge, stated attributes and warnings", async () => {
    stubDetail({
      verifiedCrosses: [
        cross({
          substituteProduct: null,
          statedAttributes: { Amps: "20", Poles: "1" },
          warnings: ["Substitute is documented but not in the stocked catalog — availability unknown"],
        }),
      ],
      brandHierarchy: null,
    });

    render(<VerifiedCrossPanel product={prod("QO120", "curated")} />);

    expect(await screen.findByText("not stocked")).toBeInTheDocument();
    // No action buttons when the substitute is not in the catalog.
    expect(screen.queryByRole("button", { name: "View" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add" })).not.toBeInTheDocument();
    // Source-stated attributes line (only shown when there is no stocked product).
    expect(screen.getByText(/Source states:/)).toBeInTheDocument();
    expect(screen.getByText(/Amps 20 · Poles 1/)).toBeInTheDocument();
    // Warning line.
    expect(screen.getByText(/availability unknown/)).toBeInTheDocument();
  });

  it("renders the brand-hierarchy line when the parent company differs from the brand", async () => {
    stubDetail({ verifiedCrosses: [], brandHierarchy: hierarchy });

    render(<VerifiedCrossPanel product={prod("QO120", "verified")} />);

    // Panel shows even with zero crosses because the hierarchy differs from the brand.
    expect(await screen.findByText("Verified cross-references")).toBeInTheDocument();
    expect(screen.getByText(/is part of/)).toBeInTheDocument();
    expect(screen.getByText("Schneider Electric")).toBeInTheDocument();
    // Division is rendered in parentheses.
    expect(screen.getByText(/\(Schneider Electric\)/)).toBeInTheDocument();
    // Hierarchy source link points at the node's sourceUrl.
    const link = screen.getByRole("link", { name: "source" });
    expect(link).toHaveAttribute("href", "https://example.com/brand");
  });

  it("does not render the hierarchy line when the parent company equals the brand", async () => {
    // Independent brand: parentCompany === brand (case-insensitive) → showHierarchy false.
    stubDetail({
      verifiedCrosses: [cross({ substituteProduct: prod("BR120", "verified", { brand: "Eaton" }) })],
      brandHierarchy: { ...hierarchy, parentCompany: "square d", division: undefined },
    });

    render(<VerifiedCrossPanel product={prod("QO120", "verified")} />);

    expect(await screen.findByText("Verified cross-references")).toBeInTheDocument();
    expect(screen.queryByText(/is part of/)).not.toBeInTheDocument();
  });

  it("renders nothing when the detail fetch rejects (catch path sets crosses=[])", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );
    const { container } = render(<VerifiedCrossPanel product={prod("QO120", "verified")} />);
    await waitFor(() => expect((globalThis.fetch as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
