import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { NextBestActionCard } from "@/features/product-finder/NextBestActionCard";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { SavedQuote } from "@/lib/product-finder-quotes";
import type { Order } from "@/lib/product-finder-store";
import type { CustomerAccount } from "@/lib/integration/types";

// NextBestActionCard's go() handler pushes a route for "search" targets
// (seasonal / stock-up). Mock next/navigation so it renders + routes in jsdom,
// and capture push() so we can assert the search branch fires.
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const DAY_MS = 86_400_000;
// Deterministic "now" — the card reads Date.now() once via useMemo, and the
// engine derives staleness/cadence from it. Freeze the clock so the same seeds
// always cross the staleness/at-risk thresholds.
const NOW = 1_750_000_000_000; // 2025-06-15-ish, stable

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

function customer(id: string, name: string): CustomerAccount {
  return { id, name, tier: "standard", discountByCategory: {}, shipToCity: "Pittsburgh", terms: "Net 30" };
}

// A "sent" quote older than STALE_DAYS (14) → follow-up-stale action (target quotes).
function staleQuote(): SavedQuote {
  return {
    id: "q-stale", number: "Q-20250101-0001", customer: "Acme Electric", project: "Plant A",
    lines: [{ product: prod("A"), qty: 5 }], total: 4200, status: "sent",
    createdAt: NOW - 30 * DAY_MS, customerId: "CUST-1",
  };
}

// An order placed long ago for a single-order customer (45-day baseline × 2) →
// at-risk → reach-out-at-risk action (target orders).
function staleOrder(): Order {
  return {
    id: "o-old", placedAt: NOW - 120 * DAY_MS, lines: [{ product: prod("A"), qty: 2 }],
    total: 80, customerId: "CUST-1", customerName: "Acme Electric",
  };
}

function seedEmpty() {
  useProductFinder.setState({ quotes: [], orders: [], customers: [] });
}

describe("NextBestActionCard (component)", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    push.mockClear();
    seedEmpty();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    useProductFinder.setState({ quotes: [], orders: [], customers: [], cartSection: null, cartQuoteStatusFilter: null, activeCustomerId: null });
  });

  it("renders nothing when the only candidate is the always-on seasonal nudge", () => {
    // Empty pipeline → only the seasonal "run-promo" action exists, which the
    // card filters out of the actionable gate → it renders null.
    const { container } = render(<NextBestActionCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the ranked list with a labeled region when there are actionable signals", () => {
    useProductFinder.setState({ quotes: [staleQuote()], orders: [staleOrder()], customers: [customer("CUST-1", "Acme Electric")] });
    render(<NextBestActionCard />);

    const region = screen.getByRole("region", { name: "Next best actions" });
    expect(region).toBeInTheDocument();
    expect(within(region).getByText("Next Best Actions")).toBeInTheDocument();
    // Both the stale-quote follow-up and the at-risk re-engage actions render.
    expect(screen.getByText("Follow up on a stale quote")).toBeInTheDocument();
    expect(screen.getByText("Re-engage an at-risk account")).toBeInTheDocument();
    // Each action is a button.
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(2);
  });

  it("shows the candidate-signal count, pluralized", () => {
    // One at-risk customer + its order = one actionable signal; the always-on
    // seasonal promo is candidate #2. total counts every candidate → "2 signals".
    // (The singular "signal" branch is effectively unreachable: the card only
    // renders when there is ≥1 actionable signal, and the promo is always a
    // second candidate, so total is always ≥ 2 at render time.)
    useProductFinder.setState({ quotes: [], orders: [staleOrder()], customers: [customer("CUST-1", "Acme Electric")] });
    render(<NextBestActionCard />);
    expect(screen.getByText(/2 signals/)).toBeInTheDocument();
  });

  it("follow-up-stale action deep-links to the sent quotes via openCartAt", () => {
    useProductFinder.setState({ quotes: [staleQuote()], orders: [], customers: [] });
    render(<NextBestActionCard />);
    act(() => fireEvent.click(screen.getByText("Follow up on a stale quote")));
    const s = useProductFinder.getState();
    expect(s.cartSection).toBe("quotes");
    expect(s.cartQuoteStatusFilter).toBe("sent");
  });

  it("reach-out-at-risk action sets the active customer and opens orders", () => {
    useProductFinder.setState({ quotes: [], orders: [staleOrder()], customers: [customer("CUST-1", "Acme Electric")] });
    render(<NextBestActionCard />);
    act(() => fireEvent.click(screen.getByText("Re-engage an at-risk account")));
    const s = useProductFinder.getState();
    expect(s.activeCustomerId).toBe("CUST-1");
    expect(s.cartSection).toBe("orders");
  });

  it("a search-target action (seasonal nudge) routes via the router", () => {
    // Seed one actionable signal so the card renders; the seasonal promo row is
    // always present and carries a { kind: 'search' } target.
    useProductFinder.setState({ quotes: [staleQuote()], orders: [], customers: [] });
    render(<NextBestActionCard />);
    const promo = screen.getByText(/^Seasonal push:/);
    act(() => fireEvent.click(promo));
    expect(push).toHaveBeenCalledTimes(1);
    const calls = push.mock.calls as unknown as [string][];
    expect(calls[0][0]).toMatch(/^\/product-finder\?/);
  });
});
