import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { NotificationBell } from "@/features/product-finder/NotificationBell";
import { useProductFinder } from "@/lib/product-finder-store";
import type { SavedSearch } from "@/lib/product-finder-saved-search";
import type { SavedQuote } from "@/lib/product-finder-quotes";
import type { ReturnRequest } from "@/lib/product-finder-returns";
import type { AuthUser } from "@/features/product-finder/types";

// NotificationBell.handleClick calls apiGetProduct (fetch) for product-linked
// notifications. We don't exercise that branch here, but stub fetch defensively
// so nothing hits the network if a product-linked notification is ever clicked.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({ product: null }) })),
  );
});

function savedSearch(over: Partial<SavedSearch> = {}): SavedSearch {
  return {
    id: "ss-1",
    name: "Square D breakers",
    query: "q=breaker",
    summary: "Square D · breakers",
    createdAt: 1_700_000_000_000,
    alertsOn: true,
    newMatches: 3,
    ...over,
  };
}

function returnReq(over: Partial<ReturnRequest> = {}): ReturnRequest {
  return {
    id: "rma-1",
    rma: "RMA-20260101-0001",
    orderId: "order-1",
    customerId: null,
    lines: [{ productId: "A", name: "Product A", sku: "A", qty: 1, unitPrice: 25 }],
    reason: "No longer needed",
    status: "approved",
    createdAt: 1_700_000_500_000,
    refundAmount: 25,
    ...over,
  };
}

const MANAGER: AuthUser = {
  name: "Pat Manager",
  email: "pat@meridian.example",
  role: "manager",
  branch: "Corporate",
  branchId: "B-CORP",
};

// A below-floor quote awaiting margin approval — only surfaces for managers.
function pendingQuote(over: Partial<SavedQuote> = {}): SavedQuote {
  return {
    id: "q-1",
    number: "Q-20260101-0001",
    customer: "Acme Electric",
    project: "Plant retrofit",
    lines: [],
    total: 1234.5,
    status: "draft",
    createdAt: 1_700_000_900_000,
    customerId: null,
    marginPct: 0.12,
    approvalStatus: "pending",
    ...over,
  };
}

/**
 * Render the bell and flush its post-mount `useEffect` (which calls
 * `setNow(Date.now())`) inside `act`, so the `now`-gated notification memo is
 * populated before assertions and React doesn't warn about an un-acted update.
 */
function renderBell() {
  const utils = render(<NotificationBell />);
  // Flush the post-mount effect's queued `setNow` synchronously inside act.
  act(() => {});
  return utils;
}

/** Reset every store field the bell reads back to an inert default. */
function resetStore() {
  useProductFinder.setState({
    user: null,
    quotes: [],
    watches: [],
    orders: [],
    returns: [],
    customers: [],
    savedSearches: [],
    notifReads: {},
  });
}

