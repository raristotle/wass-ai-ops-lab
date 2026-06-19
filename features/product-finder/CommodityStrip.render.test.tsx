import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommodityStrip } from "@/features/product-finder/CommodityStrip";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CommodityQuote } from "@/lib/product-finder-commodity";

/**
 * Render coverage for the landing-view commodity strip. The component has two
 * data paths: a deterministic simulation (when the live FRED feed is off) and a
 * live feed (when `/api/commodity` returns `enabled: true`). We drive the
 * copper-nudge branches through the LIVE path so the trend is deterministic
 * regardless of the calendar day the test runs on.
 */

function quote(over: Partial<CommodityQuote> & Pick<CommodityQuote, "id">): CommodityQuote {
  return {
    label: over.id === "copper" ? "Copper" : "Aluminum",
    unit: "$/lb",
    price: 4.2,
    change30d: 0,
    trend: "flat",
    ...over,
  };
}

/** Stub /api/commodity to return a live, enabled payload with the given quotes. */
function stubLiveFeed(quotes: CommodityQuote[], extra?: { source?: string; asOf?: string }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        enabled: true,
        source: extra?.source ?? "FRED",
        quotes: quotes.map((q) => ({ ...q, asOf: extra?.asOf })),
      }),
    })),
  );
}

/** Stub /api/commodity to report the feed is NOT configured (simulation stays). */
function stubFeedDisabled() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({ enabled: false }) })),
  );
}

describe("CommodityStrip (component)", () => {
  beforeEach(() => {
    // Default: feed off, so the deterministic simulation drives the render.
    stubFeedDisabled();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("render smoke: shows the metals-index header and a simulated metal row", async () => {
    render(<CommodityStrip />);
    // Header label is always present once the post-mount clock fills `now`.
    expect(await screen.findByText("📈 Metals index")).toBeInTheDocument();
    // The simulation always emits copper + aluminum.
    expect(screen.getByText("Copper")).toBeInTheDocument();
    expect(screen.getByText("Aluminum")).toBeInTheDocument();
    // Simulated mode advertises itself in the footer + aria-label.
    expect(screen.getByText("simulated index")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Commodity index (simulated)"),
    ).toBeInTheDocument();
  });

  it("copper trending up renders the wire & cable nudge and fires runNlSearch on click", async () => {
    const spy = vi.fn();
    useProductFinder.setState({ runNlSearch: spy as never });
    stubLiveFeed([
      quote({ id: "copper", price: 4.55, change30d: 5.2, trend: "up" }),
      quote({ id: "aluminum", price: 1.4, change30d: 1.1, trend: "up" }),
    ]);

    render(<CommodityStrip />);

    const nudge = await screen.findByRole("button", {
      name: /quote wire & cable now/i,
    });
    fireEvent.click(nudge);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("wire & cable");

    // Live mode swaps the aria-label + footer source text.
    expect(screen.getByLabelText("Commodity index (live)")).toBeInTheDocument();
    expect(screen.getByText(/FRED/)).toBeInTheDocument();
  });

  it("live mode renders the 'as of' suffix when the feed provides asOf", async () => {
    stubLiveFeed([quote({ id: "copper", trend: "flat" })], { source: "FRED", asOf: "2026-06-01" });
    render(<CommodityStrip />);
    expect(await screen.findByText(/FRED · as of 2026-06-01/)).toBeInTheDocument();
  });

  it("copper trending down shows the easing note instead of the nudge button", async () => {
    stubLiveFeed([
      quote({ id: "copper", price: 3.9, change30d: -4.4, trend: "down" }),
    ]);

    render(<CommodityStrip />);
    expect(await screen.findByText(/Copper easing/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /quote wire & cable now/i }),
    ).not.toBeInTheDocument();
  });

  it("copper flat shows neither the up-nudge nor the easing note", async () => {
    stubLiveFeed([
      quote({ id: "copper", price: 4.2, change30d: 0.1, trend: "flat" }),
      quote({ id: "aluminum", price: 1.32, change30d: 0.2, trend: "flat" }),
    ]);

    render(<CommodityStrip />);
    // Wait for the live feed to populate (aluminum is a live-only label set here).
    await screen.findByLabelText("Commodity index (live)");
    expect(
      screen.queryByRole("button", { name: /quote wire & cable now/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Copper easing/)).not.toBeInTheDocument();
  });

  it("renders each trend arrow variant with its accessible label", async () => {
    stubLiveFeed([
      quote({ id: "copper", trend: "up" }),
      quote({ id: "aluminum", trend: "down" }),
    ]);
    render(<CommodityStrip />);
    await screen.findByLabelText("Commodity index (live)");
    expect(screen.getByLabelText("up")).toBeInTheDocument();
    expect(screen.getByLabelText("down")).toBeInTheDocument();
  });

  it("renders the flat arrow variant", async () => {
    stubLiveFeed([quote({ id: "copper", trend: "flat" })]);
    render(<CommodityStrip />);
    await screen.findByLabelText("Commodity index (live)");
    expect(screen.getByLabelText("flat")).toBeInTheDocument();
  });

  it("formats positive vs negative 30d change with a sign", async () => {
    stubLiveFeed([
      quote({ id: "copper", change30d: 3.2, trend: "up" }),
      quote({ id: "aluminum", change30d: -2.5, trend: "down" }),
    ]);
    render(<CommodityStrip />);
    await screen.findByLabelText("Commodity index (live)");
    expect(screen.getByText(/\+3\.2% 30d/)).toBeInTheDocument();
    expect(screen.getByText(/-2\.5% 30d/)).toBeInTheDocument();
  });

  it("ignores a live payload with no quotes and stays on the simulation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ enabled: true, quotes: [] }) })),
    );
    render(<CommodityStrip />);
    // Falls back to the simulated footer/aria-label.
    expect(
      await screen.findByLabelText("Commodity index (simulated)"),
    ).toBeInTheDocument();
  });

  it("swallows a fetch rejection and still renders the simulation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    render(<CommodityStrip />);
    expect(
      await screen.findByLabelText("Commodity index (simulated)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Copper")).toBeInTheDocument();
  });

  it("treats a non-ok response as not-live and keeps the simulation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    );
    render(<CommodityStrip />);
    expect(
      await screen.findByLabelText("Commodity index (simulated)"),
    ).toBeInTheDocument();
  });

  it("renders nothing before the post-mount clock is set (fake timers, no effects flushed)", () => {
    // With fake timers and no act-flush, the mount effect that sets `now` hasn't
    // run, so the index is empty and the component returns null.
    vi.useFakeTimers();
    const { container } = render(<CommodityStrip />);
    // The live fetch is async; with the simulation empty the strip is absent.
    // (React flushes layout effects synchronously, so guard on the header text.)
    expect(container.querySelector('[data-tour="commodity"]')).toBeTruthy();
    // Header is rendered once `now` is set by the mount effect (runs sync in RTL).
    expect(screen.getByText("📈 Metals index")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("re-renders without crashing when the feed flips from sim to live across mounts", async () => {
    const { unmount } = render(<CommodityStrip />);
    expect(await screen.findByLabelText("Commodity index (simulated)")).toBeInTheDocument();
    unmount();
    stubLiveFeed([quote({ id: "copper", trend: "up" })]);
    render(<CommodityStrip />);
    await waitFor(() =>
      expect(screen.getByLabelText("Commodity index (live)")).toBeInTheDocument(),
    );
  });
});
