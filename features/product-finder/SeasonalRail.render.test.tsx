import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SeasonalRail } from "@/features/product-finder/SeasonalRail";
import { useProductFinder } from "@/lib/product-finder-store";
import { SEASONAL_EVENTS, seasonalEvent } from "@/lib/product-finder-seasonal";

// The rail reads the clock once in a mount effect (Date.now). We spy on Date.now
// (rather than fake timers) so the passive effect flushes normally under RTL's
// act() wrapper, and pin it so a known seasonal event is selected.
const WEEK_MS = 7 * 86_400_000;

/** A timestamp that lands the rotation on the event at SEASONAL_EVENTS[index]. */
function tsForEventIndex(index: number): number {
  // seasonalEvent uses Math.floor(now / WEEK_MS) % SEASONAL_EVENTS.length.
  // Pick a week number congruent to `index`, then a mid-week ms within it.
  const week = index; // index < length, so week % length === index
  return week * WEEK_MS + WEEK_MS / 2;
}

type RunNlSearch = ReturnType<typeof useProductFinder.getState>["runNlSearch"];

describe("SeasonalRail (component)", () => {
  let runNlSearch: ReturnType<typeof vi.fn>;
  let realRunNlSearch: RunNlSearch;

  beforeEach(() => {
    realRunNlSearch = useProductFinder.getState().runNlSearch;
    // Replace the store action with a spy so clicks are observable and no real
    // search machinery runs during render tests.
    runNlSearch = vi.fn(async () => {});
    useProductFinder.setState({ runNlSearch: runNlSearch as unknown as RunNlSearch });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useProductFinder.setState({ runNlSearch: realRunNlSearch });
  });

  /** Pin Date.now so seasonalEvent() resolves to SEASONAL_EVENTS[index]. */
  function pinClockToEvent(index: number) {
    vi.spyOn(Date, "now").mockReturnValue(tsForEventIndex(index));
  }

  /**
   * Render and flush the mount passive effect (setNow) inside act so the
   * effect-driven re-render is committed before assertions, with no act warning.
   */
  function renderRail() {
    act(() => {
      render(<SeasonalRail />);
    });
  }

  it("renders the curated event banner after mount (icon, title, blurb, footer)", () => {
    pinClockToEvent(0);
    const expected = seasonalEvent(tsForEventIndex(0));

    renderRail();

    // The container banner carries the simulated-signal aria-label.
    const banner = screen.getByLabelText("Seasonal demand signal (simulated)");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute("data-tour", "seasonal");

    // Title + blurb + the simulated-signal footer all render.
    expect(screen.getByText(expected.title)).toBeInTheDocument();
    expect(screen.getByText(expected.blurb)).toBeInTheDocument();
    expect(screen.getByText("simulated signal")).toBeInTheDocument();

    // The icon is decorative (aria-hidden).
    const icon = screen.getByText(expected.icon);
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("renders one quick-search button per pick", () => {
    pinClockToEvent(0);
    const expected = seasonalEvent(tsForEventIndex(0));

    renderRail();

    for (const pick of expected.picks) {
      expect(screen.getByRole("button", { name: pick.label })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button")).toHaveLength(expected.picks.length);
  });

  it("invokes runNlSearch with the pick's query when a pick button is clicked", () => {
    pinClockToEvent(0);
    const expected = seasonalEvent(tsForEventIndex(0));

    renderRail();

    const firstPick = expected.picks[0];
    fireEvent.click(screen.getByRole("button", { name: firstPick.label }));

    expect(runNlSearch).toHaveBeenCalledTimes(1);
    const calls = runNlSearch.mock.calls as unknown as [string][];
    expect(calls[0][0]).toBe(firstPick.query);
  });

  it("clicking a second pick fires runNlSearch again with that pick's query", () => {
    pinClockToEvent(0);
    const expected = seasonalEvent(tsForEventIndex(0));
    // Guard: this event must have at least two picks for the test to be meaningful.
    expect(expected.picks.length).toBeGreaterThanOrEqual(2);

    renderRail();

    fireEvent.click(screen.getByRole("button", { name: expected.picks[0].label }));
    fireEvent.click(screen.getByRole("button", { name: expected.picks[1].label }));

    expect(runNlSearch).toHaveBeenCalledTimes(2);
    const calls = runNlSearch.mock.calls as unknown as [string][];
    expect(calls[0][0]).toBe(expected.picks[0].query);
    expect(calls[1][0]).toBe(expected.picks[1].query);
  });

  it("rotates to a different curated event for a different epoch-week", () => {
    // Pick the last event in the rotation so it differs from index 0.
    const lastIndex = SEASONAL_EVENTS.length - 1;
    pinClockToEvent(lastIndex);
    const expected = seasonalEvent(tsForEventIndex(lastIndex));

    renderRail();

    expect(screen.getByText(expected.title)).toBeInTheDocument();
    // Sanity: the rotation actually selected the last event, not index 0.
    if (lastIndex !== 0) {
      expect(expected.title).not.toBe(SEASONAL_EVENTS[0].title);
    }
  });
});
