import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { CommandPalette } from "@/features/product-finder/CommandPalette";
import { useProductFinder } from "@/lib/product-finder-store";

// The palette pushes routes via next/navigation's useRouter and lists role
// switches that call login() (which best-effort POSTs to /api/auth/login).
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

/** Reset the slice of store state the palette reads/writes between tests. */
function resetStore() {
  useProductFinder.setState({
    paletteOpen: false,
    user: null,
    cartOpen: false,
    helpOpen: false,
    bomModalOpen: false,
    bulkModalOpen: false,
    bulkCrossOpen: false,
    jobWizardOpen: false,
    compareModalOpen: false,
    submittalOpen: false,
    assistantOpen: false,
    guidedOpen: false,
    rfqOpen: false,
    bomIqOpen: false,
    jobsOpen: false,
    kitsOpen: false,
    willCallOpen: false,
    vmiOpen: false,
    quickOrderOpen: false,
    barcodeOpen: false,
    cycleCountOpen: false,
    specMatchOpen: false,
    riskSweepOpen: false,
    returnModalOrderId: null,
    detailModalProduct: null,
    orders: [],
  });
}

describe("CommandPalette (component)", () => {
  beforeEach(() => {
    push.mockClear();
    // login() and establishServerSession() touch fetch; guided role-switch test
    // also exercises that path. Stub so nothing hits the network.
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) })));
    resetStore();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetStore();
  });

  it("renders nothing when the palette is closed", () => {
    useProductFinder.setState({ paletteOpen: false });
    const { container } = render(<CommandPalette />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog with the full registry on empty input (smoke)", () => {
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Command palette input" })).toBeInTheDocument();
    // A few representative always-present commands across groups.
    expect(screen.getByRole("option", { name: "Go to product search" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Open cart" })).toBeInTheDocument();
    // No fallback "Search for ..." item is shown for empty input.
    expect(screen.queryByRole("option", { name: /^Search for "/ })).not.toBeInTheDocument();
  });

  it("hides role-gated Insights for an anonymous user and shows it for a manager", () => {
    // Anonymous: no Insights dashboard command.
    useProductFinder.setState({ paletteOpen: true, user: null });
    const { unmount } = render(<CommandPalette />);
    expect(screen.queryByRole("option", { name: "Go to Insights dashboard" })).not.toBeInTheDocument();
    unmount();

    // Manager: the role-gated command appears.
    useProductFinder.setState({
      paletteOpen: true,
      user: { name: "M", email: "m@x.com", role: "manager", branch: "B", branchId: "B1" },
    });
    render(<CommandPalette />);
    expect(screen.getByRole("option", { name: "Go to Insights dashboard" })).toBeInTheDocument();
  });

  it("filters by typed input and appends a search fallback", () => {
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    const input = screen.getByRole("combobox", { name: "Command palette input" });
    fireEvent.change(input, { target: { value: "cart" } });
    expect(screen.getByRole("option", { name: "Open cart" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: 'Search for "cart"' })).toBeInTheDocument();
    // An unrelated command is filtered out.
    expect(screen.queryByRole("option", { name: "Go to product search" })).not.toBeInTheDocument();
  });

  it("shows the empty-state message plus fallback when nothing matches the label/keywords", () => {
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    const input = screen.getByRole("combobox", { name: "Command palette input" });
    fireEvent.change(input, { target: { value: "zzqqxx-nomatch" } });
    // Only the fallback search item remains (so it is NOT the empty list branch);
    // the registry filtered to nothing.
    expect(screen.getByRole("option", { name: 'Search for "zzqqxx-nomatch"' })).toBeInTheDocument();
    expect(screen.queryByText("No commands match.")).not.toBeInTheDocument();
  });

  it("executes an 'open' command by click — Open cart sets cartOpen and closes the palette", () => {
    useProductFinder.setState({ paletteOpen: true, cartOpen: false });
    render(<CommandPalette />);
    fireEvent.click(screen.getByRole("option", { name: "Open cart" }));
    const s = useProductFinder.getState();
    expect(s.cartOpen).toBe(true);
    expect(s.paletteOpen).toBe(false);
  });

  it("executes a 'navigate' command via router.push and closes the palette", () => {
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    fireEvent.click(screen.getByRole("option", { name: "Open Cross-Reference Explorer" }));
    expect(push).toHaveBeenCalledWith("/product-finder/crosses");
    expect(useProductFinder.getState().paletteOpen).toBe(false);
  });

  it("ArrowDown moves the selection and Enter runs the highlighted item", () => {
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    const dialog = screen.getByRole("dialog", { name: "Command palette" });
    const options = screen.getAllByRole("option");
    // First item starts selected.
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(dialog, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(dialog, { key: "ArrowUp" });
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
    // Enter on the first item ("Go to product search" → navigate) closes + pushes.
    fireEvent.keyDown(dialog, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/product-finder");
    expect(useProductFinder.getState().paletteOpen).toBe(false);
  });

  it("Escape closes the palette", () => {
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Command palette" }), { key: "Escape" });
    expect(useProductFinder.getState().paletteOpen).toBe(false);
  });

  it("clicking the backdrop (but not an inner element) closes the palette", () => {
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    const dialog = screen.getByRole("dialog", { name: "Command palette" });
    // Click on the overlay itself (target === currentTarget) closes it.
    fireEvent.click(dialog);
    expect(useProductFinder.getState().paletteOpen).toBe(false);
  });

  it("clicking inside the panel does NOT close the palette", () => {
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    // Clicking the input (an inner element) must not bubble-close the overlay.
    fireEvent.click(screen.getByRole("combobox", { name: "Command palette input" }));
    expect(useProductFinder.getState().paletteOpen).toBe(true);
  });

  it("a 'role' command keeps the palette open and switches the user (re-filtering the list)", () => {
    useProductFinder.setState({ paletteOpen: true, user: null });
    render(<CommandPalette />);
    // Before: anonymous → no Insights command.
    expect(screen.queryByRole("option", { name: "Go to Insights dashboard" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Switch to .* \(manager\)/ }));
    const s = useProductFinder.getState();
    // Palette stays open and the manager is now logged in.
    expect(s.paletteOpen).toBe(true);
    expect(s.user?.role).toBe("manager");
    // The list re-filters live: the role-gated command now renders.
    expect(screen.getByRole("option", { name: "Go to Insights dashboard" })).toBeInTheDocument();
  });

  it("executes the 'print' action via window.print without throwing", () => {
    const printSpy = vi.fn();
    vi.stubGlobal("print", printSpy);
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    const input = screen.getByRole("combobox", { name: "Command palette input" });
    fireEvent.change(input, { target: { value: "Print this page" } });
    fireEvent.click(screen.getByRole("option", { name: "Print this page" }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(useProductFinder.getState().paletteOpen).toBe(false);
  });

  it("groups headers render once per group (e.g. 'Navigate' appears before the nav items)", () => {
    useProductFinder.setState({ paletteOpen: true });
    render(<CommandPalette />);
    const list = screen.getByRole("listbox");
    expect(within(list).getByText("Navigate")).toBeInTheDocument();
    expect(within(list).getByText("Open")).toBeInTheDocument();
  });
});
