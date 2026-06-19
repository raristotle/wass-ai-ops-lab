import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductFinderCard } from "@/features/product-finder/ProductFinderCard";

/**
 * Render coverage for the floating dashboard nav card. The component is a
 * purely presentational leaf: no props, no store reads, no network — it just
 * wraps a next/link with branded labels. These tests assert the
 * accessibility-critical structure (complementary landmark, link target,
 * decorative icon hiding) and that the link is interactable.
 */
describe("ProductFinderCard (component)", () => {
  it("renders without throwing and exposes the labelled complementary landmark", () => {
    render(<ProductFinderCard />);
    const region = screen.getByRole("complementary", {
      name: "Navigate to AI Product Recommender",
    });
    expect(region).toBeInTheDocument();
  });

  it("links to the product-finder route", () => {
    render(<ProductFinderCard />);
    const link = screen.getByRole("link", { name: /AI Product Recommender/i });
    expect(link).toHaveAttribute("href", "/product-finder");
  });

  it("shows the AI badge plus the title and subtitle copy", () => {
    render(<ProductFinderCard />);
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("AI Product Recommender")).toBeInTheDocument();
    expect(
      screen.getByText("Find alternatives, compare specs, manage BOM"),
    ).toBeInTheDocument();
  });

  it("marks the chevron icon as decorative (aria-hidden) so it is not announced", () => {
    const { container } = render(<ProductFinderCard />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("is reachable as a single accessible link the user can activate", () => {
    render(<ProductFinderCard />);
    // Exactly one navigable link — the whole card is the target.
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    // Clicking the link should not throw (next/link renders a plain anchor in
    // jsdom). preventDefault avoids jsdom's unimplemented-navigation noise while
    // still exercising the click path through the rendered anchor.
    const clicked = fireEvent.click(links[0], { cancelable: true });
    expect(clicked).toBe(true);
    expect(links[0]).toBeInTheDocument();
  });
});
