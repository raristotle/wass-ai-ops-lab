import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { JobWizardModal } from "@/features/product-finder/JobWizardModal";
import { useProductFinder } from "@/lib/product-finder-store";
import { JOB_DEFS } from "@/lib/product-finder-jobs";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Render-net coverage for the Ask Meridian Job Wizard modal.
 *
 * The wizard resolves each job step against the live catalog via apiSearch,
 * which `fetch`es /api/products/search. We stub fetch so every step resolves to
 * a deterministic candidate list (a primary pick + alternates) and exercise the
 * picker grid, the resolved-steps view, the qty stepper, include/exclude,
 * alternate swap, reset, and the add-all → basket handoff.
 */

function prod(id: string, overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id,
    sku: id,
    name: `Product ${id}`,
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 25,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock: [{ branchId: "b1", branchName: "Main", city: "Pittsburgh", state: "PA", quantity: 5 }],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
    ...overrides,
  } as CatalogProduct;
}

/**
 * Each apiSearch call (one per step) returns three products: the first becomes
 * the pick, the next two become the alternates. We key the names off a counter
 * so different steps render distinguishable products.
 */
let searchCall = 0;
function searchResponse(items: CatalogProduct[]) {
  return {
    ok: true,
    json: async () => ({ items, total: items.length, page: 0, pageSize: 3, facets: [] }),
  };
}

