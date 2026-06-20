import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { IngestStatus, IngestRunResult } from "@/lib/product-finder-api";

const { apiIngestStatus, apiIngestRun } = vi.hoisted(() => ({
  apiIngestStatus: vi.fn<() => Promise<IngestStatus>>(),
  apiIngestRun: vi.fn<() => Promise<IngestRunResult>>(),
}));
vi.mock("@/lib/product-finder-api", () => ({ apiIngestStatus, apiIngestRun }));

import { IngestionPanelModal } from "@/features/product-finder/IngestionPanelModal";
import { useProductFinder } from "@/lib/product-finder-store";

function status(over: Partial<IngestStatus> = {}): IngestStatus {
  return {
    ok: true,
    persisted: "memory",
    liveSourcesConfigured: false,
    sources: [
      {
        id: "selftest:schema-org",
        label: "Framework self-test (schema.org fixture)",
        segment: "cross-segment",
        dataTypes: ["attributes", "images", "gtin-identity"],
        license: "synthetic fixture",
        records: 1,
        lastFetchedIso: "2026-06-20T00:00:00.000Z",
      },
    ],
    recentRuns: [],
    attributeTaxonomy: [
      { key: "amperage", label: "Amperage", unit: "A" },
      { key: "voltage", label: "Voltage", unit: "V" },
    ],
    ...over,
  };
}

describe("IngestionPanelModal (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ ingestOpen: false });
    apiIngestStatus.mockReset().mockResolvedValue(status());
    apiIngestRun.mockReset();
  });
  afterEach(() => useProductFinder.setState({ ingestOpen: false }));

  it("is not rendered when closed", () => {
    const { container } = render(<IngestionPanelModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists registered sources and the $0/self-test banner when no live sources", async () => {
    useProductFinder.setState({ ingestOpen: true });
    render(<IngestionPanelModal />);
    expect(await screen.findByText(/Framework self-test/)).toBeInTheDocument();
    expect(screen.getByText(/never touch the network/)).toBeInTheDocument();
    expect(screen.getByText(/selftest:schema-org/)).toBeInTheDocument();
  });

  it("runs all sources and shows the headline + per-source report", async () => {
    apiIngestRun.mockResolvedValue({
      ok: true,
      persisted: "memory",
      headline: "Ran 1 source → 1 new + 0 changed record(s) gated in.",
      reports: [
        {
          adapterId: "selftest:schema-org",
          label: "Framework self-test (schema.org fixture)",
          runAtIso: "2026-06-20T00:00:00.000Z",
          fetched: 1,
          parsed: 2,
          kept: 1,
          dropped: 1,
          diff: { added: 1, changed: 0, removed: 0 },
          sampleAdded: ["EX-BR120"],
          normalization: { attributesSeen: 3, attributesMapped: 3, coverage: 100 },
        },
      ],
    });
    useProductFinder.setState({ ingestOpen: true });
    render(<IngestionPanelModal />);
    fireEvent.click(await screen.findByRole("button", { name: /Run all/ }));
    await waitFor(() => expect(apiIngestRun).toHaveBeenCalled());
    expect(await screen.findByText(/1 new \+ 0 changed/)).toBeInTheDocument();
    expect(screen.getByText(/kept 1 · dropped 1.*100% canonical/)).toBeInTheDocument();
  });

  it("lists the D2 attribute backbone (canonical taxonomy) from status", async () => {
    useProductFinder.setState({ ingestOpen: true });
    render(<IngestionPanelModal />);
    expect(await screen.findByText(/Attribute backbone — 2 canonical attributes/)).toBeInTheDocument();
    expect(screen.getByText(/Amperage/)).toBeInTheDocument();
  });

  it("shows the live-sources banner when INGEST_SOURCES is configured", async () => {
    apiIngestStatus.mockResolvedValue(status({ liveSourcesConfigured: true, persisted: "postgres" }));
    useProductFinder.setState({ ingestOpen: true });
    render(<IngestionPanelModal />);
    expect(await screen.findByText(/Live external sources are configured/)).toBeInTheDocument();
    expect(screen.getByText(/durable \(Neon\)/)).toBeInTheDocument();
  });
});
