import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QualityMetricsCard } from "@/features/product-finder/QualityMetricsCard";
import type { CatalogQualitySummary } from "@/lib/catalog/data-quality-score";

// QualityMetricsCard fetches /api/catalog/quality-summary on mount and reads NO
// Zustand store — every branch is driven by the fetched summary payload, so the
// tests just stub global.fetch with the response shapes we want to exercise.

function summary(over: Partial<CatalogQualitySummary> = {}): CatalogQualitySummary {
  return {
    count: 1234,
    averageScore: 72,
    byTier: { excellent: 600, good: 400, partial: 200, incomplete: 34 },
    topGaps: [
      { key: "datasheet", label: "Datasheet link", missingPct: 0.42 },
      { key: "specs", label: "Specifications", missingPct: 0.18 },
    ],
    ...over,
  };
}

/** Stub fetch with a {summary} JSON response (ok by default). */
function stubFetch(body: { summary?: CatalogQualitySummary } | null, ok = true) {
  const fn = vi.fn(async () => ({ ok, json: async () => body }) as unknown as Response);
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("QualityMetricsCard (component)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders nothing on the initial paint before data resolves", async () => {
    const fn = stubFetch({ summary: summary() });
    const { container } = render(<QualityMetricsCard />);
    // Synchronous first paint: summary is still null → component returns null.
    expect(container).toBeEmptyDOMElement();
    // Let the mount fetch settle so the trailing state update is flushed in-test.
    await waitFor(() => expect(fn).toHaveBeenCalled());
  });

  it("renders the headline, average score and tier legend once data resolves", async () => {
    stubFetch({ summary: summary() });
    render(<QualityMetricsCard />);

    // Smoke: the labelled section is present once data arrives.
    const section = await screen.findByRole("region", { name: "Catalog data quality" });
    expect(section).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Catalog Data Quality/ })).toBeInTheDocument();

    // Localized product count (1,234) and the average score with /100 suffix.
    expect(screen.getByText(/completeness across 1,234 products/)).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();

    // All four tier labels appear in the legend regardless of count.
    expect(screen.getByText("Excellent")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Partial")).toBeInTheDocument();
    expect(screen.getByText("Incomplete")).toBeInTheDocument();

    // Per-tier percentages: 600/1234≈49%, 400≈32%, 200≈16%, 34≈3%.
    expect(screen.getByText("49%")).toBeInTheDocument();
    expect(screen.getByText("32%")).toBeInTheDocument();
    expect(screen.getByText("16%")).toBeInTheDocument();
    expect(screen.getByText("3%")).toBeInTheDocument();
  });

  it("renders the distribution bar only for tiers with a non-zero count", async () => {
    // Only two tiers populated → only two distribution-bar segments render
    // (the other two hit the `byTier[t] > 0 ? … : null` empty branch). The
    // legend, by contrast, always lists all four tiers.
    stubFetch({
      summary: summary({
        count: 100,
        byTier: { excellent: 70, good: 0, partial: 30, incomplete: 0 },
        topGaps: [],
      }),
    });
    const { container } = render(<QualityMetricsCard />);
    await screen.findByRole("region", { name: "Catalog data quality" });

    // The bar wrapper is the flex h-3 row; its direct children are the segments.
    const bar = container.querySelector(".flex.h-3");
    expect(bar).not.toBeNull();
    expect(bar?.children.length).toBe(2);

    // Legend still shows all four labels (zero-count tiers show 0%).
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Incomplete")).toBeInTheDocument();
    const zeroPcts = screen.getAllByText("0%");
    expect(zeroPcts.length).toBe(2); // good + incomplete
  });

  it("renders the 'Biggest gaps' block, filtered to gaps>0 and capped at 4", async () => {
    stubFetch({
      summary: summary({
        topGaps: [
          { key: "datasheet", label: "Datasheet link", missingPct: 0.42 },
          { key: "specs", label: "Specifications", missingPct: 0.3 },
          { key: "provenance", label: "Provenance", missingPct: 0.2 },
          { key: "lifecycle", label: "Active lifecycle", missingPct: 0.1 },
          { key: "identifier", label: "Brand + SKU + name", missingPct: 0.05 },
          // A zero-gap entry that must be filtered out by the missingPct>0 guard.
          { key: "extra", label: "Extra signal", missingPct: 0 },
        ],
      }),
    });
    render(<QualityMetricsCard />);
    await screen.findByRole("region", { name: "Catalog data quality" });

    expect(screen.getByText("Biggest gaps")).toBeInTheDocument();
    // First four positive gaps render…
    expect(screen.getByText("Datasheet link")).toBeInTheDocument();
    expect(screen.getByText("Specifications")).toBeInTheDocument();
    expect(screen.getByText("Provenance")).toBeInTheDocument();
    expect(screen.getByText("Active lifecycle")).toBeInTheDocument();
    // …the 5th positive gap and the zero-gap entry are dropped (slice(0,4)).
    expect(screen.queryByText("Brand + SKU + name")).not.toBeInTheDocument();
    expect(screen.queryByText("Extra signal")).not.toBeInTheDocument();
    // Per-row "% missing" labels (42%, 30%, 20%, 10%).
    expect(screen.getByText("42% missing")).toBeInTheDocument();
    expect(screen.getByText("10% missing")).toBeInTheDocument();
  });

  it("omits the 'Biggest gaps' block when the top gap is zero", async () => {
    // topGaps non-empty but first entry has missingPct 0 → whole block hidden
    // (the `topGaps[0].missingPct > 0` guard short-circuits).
    stubFetch({
      summary: summary({ topGaps: [{ key: "specs", label: "Specifications", missingPct: 0 }] }),
    });
    render(<QualityMetricsCard />);
    await screen.findByRole("region", { name: "Catalog data quality" });
    expect(screen.queryByText("Biggest gaps")).not.toBeInTheDocument();
  });

  it("omits the 'Biggest gaps' block when topGaps is empty", async () => {
    stubFetch({ summary: summary({ topGaps: [] }) });
    render(<QualityMetricsCard />);
    await screen.findByRole("region", { name: "Catalog data quality" });
    expect(screen.queryByText("Biggest gaps")).not.toBeInTheDocument();
  });

  it("renders nothing when the summary count is 0", async () => {
    const fn = stubFetch({ summary: summary({ count: 0 }) });
    const { container } = render(<QualityMetricsCard />);
    await waitFor(() => expect(fn).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the payload carries no summary", async () => {
    const fn = stubFetch({});
    const { container } = render(<QualityMetricsCard />);
    await waitFor(() => expect(fn).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the fetch responds non-OK", async () => {
    const fn = stubFetch({ summary: summary() }, false);
    const { container } = render(<QualityMetricsCard />);
    await waitFor(() => expect(fn).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the fetch rejects (network error)", async () => {
    const fn = vi.fn(async () => {
      throw new Error("network down");
    });
    vi.stubGlobal("fetch", fn);
    const { container } = render(<QualityMetricsCard />);
    await waitFor(() => expect(fn).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("hits the quality-summary endpoint exactly once on mount", async () => {
    const fn = stubFetch({ summary: summary() });
    render(<QualityMetricsCard />);
    await screen.findByRole("region", { name: "Catalog data quality" });
    const calls = fn.mock.calls as unknown as [string][];
    expect(calls.filter(([u]) => u === "/api/catalog/quality-summary")).toHaveLength(1);
  });
});
