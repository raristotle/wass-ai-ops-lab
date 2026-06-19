import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LiveDistributorPanel } from "@/features/product-finder/LiveDistributorPanel";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string, sku = id): CatalogProduct {
  return {
    id,
    sku,
    name: `Product ${id}`,
    brand: "Acme",
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
  };
}

type LiveQuote = {
  distributor: string;
  matchedPart: string;
  manufacturer: string;
  description: string;
  unitPrice: number | null;
  priceBreaks: { qty: number; price: number }[];
  stock: number | null;
  datasheetUrl: string | null;
  productUrl: string | null;
};

type LiveResponse = {
  enabled: boolean;
  reason?: string;
  configured?: string[];
  quotes: LiveQuote[];
  fetchedAt?: string;
};

/** Stub global fetch to return the given LiveResponse body (ok:200). */
function stubFetch(body: LiveResponse | null, ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    json: async () => body,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const QUOTE_FULL: LiveQuote = {
  distributor: "Mouser",
  matchedPart: "MP-12345",
  manufacturer: "Schneider",
  description: "20A breaker",
  unitPrice: 12.5,
  priceBreaks: [{ qty: 10, price: 11 }],
  stock: 4200,
  datasheetUrl: "https://example.com/ds.pdf",
  productUrl: "https://example.com/p",
};

const QUOTE_SPARSE: LiveQuote = {
  distributor: "Digi-Key",
  matchedPart: "DK-99",
  manufacturer: "Eaton",
  description: "contactor",
  unitPrice: null,
  priceBreaks: [],
  stock: null,
  datasheetUrl: null,
  productUrl: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LiveDistributorPanel (component)", () => {
  it("renders nothing while the fetch is still in flight (loading)", () => {
    // A fetch that never resolves keeps the component in its loading branch.
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { container } = render(<LiveDistributorPanel product={prod("A")} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the live seam is dormant (enabled:false)", async () => {
    const fetchMock = stubFetch({ enabled: false, quotes: [], reason: "no keys" });
    const { container } = render(<LiveDistributorPanel product={prod("A")} />);
    // Let the effect's promise chain settle, then assert it stayed quiet.
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing when the response is not ok (json() short-circuits to null)", async () => {
    const fetchMock = stubFetch(null, false);
    const { container } = render(<LiveDistributorPanel product={prod("A")} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("shows the empty-match message when enabled but no quotes returned", async () => {
    stubFetch({
      enabled: true,
      configured: ["Mouser", "Digi-Key"],
      quotes: [],
      fetchedAt: "2026-06-18T15:30:00.000Z",
    });
    render(<LiveDistributorPanel product={prod("A", "SKU-ABC")} />);

    expect(await screen.findByText("Live Distributor Data")).toBeInTheDocument();
    // configured distributors are joined with " + "
    expect(screen.getByText(/Mouser \+ Digi-Key/)).toBeInTheDocument();
    // empty-state copy mentions the SKU
    expect(screen.getByText(/No live match for part/)).toBeInTheDocument();
    expect(screen.getByText(/SKU-ABC/)).toBeInTheDocument();
  });

  it("renders a populated quote with price, stock, and both links", async () => {
    stubFetch({
      enabled: true,
      configured: ["Mouser"],
      quotes: [QUOTE_FULL],
      fetchedAt: "2026-06-18T15:30:00.000Z",
    });
    render(<LiveDistributorPanel product={prod("A")} />);

    expect(await screen.findByText("Mouser")).toBeInTheDocument();
    expect(screen.getByText("MP-12345")).toBeInTheDocument();
    // unitPrice formatted to 2dp with a $ prefix
    expect(screen.getByText("$12.50")).toBeInTheDocument();
    // stock rendered with locale grouping
    expect(screen.getByText(/4,200 in stock/)).toBeInTheDocument();

    const datasheet = screen.getByRole("link", { name: "Datasheet" });
    expect(datasheet).toHaveAttribute("href", "https://example.com/ds.pdf");
    expect(datasheet).toHaveAttribute("target", "_blank");
    expect(datasheet).toHaveAttribute("rel", "noreferrer");

    const productLink = screen.getByRole("link", { name: "View at distributor" });
    expect(productLink).toHaveAttribute("href", "https://example.com/p");
  });

  it("omits price/stock/links for a sparse quote (all nullable fields null)", async () => {
    stubFetch({
      enabled: true,
      configured: ["Digi-Key"],
      quotes: [QUOTE_SPARSE],
      fetchedAt: "2026-06-18T15:30:00.000Z",
    });
    render(<LiveDistributorPanel product={prod("A")} />);

    expect(await screen.findByText("Digi-Key")).toBeInTheDocument();
    expect(screen.getByText("DK-99")).toBeInTheDocument();
    // None of the conditional bits should be present
    expect(screen.queryByText(/in stock/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Datasheet" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View at distributor" })).not.toBeInTheDocument();
  });

  it("falls back to \"now\" in the header when fetchedAt is absent", async () => {
    stubFetch({ enabled: true, configured: [], quotes: [QUOTE_FULL] });
    render(<LiveDistributorPanel product={prod("A")} />);

    // header reads: "fetched now · " when no timestamp and no configured list
    expect(await screen.findByText(/fetched now/)).toBeInTheDocument();
  });

  it("re-fetches when the product id changes", async () => {
    const fetchMock = stubFetch({
      enabled: true,
      configured: ["Mouser"],
      quotes: [QUOTE_FULL],
      fetchedAt: "2026-06-18T15:30:00.000Z",
    });
    const { rerender } = render(<LiveDistributorPanel product={prod("first")} />);
    await screen.findByText("Mouser");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender(<LiveDistributorPanel product={prod("second")} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls[0][0]).toContain("/api/products/first/live");
    expect(calls[1][0]).toContain("/api/products/second/live");
  });
});
