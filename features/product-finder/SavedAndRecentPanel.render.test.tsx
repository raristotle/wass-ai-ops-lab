import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { SavedAndRecentPanel } from "@/features/product-finder/SavedAndRecentPanel";
import { useProductFinder } from "@/lib/product-finder-store";
import type { ProductSnapshot } from "@/features/product-finder/types";

function snap(id: string): ProductSnapshot {
  return {
    id,
    name: `Product ${id}`,
    brand: "Acme",
    unitPrice: 12.5,
    imageIcon: "x",
    category: "electrical",
  };
}

/** Empty store slice used to reset between tests. */
const EMPTY = {
  searchHistory: [] as string[],
  recentlyViewed: [] as string[],
  recentSnapshots: {} as Record<string, ProductSnapshot>,
  favorites: [] as string[],
  favoriteSnapshots: {} as Record<string, ProductSnapshot>,
};

describe("SavedAndRecentPanel (component)", () => {
  beforeEach(() => {
    localStorage.clear();
    useProductFinder.setState(EMPTY);
  });
  afterEach(() => {
    localStorage.clear();
    useProductFinder.setState(EMPTY);
  });

  it("renders nothing when history, recents, and favorites are all empty", () => {
    const { container } = render(<SavedAndRecentPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when only orphan ids exist (no matching snapshots)", () => {
    // recentlyViewed/favorites reference ids that have no snapshot — the
    // .map(...).filter(Boolean) drops them, so the panel should collapse to null.
    useProductFinder.setState({
      ...EMPTY,
      recentlyViewed: ["ghost"],
      favorites: ["ghost"],
    });
    const { container } = render(<SavedAndRecentPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("render-smoke: renders all three sections when populated", () => {
    useProductFinder.setState({
      searchHistory: ["breakers", "conduit"],
      recentlyViewed: ["R1", "R2"],
      recentSnapshots: { R1: snap("R1"), R2: snap("R2") },
      favorites: ["F1"],
      favoriteSnapshots: { F1: snap("F1") },
    });
    render(<SavedAndRecentPanel />);

    expect(screen.getByText("Search history")).toBeInTheDocument();
    expect(screen.getByText("Recently viewed")).toBeInTheDocument();
    expect(screen.getByText("★ Favorites")).toBeInTheDocument();

    // history chips
    expect(screen.getByRole("button", { name: "breakers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "conduit" })).toBeInTheDocument();

    // mini-rows
    expect(screen.getByText("Product R1")).toBeInTheDocument();
    expect(screen.getByText("Product F1")).toBeInTheDocument();
    // unit price is formatted with two decimals
    expect(screen.getAllByText(/Acme · \$12\.50/).length).toBeGreaterThan(0);
  });

  it("caps Recently viewed at 6 rows and reports the capped count", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h"]; // 8 > cap of 6
    useProductFinder.setState({
      ...EMPTY,
      recentlyViewed: ids,
      recentSnapshots: Object.fromEntries(ids.map((id) => [id, snap(id)])),
    });
    render(<SavedAndRecentPanel />);

    // 6 mini-rows render, not 8
    expect(screen.getByText("Product a")).toBeInTheDocument();
    expect(screen.getByText("Product f")).toBeInTheDocument();
    expect(screen.queryByText("Product g")).not.toBeInTheDocument();
    expect(screen.queryByText("Product h")).not.toBeInTheDocument();

    // count label is min(6, n) = 6, shown as "(6)" next to the section title
    const section = screen.getByText("Recently viewed").closest("section") as HTMLElement;
    expect(within(section).getByText("(6)")).toBeInTheDocument();
  });

  it("clicking a search-history chip calls runNlSearch with the term", () => {
    const runNlSearch = vi.fn(async () => {});
    useProductFinder.setState({
      ...EMPTY,
      searchHistory: ["breakers"],
      runNlSearch,
    });
    render(<SavedAndRecentPanel />);

    fireEvent.click(screen.getByRole("button", { name: "breakers" }));
    expect(runNlSearch).toHaveBeenCalledTimes(1);
    const calls = runNlSearch.mock.calls as unknown as [string][];
    expect(calls[0][0]).toBe("breakers");

    // restore the real action so other tests aren't affected
    useProductFinder.setState({ runNlSearch: realRunNlSearch });
  });

  it("Clear in the history section invokes clearSearchHistory and removes the section", () => {
    useProductFinder.setState({
      ...EMPTY,
      searchHistory: ["breakers", "conduit"],
      recentlyViewed: ["R1"],
      recentSnapshots: { R1: snap("R1") },
    });
    render(<SavedAndRecentPanel />);

    const historySection = screen.getByText("Search history").closest("section") as HTMLElement;
    fireEvent.click(within(historySection).getByRole("button", { name: "Clear" }));

    // real store action ran: searchHistory emptied + localStorage key removed
    expect(useProductFinder.getState().searchHistory).toEqual([]);
    expect(screen.queryByText("Search history")).not.toBeInTheDocument();
    // the recents section is still there (only history was cleared)
    expect(screen.getByText("Recently viewed")).toBeInTheDocument();
  });

  it("Clear in the recents section invokes clearRecentlyViewed", () => {
    useProductFinder.setState({
      ...EMPTY,
      recentlyViewed: ["R1", "R2"],
      recentSnapshots: { R1: snap("R1"), R2: snap("R2") },
    });
    render(<SavedAndRecentPanel />);

    const recentsSection = screen.getByText("Recently viewed").closest("section") as HTMLElement;
    fireEvent.click(within(recentsSection).getByRole("button", { name: "Clear" }));

    expect(useProductFinder.getState().recentlyViewed).toEqual([]);
    expect(useProductFinder.getState().recentSnapshots).toEqual({});
    expect(screen.queryByText("Recently viewed")).not.toBeInTheDocument();
  });

  it("Favorites has no Clear control (onClear is undefined for that section)", () => {
    useProductFinder.setState({
      ...EMPTY,
      favorites: ["F1"],
      favoriteSnapshots: { F1: snap("F1") },
    });
    render(<SavedAndRecentPanel />);

    const favSection = screen.getByText("★ Favorites").closest("section") as HTMLElement;
    expect(within(favSection).queryByRole("button", { name: "Clear" })).toBeNull();
  });

  it("toggling a section collapses it, hides its body, flips aria-expanded, and persists to localStorage", async () => {
    useProductFinder.setState({
      ...EMPTY,
      searchHistory: ["breakers"],
    });
    render(<SavedAndRecentPanel />);
    await act(async () => {}); // flush the mount hydration effect

    // expanded initially → chip visible, aria-expanded true
    const toggle = screen.getByRole("button", { name: /Search history/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "breakers" })).toBeInTheDocument();

    fireEvent.click(toggle);

    // collapsed → body (chip) removed, aria-expanded false, persisted as "1"
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "breakers" })).not.toBeInTheDocument();
    expect(localStorage.getItem("pf_collapsed_history")).toBe("1");

    // toggle back → body returns, persisted as "0"
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "breakers" })).toBeInTheDocument();
    expect(localStorage.getItem("pf_collapsed_history")).toBe("0");
  });

  it("hydrates collapsed state from localStorage on mount (effect path)", async () => {
    localStorage.setItem("pf_collapsed_recent", "1");
    useProductFinder.setState({
      ...EMPTY,
      recentlyViewed: ["R1"],
      recentSnapshots: { R1: snap("R1") },
    });
    render(<SavedAndRecentPanel />);
    await act(async () => {}); // flush the mount hydration effect

    const toggle = screen.getByRole("button", { name: /Recently viewed/ });
    // effect read the stored "1" → section mounts collapsed, body hidden
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Product R1")).not.toBeInTheDocument();
  });
});

// Captured once at module load so chip-click test can restore the real action.
const realRunNlSearch = useProductFinder.getState().runNlSearch;
