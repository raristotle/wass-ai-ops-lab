import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { IndicativeFxTotal } from "@/features/product-finder/IndicativeFxTotal";

/**
 * IndicativeFxTotal fetches the dormant FX seam (`GET /api/fx/quote`) in a
 * useEffect and renders an "≈ CA$X" secondary-currency line only when the seam
 * is *configured* and returns at least one well-formed rate. These tests stub
 * `fetch` per-case to drive each branch: dormant (null render), configured +
 * populated, malformed-rate fail-closed, the Intl fallback formatter, and the
 * conditional ECB "as of" footnote.
 */

type FxBody = {
  configured?: boolean;
  asOf?: string;
  rates?: Array<{ currency: string; rate: number } | unknown> | null;
};

function stubFx(body: FxBody | null, { ok = true }: { ok?: boolean } = {}) {
  const fetchMock = vi.fn(async () => ({
    ok,
    json: async () => body,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("IndicativeFxTotal (component)", () => {
  it("renders the indicative block and converts the USD amount when configured", async () => {
    stubFx({ configured: true, asOf: "2026-06-18", rates: [{ currency: "CAD", rate: 1.37 }] });
    render(<IndicativeFxTotal amountUsd={100} />);

    // Heading appears once the async fetch resolves and state is set.
    expect(await screen.findByText("Indicative total in other currencies")).toBeInTheDocument();

    // 100 USD * 1.37 = 137 CAD, formatted by Intl for the CAD currency.
    const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "CAD" }).format(137);
    expect(screen.getByText(new RegExp(formatted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();

    // aria-live region present for the polite announcement.
    const region = screen.getByText("Indicative total in other currencies").closest("div");
    expect(region).toHaveAttribute("aria-live", "polite");

    // The "as of" footnote is shown because asOf is a string.
    expect(screen.getByText(/ECB rates as of 2026-06-18/)).toBeInTheDocument();
    expect(screen.getByText(/USD is the authoritative price/)).toBeInTheDocument();

    expect(fetchMock_lastUrl()).toBe("/api/fx/quote");
  });

  it("renders multiple currency rows and omits the ECB footnote when asOf is missing", async () => {
    stubFx({
      configured: true,
      // no asOf
      rates: [
        { currency: "CAD", rate: 1.37 },
        { currency: "EUR", rate: 0.92 },
      ],
    });
    render(<IndicativeFxTotal amountUsd={200} />);

    await screen.findByText("Indicative total in other currencies");

    const cad = new Intl.NumberFormat("en-US", { style: "currency", currency: "CAD" }).format(200 * 1.37);
    const eur = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(200 * 0.92);
    expect(screen.getByText((c) => c.includes(cad))).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes(eur))).toBeInTheDocument();

    // No asOf → footnote stops at "for reference." with no ECB clause.
    expect(screen.queryByText(/ECB rates as of/)).not.toBeInTheDocument();
    expect(screen.getByText(/Indicative only, for reference\./)).toBeInTheDocument();
  });

  it("renders nothing when the seam is dormant (configured:false)", async () => {
    stubFx({ configured: false, rates: null });
    const { container } = render(<IndicativeFxTotal amountUsd={100} />);
    // Give the resolved promise a tick; nothing should ever appear.
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Indicative total in other currencies")).not.toBeInTheDocument();
  });

  it("fail-closes (renders nothing) when every rate is malformed", async () => {
    stubFx({
      configured: true,
      rates: [
        { currency: "CAD", rate: 0 }, // non-positive → dropped
        { currency: "EUR", rate: Number.NaN }, // not finite → dropped
        { currency: 123 as unknown as string, rate: 1.1 }, // bad currency → dropped
        null, // bad entry → dropped
      ],
    });
    const { container } = render(<IndicativeFxTotal amountUsd={100} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the response is not ok", async () => {
    stubFx({ configured: true, rates: [{ currency: "CAD", rate: 1.3 }] }, { ok: false });
    const { container } = render(<IndicativeFxTotal amountUsd={100} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when fetch rejects (network failure is swallowed)", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<IndicativeFxTotal amountUsd={100} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("uses the plain-text fallback formatter for an invalid currency code", async () => {
    // "XYZ" is not a valid ISO currency → Intl.NumberFormat throws → fallback.
    stubFx({ configured: true, rates: [{ currency: "XYZ", rate: 2 }] });
    render(<IndicativeFxTotal amountUsd={50} />);

    await screen.findByText("Indicative total in other currencies");
    // Fallback path: `${currency} ${value.toFixed(2)}` → "XYZ 100.00".
    expect(screen.getByText((c) => c.includes("XYZ 100.00"))).toBeInTheDocument();
  });

  it("treats a missing rates array as dormant (rates undefined)", async () => {
    stubFx({ configured: true }); // configured but no rates field at all
    const { container } = render(<IndicativeFxTotal amountUsd={100} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});

/** Inspect the URL the component fetched, with a type-clean cast of mock.calls. */
function fetchMock_lastUrl(): string {
  const mock = global.fetch as unknown as { mock: { calls: unknown[][] } };
  const calls = mock.mock.calls as unknown as [string][];
  return calls[calls.length - 1][0];
}
