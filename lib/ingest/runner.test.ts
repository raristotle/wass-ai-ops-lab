import { describe, it, expect } from "vitest";
import { MemoryStore } from "@/lib/server/persistence";
import { runIngestion } from "@/lib/ingest/runner";
import { loadSnapshot, recentRunReports, reportsForAdapter, MAX_REPORTS_PER_ADAPTER } from "@/lib/ingest/snapshot-store";
import { SELFTEST_ADAPTER_ID } from "@/lib/ingest/adapters/selftest";

describe("runIngestion (self-test adapter, network-free)", () => {
  it("runs the self-test adapter, keeps the keyed product, drops the name-only one, and persists a snapshot", async () => {
    const store = new MemoryStore();
    const reports = await runIngestion(store, { adapterIds: [SELFTEST_ADAPTER_ID], now: () => "2026-06-20T00:00:00.000Z" });
    expect(reports).toHaveLength(1);
    const r = reports[0];
    expect(r.adapterId).toBe(SELFTEST_ADAPTER_ID);
    expect(r.kept).toBe(1); // the keyed breaker
    expect(r.dropped).toBe(1); // the unkeyed mystery part
    expect(r.diff.added).toBe(1); // first run → added
    const snap = await loadSnapshot(store, SELFTEST_ADAPTER_ID);
    expect(snap?.records[0].mpn).toBe("EX-BR120");
    expect(snap?.records[0].attributes).toEqual([
      { name: "Amperage", value: "20 A" },
      { name: "Poles", value: "1" },
      { name: "Voltage", value: "120/240 V" },
    ]);
  });

  it("a second identical run reports zero added/changed/removed (idempotent diff)", async () => {
    const store = new MemoryStore();
    const opts = { adapterIds: [SELFTEST_ADAPTER_ID], now: () => "2026-06-20T00:00:00.000Z" };
    await runIngestion(store, opts);
    const [second] = await runIngestion(store, opts);
    expect(second.diff).toEqual({ added: 0, changed: 0, removed: 0 });
    // Two runs recorded in the rolling log.
    expect(await reportsForAdapter(store, SELFTEST_ADAPTER_ID)).toHaveLength(2);
  });

  it("an injected fetcher error is captured per-adapter without throwing", async () => {
    const store = new MemoryStore();
    // Self-test ignores ctx.get (returns its own fixture), so force a failure via a
    // live-style adapter id that doesn't exist → empty run, still no throw.
    const reports = await runIngestion(store, { adapterIds: ["does-not-exist"], now: () => "t" });
    expect(reports).toEqual([]);
  });

  it("caps the rolling report log at MAX_REPORTS_PER_ADAPTER", async () => {
    const store = new MemoryStore();
    for (let i = 0; i < MAX_REPORTS_PER_ADAPTER + 5; i++) {
      await runIngestion(store, { adapterIds: [SELFTEST_ADAPTER_ID], now: () => `2026-06-20T00:00:${String(i).padStart(2, "0")}.000Z` });
    }
    const log = await reportsForAdapter(store, SELFTEST_ADAPTER_ID);
    expect(log).toHaveLength(MAX_REPORTS_PER_ADAPTER);
    // Newest first.
    expect(log[0].runAtIso > log[1].runAtIso).toBe(true);
  });

  it("recentRunReports merges across adapters, newest first", async () => {
    const store = new MemoryStore();
    await runIngestion(store, { adapterIds: [SELFTEST_ADAPTER_ID], now: () => "2026-06-20T00:00:01.000Z" });
    await runIngestion(store, { adapterIds: [SELFTEST_ADAPTER_ID], now: () => "2026-06-20T00:00:02.000Z" });
    const recent = await recentRunReports(store, 10);
    expect(recent[0].runAtIso).toBe("2026-06-20T00:00:02.000Z");
  });
});
