import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OfferLadderPanel } from "@/features/product-finder/OfferLadderPanel";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { Offer } from "@/lib/product-finder-offers";

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

function offer(partial: Partial<Offer>): Offer {
  return {
    source: "Meridian (branch)",
    authorized: false,
    stock: null,
    leadDays: null,
    unitPrice: null,
    priceBreaks: [],
    url: null,
    ...partial,
  };
}

interface OffersResponse {
  productId: string;
  realPart: boolean;
  ladder: Offer[];
  best: Offer | null;
  sourceCount: number;
  lanes: Record<string, string>;
  fetchedAt: string;
}

function response(partial: Partial<OffersResponse>): OffersResponse {
  return {
    productId: "A",
    realPart: false,
    ladder: [],
    best: null,
    sourceCount: 0,
    lanes: {},
    fetchedAt: "2026-06-18T00:00:00.000Z",
    ...partial,
  };
}

/** Stub fetch to resolve the offers endpoint with the given body (ok: true). */
function stubOffers(body: OffersResponse) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => body })),
  );
}

describe("OfferLadderPanel (component)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => response({}) })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders nothing while the fetch is pending (no data yet)", () => {
    // fetch never resolves -> data stays null -> component returns null
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { container } = render(<OfferLadderPanel product={prod("A")} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the ladder comes back empty", async () => {
    stubOffers(response({ ladder: [], sourceCount: 0 }));
    const { container } = render(<OfferLadderPanel product={prod("A")} />);
    // Give the resolved promise a tick; the empty ladder must keep it blank.
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing when the response itself is null (non-ok)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    const { container } = render(<OfferLadderPanel product={prod("A")} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders the dormant Meridian-only ladder with the volume-curve note", async () => {
    const best = offer({
      source: "Meridian (branch)",
      authorized: true,
      stock: 1240,
      leadDays: 0,
      unitPrice: 18.5,
      priceBreaks: [
        { qty: 1, price: 18.5 },
        { qty: 10, price: 17 },
        { qty: 50, price: 15.25 },
      ],
    });
    stubOffers(
      response({
        ladder: [best],
        best,
        sourceCount: 1,
        lanes: { internal: "Meridian" }, // no external lane keys -> dormant
      }),
    );

    render(<OfferLadderPanel product={prod("A")} />);

    // Header + singular "source" + the volume-curve suffix (best has >1 breaks).
    expect(await screen.findByRole("heading", { name: "Offer Ladder" })).toBeInTheDocument();
    expect(screen.getByText(/1 source/)).toBeInTheDocument();
    expect(screen.getByText(/volume curve/)).toBeInTheDocument();

    // Best badge + authorized badge + formatted price + stock formatting.
    expect(screen.getByText("Best")).toBeInTheDocument();
    expect(screen.getByText("Authorized")).toBeInTheDocument();
    expect(screen.getByText("$18.50")).toBeInTheDocument();
    expect(screen.getByText("1,240 in stock")).toBeInTheDocument();

    // The price-curve sparkline renders for the best (>=2 points).
    expect(screen.getByRole("img", { name: /Volume price curve/ })).toBeInTheDocument();

    // Dormant footer copy (external not configured).
    expect(screen.getByText(/Showing the Meridian volume ladder/)).toBeInTheDocument();
    expect(screen.queryByText(/Live, fetched on demand/)).not.toBeInTheDocument();
  });

  it("renders a configured multi-source ladder: price-on-request, lead time, View link, and live note", async () => {
    const best = offer({
      source: "Mouser Electronics",
      authorized: true,
      stock: 500,
      leadDays: 0,
      unitPrice: 12.34,
      priceBreaks: [{ qty: 1, price: 12.34 }], // single break -> no "volume curve", no sparkline
      url: "https://mouser.com/part",
    });
    const second = offer({
      source: "OEMsecrets Broker",
      authorized: false,
      stock: null,
      leadDays: 21,
      unitPrice: null, // -> "price on request"
      url: null,
    });
    stubOffers(
      response({
        ladder: [best, second],
        best,
        sourceCount: 2,
        lanes: { live: "Mouser", oemsecrets: "OEMsecrets" }, // external configured
      }),
    );

    render(<OfferLadderPanel product={prod("A")} />);

    expect(await screen.findByText("Mouser Electronics")).toBeInTheDocument();
    expect(screen.getByText("OEMsecrets Broker")).toBeInTheDocument();

    // Plural "sources", and NO volume-curve suffix (best has a single break).
    expect(screen.getByText(/2 sources/)).toBeInTheDocument();
    expect(screen.queryByText(/volume curve/)).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Volume price curve/ })).not.toBeInTheDocument();

    // Branch coverage: priced best vs unpriced second.
    expect(screen.getByText("$12.34")).toBeInTheDocument();
    expect(screen.getByText("price on request")).toBeInTheDocument();

    // leadDays > 0 renders for the second; leadDays === 0 does NOT render for the best.
    expect(screen.getByText("21-day lead")).toBeInTheDocument();
    expect(screen.queryByText("0-day lead")).not.toBeInTheDocument();

    // View link is present for the offer with a url, absent for the one without.
    const links = screen.getAllByRole("link", { name: "View" });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://mouser.com/part");

    // Configured footer copy.
    expect(screen.getByText(/Live, fetched on demand/)).toBeInTheDocument();
    expect(screen.queryByText(/Showing the Meridian volume ladder/)).not.toBeInTheDocument();
  });

  it("re-fetches when the product id changes", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => response({ ladder: [] }) }));
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(<OfferLadderPanel product={prod("A")} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender(<OfferLadderPanel product={prod("B")} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const calls = fetchMock.mock.calls as unknown as Array<[string]>;
    expect(calls[0][0]).toContain("/api/products/A/offers");
    expect(calls[1][0]).toContain("/api/products/B/offers");
  });
});