describe("JobWizardModal (render net)", () => {
  beforeEach(() => {
    searchCall = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const n = searchCall++;
        return searchResponse([
          prod(`p${n}-a`, { name: `Primary ${n}`, unitPrice: 10 + n, imageIcon: "🔧" }),
          prod(`p${n}-b`, { name: `Alt ${n} B`, unitPrice: 20 + n }),
          prod(`p${n}-c`, { name: `Alt ${n} C`, unitPrice: 30 + n }),
        ]);
      }),
    );
    useProductFinder.setState({ jobWizardOpen: false, cart: {}, cartOpen: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    useProductFinder.setState({ jobWizardOpen: false, cart: {}, cartOpen: false });
  });

  it("renders nothing when the wizard is closed", () => {
    useProductFinder.setState({ jobWizardOpen: false });
    const { container } = render(<JobWizardModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the job picker grid when open (no job selected yet)", () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);

    expect(screen.getByRole("dialog", { name: /Job Wizard/i })).toBeInTheDocument();
    expect(screen.getByText(/What are you building today\?/i)).toBeInTheDocument();
    // Every job template renders a card.
    for (const def of JOB_DEFS) {
      expect(screen.getByText(def.title)).toBeInTheDocument();
    }
    // The footer (job-only) is not shown on the picker screen.
    expect(screen.queryByRole("button", { name: /items to basket/i })).not.toBeInTheDocument();
  });

  it("closes via the close button (clears jobWizardOpen)", () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);
    fireEvent.click(screen.getByRole("button", { name: /Close job wizard/i }));
    expect(useProductFinder.getState().jobWizardOpen).toBe(false);
  });

  it("closes when Escape is pressed on the dialog backdrop", () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(useProductFinder.getState().jobWizardOpen).toBe(false);
  });

  it("closes when the backdrop itself is clicked", () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);
    // The outer dialog div is the backdrop; clicking it (target === currentTarget) closes.
    fireEvent.click(screen.getByRole("dialog"));
    expect(useProductFinder.getState().jobWizardOpen).toBe(false);
  });

  it("picks a job, shows the loading state, then resolves each step to a product", async () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);

    const job = JOB_DEFS[0];
    fireEvent.click(screen.getByText(job.title));

    // While resolving, the loading copy appears (at least one step).
    expect(screen.getAllByText(/Finding the right product/i).length).toBeGreaterThan(0);

    // After fetch resolves, the primary product names show up.
    await waitFor(() => {
      expect(screen.getAllByText(/^Primary \d+$/).length).toBe(job.steps.length);
    });

    // Footer summary: every required (non-optional) step is included by default.
    const requiredCount = job.steps.filter((s) => !s.optional).length;
    expect(
      screen.getByText(new RegExp(`${requiredCount} of ${job.steps.length} steps included`)),
    ).toBeInTheDocument();

    // The add button reflects the included count.
    expect(
      screen.getByRole("button", { name: new RegExp(`Add ${requiredCount} items to basket`) }),
    ).toBeInTheDocument();
  });

  it("toggling a step checkbox updates the included count and add button label", async () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);

    const job = JOB_DEFS[0];
    fireEvent.click(screen.getByText(job.title));
    await waitFor(() => {
      expect(screen.getAllByText(/^Primary \d+$/).length).toBe(job.steps.length);
    });

    const requiredCount = job.steps.filter((s) => !s.optional).length;
    // Uncheck the first (checked) required step → included count drops by one.
    const checkboxes = screen.getAllByRole("checkbox");
    const firstChecked = checkboxes.find((c) => (c as HTMLInputElement).checked)!;
    fireEvent.click(firstChecked);

    await waitFor(() => {
      expect(
        screen.getByText(
          new RegExp(`${requiredCount - 1} of ${job.steps.length} steps included`),
        ),
      ).toBeInTheDocument();
    });
  });

  it("qty steppers increment and decrement, clamping the floor at 1", async () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);

    const job = JOB_DEFS[0];
    // First step defaults to qty 1 (panel), which lets us prove the floor clamp.
    fireEvent.click(screen.getByText(job.title));
    await waitFor(() => {
      expect(screen.getAllByText(/^Primary \d+$/).length).toBe(job.steps.length);
    });

    const firstStepLabel = job.steps[0].label;
    const inc = screen.getByRole("button", { name: `Increase quantity for ${firstStepLabel}` });
    const dec = screen.getByRole("button", { name: `Decrease quantity for ${firstStepLabel}` });
    const li = inc.closest("li")!;

    // Default qty for the first step is 1.
    expect(within(li).getByText("1")).toBeInTheDocument();
    fireEvent.click(inc); // → 2
    await waitFor(() => expect(within(li).getByText("2")).toBeInTheDocument());
    fireEvent.click(dec); // → 1
    fireEvent.click(dec); // floor: stays at 1
    await waitFor(() => expect(within(li).getByText("1")).toBeInTheDocument());
  });

  it("swaps the pick when an alternate chip is clicked", async () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);

    const job = JOB_DEFS[0];
    fireEvent.click(screen.getByText(job.title));
    await waitFor(() => {
      expect(screen.getAllByText(/^Primary \d+$/).length).toBe(job.steps.length);
    });

    // For step 0, the resolver returned Primary 0 with alternates "Alt 0 B" / "Alt 0 C".
    const firstStepLabel = job.steps[0].label;
    const li = screen
      .getByRole("button", { name: `Increase quantity for ${firstStepLabel}` })
      .closest("li")!;
    // The alternate chip text includes the price.
    const altChip = within(li).getByTitle(/Use Alt 0 B/i);
    fireEvent.click(altChip);

    // After the swap, the alternate becomes the pick (its name now shows as the line title).
    await waitFor(() => {
      expect(within(li).getByText("Alt 0 B")).toBeInTheDocument();
    });
  });

  it("returns to the picker via the back link (reset)", async () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);

    const job = JOB_DEFS[0];
    fireEvent.click(screen.getByText(job.title));
    await waitFor(() => {
      expect(screen.getAllByText(/^Primary \d+$/).length).toBe(job.steps.length);
    });

    fireEvent.click(screen.getByText(/Pick a different job/i));
    expect(screen.getByText(/What are you building today\?/i)).toBeInTheDocument();
  });

  it("renders the no-match branch when the catalog returns nothing for a step", async () => {
    // Override fetch so apiSearch resolves to an empty item list.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => searchResponse([])),
    );
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);

    const job = JOB_DEFS[0];
    fireEvent.click(screen.getByText(job.title));

    await waitFor(() => {
      expect(screen.getAllByText(/No match in the catalog/i).length).toBe(job.steps.length);
    });

    // With no products at all, the add button is disabled (includedPicks is empty).
    const addBtn = screen.getByRole("button", { name: /items to basket|Resolving picks/i });
    expect(addBtn).toBeDisabled();
  });

  it("adds the included picks to the cart, then opens the cart drawer", async () => {
    useProductFinder.setState({ jobWizardOpen: true });
    render(<JobWizardModal />);

    const job = JOB_DEFS[0];
    fireEvent.click(screen.getByText(job.title));

    // Let the resolveStep promises settle under real timers (so the act() wrapper
    // inside waitFor flushes them cleanly), then switch to fake timers only for
    // the 700ms post-add close handoff.
    await waitFor(() => {
      expect(screen.getAllByText(/^Primary \d+$/).length).toBe(job.steps.length);
    });

    vi.useFakeTimers();
    const requiredCount = job.steps.filter((s) => !s.optional).length;
    const addBtn = screen.getByRole("button", {
      name: new RegExp(`Add ${requiredCount} items to basket`),
    });
    fireEvent.click(addBtn);

    // Cart now holds the included primary picks.
    const cart = useProductFinder.getState().cart;
    expect(Object.keys(cart)).toHaveLength(requiredCount);
    // Button flips to the confirmed state immediately.
    expect(screen.getByRole("button", { name: /Added to basket/i })).toBeInTheDocument();

    // After the 700ms timeout the wizard closes and the cart drawer opens.
    vi.advanceTimersByTime(800);
    expect(useProductFinder.getState().jobWizardOpen).toBe(false);
    expect(useProductFinder.getState().cartOpen).toBe(true);
  });
});
