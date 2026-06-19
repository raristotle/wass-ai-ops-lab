import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TourOverlay } from "@/features/product-finder/TourOverlay";
import { useProductFinder } from "@/lib/product-finder-store";
import { TOUR_STEPS } from "@/lib/product-finder-tour-content";
import type { AuthUser } from "@/features/product-finder/types";

// TourOverlay reads next/navigation's useRouter for "navigate" actions — mock it.
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function user(role: AuthUser["role"]): AuthUser {
  return { name: "Rep", email: "rep@example.com", role, branch: "B1", branchId: "b1" };
}

const LAST = TOUR_STEPS.length - 1;
// Indices of steps that carry a "try it" action, by kind, derived from content.
const nlSearchStep = TOUR_STEPS.findIndex((s) => s.action?.kind === "nlSearch");
const openJobWizardStep = TOUR_STEPS.findIndex((s) => s.action?.kind === "openJobWizard");
const openCartStep = TOUR_STEPS.findIndex((s) => s.action?.kind === "openCart");
// The navigate step is role-gated to manager/admin.
const navigateStep = TOUR_STEPS.findIndex(
  (s) => s.action?.kind === "navigate" && s.actionRoles !== undefined,
);

describe("TourOverlay (component)", () => {
  beforeEach(() => {
    push.mockReset();
    // Spy on the store actions so we can assert the handlers fire without
    // running their full side-effects (runNlSearch is async + hits search).
    useProductFinder.setState({
      tourOpen: false,
      tourStep: 0,
      user: null,
      runNlSearch: vi.fn(async () => {}),
      setCartOpen: vi.fn(),
      setJobWizardOpen: vi.fn(),
    });
  });

  afterEach(() => {
    useProductFinder.setState({ tourOpen: false, tourStep: 0, user: null });
  });

  it("renders nothing when the tour is closed", () => {
    useProductFinder.setState({ tourOpen: false });
    const { container } = render(<TourOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("render-smoke: open tour shows the first step's title and footer controls", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: 0 });
    render(<TourOverlay />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute(
      "aria-label",
      `Tour step 1 of ${TOUR_STEPS.length}: ${TOUR_STEPS[0].title}`,
    );
    expect(screen.getByRole("heading", { name: TOUR_STEPS[0].title })).toBeInTheDocument();
    // First step: Back disabled, Next enabled, Skip tour present.
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Skip tour" })).toBeInTheDocument();
  });

  it("renders bullet lines (• prefixed) for steps that have them", () => {
    // nl-search step has bullet body lines; assert one renders with the prefix stripped.
    useProductFinder.setState({ tourOpen: true, tourStep: nlSearchStep });
    render(<TourOverlay />);
    const bulletLine = TOUR_STEPS[nlSearchStep].body.find((l) => l.startsWith("• "))!;
    expect(screen.getByText(bulletLine.slice(2))).toBeInTheDocument();
  });

  it("Next advances the step via setTourStep; Back is disabled on step 0", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: 0 });
    render(<TourOverlay />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(useProductFinder.getState().tourStep).toBe(1);
  });

  it("Back goes to the previous step", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: 2 });
    render(<TourOverlay />);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(useProductFinder.getState().tourStep).toBe(1);
  });

  it("last step shows Done and closes the tour when clicked", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: LAST });
    render(<TourOverlay />);
    const done = screen.getByRole("button", { name: "Done" });
    expect(done).toBeInTheDocument();
    fireEvent.click(done);
    expect(useProductFinder.getState().tourOpen).toBe(false);
  });

  it("Skip tour closes the tour", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: 1 });
    render(<TourOverlay />);
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(useProductFinder.getState().tourOpen).toBe(false);
  });

  it("clamps an out-of-range tourStep to the last valid step", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: 999 });
    render(<TourOverlay />);
    // Clamped to LAST → aria-label reflects the final step, and Done shows.
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-label",
      `Tour step ${TOUR_STEPS.length} of ${TOUR_STEPS.length}: ${TOUR_STEPS[LAST].title}`,
    );
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });

  it("clamps a negative tourStep to the first step", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: -5 });
    render(<TourOverlay />);
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-label",
      `Tour step 1 of ${TOUR_STEPS.length}: ${TOUR_STEPS[0].title}`,
    );
  });

  // ── "Try it" action handlers ──────────────────────────────────────────────
  it("runs an nlSearch action via the store", () => {
    const runNlSearch = vi.fn(async () => {});
    useProductFinder.setState({ tourOpen: true, tourStep: nlSearchStep, runNlSearch });
    render(<TourOverlay />);
    const action = TOUR_STEPS[nlSearchStep].action!;
    fireEvent.click(screen.getByRole("button", { name: `▶ ${action.label}` }));
    expect(runNlSearch).toHaveBeenCalledTimes(1);
    const calls = runNlSearch.mock.calls as unknown as [string][];
    expect(calls[0][0]).toBe((action as { query: string }).query);
  });

  it("runs an openJobWizard action via the store", () => {
    const setJobWizardOpen = vi.fn();
    useProductFinder.setState({ tourOpen: true, tourStep: openJobWizardStep, setJobWizardOpen });
    render(<TourOverlay />);
    const action = TOUR_STEPS[openJobWizardStep].action!;
    fireEvent.click(screen.getByRole("button", { name: `▶ ${action.label}` }));
    expect(setJobWizardOpen).toHaveBeenCalledWith(true);
  });

  it("runs an openCart action via the store", () => {
    const setCartOpen = vi.fn();
    useProductFinder.setState({ tourOpen: true, tourStep: openCartStep, setCartOpen });
    render(<TourOverlay />);
    const action = TOUR_STEPS[openCartStep].action!;
    fireEvent.click(screen.getByRole("button", { name: `▶ ${action.label}` }));
    expect(setCartOpen).toHaveBeenCalledWith(true);
  });

  // ── Role-gated navigate action ────────────────────────────────────────────
  it("hides the role-gated action for a sales rep (role not allowed)", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: navigateStep, user: user("sales") });
    render(<TourOverlay />);
    const action = TOUR_STEPS[navigateStep].action!;
    expect(screen.queryByRole("button", { name: `▶ ${action.label}` })).not.toBeInTheDocument();
  });

  it("hides the role-gated action when signed out (user is null)", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: navigateStep, user: null });
    render(<TourOverlay />);
    const action = TOUR_STEPS[navigateStep].action!;
    expect(screen.queryByRole("button", { name: `▶ ${action.label}` })).not.toBeInTheDocument();
  });

  it("shows and runs the role-gated navigate action for a manager", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: navigateStep, user: user("manager") });
    render(<TourOverlay />);
    const action = TOUR_STEPS[navigateStep].action! as { label: string; href: string };
    fireEvent.click(screen.getByRole("button", { name: `▶ ${action.label}` }));
    expect(push).toHaveBeenCalledWith(action.href);
  });

  // ── Escape-to-close effect ────────────────────────────────────────────────
  it("Escape key closes the tour while open", () => {
    useProductFinder.setState({ tourOpen: true, tourStep: 0 });
    render(<TourOverlay />);
    expect(useProductFinder.getState().tourOpen).toBe(true);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useProductFinder.getState().tourOpen).toBe(false);
  });

  // ── Auto-open effect (localStorage + signed-in user) ──────────────────────
  it("auto-opens once for a signed-in user when pf_tour_seen is unset", () => {
    localStorage.removeItem("pf_tour_seen");
    const startTour = vi.fn();
    useProductFinder.setState({ tourOpen: false, user: user("sales"), startTour });
    render(<TourOverlay />);
    expect(startTour).toHaveBeenCalledTimes(1);
  });

  it("does NOT auto-open when pf_tour_seen is already set", () => {
    localStorage.setItem("pf_tour_seen", "1");
    const startTour = vi.fn();
    useProductFinder.setState({ tourOpen: false, user: user("sales"), startTour });
    render(<TourOverlay />);
    expect(startTour).not.toHaveBeenCalled();
    localStorage.removeItem("pf_tour_seen");
  });

  it("does NOT auto-open when signed out", () => {
    localStorage.removeItem("pf_tour_seen");
    const startTour = vi.fn();
    useProductFinder.setState({ tourOpen: false, user: null, startTour });
    render(<TourOverlay />);
    expect(startTour).not.toHaveBeenCalled();
  });
});