describe("NotificationBell (component)", () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetStore();
  });

  it("render smoke: shows the bell with 0 unread and the panel closed", () => {
    renderBell();
    const trigger = screen.getByRole("button", { name: /Notifications/ });
    expect(trigger).toHaveAttribute("aria-label", "Notifications — 0 unread");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // No badge, no panel region while there is nothing unread / panel is closed.
    expect(screen.queryByRole("region", { name: "Notifications" })).not.toBeInTheDocument();
  });

  it("empty state: opening the panel shows the caught-up message", () => {
    renderBell();
    fireEvent.click(screen.getByRole("button", { name: /Notifications/ }));
    expect(screen.getByRole("button", { name: /Notifications/ })).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("region", { name: "Notifications" });
    expect(within(panel).getByText("You're all caught up")).toBeInTheDocument();
    // Empty panel: no "Mark all read" affordance.
    expect(within(panel).queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
  });

  it("populated: renders an unread badge and notification rows", () => {
    useProductFinder.setState({
      savedSearches: [savedSearch()],
      returns: [returnReq()],
    });
    renderBell();
    const trigger = screen.getByRole("button", { name: /Notifications/ });
    // Two unread notifications (saved-search + rma).
    expect(trigger).toHaveAttribute("aria-label", "Notifications — 2 unread");

    fireEvent.click(trigger);
    const panel = screen.getByRole("region", { name: "Notifications" });
    expect(within(panel).getByText(/new matches — Square D breakers/)).toBeInTheDocument();
    expect(within(panel).getByText(/Return RMA-20260101-0001/)).toBeInTheDocument();
    // Both rows are unread, so each carries the "Unread" dot.
    expect(within(panel).getAllByLabelText("Unread")).toHaveLength(2);
  });

  it("role-gated: a pending below-margin quote shows only for managers/admins", () => {
    useProductFinder.setState({ quotes: [pendingQuote()] });

    // Sales rep: approval notification is hidden.
    const { unmount } = renderBell();
    expect(screen.getByRole("button", { name: /Notifications/ })).toHaveAttribute(
      "aria-label",
      "Notifications — 0 unread",
    );
    unmount();

    // Manager: the approval notification appears.
    useProductFinder.setState({ user: MANAGER });
    renderBell();
    const trigger = screen.getByRole("button", { name: /Notifications/ });
    expect(trigger).toHaveAttribute("aria-label", "Notifications — 1 unread");
    fireEvent.click(trigger);
    expect(screen.getByText(/needs margin approval/)).toBeInTheDocument();
  });

  it("badge caps at 9+ when there are more than nine unread", () => {
    const searches = Array.from({ length: 12 }, (_, i) =>
      savedSearch({ id: `ss-${i}`, name: `Search ${i}`, newMatches: 1 }),
    );
    useProductFinder.setState({ savedSearches: searches });
    renderBell();
    const trigger = screen.getByRole("button", { name: /Notifications/ });
    expect(trigger).toHaveAttribute("aria-label", "Notifications — 12 unread");
    // The visible badge text is clamped to "9+".
    expect(within(trigger).getByText("9+")).toBeInTheDocument();
  });

  it("interaction: clicking an RMA notification marks it read and deep-links to orders", () => {
    const openCartAt = vi.fn();
    useProductFinder.setState({
      returns: [returnReq()],
      openCartAt: openCartAt as unknown as ReturnType<typeof useProductFinder.getState>["openCartAt"],
    });

    renderBell();
    fireEvent.click(screen.getByRole("button", { name: /Notifications/ }));
    const row = screen.getByRole("button", { name: /Return RMA-20260101-0001/ });
    fireEvent.click(row);

    // Deep-links to the orders section of the cart drawer.
    expect(openCartAt).toHaveBeenCalledWith("orders");
    // The click marked the notification read.
    expect(useProductFinder.getState().notifReads["rma:rma-1"]).toBeDefined();
    // Clicking closes the panel.
    expect(screen.getByRole("button", { name: /Notifications/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("interaction: 'Mark all read' clears the unread badge", () => {
    useProductFinder.setState({
      savedSearches: [savedSearch()],
      returns: [returnReq()],
    });
    renderBell();
    const trigger = screen.getByRole("button", { name: /Notifications/ });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));

    expect(trigger).toHaveAttribute("aria-label", "Notifications — 0 unread");
    expect(Object.keys(useProductFinder.getState().notifReads).sort()).toEqual([
      "rma:rma-1",
      "saved-search:ss-1",
    ]);
  });

  it("interaction: the click-away catcher closes an open panel", () => {
    useProductFinder.setState({ savedSearches: [savedSearch()] });
    renderBell();
    const trigger = screen.getByRole("button", { name: /Notifications/ });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // The fixed full-screen overlay is the click-away catcher (aria-hidden).
    const catcher = document.querySelector(".fixed.inset-0.z-40") as HTMLElement;
    expect(catcher).not.toBeNull();
    fireEvent.click(catcher);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
