import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ExternalSourcesCard } from "@/features/product-finder/ExternalSourcesCard";
import type { CatalogProduct, ExternalSource } from "@/features/product-finder/types";

// ── Fixtures ───────────────────────────────────────────────────────────────
// ExternalSourcesCard is a pure prop-driven presentational component: it reads
// only `product.externalSources` and renders nothing else from the store, the
// network, or next/navigation. So no store seeding / fetch stubbing is needed —
// we just feed it products with different external-source shapes.

function prod(externalSources: ExternalSource[]): CatalogProduct {
  return {
    id: "p1",
    sku: "P1",
    name: "Product P1",
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 20,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources,
    imageIcon: "x",
  };
}

const src = (over: Partial<ExternalSource> = {}): ExternalSource => ({
  distributor: "Grainger",
  url: "https://example.com/grainger",
  price: 100,
  quantity: 5,
  status: "in-stock",
  ...over,
});

describe("ExternalSourcesCard (component)", () => {
  it("renders nothing when there are no external sources", () => {
    const { container } = render(<ExternalSourcesCard product={prod([])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("render-smoke: shows the header and one row per source", () => {
    render(
      <ExternalSourcesCard
        product={prod([
          src({ distributor: "Grainger", price: 100, quantity: 5 }),
          src({ distributor: "Graybar", price: 90, quantity: 12 }),
        ])}
      />
    );
    expect(
      screen.getByText("Available at External Distributors")
    ).toBeInTheDocument();
    // The two distributor chips render.
    expect(screen.getByText("Grainger")).toBeInTheDocument();
    expect(screen.getByText("Graybar")).toBeInTheDocument();
    // One row per source in the table body.
    const rows = screen.getAllByRole("row");
    // 1 header row + 2 data rows.
    expect(rows).toHaveLength(3);
  });

  it("flags only the cheapest source as Best and formats price/qty", () => {
    render(
      <ExternalSourcesCard
        product={prod([
          src({ distributor: "Grainger", price: 100, quantity: 1234 }),
          src({ distributor: "Graybar", price: 89.5, quantity: 7 }),
          src({ distributor: "Rexel USA", price: 95, quantity: 3 }),
        ])}
      />
    );
    // Exactly one "Best" marker, attached to the lowest-priced row (Graybar @ 89.50).
    const bests = screen.getAllByText("Best");
    expect(bests).toHaveLength(1);
    const bestRow = bests[0].closest("tr");
    expect(bestRow).not.toBeNull();
    expect(within(bestRow as HTMLElement).getByText("Graybar")).toBeInTheDocument();
    expect(within(bestRow as HTMLElement).getByText(/\$89\.50/)).toBeInTheDocument();
    // Quantity is locale-formatted with a thousands separator.
    expect(screen.getByText("1,234")).toBeInTheDocument();
    // Other prices are present and two-decimal formatted.
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$95\.00/)).toBeInTheDocument();
  });

  it("renders all three status labels", () => {
    render(
      <ExternalSourcesCard
        product={prod([
          src({ distributor: "Grainger", status: "in-stock" }),
          src({ distributor: "Graybar", status: "low-stock" }),
          src({ distributor: "Rexel USA", status: "out-of-stock" }),
        ])}
      />
    );
    expect(screen.getByText("In Stock")).toBeInTheDocument();
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
    // out-of-stock maps to the "Order Only" label.
    expect(screen.getByText("Order Only")).toBeInTheDocument();
  });

  it("shows lead time only when provided, and renders a safe external link", () => {
    render(
      <ExternalSourcesCard
        product={prod([
          src({ distributor: "Grainger", leadTime: "3-5 days", url: "https://grainger.test/p" }),
          src({ distributor: "Graybar", leadTime: undefined }),
        ])}
      />
    );
    // Lead time text appears for the source that has it...
    expect(screen.getByText(/Lead:/)).toBeInTheDocument();
    expect(screen.getByText(/3-5 days/)).toBeInTheDocument();
    // ...and there is exactly one Lead: line (the undefined one is omitted).
    expect(screen.getAllByText(/Lead:/)).toHaveLength(1);

    // "Visit Site" links open safely in a new tab.
    const links = screen.getAllByRole("link", { name: /Visit Site/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://grainger.test/p");
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("when only one source exists it is itself the Best price", () => {
    render(<ExternalSourcesCard product={prod([src({ distributor: "Grainger", price: 42 })])} />);
    expect(screen.getByText("Best")).toBeInTheDocument();
    expect(screen.getByText(/\$42\.00/)).toBeInTheDocument();
  });
});
