import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CrosswalkManifest, CrosswalkStatus, CrosswalkImportResult } from "@/lib/product-finder-api";
import type { CrosswalkReject, CrosswalkRejectReport } from "@/lib/catalog/crosswalk-reject";

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

function rejectReport(rows: CrosswalkReject[], over: Partial<CrosswalkRejectReport> = {}): CrosswalkRejectReport {
  return { rows, total: rows.length, truncated: false, importedAtIso: "2026-06-20T00:00:00.000Z", ...over };
}

function reject(line: number): CrosswalkReject {
  return { line, customerNumber: `WX-${line}`, sku: "NOPE", reason: "sku_not_carried", lookupKey: "NOPE", nearMatch: "" };
}

const DOWNLOAD_LABEL = /Download unresolved rows/;

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

/**
 * PF-5 — the unresolved-row triage export. The control is the ONLY route from
 * "12 unresolved" to knowing which 12, so its show/hide rule is behaviour, not polish.
 */
describe("CrosswalkImportModal — unresolved-row triage export (PF-5)", () => {
  beforeEach(() => {
    useProductFinder.setState({ crosswalkOpen: false });
    apiCrosswalkStatus.mockReset().mockResolvedValue({ durable: true, manifest: null, rejects: null });
    apiImportCrosswalk.mockReset();
    apiClearCrosswalk.mockReset().mockResolvedValue(true);
  });
  afterEach(() => useProductFinder.setState({ crosswalkOpen: false }));

  it("offers no download when the last import left nothing unresolved (empty case)", async () => {
    apiCrosswalkStatus.mockResolvedValue({ durable: true, manifest: manifest({ unresolved: 0 }), rejects: rejectReport([]) });
    useProductFinder.setState({ crosswalkOpen: true });
    render(<CrosswalkImportModal />);
    expect(await screen.findByText(/Real crosswalk active/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: DOWNLOAD_LABEL })).toBeNull();
    expect(screen.queryByText(/didn’t import/)).toBeNull();
  });

  it("shows the stored report on open, so the export survives a reload", async () => {
    apiCrosswalkStatus.mockResolvedValue({
      durable: true,
      manifest: manifest(),
      rejects: rejectReport([reject(4), reject(9)]),
    });
    useProductFinder.setState({ crosswalkOpen: true });
    render(<CrosswalkImportModal />);
    expect(await screen.findByText(/2 rows didn’t import/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: DOWNLOAD_LABEL })).toBeInTheDocument();
  });

  it("appears after an import that skipped rows, and downloads a CSV of them", async () => {
    apiImportCrosswalk.mockResolvedValue({
      ok: true,
      persisted: "postgres",
      manifest: manifest(),
      headline: "Imported 250 catalog-number mappings (1 skipped — not carried).",
      rejects: rejectReport([reject(7)]),
    });
    useProductFinder.setState({ crosswalkOpen: true });
    render(<CrosswalkImportModal />);
    fireEvent.change(await screen.findByLabelText("Crosswalk (CSV)"), { target: { value: "your number,our_sku\nWX-7,NOPE" } });
    fireEvent.click(screen.getByRole("button", { name: /Import catalog crosswalk/ }));

    const download = await screen.findByRole("button", { name: DOWNLOAD_LABEL });
    // Singular copy for a single row.
    expect(screen.getByText(/1 row didn’t import/)).toBeInTheDocument();

    // jsdom has no blob-URL plumbing and its Blob has no .text() — stub both so the
    // click's actual payload can be inspected.
    const blobs: { parts: string[]; type: string }[] = [];
    vi.stubGlobal("Blob", function FakeBlob(parts: string[], opts?: { type?: string }) {
      const rec = { parts, type: opts?.type ?? "" };
      blobs.push(rec);
      return rec;
    });
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    fireEvent.click(download);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(blobs).toHaveLength(1);
    expect(blobs[0].type).toContain("text/csv");
    // The payload is the triage CSV, not the sample or the manifest.
    expect(blobs[0].parts.join("")).toContain("Row,Customer number,SKU,Reason");
    expect(blobs[0].parts.join("")).toContain("sku_not_carried");

    // downloadTextFile revokes the URL on the next tick — let that run before the stub
    // is torn down, or the timer fires against a jsdom URL that has no revokeObjectURL.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(revokeObjectURL).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("still offers the export when the import failed outright — the worst case needs it most", async () => {
    apiImportCrosswalk.mockResolvedValue({
      error: "No crosswalk rows mapped to carried products — check the SKUs.",
      rejects: rejectReport([reject(2), reject(3), reject(4)]),
    });
    useProductFinder.setState({ crosswalkOpen: true });
    render(<CrosswalkImportModal />);
    fireEvent.change(await screen.findByLabelText("Crosswalk (CSV)"), { target: { value: "your number,our_sku\nWX-2,NOPE" } });
    fireEvent.click(screen.getByRole("button", { name: /Import catalog crosswalk/ }));

    expect(await screen.findByText(/No crosswalk rows mapped/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: DOWNLOAD_LABEL })).toBeInTheDocument();
    expect(screen.getByText(/3 rows didn’t import/)).toBeInTheDocument();
  });

  it("reports the honest total when the stored list was capped", async () => {
    apiCrosswalkStatus.mockResolvedValue({
      durable: true,
      manifest: manifest(),
      rejects: rejectReport([reject(2)], { total: 4321, truncated: true }),
    });
    useProductFinder.setState({ crosswalkOpen: true });
    render(<CrosswalkImportModal />);
    expect(await screen.findByText(/4,321 rows didn’t import/)).toBeInTheDocument();
    expect(screen.getByText(/Showing the first 1\./)).toBeInTheDocument();
  });

  it("drops the report when the crosswalk is cleared", async () => {
    apiCrosswalkStatus.mockResolvedValue({ durable: true, manifest: manifest(), rejects: rejectReport([reject(4)]) });
    useProductFinder.setState({ crosswalkOpen: true });
    render(<CrosswalkImportModal />);
    fireEvent.click(await screen.findByRole("button", { name: /Clear imported crosswalk/ }));
    await waitFor(() => expect(screen.queryByRole("button", { name: DOWNLOAD_LABEL })).toBeNull());
  });
});
