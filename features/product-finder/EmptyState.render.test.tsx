import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingState, NoResultsState } from "@/features/product-finder/EmptyState";
import { useProductFinder } from "@/lib/product-finder-store";
import type { ProductSnapshot } from "@/features/product-finder/types";

function snap(id: string): ProductSnapshot {
  return { id, name: `Product ${id}`, brand: "Acme", unitPrice: 19.5, imageIcon: "🔌", category: "electrical" };
}

// LandingState renders SavedAndRecentPanel, which reads/writes localStorage and
// calls runNlSearch (which the store implements as an async fetch-backed search).
// Reset the relevant store slice + localStorage between tests so branches are isolated.
const PANEL_KEYS = ["pf_collapsed_history", "pf_collapsed_recent", "pf_collapsed_favorites"];

function resetPanelState() {
  useProductFinder.setState({
    searchHistory: [],
    recentlyViewed: [],
    recentSnapshots: {},
    favorites: [],
    favoriteSnapshots: {},
  });
  for (const k of PANEL_KEYS) localStorage.removeItem(k);
}

describe("LandingState (component)", () => {
  beforeEach(() => {
    resetPanelState();
    // SavedAndRecentPanel's "search history" chips call runNlSearch; stub fetch so
    // the store's async search seam never hits the network under jsdom.
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ results: [], items: [] }) })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetPanelState();
  });

  it("render-smoke: shows the landing prompt and renders no panel when nothing is saved", () => {
    const { container } = render(<LandingState />);
    // Key piece of output present:
    expect(screen.getByText("Find the right product, fast")).toBeInTheDocument();
    expect(screen.getByText(/Search by name, SKU, spec/)).toBeInTheDocument();
    // SavedAndRecentPanel returns null when history/recent/favs are all empty,
    // so only the prompt card renders (no "Search history"/"Favorites" sections).
    expect(screen.queryByText("Search history")).not.toBeInTheDocument();
    expect(screen.queryByText(/Favorites/)).not.toBeInTheDocument();
    // The outer wrapper still rendered.
    expect(container.querySelector(".space-y-6")).not.toBeNull();
  });

  it("populated branch: renders search-history, recently-viewed, and favorites sections", () => {
    useProductFinder.setState({
      searchHistory: ["20A breaker", "ground rod"],
      recentlyViewed: ["a", "b"],
      recentSnapshots: { a: snap("a"), b: snap("b") },
      favorites: ["c"],
      favoriteSnapshots: { c: snap("c") },
    });
    render(<LandingState />);
    expect(screen.getByText("Search history")).toBeInTheDocument();
    expect(screen.getByText("Recently viewed")).toBeInTheDocument();
    expect(screen.getByText("★ Favorites")).toBeInTheDocument();
    // A history chip and a snapshot row both render.
    expect(screen.getByRole("button", { name: "20A breaker" })).toBeInTheDocument();
    expect(screen.getByText("Product a")).toBeInTheDocument();
    expect(screen.getByText("Product c")).toBeInTheDocument();
  });

  it("interaction: clicking a search-history chip triggers runNlSearch", () => {
    const runNlSearch = vi.fn(async () => {});
    useProductFinder.setState({ searchHistory: ["ground rod"], runNlSearch });
    render(<LandingState />);
    fireEvent.click(screen.getByRole("button", { name: "ground rod" }));
    expect(runNlSearch).toHaveBeenCalledWith("ground rod");
    // restore the real implementation for other tests
    useProductFinder.setState({ runNlSearch: useProductFinder.getInitialState().runNlSearch });
  });

  it("interaction: Clear on search history calls clearSearchHistory", () => {
    const clearSearchHistory = vi.fn();
    useProductFinder.setState({ searchHistory: ["x"], clearSearchHistory });
    render(<LandingState />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(clearSearchHistory).toHaveBeenCalledTimes(1);
    useProductFinder.setState({ clearSearchHistory: useProductFinder.getInitialState().clearSearchHistory });
  });

  it("interaction: toggling a section collapses it and persists to localStorage", () => {
    useProductFinder.setState({ searchHistory: ["alpha"] });
    render(<LandingState />);
    const toggle = screen.getByRole("button", { name: /Search history/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    // The chip is visible while expanded.
    expect(screen.getByRole("button", { name: "alpha" })).toBeInTheDocument();
    fireEvent.click(toggle);
    // Collapsed: aria-expanded flips and the chip is unmounted; state persisted.
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "alpha" })).not.toBeInTheDocument();
    expect(localStorage.getItem("pf_collapsed_history")).toBe("1");
  });

  it("reads persisted collapsed flags from localStorage on mount", () => {
    localStorage.setItem("pf_collapsed_recent", "1");
    useProductFinder.setState({ recentlyViewed: ["a"], recentSnapshots: { a: snap("a") } });
    render(<LandingState />);
    // Section header still shows, but its row is collapsed (effect ran on mount).
    expect(screen.getByText("Recently viewed")).toBeInTheDocument();
    expect(screen.queryByText("Product a")).not.toBeInTheDocument();
  });
});

describe("NoResultsState (component)", () => {
  it("render-smoke: shows the empty-results copy and a Clear button", () => {
    const onClear = vi.fn();
    render(<NoResultsState onClear={onClear} />);
    expect(screen.getByText("No matching products")).toBeInTheDocument();
    expect(screen.getByText(/Try removing a filter/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search & filters" })).toBeInTheDocument();
    // No "Did you mean" without a suggestion.
    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  });

  it("interaction: Clear button invokes onClear", () => {
    const onClear = vi.fn();
    render(<NoResultsState onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear search & filters" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("suggestion branch: renders 'Did you mean' and calls onTrySuggestion with the candidate", () => {
    const onClear = vi.fn();
    const onTrySuggestion = vi.fn();
    render(<NoResultsState onClear={onClear} suggestion="breaker" onTrySuggestion={onTrySuggestion} />);
    expect(screen.getByText(/Did you mean/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "breaker" }));
    expect(onTrySuggestion).toHaveBeenCalledWith("breaker");
  });

  it("suggestion branch is hidden when onTrySuggestion is omitted even if a suggestion exists", () => {
    render(<NoResultsState onClear={vi.fn()} suggestion="breaker" />);
    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "breaker" })).not.toBeInTheDocument();
  });

  it("suggestion branch is hidden for a null suggestion", () => {
    render(<NoResultsState onClear={vi.fn()} suggestion={null} onTrySuggestion={vi.fn()} />);
    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  });
});
