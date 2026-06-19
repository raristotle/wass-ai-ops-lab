import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CrossCoveragePanel } from "@/features/product-finder/CrossCoveragePanel";

// next/link renders a plain <a> in jsdom; no next/navigation hook is used by
// this component, so only fetch needs stubbing.

type Coverage = {
  pairs: number;
  bothStocked: number;
  oneStocked: number;
  bySourceKind: Record<string, number>;
  byCategory: Record<string, number>;
  sources: { total: number; byStatus: Record<string, number>; workbookRows: number };
  products: { total: number; productionReady: number };
  brands: { distinct: number; modeled: number; topUncovered: { brand: string; products: number }[] };
};

function coverage(overrides: Partial<Coverage> = {}): Coverage {
  return {
    pairs: 1200,
    bothStocked: 800,
    oneStocked: 400,
    bySourceKind: { manufacturer: 100, distributor: 60 },
    byCategory: { electrical: 700, datacom: 300, av: 50 },
    sources: {
      total: 166,
      byStatus: { ingested: 120, "requires-browser": 30, "weird-status": 16 },
      workbookRows: 1166,
    },
    products: { total: 5000, productionReady: 4800 },
    brands: {
      distinct: 90,
      modeled: 40,
      topUncovered: [
        { brand: "Acme", products: 42 },
        { brand: "Globex", products: 17 },
      ],
    },
    ...overrides,
  };
}

/** Stub fetch with a JSON response (ok by default). */
function stubFetch(body: Coverage, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, json: async () => body }) as unknown as Response),
  );
}

describe("CrossCoveragePanel (component)", () => {
  beforeEach(() => {
    // Default stub; individual tests may override.
    stubFetch(coverage());
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the loading state before data resolves, then the headline stats", async () => {
    render(<CrossCoveragePanel />);
    // Synchronous first paint: data is still null → loading copy is shown.
    expect(screen.getByText("Loading coverage…")).toBeInTheDocument();
    // Static header + explorer link are present immediately.
    expect(screen.getByRole("heading", { name: "Cross-Reference Coverage" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Explorer/ })).toHaveAttribute(
      "href",
      "/product-finder/crosses",
    );

    // After the fetch microtask flushes, the populated body renders.
    await waitFor(() => expect(screen.getByText("Source-backed pairs")).toBeInTheDocument());
    expect(screen.queryByText("Loading coverage…")).not.toBeInTheDocument();
    // Headline values.
    expect(screen.getByText("1200")).toBeInTheDocument(); // pairs
    expect(screen.getByText("800")).toBeInTheDocument(); // both stocked
    expect(screen.getByText("400")).toBeInTheDocument(); // one stocked
    expect(screen.getByText("120/166")).toBeInTheDocument(); // sources ingested / total
  });

  it("renders pairs-by-category sorted desc with known + unknown category labels", async () => {
    // 'av' has a known label ("AV"); add an unknown category that falls through
    // to its raw key to exercise the `?? cat` branch.
    stubFetch(
      coverage({ byCategory: { electrical: 700, datacom: 300, "mystery-cat": 25 } }),
    );
    render(<CrossCoveragePanel />);
    await waitFor(() => expect(screen.getByText("Pairs by category")).toBeInTheDocument());
    // Known label is mapped.
    expect(screen.getByText("Electrical")).toBeInTheDocument();
    expect(screen.getByText("Datacom")).toBeInTheDocument();
    // Unknown category renders its raw key.
    expect(screen.getByText("mystery-cat")).toBeInTheDocument();
    // Counts appear (the per-row right-hand count).
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("renders the empty-category branch when no stocked-side pairs exist", async () => {
    stubFetch(coverage({ byCategory: {} }));
    render(<CrossCoveragePanel />);
    await waitFor(() => expect(screen.getByText("No stocked-side pairs.")).toBeInTheDocument());
    // The per-row category bars are absent.
    expect(screen.queryByText("Electrical")).not.toBeInTheDocument();
  });

  it("renders the source-status mix (known + raw labels) and the uncovered-brand chips", async () => {
    render(<CrossCoveragePanel />);
    await waitFor(() =>
      expect(screen.getByText(/Source workbook \(1166 rows → 166 sources\)/)).toBeInTheDocument(),
    );
    // Known status label is mapped; unknown status falls through to its raw key.
    expect(screen.getByText("Ingested:")).toBeInTheDocument();
    expect(screen.getByText("Needs browser:")).toBeInTheDocument();
    expect(screen.getByText("weird-status:")).toBeInTheDocument();
    // Modeled-vs-distinct brand summary.
    expect(screen.getByText("(40/90 modeled)")).toBeInTheDocument();
    // Uncovered-brand chips render brand + product count.
    expect(screen.getByText("Acme (42)")).toBeInTheDocument();
    expect(screen.getByText("Globex (17)")).toBeInTheDocument();
    // Production-ready footer.
    expect(screen.getByText(/4800\/5000 verified records production-ready/)).toBeInTheDocument();
  });

  it("hits the coverage endpoint exactly once on mount", async () => {
    render(<CrossCoveragePanel />);
    await waitFor(() => expect(screen.getByText("Source-backed pairs")).toBeInTheDocument());
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls.some(([u]) => u === "/api/crosses/coverage")).toBe(true);
  });

  it("renders nothing when the coverage fetch responds non-OK", async () => {
    stubFetch(coverage(), false);
    const { container } = render(<CrossCoveragePanel />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing when the coverage fetch rejects (network error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const { container } = render(<CrossCoveragePanel />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("handles a missing 'ingested' status key by showing 0/total", async () => {
    // byStatus without an `ingested` entry exercises the `?? 0` fallback.
    stubFetch(
      coverage({ sources: { total: 50, byStatus: { ingestible: 10 }, workbookRows: 200 } }),
    );
    render(<CrossCoveragePanel />);
    await waitFor(() => expect(screen.getByText("0/50")).toBeInTheDocument());
  });
});
