/**
 * Durable persistence for the ingestion framework (Sprint D1).
 *
 * Two things survive a run so the process is RENEWABLE — a later re-run can diff
 * against the last pull and an operator can audit what changed:
 *   • the latest gated SNAPSHOT per adapter  (namespace ingest:snapshot, key=adapterId)
 *   • a rolling log of RUN REPORTS per adapter (namespace ingest:reports,  key=adapterId)
 *
 * The store is injected (already tenant-scoped by the caller via forTenant), so the
 * same code path works on the in-memory default and on Neon Postgres with no change.
 * Reports are capped to the most recent {@link MAX_REPORTS_PER_ADAPTER} so the log
 * can't grow unbounded.
 */

import type { KvStore } from "@/lib/server/persistence";
import { mutate } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import type { RunReport, SourceSnapshot } from "@/lib/ingest/source-adapter";

const SNAPSHOT_NS = "ingest:snapshot";
const REPORTS_NS = "ingest:reports";

/** Keep at most this many run reports per adapter (newest first). */
export const MAX_REPORTS_PER_ADAPTER = 25;

/** Load the last persisted snapshot for an adapter, or null on a first run. */
export async function loadSnapshot(store: KvStore, adapterId: string): Promise<SourceSnapshot | null> {
  return store.get<SourceSnapshot>(SNAPSHOT_NS, adapterId);
}

/** Persist the latest gated snapshot for an adapter (overwrites the prior one). */
export async function saveSnapshot(store: KvStore, snapshot: SourceSnapshot): Promise<void> {
  await store.put(SNAPSHOT_NS, snapshot.adapterId, snapshot);
}

/**
 * Append a run report to the adapter's rolling log (newest first, capped). Uses
 * compare-and-set via `mutate` so concurrent runs of different adapters — or a
 * retried run — can't clobber each other's history. The log is best-effort telemetry:
 * if two concurrent runs of the SAME adapter exhaust the CAS retries, we log and move on
 * rather than fail an otherwise-successful ingestion run.
 */
export async function recordRunReport(store: KvStore, report: RunReport): Promise<void> {
  try {
    await mutate<RunReport[]>(store, REPORTS_NS, report.adapterId, (current) => {
      const next = [report, ...(current ?? [])];
      return next.slice(0, MAX_REPORTS_PER_ADAPTER);
    });
  } catch (e) {
    logApiError("ingest:recordRunReport", e, { adapterId: report.adapterId });
  }
}

/** The rolling report log for one adapter (newest first), or [] if it never ran. */
export async function reportsForAdapter(store: KvStore, adapterId: string): Promise<RunReport[]> {
  return (await store.get<RunReport[]>(REPORTS_NS, adapterId)) ?? [];
}

/**
 * Recent run reports across all adapters, newest first, capped at `limit`. Used by
 * the status endpoint / admin UI. Reads every adapter's rolling log and merges.
 */
export async function recentRunReports(store: KvStore, limit = 50): Promise<RunReport[]> {
  const logs = await store.list<RunReport[]>(REPORTS_NS);
  const flat = logs.flat();
  flat.sort((a, b) => (a.runAtIso < b.runAtIso ? 1 : a.runAtIso > b.runAtIso ? -1 : 0));
  return flat.slice(0, limit);
}
