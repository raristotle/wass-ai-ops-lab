import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { RecommendationExplanation } from "@/features/product-finder/RecommendationExplanation";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";

const BRANCH_ID = "B-HOU-01";

function prod(id: string, overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id,
    sku: id,
    name: `Product ${id}`,
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
    externalSources: [],
    imageIcon: "x",
    ...overrides,
  };
}

function spec(name: string, value: string, isNonNeg = true): ProductSpec {
  return { name, value, isNonNeg };
}

// Reference with two non-negotiable specs at unitPrice 100.
const reference = prod("REF", {
  unitPrice: 100,
  subcategory: "Circuit Breakers",
  specs: [spec("Amperage", "20A"), spec("Poles", "2")],
});

// Excellent candidate: matches all non-neg specs, in branch stock, preferred,
// cheaper, same subcategory → high total, populated chips.
const excellentCandidate = prod("EXC", {
  unitPrice: 50, // 50% cheaper → saturates the price factor
  subcategory: "Circuit Breakers",
  preferred: true,
  specs: [spec("Amperage", "20A"), spec("Poles", "2")],
  branchStock: [{ branchId: BRANCH_ID, branchName: "Houston", city: "Houston", state: "TX", quantity: 12 }],
});

// Partial candidate: differs on every non-neg spec, not in stock, not preferred,
// more expensive, different subcategory → low total, zero positive chips.
const partialCandidate = prod("PAR", {
  unitPrice: 140, // more expensive than reference
  subcategory: "Fuses",
  preferred: false,
  specs: [spec("Amperage", "30A"), spec("Poles", "3")],
});

describe("RecommendationExplanation (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({
      user: {
        name: "Rep",
        email: "rep@example.com",
        role: "sales",
        branch: "Houston",
        branchId: BRANCH_ID,
      },
    });
  });
  afterEach(() => {
    useProductFinder.setState({ user: null });
  });

  it("render-smoke: shows the score ring, tier label, and the why-disclosure button", () => {
    render(<RecommendationExplanation product={excellentCandidate} reference={reference} />);

    // Score ring exposes an accessible progressbar with the computed total.
    const ring = screen.getByRole("progressbar");
    expect(ring).toBeInTheDocument();
    const total = Number(ring.getAttribute("aria-valuenow"));
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
    // The inner badge prints the same percentage.
    expect(screen.getByText(`${total}%`)).toBeInTheDocument();

    // Disclosure starts collapsed.
    const why = screen.getByRole("button", { name: /Why recommended\?/i });
    expect(why).toHaveAttribute("aria-expanded", "false");
  });

  it("excellent branch: high total, Excellent tier, populated reason chips", () => {
    render(<RecommendationExplanation product={excellentCandidate} reference={reference} />);

    const ring = screen.getByRole("progressbar");
    // spec45 + branch25 + preferred15 + price8 + subcat7 = 100
    expect(ring.getAttribute("aria-valuenow")).toBe("100");
    expect(ring.getAttribute("aria-label")).toContain("Excellent match");
    expect(screen.getByText("Excellent match")).toBeInTheDocument();

    // topReasons(score, 2) → exactly the two highest positive chips are rendered.
    // The chip container is the wrap directly under the ring row; each chip
    // carries a ✓. Assert two chips and that the top spec/stock reasons appear.
    expect(screen.getByText("Matches all 2 non-negotiable specs")).toBeInTheDocument();
    expect(screen.getByText("In stock at your branch")).toBeInTheDocument();
  });

  it("partial branch: low total, Partial tier, no positive chips rendered", () => {
    render(<RecommendationExplanation product={partialCandidate} reference={reference} />);

    const ring = screen.getByRole("progressbar");
    expect(ring.getAttribute("aria-valuenow")).toBe("0");
    expect(ring.getAttribute("aria-label")).toContain("Partial match");
    expect(screen.getByText("Partial match")).toBeInTheDocument();

    // No positive, point-bearing factors → topReasons returns [] → no chips.
    // (The ✓ glyph only appears inside chips and inside the expanded list.)
    expect(screen.queryByText("In stock at your branch")).not.toBeInTheDocument();
    // The disclosure is still present even with zero chips.
    expect(screen.getByRole("button", { name: /Why recommended\?/i })).toBeInTheDocument();
  });

  it("interaction: clicking the disclosure toggles the full factor list", () => {
    render(<RecommendationExplanation product={partialCandidate} reference={reference} />);
    const why = screen.getByRole("button", { name: /Why recommended\?/i });

    // Collapsed: the mismatch/warning notes are not in the DOM.
    expect(screen.queryByText(/Differs on Amperage/i)).not.toBeInTheDocument();

    fireEvent.click(why);
    expect(why).toHaveAttribute("aria-expanded", "true");

    // Expanded list renders every factor, including non-positive warning notes.
    const list = screen.getByRole("list");
    expect(within(list).getByText(/Differs on Amperage \(needs 20A\)/i)).toBeInTheDocument();
    expect(within(list).getByText(/Differs on Poles \(needs 2\)/i)).toBeInTheDocument();
    expect(within(list).getByText("Not in Meridian stock")).toBeInTheDocument();

    // Collapse again.
    fireEvent.click(why);
    expect(why).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("expanded list shows positive points with a +N badge for point-bearing factors", () => {
    render(<RecommendationExplanation product={excellentCandidate} reference={reference} />);
    fireEvent.click(screen.getByRole("button", { name: /Why recommended\?/i }));
    const list = screen.getByRole("list");

    // Spec factor is worth +45; its row should carry the +45 points badge.
    expect(within(list).getByText("+45")).toBeInTheDocument();
    // Preferred-line positive factor is present in the full breakdown.
    expect(within(list).getByText("Meridian Preferred line")).toBeInTheDocument();
  });

  it("no-branch user: scoring falls back gracefully (DC stock path), still renders", () => {
    // Clear the user so userBranchId is undefined; candidate has DC stock only.
    useProductFinder.setState({ user: null });
    const dcCandidate = prod("DC", {
      unitPrice: 50,
      subcategory: "Circuit Breakers",
      specs: [spec("Amperage", "20A"), spec("Poles", "2")],
      dcStock: [{ dcId: "DC1", dcName: "Central", location: "TX", quantity: 5 }],
    });
    render(<RecommendationExplanation product={dcCandidate} reference={reference} />);

    // Renders without throwing and surfaces the DC availability factor when expanded.
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Why recommended\?/i }));
    expect(
      within(screen.getByRole("list")).getByText("Available from distribution center"),
    ).toBeInTheDocument();
  });

  it("reference with no non-negotiable specs: 'No spec constraints' factor path", () => {
    const looseRef = prod("LOOSEREF", { unitPrice: 100, subcategory: "Circuit Breakers", specs: [] });
    const candidate = prod("CAND", { unitPrice: 100, subcategory: "Circuit Breakers" });
    render(<RecommendationExplanation product={candidate} reference={looseRef} />);

    fireEvent.click(screen.getByRole("button", { name: /Why recommended\?/i }));
    expect(
      within(screen.getByRole("list")).getByText("No spec constraints to meet"),
    ).toBeInTheDocument();
  });
});
