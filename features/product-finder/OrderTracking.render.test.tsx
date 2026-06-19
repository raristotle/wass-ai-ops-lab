import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";
import { OrderTracking } from "@/features/product-finder/OrderTracking";
import { useProductFinder } from "@/lib/product-finder-store";
import type { Order } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

// Deterministic clock so the tracking timeline (which derives stage state from
// Date.now() relative to placedAt) is reproducible.
const PLACED_AT = Date.UTC(2026, 0, 1, 12, 0, 0); // 2026-01-01

function prod(id: string, withBranch = true): CatalogProduct {
  return {
    id,
    sku: id,
    name: `Product ${id}`,
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 20,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock: withBranch
      ? [{ branchId: "B-HOU-01", branchName: "Houston", city: "Houston", state: "TX", quantity: 5 }]
      : [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
  };
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    placedAt: PLACED_AT,
    lines: [{ product: prod("A"), qty: 3 }],
    total: 60,
    customerId: null,
    customerName: null,
    ...overrides,
  };
}

const initialState = useProductFinder.getState();

/**
 * The delivery tracking panel mounts JobsiteWeatherBadge, which fires a fetch on
 * mount and calls setState in a .then(). Wait for that fetch to have been issued
 * (and let its microtasks drain) so the resulting state update is flushed inside
 * React's act() — otherwise React logs a "not wrapped in act(...)" warning after
 * the synchronous test body returns.
 */
async function flushWeatherFetch() {
  const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  await waitFor(() => {
    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls.some(([u]) => typeof u === "string" && u.includes("/api/weather"))).toBe(true);
  });
}

