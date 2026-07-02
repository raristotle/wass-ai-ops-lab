import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { OrderHistoryStatus, CrosswalkStatus } from "@/lib/product-finder-api";

const { apiOrderHistoryStatus, apiCrosswalkStatus } = vi.hoisted(() => ({
  apiOrderHistoryStatus: vi.fn<() => Promise<OrderHistoryStatus>>(),
  apiCrosswalkStatus: vi.fn<() => Promise<CrosswalkStatus>>(),
}));
vi.mock("@/lib/product-finder-api", () => ({ apiOrderHistoryStatus, apiCrosswalkStatus }));

import { DataHubModal } from "@/features/product-finder/DataHubModal";
import { useProductFinder } from "@/lib/product-finder-store";

describe("DataHubModal (component) — B6", () => {
  beforeEach(() => {
    useProductFinder.setState({ dataHubOpen: false, crosswalkOpen: false, orderHistoryOpen: false });
    apiOrderHistoryStatus.mockReset().mockResolvedValue({ durable: true, manifest: null });
    apiCrosswalkStatus.mockReset().mockResolvedValue({ durable: true, manifest: null });
  });
  afterEach(() => useProductFinder.setState({ dataHubOpen: false }));

  it("is not rendered when closed", () => {
    const { container } = render(<DataHubModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows both import sections and the recommended crosswalk-first order", async () => {
    useProductFinder.setState({ dataHubOpen: true });
    render(<DataHubModal />);
    expect(await screen.findByRole("heading", { name: "Load your data" })).toBeInTheDocument();
    expect(screen.getByText(/Catalog crosswalk/)).toBeInTheDocument();
    expect(screen.getByText(/Order history/)).toBeInTheDocument();
    expect(screen.getByText(/Recommended order/)).toBeInTheDocument();
  });

  it("opening the crosswalk import closes the hub and opens the crosswalk modal", async () => {
    useProductFinder.setState({ dataHubOpen: true });
    render(<DataHubModal />);
    fireEvent.click(await screen.findByRole("button", { name: /Import crosswalk/ }));
    expect(useProductFinder.getState().crosswalkOpen).toBe(true);
    expect(useProductFinder.getState().dataHubOpen).toBe(false);
  });
});
