import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SavedSearchesBar } from "@/features/product-finder/SavedSearchesBar";
import { useProductFinder } from "@/lib/product-finder-store";

/**
 * Render-loop guard. SavedSearchesBar subscribes to several store selectors;
 * a selector returning a fresh reference each render would trigger React's
 * "Maximum update depth exceeded" (the #185 class of bug that once broke prod).
 * If this renders at all, the subscriptions are stable.
 */
describe("SavedSearchesBar (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({
      savedSearches: [
        { id: "s1", name: "Square D 20A", query: "q=20A", summary: "“20A”", createdAt: 1, alertsOn: true, newMatches: 3 },
      ],
    });
  });

  it("mounts without a render loop and shows the saved-search chip + alert badge", () => {
    render(<SavedSearchesBar />);
    expect(screen.getByText("Square D 20A")).toBeInTheDocument();
    expect(screen.getByText("+3 new")).toBeInTheDocument();
  });

  it("renders nothing extra when there are no saved searches and no active filters", () => {
    useProductFinder.setState({ savedSearches: [] });
    const { container } = render(<SavedSearchesBar />);
    // With the default (empty) filter state and no saved searches, the bar is empty.
    expect(container.querySelector('[data-tour="saved-searches"]')).toBeNull();
  });
});
