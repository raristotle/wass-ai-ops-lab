import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuditLogCard } from "@/features/product-finder/AuditLogCard";
import type { AuditEntry, ChainVerification } from "@/lib/product-finder-audit";

// AuditLogCard fetches /api/audit on mount and /api/audit?format=csv on export.
// It reads no Zustand store; all of its branches are driven by the fetch payload,
// so the tests just stub global.fetch with the response shapes we want to exercise.

function entry(seq: number, over: Partial<AuditEntry> = {}): AuditEntry {
  return {
    seq,
    at: 1_700_000_000_000 + seq * 1000,
    actor: "user@meridian.test",
    action: "quote.sent",
    target: `Q-${seq}`,
    detail: "",
    prevHash: seq === 0 ? "" : `hash-${seq - 1}`,
    hash: `hash-${seq}`,
    ...over,
  };
}

interface AuditResponse {
  entries: AuditEntry[];
  verification: ChainVerification;
  signed: boolean;
  total: number;
}

function response(over: Partial<AuditResponse> = {}): AuditResponse {
  const entries = over.entries ?? [entry(0)];
  return {
    entries,
    verification: { valid: true, brokenAt: null, length: entries.length },
    signed: true,
    total: over.total ?? entries.length,
    ...over,
  };
}

/** Stub fetch: GET /api/audit -> JSON; GET /api/audit?format=csv -> text. */
function stubFetch(json: AuditResponse | null, opts: { ok?: boolean; csv?: string; csvOk?: boolean } = {}) {
  const fn = vi.fn(async (url: string) => {
    if (typeof url === "string" && url.includes("format=csv")) {
      return { ok: opts.csvOk ?? true, text: async () => opts.csv ?? "csv-body" };
    }
    return { ok: opts.ok ?? true, json: async () => json };
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("AuditLogCard (component)", () => {
  beforeEach(() => {
    // downloadCsv builds an <a download> and calls .click(); jsdom would try to
    // navigate the blob URL ("Not implemented: navigation"). Stub the anchor
    // click + URL object-URL helpers so the export path runs without warnings.
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders nothing until data has loaded (initial null state)", async () => {
    const fn = stubFetch(response());
    const { container } = render(<AuditLogCard />);
    // Synchronous first paint: data is still null, component returns null.
    expect(container).toBeEmptyDOMElement();
    // Let the mount fetch settle so the trailing state update is flushed in-test.
    await waitFor(() => expect(fn).toHaveBeenCalled());
    await screen.findByRole("region", { name: "Audit log" });
  });

  it("renders the verified, signed, populated card after fetch resolves", async () => {
    stubFetch(
      response({
        entries: [entry(0, { action: "order.placed", target: "O-100", detail: "net30", actor: "system" })],
        signed: true,
      }),
    );
    render(<AuditLogCard />);

    // Smoke: the labelled section is present once data arrives.
    const section = await screen.findByRole("region", { name: "Audit log" });
    expect(section).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Audit Log/ })).toBeInTheDocument();

    // Verified badge + signed-key copy.
    expect(screen.getByText("✓ Chain verified")).toBeInTheDocument();
    expect(screen.getByText(/HMAC-signed \(production key\)/)).toBeInTheDocument();

    // Singular "entry" for a single-entry chain.
    expect(screen.getByText(/1 entry/)).toBeInTheDocument();

    // The entry's action + target + actor render.
    expect(screen.getByText("order.placed")).toBeInTheDocument();
    expect(screen.getByText(/O-100/)).toBeInTheDocument();
    expect(screen.getByText(/system/)).toBeInTheDocument();
  });

  it("shows the dev-key warning and plural 'entries' when unsigned with multiple entries", async () => {
    stubFetch(
      response({
        entries: [entry(0), entry(1), entry(2)],
        signed: false,
      }),
    );
    render(<AuditLogCard />);

    await screen.findByRole("region", { name: "Audit log" });
    expect(screen.getByText(/3 entries/)).toBeInTheDocument();
    expect(screen.getByText(/dev signing key — set AUDIT_SECRET/)).toBeInTheDocument();
  });

  it("renders the broken-chain badge when verification fails", async () => {
    stubFetch(
      response({
        entries: [entry(0), entry(1)],
        verification: { valid: false, brokenAt: 1, length: 2 },
      }),
    );
    render(<AuditLogCard />);

    await screen.findByRole("region", { name: "Audit log" });
    // Badge text + title both reference the broken seq.
    expect(screen.getByText("✗ Broken @ #1")).toBeInTheDocument();
    const badge = screen.getByTitle(/Integrity check failed at entry #1/);
    expect(badge).toBeInTheDocument();
  });

  it("renders nothing when total is 0 even if a (stale) entry is present", async () => {
    const fn = stubFetch(response({ entries: [entry(0)], total: 0 }));
    const { container } = render(<AuditLogCard />);
    // Let the fetch promise settle, then confirm the card stayed empty.
    await waitFor(() => expect(fn).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the fetch response is not ok", async () => {
    const fn = stubFetch(response(), { ok: false });
    const { container } = render(<AuditLogCard />);
    await waitFor(() => expect(fn).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("caps the displayed list at 12 entries (newest first)", async () => {
    const entries = Array.from({ length: 15 }, (_, i) => entry(i, { target: `Q-${i}` }));
    stubFetch(response({ entries, total: 15 }));
    render(<AuditLogCard />);

    await screen.findByRole("region", { name: "Audit log" });
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(12);
    // Reversed for display: newest (seq 14) shown, oldest three (0,1,2) dropped.
    expect(screen.getByText("#14")).toBeInTheDocument();
    expect(screen.queryByText("#2")).not.toBeInTheDocument();
    // First rendered item is the newest seq.
    expect(items[0]).toHaveTextContent("#14");
  });

  it("falls back to an em dash when an entry has an empty target", async () => {
    stubFetch(response({ entries: [entry(0, { target: "" })] }));
    render(<AuditLogCard />);
    await screen.findByRole("region", { name: "Audit log" });
    expect(screen.getByText(/·\s*—/)).toBeInTheDocument();
  });

  it("exports the CSV chain when the Export button is clicked", async () => {
    const fn = stubFetch(response(), { csv: "Seq,Action\r\n0,quote.sent\r\n" });
    render(<AuditLogCard />);
    await screen.findByRole("region", { name: "Audit log" });

    const exportBtn = screen.getByRole("button", { name: /Export \(CSV\)/ });
    fireEvent.click(exportBtn);

    // The export issues a second fetch against the csv endpoint.
    await waitFor(() => {
      const calls = fn.mock.calls as unknown as [string][];
      expect(calls.some((c) => c[0].includes("format=csv"))).toBe(true);
    });
  });

  it("export is a no-op (no throw) when the csv fetch is not ok", async () => {
    const fn = stubFetch(response(), { csvOk: false });
    render(<AuditLogCard />);
    await screen.findByRole("region", { name: "Audit log" });

    const exportBtn = screen.getByRole("button", { name: /Export \(CSV\)/ });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      const calls = fn.mock.calls as unknown as [string][];
      expect(calls.some((c) => c[0].includes("format=csv"))).toBe(true);
    });
    // Still on screen, no crash.
    expect(screen.getByRole("region", { name: "Audit log" })).toBeInTheDocument();
  });
});
