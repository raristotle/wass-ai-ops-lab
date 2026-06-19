import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { WillCallQueueModal } from "@/features/product-finder/WillCallQueueModal";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

function order(id: string, opts: { customerName?: string | null; placedAt?: number; qty?: number } = {}) {
  return {
    id,
    placedAt: opts.placedAt ?? 1_700_000_000_000,
    lines: [{ product: prod("A"), qty: opts.qty ?? 2 }, { product: prod("B"), qty: 1 }],
    total: 80,
    customerId: null,
    customerName: opts.customerName === undefined ? "Acme Electric" : opts.customerName,
  };
}

// Reset the modal-relevant slice of the real store between tests.
function resetStore() {
  useProductFinder.setState({
    willCallOpen: false,
    orders: [],
    orderFulfillment: {},
    brandId: "meridian",
    locale: "en",
  });
}

describe("WillCallQueueModal (component)", () => {
  beforeEach(() => resetStore());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetStore();
  });

  it("renders nothing when the modal is closed", () => {
    useProductFinder.setState({ willCallOpen: false });
    const { container } = render(<WillCallQueueModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the empty state when open with no will-call orders", () => {
    useProductFinder.setState({
      willCallOpen: true,
      // An order exists but is NOT flagged for will-call → queue is empty.
      orders: [order("o-delivery")],
      orderFulfillment: { "o-delivery": "delivery" },
    });
    render(<WillCallQueueModal />);
    expect(screen.getByRole("dialog", { name: "Will-Call Queue" })).toBeInTheDocument();
    expect(screen.getByText("No will-call orders right now.")).toBeInTheDocument();
    // No table rendered in the empty branch.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders the queue table for will-call orders, newest first, with item totals and customer fallback", () => {
    useProductFinder.setState({
      willCallOpen: true,
      orders: [
        order("o-old", { placedAt: 1_700_000_000_000, customerName: "Old Co", qty: 3 }),
        order("o-new", { placedAt: 1_700_100_000_000, customerName: null, qty: 5 }),
        order("o-delivery", { customerName: "Skip Me" }),
      ],
      orderFulfillment: {
        "o-old": "willcall",
        "o-new": "willcall",
        "o-delivery": "delivery", // excluded from the queue
      },
    });
    render(<WillCallQueueModal />);

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1); // drop header row
    expect(rows).toHaveLength(2); // delivery order excluded

    // willCallOrders sorts by placedAt desc → o-new first.
    expect(within(rows[0]).getByText("o-new")).toBeInTheDocument();
    expect(within(rows[1]).getByText("o-old")).toBeInTheDocument();

    // null customerName falls back to "Walk-in"; the delivery order is absent.
    expect(within(rows[0]).getByText("Walk-in")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Old Co")).toBeInTheDocument();
    expect(screen.queryByText("Skip Me")).not.toBeInTheDocument();

    // Item totals sum line quantities (5 + 1 = 6 for o-new; 3 + 1 = 4 for o-old).
    expect(within(rows[0]).getByText("6")).toBeInTheDocument();
    expect(within(rows[1]).getByText("4")).toBeInTheDocument();
  });

  it("opens and prints a pick ticket when the print button is clicked", () => {
    const docWrite = vi.fn();
    const docClose = vi.fn();
    const focus = vi.fn();
    const print = vi.fn();
    const fakeWin = { document: { write: docWrite, close: docClose }, focus, print } as unknown as Window;
    const openSpy = vi.fn(() => fakeWin);
    vi.stubGlobal("open", openSpy);

    useProductFinder.setState({
      willCallOpen: true,
      orders: [order("o-print", { customerName: "Print Co" })],
      orderFulfillment: { "o-print": "willcall" },
    });
    render(<WillCallQueueModal />);

    fireEvent.click(screen.getByRole("button", { name: /Print pick ticket/i }));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const openArgs = openSpy.mock.calls[0] as unknown as [string, string, string];
    expect(openArgs[0]).toBe(""); // url
    expect(openArgs[1]).toBe("_blank");
    expect(docWrite).toHaveBeenCalledTimes(1);
    const html = (docWrite.mock.calls[0] as unknown as [string])[0];
    expect(html).toContain("WILL-CALL PICK TICKET");
    expect(html).toContain("o-print");
    expect(html).toContain("Meridian Supply Co."); // brandId=meridian resolves the brand name
    expect(docClose).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("does not throw when window.open is blocked (returns null)", () => {
    vi.stubGlobal("open", vi.fn(() => null));
    useProductFinder.setState({
      willCallOpen: true,
      orders: [order("o-blocked")],
      orderFulfillment: { "o-blocked": "willcall" },
    });
    render(<WillCallQueueModal />);
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /Print pick ticket/i })),
    ).not.toThrow();
  });

  it("closes via the close (X) button", () => {
    useProductFinder.setState({
      willCallOpen: true,
      orders: [order("o1")],
      orderFulfillment: { o1: "willcall" },
    });
    render(<WillCallQueueModal />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(useProductFinder.getState().willCallOpen).toBe(false);
  });

  it("closes when the backdrop (overlay) is clicked", () => {
    useProductFinder.setState({
      willCallOpen: true,
      orders: [order("o1")],
      orderFulfillment: { o1: "willcall" },
    });
    render(<WillCallQueueModal />);
    // Backdrop handler fires only when target === currentTarget (the overlay itself).
    const dialog = screen.getByRole("dialog", { name: "Will-Call Queue" });
    fireEvent.click(dialog);
    expect(useProductFinder.getState().willCallOpen).toBe(false);
  });

  it("renders Spanish copy when the locale is es", () => {
    useProductFinder.setState({
      willCallOpen: true,
      locale: "es",
      orders: [],
      orderFulfillment: {},
    });
    render(<WillCallQueueModal />);
    expect(screen.getByRole("dialog", { name: "Cola de recogida (Will-Call)" })).toBeInTheDocument();
    expect(screen.getByText("No hay pedidos de recogida en este momento.")).toBeInTheDocument();
  });
});
