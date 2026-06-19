import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CoverageGapsCard } from "@/features/product-finder/CoverageGapsCard";

// CoverageGapsCard fetches /api/crosses/gaps on mount and reads no Zustand
// store / next-navigation hooks, so only global fetch needs stubbing. Pattern
// mirrors CrossCoveragePanel.render.test.tsx (the other fetch-on-mount card).

type Gap = { sku: string; count: number; lastMissAt: number };

function gap(sku: string, count: number): Gap {
  return { sku, count, lastMissAt: 1_700_000_000_000 };
}

/** Stub fetch with a JSON body (ok by default). */
function stubFetch(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, json: async () => body }) as unknown as Response),
  );
}

describe("CoverageGapsCard (component)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the gap list with sku + request count once data resolves", async () => {
    stubFetch({ gaps: [gap("SQ-D-QO120", 42), gap("EATON-BR120", 17)] });
    render(<CoverageGapsCard />);

    // First synchronous paint: gaps is still null → component returns null.
    expect(screen.queryByText("Coverage gaps")).not.toBeInTheDocument();

    // After the fetch microtask flushes, the populated card renders.
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Coverage gaps" })).toBeInTheDocument(),
    );
    // Accessible region label.
    expect(
      screen.getByRole("region", { name: "Cross-reference coverage gaps" }),
    ).toBeInTheDocument();
    // Each gap row shows the competitor SKU and its request count.
    expect(screen.getByText("SQ-D-QO120")).toBeInTheDocument();
    expect(screen.getByText("EATON-BR120")).toBeInTheDocument();
    expect(screen.getByText("42× requested")).toBeInTheDocument();
    expect(screen.getByText("17× requested")).toBeInTheDocument();
    // Explanatory caption is present.
    expect(
      screen.getByText(/most-requested competitor parts with no Wesco cross/),
    ).toBeInTheDocument();
    // One <li> per gap.
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders nothing when the gaps array is empty (dormant / no demand data)", async () => {
    stubFetch({ gaps: [] });
    const { container } = render(<CoverageGapsCard />);
    // Give the resolved-empty fetch a chance to (not) populate.
    await waitFor(() => {
      const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Coverage gaps")).not.toBeInTheDocument();
  });

  it("renders nothing when the payload has no gaps array (malformed body)", async () => {
    stubFetch({ notGaps: true });
    const { container } = render(<CoverageGapsCard />);
    await waitFor(() => {
      const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the gaps fetch responds non-OK", async () => {
    stubFetch({ gaps: [gap("X", 1)] }, false);
    const { container } = render(<CoverageGapsCard />);
    await waitFor(() => {
      const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the gaps fetch rejects (network error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const { container } = render(<CoverageGapsCard />);
    await waitFor(() => {
      const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("hits the gaps endpoint exactly once on mount", async () => {
    stubFetch({ gaps: [gap("SQ-D-QO120", 5)] });
    render(<CoverageGapsCard />);
    await waitFor(() => expect(screen.getByText("SQ-D-QO120")).toBeInTheDocument());
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls.filter(([u]) => u === "/api/crosses/gaps")).toHaveLength(1);
  });

  it("does not set state after unmount (aborted in-flight fetch is a no-op)", async () => {
    // Defer the fetch resolution so we can unmount while it is in flight; the
    // `alive` guard in the effect's cleanup must prevent a post-unmount setState.
    let resolveBody: (v: { ok: boolean; json: () => Promise<unknown> }) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((res) => {
            resolveBody = res;
          }),
      ),
    );
    const { unmount, container } = render(<CoverageGapsCard />);
    unmount();
    // Resolve after unmount; the guarded effect should swallow the result.
    resolveBody({ ok: true, json: async () => ({ gaps: [gap("LATE", 9)] }) });
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
  });
});