describe("OrderTracking (component)", () => {
  beforeEach(() => {
    // Pin Date.now() (NOT fake timers — the component fetches and we rely on
    // real microtask/timer flushing for waitFor). ETA window for the seeded
    // order is 2 days (in-stock at the home branch), so +1 day is mid-timeline:
    // some stages done, not yet delivered.
    vi.spyOn(Date, "now").mockReturnValue(PLACED_AT + 1 * 86_400_000);
    // Default: weather lane dormant (enabled:false) + a benign cXML response.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("/api/weather")) {
          return { ok: true, json: async () => ({ enabled: false }) } as Response;
        }
        return { ok: true, text: async () => "<cXML/>" } as unknown as Response;
      }),
    );
    // jsdom lacks Blob URL plumbing used by downloadText().
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
    // downloadText() calls anchor.click(); jsdom would try to "navigate" and log
    // a noisy "Not implemented" error. No-op it for the doc-download path.
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    useProductFinder.setState({
      user: { ...(initialState.user ?? {}), branchId: "B-HOU-01" } as typeof initialState.user,
      orderFulfillment: {},
      returnModalOrderId: null,
    });
  });

  afterEach(() => {
    // Unmount mounted trees BEFORE resetting the Zustand store — otherwise the
    // setState below pushes an update into a still-subscribed component outside
    // React's act() and logs a "not wrapped in act(...)" warning.
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    useProductFinder.setState({
      orderFulfillment: {},
      returnModalOrderId: null,
      user: initialState.user,
    });
  });

  it("renders a collapsed summary with the Track order + Start a return controls", () => {
    render(<OrderTracking order={order()} />);
    expect(screen.getByRole("button", { name: "Track order" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start a return" })).toBeInTheDocument();
    // Status summary line shows an ETA word for a not-yet-delivered delivery order.
    expect(screen.getByText(/arrives ~/i)).toBeInTheDocument();
    // Collapsed: the timeline detail (Fulfillment toggle) is not mounted.
    expect(screen.queryByText("Fulfillment:")).not.toBeInTheDocument();
  });

  it("expands the timeline panel and shows the delivery-labelled stages", async () => {
    render(<OrderTracking order={order()} />);
    fireEvent.click(screen.getByRole("button", { name: "Track order" }));
    // Toggle button label flips.
    expect(screen.getByRole("button", { name: "Hide tracking" })).toBeInTheDocument();
    expect(screen.getByText("Fulfillment:")).toBeInTheDocument();
    // Delivery-method stage labels are present.
    expect(screen.getByText("Order placed")).toBeInTheDocument();
    expect(screen.getByText("Out for delivery")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    // cXML procurement controls are present.
    expect(screen.getByRole("button", { name: "Order confirmation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ship notice (ASN)" })).toBeInTheDocument();
    // The delivery panel mounts the (dormant) weather badge, which fetches on
    // mount — flush that so its state update settles inside act().
    await flushWeatherFetch();
  });

  it("switches to will-call and relabels the stages + summary", async () => {
    render(<OrderTracking order={order()} />);
    fireEvent.click(screen.getByRole("button", { name: "Track order" }));
    await flushWeatherFetch(); // delivery panel badge fetch
    fireEvent.click(screen.getByRole("button", { name: "Will-call pickup" }));
    // Store updated.
    expect(useProductFinder.getState().orderFulfillment["order-1"]).toBe("willcall");
    // Will-call stage labels replace the delivery ones.
    expect(screen.getByText("Staged for pickup")).toBeInTheDocument();
    expect(screen.getByText("Ready for pickup")).toBeInTheDocument();
    // Summary uses "ready" rather than "arrives" for will-call.
    expect(screen.getByText(/ready ~/i)).toBeInTheDocument();
  });

  it("renders the delivered status when now is past the full ETA window", () => {
    // Far in the future: every stage is done.
    vi.spyOn(Date, "now").mockReturnValue(PLACED_AT + 365 * 86_400_000);
    render(<OrderTracking order={order()} />);
    // Summary collapses to the bare delivered status (no 'arrives ~' suffix).
    expect(screen.queryByText(/arrives ~/i)).not.toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("opens the return modal for this order via the store handler", () => {
    render(<OrderTracking order={order()} />);
    expect(useProductFinder.getState().returnModalOrderId).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Start a return" }));
    expect(useProductFinder.getState().returnModalOrderId).toBe("order-1");
  });

  it("generates an order-confirmation cXML doc (POSTs to the order-status API)", async () => {
    render(<OrderTracking order={order()} />);
    fireEvent.click(screen.getByRole("button", { name: "Track order" }));
    await flushWeatherFetch(); // settle the badge's mount fetch first
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Order confirmation" }));
    await waitFor(() => {
      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      expect(calls.some(([u]) => u === "/api/procurement/order-status")).toBe(true);
    });
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    const post = calls.find(([u]) => u === "/api/procurement/order-status")!;
    expect(post[1].method).toBe("POST");
    expect(JSON.parse(post[1].body as string).kind).toBe("confirmation");
  });

  it("surfaces an inline error when the doc API responds non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("/api/weather")) {
          return { ok: true, json: async () => ({ enabled: false }) } as Response;
        }
        return { ok: false, status: 500, text: async () => "" } as unknown as Response;
      }),
    );
    render(<OrderTracking order={order()} />);
    fireEvent.click(screen.getByRole("button", { name: "Track order" }));
    await flushWeatherFetch(); // settle the badge's mount fetch first
    fireEvent.click(screen.getByRole("button", { name: "Ship notice (ASN)" }));
    expect(await screen.findByText(/Could not generate the document/i)).toBeInTheDocument();
  });

  it("does not crash and shows a status summary when no branch stock is present", async () => {
    const o = order({ lines: [{ product: prod("A", false), qty: 1 }] });
    const { container } = render(<OrderTracking order={o} />);
    expect(within(container).getByRole("button", { name: "Track order" })).toBeInTheDocument();
    // No metro -> opening the panel must not throw and weather badge is absent.
    fireEvent.click(screen.getByRole("button", { name: "Track order" }));
    expect(screen.getByText("Fulfillment:")).toBeInTheDocument();
    // No branch metro -> the dormant weather badge is NOT mounted (no fetch).
    expect(screen.queryByText(/Install/)).not.toBeInTheDocument();
    // Drain any straggler microtasks so nothing updates state after the test.
    await waitFor(() => expect(screen.getByText("Fulfillment:")).toBeInTheDocument());
  });
});
