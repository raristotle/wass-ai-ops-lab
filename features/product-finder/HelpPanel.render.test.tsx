import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { HelpPanel } from "@/features/product-finder/HelpPanel";
import { useProductFinder } from "@/lib/product-finder-store";

// HelpPanel reads helpOpen/setHelpOpen and calls runNlSearch + startTour. We seed
// the real Zustand store via setState, replacing the two action methods with spies
// so the "Try it" / "Restart the tour" handlers are observable and isolated from
// the full search pipeline (runNlSearch normally drives runSearch over the catalog).
let runNlSearchSpy: ReturnType<typeof vi.fn>;
let startTourSpy: ReturnType<typeof vi.fn>;
const realRunNlSearch = useProductFinder.getState().runNlSearch;
const realStartTour = useProductFinder.getState().startTour;

beforeEach(() => {
  runNlSearchSpy = vi.fn(async () => {});
  startTourSpy = vi.fn();
  useProductFinder.setState({
    helpOpen: true,
    runNlSearch: runNlSearchSpy as unknown as typeof realRunNlSearch,
    startTour: startTourSpy as unknown as typeof realStartTour,
  });
});

afterEach(() => {
  // Restore the real action implementations and close the panel for the next test.
  useProductFinder.setState({
    helpOpen: false,
    runNlSearch: realRunNlSearch,
    startTour: realStartTour,
  });
  vi.restoreAllMocks();
});

describe("HelpPanel (component)", () => {
  it("renders nothing when helpOpen is false", () => {
    useProductFinder.setState({ helpOpen: false });
    const { container } = render(<HelpPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("render-smoke: opens as a labelled dialog with the header and search box", () => {
    render(<HelpPanel />);
    const dialog = screen.getByRole("dialog", { name: "Help" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Help & Tips/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Search help topics")).toBeInTheDocument();
    // The default-open topic ("getting-started") is expanded on first render.
    const gettingStarted = screen.getByRole("button", { name: /Getting started/i });
    expect(gettingStarted).toHaveAttribute("aria-expanded", "true");
  });

  it("filters topics by query and shows an empty state when nothing matches", () => {
    render(<HelpPanel />);
    const search = screen.getByLabelText("Search help topics");

    // A query that matches a real topic title.
    fireEvent.change(search, { target: { value: "voice" } });
    expect(screen.getByRole("button", { name: /Voice search/i })).toBeInTheDocument();
    // Unrelated topics are filtered out.
    expect(screen.queryByRole("button", { name: /^Compare products$/i })).not.toBeInTheDocument();

    // A query that matches nothing → empty-state branch.
    fireEvent.change(search, { target: { value: "zzzzzznope" } });
    expect(screen.getByText(/No topics match/i)).toBeInTheDocument();
    expect(screen.getByText(/zzzzzznope/)).toBeInTheDocument();
  });

  it("expands topics automatically while a search query is active", () => {
    render(<HelpPanel />);
    // "Compare" matches the Compare topic; with an active query every shown topic
    // renders expanded (isOpen = query.trim().length > 0), so its body is visible.
    fireEvent.change(screen.getByLabelText("Search help topics"), { target: { value: "Compare" } });
    const compareBtn = screen.getByRole("button", { name: /Compare products/i });
    expect(compareBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Side-by-side specs/i)).toBeInTheDocument();
  });

  it("toggles a topic accordion open and closed when there is no active query", () => {
    render(<HelpPanel />);
    // "Search & plain-English queries" is collapsed by default (getting-started is the open one).
    const searchTopicBtn = screen.getByRole("button", { name: /Search & plain-English queries/i });
    expect(searchTopicBtn).toHaveAttribute("aria-expanded", "false");

    // Open it.
    fireEvent.click(searchTopicBtn);
    expect(searchTopicBtn).toHaveAttribute("aria-expanded", "true");
    // Its "Try it" button (tryQuery = "20A breaker in stock under $50") now shows.
    const tryBtn = screen.getByRole("button", { name: /Try it/i });
    expect(tryBtn).toBeInTheDocument();

    // Close it again (isOpen && !query → null).
    fireEvent.click(searchTopicBtn);
    expect(searchTopicBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("'Try it' closes the panel and runs the topic's natural-language query", async () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Search & plain-English queries/i }));
    const tryBtn = screen.getByRole("button", { name: /Try it/i });
    fireEvent.click(tryBtn);

    expect(useProductFinder.getState().helpOpen).toBe(false);
    expect(runNlSearchSpy).toHaveBeenCalledTimes(1);
    const calls = runNlSearchSpy.mock.calls as unknown as [string][];
    expect(calls[0][0]).toBe("20A breaker in stock under $50");
  });

  it("'Restart the tour' closes the panel and starts the tour", () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Restart the tour/i }));
    expect(useProductFinder.getState().helpOpen).toBe(false);
    expect(startTourSpy).toHaveBeenCalledTimes(1);
  });

  it("the backdrop and the ✕ close buttons set helpOpen false", () => {
    const { unmount } = render(<HelpPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Close help" }));
    expect(useProductFinder.getState().helpOpen).toBe(false);
    unmount();

    // Re-open and exercise the header ✕ button (distinct aria-label).
    useProductFinder.setState({ helpOpen: true });
    render(<HelpPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Close help panel" }));
    expect(useProductFinder.getState().helpOpen).toBe(false);
  });

  it("Escape key closes the panel (window keydown listener)", () => {
    render(<HelpPanel />);
    expect(useProductFinder.getState().helpOpen).toBe(true);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useProductFinder.getState().helpOpen).toBe(false);
  });

  it("renders bullet lines distinctly from paragraph lines in an open topic", () => {
    render(<HelpPanel />);
    // getting-started is open by default and has bullet ("• ") lines.
    const dialog = screen.getByRole("dialog", { name: "Help" });
    // The bullet glyph is rendered as a separate green span on bullet lines.
    expect(within(dialog).getAllByText("•").length).toBeGreaterThan(0);
  });
});
