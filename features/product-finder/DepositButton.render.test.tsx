import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DepositButton } from "@/features/product-finder/DepositButton";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { SavedQuote } from "@/lib/product-finder-quotes";

// DepositButton lives in the cart drawer, whose other leaves read next/navigation;
// mock it so nothing throws under jsdom, mirroring CartDrawer.render.test.tsx.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

function quote(overrides: Partial<SavedQuote> = {}): SavedQuote {
  return {
    id: "quote-1",
    number: "Q-20260101-0001",
    customer: "Northside Electric",
    project: "Plant retrofit",
    lines: [{ product: prod("A"), qty: 2, unitPrice: 20 }],
    total: 40,
    status: "sent",
    createdAt: 1_700_000_000_000,
    customerId: null,
    ...overrides,
  };
}

/** Build a fetch stub that routes by method + querystring to mimic the deposit API. */
function makeFetch(opts: {
  configured?: boolean;
  post?: unknown;
  postOk?: boolean;
  poll?: unknown;
} = {}) {
  const { configured = true, post, postOk = true, poll } = opts;
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method ?? "GET";
    if (method === "POST") {
      return { ok: postOk, json: async () => post ?? {} } as Response;
    }
    // GET with a depositId is the poll lane.
    if (url.includes("depositId=")) {
      return { ok: true, json: async () => poll ?? {} } as Response;
    }
    // Plain GET is the dormant/configured probe.
    return { ok: true, json: async () => ({ configured }) } as Response;
  });
}

describe("DepositButton (component render-net)", () => {
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders nothing while the deposit seam is dormant (configured:false)", async () => {
    vi.stubGlobal("fetch", makeFetch({ configured: false }));
    const { container } = render(<DepositButton quote={quote()} />);
    // The mount probe resolves to configured:false → component stays hidden.
    await waitFor(() => expect((globalThis.fetch as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: /Request a deposit/ })).not.toBeInTheDocument();
  });

  it("renders nothing for a draft quote even when the seam IS configured (status gate)", async () => {
    vi.stubGlobal("fetch", makeFetch({ configured: true }));
    const { container } = render(<DepositButton quote={quote({ status: "draft" })} />);
    await waitFor(() => expect((globalThis.fetch as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a lost quote when configured (status gate)", async () => {
    vi.stubGlobal("fetch", makeFetch({ configured: true }));
    const { container } = render(<DepositButton quote={quote({ status: "lost" })} />);
    await waitFor(() => expect((globalThis.fetch as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the Request deposit button once configured for a SENT quote", async () => {
    vi.stubGlobal("fetch", makeFetch({ configured: true }));
    render(<DepositButton quote={quote({ status: "sent" })} />);
    const btn = await screen.findByRole("button", { name: "Request a deposit for quote Q-20260101-0001" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent("Request deposit");
    expect(btn).not.toBeDisabled();
  });

  it("also shows the button for a WON quote (the second allowed status)", async () => {
    vi.stubGlobal("fetch", makeFetch({ configured: true }));
    render(<DepositButton quote={quote({ status: "won", number: "Q-WON-1" })} />);
    expect(await screen.findByRole("button", { name: "Request a deposit for quote Q-WON-1" })).toBeInTheDocument();
  });

  it("requests a deposit, opens the hosted checkout, and surfaces the refresh affordance", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({
        configured: true,
        post: { depositId: "dep_123", amountCents: 800, url: "https://stripe.test/checkout/abc" },
        poll: { deposit: { status: "paid", amountCents: 800 } },
      }),
    );
    render(<DepositButton quote={quote({ status: "sent", total: 40 })} />);
    const btn = await screen.findByRole("button", { name: /Request a deposit/ });
    fireEvent.click(btn);

    // After the POST resolves the "Awaiting payment — refresh" affordance appears
    // (deposit.status === "requested" && depositIdRef set).
    const refresh = await screen.findByRole("button", { name: "Refresh deposit status" });
    expect(refresh).toBeInTheDocument();

    // Stripe's hosted page is opened in a new tab with safe rel attrs.
    await waitFor(() => expect(openSpy).toHaveBeenCalled());
    const openArgs = openSpy.mock.calls[0] as unknown as [string, string, string];
    expect(openArgs[0]).toBe("https://stripe.test/checkout/abc");
    expect(openArgs[1]).toBe("_blank");
    expect(openArgs[2]).toBe("noopener,noreferrer");

    // The POST body carries the rounded cents + quote identifiers.
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const postCall = fetchMock.mock.calls.find((c: unknown[]) => (c[1] as RequestInit | undefined)?.method === "POST") as
      | [string, RequestInit]
      | undefined;
    expect(postCall).toBeTruthy();
    const body = JSON.parse((postCall as [string, RequestInit])[1].body as string);
    expect(body.totalCents).toBe(4000);
    expect(body.quoteId).toBe("quote-1");

    // Clicking refresh polls and the component flips to the paid badge.
    fireEvent.click(refresh);
    expect(await screen.findByText("Deposit paid ✓")).toBeInTheDocument();
  });

  it("renders the paid badge immediately when the POST reports alreadyPaid (no checkout opened)", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({ configured: true, post: { alreadyPaid: true, deposit: { amountCents: 500 } } }),
    );
    render(<DepositButton quote={quote({ status: "sent" })} />);
    const btn = await screen.findByRole("button", { name: /Request a deposit/ });
    fireEvent.click(btn);
    expect(await screen.findByText("Deposit paid ✓")).toBeInTheDocument();
    // alreadyPaid short-circuits before window.open.
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("surfaces an error when the POST returns enabled:false", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({ configured: true, postOk: true, post: { enabled: false } }),
    );
    render(<DepositButton quote={quote({ status: "sent" })} />);
    const btn = await screen.findByRole("button", { name: /Request a deposit/ });
    fireEvent.click(btn);
    expect(await screen.findByText("Could not start a deposit. Check the Stripe configuration.")).toBeInTheDocument();
    // The button is re-enabled in the finally block.
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("surfaces a retry error when the POST throws (network failure)", async () => {
    // Configured probe succeeds, but the POST rejects.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if ((init?.method ?? "GET") === "POST") throw new Error("boom");
        return { ok: true, json: async () => ({ configured: true }) } as Response;
      }),
    );
    render(<DepositButton quote={quote({ status: "sent" })} />);
    const btn = await screen.findByRole("button", { name: /Request a deposit/ });
    fireEvent.click(btn);
    expect(await screen.findByText("Could not start a deposit. Try again.")).toBeInTheDocument();
  });
});
