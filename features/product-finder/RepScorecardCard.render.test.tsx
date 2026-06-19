import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { RepScorecardCard } from "@/features/product-finder/RepScorecardCard";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { SavedQuote } from "@/lib/product-finder-quotes";
import type { QuoteEvent } from "@/lib/product-finder-quote-events";

// RepScorecardCard reads `quotes` from the Zustand store, rolls them through
// repScorecard(), and renders a per-rep table (or null when there are no
// quotes). It uses no network or next/navigation, so the only setup needed is
// seeding the store via setState before render.

function prod(id: string, subcategory: string): CatalogProduct {
  return {
    id,
    sku: id,
    name: `Product ${id}`,
    brand: "Acme",
    category: "electrical",
    subcategory,
    description: "",
    unitPrice: 20,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
  };
}

const DAY = 86_400_000;
const T0 = 1_700_000_000_000;

function quote(over: Partial<SavedQuote> & { id: string }): SavedQuote {
  return {
    number: `Q-${over.id}`,
    customer: "Customer",
    project: "Project",
    lines: [{ product: prod("A", "Circuit Breakers"), qty: 1 }],
    total: 100,
    status: "draft",
    createdAt: T0,
    customerId: null,
    ...over,
  };
}

/** An event that names a rep as the audit-trail author. */
function authoredBy(rep: string): QuoteEvent[] {
  return [{ at: T0, kind: "created", detail: "Created", actor: rep }];
}

function seed(quotes: SavedQuote[]) {
  useProductFinder.setState({ quotes });
}

describe("RepScorecardCard (component)", () => {
  beforeEach(() => useProductFinder.setState({ quotes: [] }));
  afterEach(() => useProductFinder.setState({ quotes: [] }));

  it("renders nothing when there are no quotes (empty state)", () => {
    const { container } = render(<RepScorecardCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("render smoke: shows the labelled section, heading, and column headers when populated", () => {
    seed([quote({ id: "1", status: "won", marginPct: 0.3, events: authoredBy("Dana") })]);
    render(<RepScorecardCard />);

    const section = screen.getByRole("region", { name: "Rep performance scorecard" });
    expect(section).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Rep performance/ })).toBeInTheDocument();

    // Column headers (the table scaffold).
    for (const col of ["Rep", "Quotes", "Win rate", "Avg margin", "Cross-sell", "Cycle"]) {
      expect(screen.getByRole("columnheader", { name: new RegExp(col) })).toBeInTheDocument();
    }
    // The rep's name renders as a row.
    expect(screen.getByRole("cell", { name: "Dana" })).toBeInTheDocument();
  });

  it("computes win rate, avg margin, and cycle days for a decided/won quote", () => {
    // Won quote: margin 40%, converted 4 days after creation.
    seed([
      quote({
        id: "1",
        status: "won",
        marginPct: 0.4,
        createdAt: T0,
        convertedAt: T0 + 4 * DAY,
        events: authoredBy("Dana"),
      }),
    ]);
    render(<RepScorecardCard />);

    const row = screen.getByRole("cell", { name: "Dana" }).closest("tr");
    expect(row).not.toBeNull();
    const r = within(row as HTMLElement);
    // volume = 1 quote
    expect(r.getByText("1")).toBeInTheDocument();
    // win rate = 1/1 = 100%, with (won/decided) detail
    expect(r.getByText(/100%/)).toBeInTheDocument();
    expect(r.getByText(/\(1\/1\)/)).toBeInTheDocument();
    // avg margin = 40%
    expect(r.getByText("40%")).toBeInTheDocument();
    // cycle = 4d
    expect(r.getByText("4d")).toBeInTheDocument();
  });

  it("renders an em dash for win rate, margin, and cycle when no data is available", () => {
    // A single draft quote with no margin and no conversion: every derived
    // metric is null → the pct()/cycle fallbacks render "—".
    seed([quote({ id: "1", status: "draft", events: authoredBy("Lee") })]);
    render(<RepScorecardCard />);

    const row = screen.getByRole("cell", { name: "Lee" }).closest("tr");
    const dashes = within(row as HTMLElement).getAllByText("—");
    // win rate (no decided), avg margin (no marginPct), cycle (not won) → 3 dashes.
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("reports cross-sell attach when a quote spans >1 subcategory", () => {
    // One quote with two distinct subcategories → cross-sell attach = 100%.
    seed([
      quote({
        id: "1",
        status: "won",
        marginPct: 0.25,
        lines: [
          { product: prod("A", "Circuit Breakers"), qty: 1 },
          { product: prod("B", "Wire & Cable"), qty: 2 },
        ],
        events: authoredBy("Dana"),
      }),
    ]);
    render(<RepScorecardCard />);

    const row = screen.getByRole("cell", { name: "Dana" }).closest("tr");
    // crossSellAttachPct = 1/1 = 100%. Win rate is also 100% (1/1 won), so both
    // the win-rate and cross-sell cells read 100% — assert both are present.
    const hundreds = within(row as HTMLElement).getAllByText("100%");
    expect(hundreds).toHaveLength(2);
  });

  it("falls back to 'Unknown' when a quote has no event naming a rep", () => {
    // No events at all (and an empty-actor event) → rep attribution is "Unknown".
    seed([
      quote({ id: "1", status: "sent" }),
      quote({ id: "2", status: "sent", events: [{ at: T0, kind: "created", detail: "Created" }] }),
    ]);
    render(<RepScorecardCard />);
    const row = screen.getByRole("cell", { name: "Unknown" }).closest("tr");
    // Both quotes roll up under "Unknown": volume = 2.
    expect(within(row as HTMLElement).getByText("2")).toBeInTheDocument();
  });

  it("groups multiple reps into separate rows sorted by volume", () => {
    seed([
      quote({ id: "1", status: "won", marginPct: 0.3, events: authoredBy("Dana") }),
      quote({ id: "2", status: "lost", events: authoredBy("Dana") }),
      quote({ id: "3", status: "sent", events: authoredBy("Lee") }),
    ]);
    render(<RepScorecardCard />);

    expect(screen.getByRole("cell", { name: "Dana" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Lee" })).toBeInTheDocument();

    // Dana has 2 quotes, Lee has 1 — Dana's row sorts first.
    const repCells = screen.getAllByRole("row").slice(1).map((tr) => tr.querySelector("td")?.textContent);
    expect(repCells[0]).toBe("Dana");
    expect(repCells[1]).toBe("Lee");

    // Dana decided = won+lost = 2, win rate = 1/2 = 50%.
    const danaRow = screen.getByRole("cell", { name: "Dana" }).closest("tr");
    expect(within(danaRow as HTMLElement).getByText(/50%/)).toBeInTheDocument();
    expect(within(danaRow as HTMLElement).getByText(/\(1\/2\)/)).toBeInTheDocument();
  });
});
