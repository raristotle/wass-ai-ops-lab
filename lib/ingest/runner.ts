/**
 * Ingestion runner (Sprint D1) — wires the registry, the polite fetcher, and the
 * snapshot store into the pure `runAdapter` orchestration.
 *
 * This is the single operator-facing entry point the API route, the MCP tool, and a
 * future BullMQ worker all call. For each selected adapter it loads the last snapshot,
 * runs fetch → parse → gate → diff, then persists the new snapshot and appends a run
 * report. The clock and fetcher are injectable so the whole thing is testable offline.
 *
 * Per the cost guardrail, NOTHING here runs on a schedule — a run happens only when an
 * operator triggers it (HTTP/MCP) or an enqueued job invokes it. No cron (per CLAUDE.md).
 */

import type { KvStore } from "@/lib/server/persistence";
import type { AdapterContext, RunReport, SourceAdapter } from "@/lib/ingest/source-adapter";
import { runAdapter } from "@/lib/ingest/source-adapter";
import { politeGet } from "@/lib/ingest/fetcher";
import { getAdapters } from "@/lib/ingest/registry";
import { loadSnapshot, recordRunReport, saveSnapshot } from "@/lib/ingest/snapshot-store";
import { normalizeRecord, attributeCoverage } from "@/lib/ingest/attribute-normalize";

export interface RunIngestionOptions {
  /** Restrict the run to these adapter ids; omit/empty = run all registered adapters. */
  adapterIds?: string[];
  /** Injected clock for deterministic tests (defaults to real time). */
  now?: () => string;
  /** Injected fetcher for tests (defaults to the polite HTTP GET). */
  get?: AdapterContext["get"];
  /** Confidence floor passed through to the gate (defaults to PRODUCTION_CONFIDENCE). */
  minConfidence?: number;
}

/**
 * Run the selected adapters end-to-end against their last snapshots and persist the
 * results. Returns one report per adapter (in registry order). A single adapter's
 * failure is captured in its report — it never aborts the batch.
 */
export async function runIngestion(store: KvStore, opts: RunIngestionOptions = {}): Promise<RunReport[]> {
  const all = getAdapters();
  const wanted = opts.adapterIds && opts.adapterIds.length ? new Set(opts.adapterIds) : null;
  const adapters: SourceAdapter[] = wanted ? all.filter((a) => wanted.has(a.id)) : all;

  const ctx: AdapterContext = {
    get: opts.get ?? ((url) => politeGet(url)),
    nowIso: opts.now ?? (() => new Date().toISOString()),
  };

  const reports: RunReport[] = [];
  for (const adapter of adapters) {
    const prev = await loadSnapshot(store, adapter.id);
    const { report, snapshot } = await runAdapter(adapter, ctx, prev, opts.minConfidence);

    let finalReport = report;
    if (snapshot) {
      // D2 attribute backbone: attach canonical normalized attributes to each kept record
      // (additive — raw `attributes` stay intact) and report normalization coverage. This
      // only ADDS a derived field, so the diff (computed on raw attributes in runAdapter)
      // is unchanged whether we normalize before or after it.
      const normalizedRecords = snapshot.records.map(normalizeRecord);
      await saveSnapshot(store, { ...snapshot, records: normalizedRecords });
      finalReport = { ...report, normalization: attributeCoverage(snapshot.records) };
    }
    await recordRunReport(store, finalReport);
    reports.push(finalReport);
  }
  return reports;
}
