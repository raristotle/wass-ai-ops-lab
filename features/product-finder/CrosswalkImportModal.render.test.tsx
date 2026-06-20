import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CrosswalkManifest, CrosswalkStatus, CrosswalkImportResult } from "@/lib/product-finder-api";

const { apiCrosswalkStatus, apiImportCrosswalk, apiClearCrosswalk } = vi.hoisted(() => ({
  apiCrosswalkStatus: vi.fn<() => Promise<CrosswalkStatus>>(),
  apiImportCrosswalk: vi.fn<() => Promise<CrosswalkImportResult>>(),
  apiClearCrosswalk: vi.fn<() => Promise<boolean>>(),
}));
vi.mock("@/lib/product-finder-api", () => ({ apiCrosswalkStatus, apiImportCrosswalk, apiClearCrosswalk }));

import { CrosswalkImportModal } from "@/features/product-finder/CrosswalkImportModal";
import { useProductFinder } from "@/lib/product-finder-store";

function manifest(over: Partial<CrosswalkManifest> = {}): CrosswalkManifest {
  return { version: 1, customer: "Gulf Coast Industrial", entries: 250, resolved: 250, unresolved: 5, importedAtIso: "2026-06-20T00:00:00.000Z", ...over };
}

describe("CrosswalkImportModal (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ crosswalkOpen: false });
    apiCrosswalkStatus.mockReset().mockResolvedValue({ durable: true, manifest: null });
    apiImportCrosswalk.mockReset();
    apiClearCrosswalk.mockReset().mockResolvedValue(true);
  });
  afterEach(() => useProductFinder.setState({ crosswalkOpen: false }));

  it("is not rendered when closed", () => {
    const { container } = render(<CrosswalkImportModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the demo-crosswalk state when nothing is imported", async () => {
    useProductFinder.setState({ crosswalkOpen: true });
    render(<CrosswalkImportModal />);
    expect(await screen.findByText(/illustrative DEMO crosswalk/)).toBeInTheDocument();
    expect(screen.getByText("WX-100000")).toBeInTheDocument();
  });

  it("renders the active imported manifest", async () => {
    apiCrosswalkStatus.mockResolvedValue({ durable: true, manifest: manifest() });
    useProductFinder.setState({ crosswalkOpen: true });
    render(<CrosswalkImportModal />);
    expect(await screen.findByText(/Real crosswalk active/)).toBeInTheDocument();
    expect(screen.getByText(/250 catalog-number mappings/)).toBeInTheDocument();
  });

  it("imports a crosswalk and shows the headline", async () => {
    apiImportCrosswalk.mockResolvedValue({ ok: true, persisted: "postgres", manifest: manifest(), headline: "Imported 250 catalog-number mappings. Buyers can now search their own numbers." });
    useProductFinder.setState({ crosswalkOpen: true });
    render(<CrosswalkImportModal />);
    fireEvent.change(await screen.findByLabelText("Crosswalk (CSV)"), { target: { value: "your number,our_sku\nWX-1,CB-1" } });
    fireEvent.click(screen.getByRole("button", { name: /Import catalog crosswalk/ }));
    await waitFor(() => expect(apiImportCrosswalk).toHaveBeenCalled());
    expect(await screen.findByText(/Buyers can now search their own numbers/)).toBeInTheDocument();
  });
});
