"use client";

import { useEffect, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { apiIngestStatus, apiIngestRun, type IngestStatus, type IngestRunReport } from "@/lib/product-finder-api";
import { Button } from "@/components/ui/button";

/**
 * Data Ingestion admin panel (Sprint D1) — the operator face of the renewable
 * Source-Adapter framework. Lists the registered sources (the built-in self-test plus
 * any operator-declared live sources), shows each one's last snapshot size and refresh
 * time, and lets the operator RE-RUN ingestion on demand. A run does
 * fetch → parse → gate(provenance ≥95) → snapshot → diff and reports kept/dropped +
 * added/changed/removed per source.
 *
 * The default deploy registers only the network-free self-test adapter, so a run here
 * is $0 and never touches the network; live sources appear only when INGEST_SOURCES is
 * set. Auth-gated server-side; the modal is same-origin so requests carry app creds.
 */
export function IngestionPanelModal() {
  const open = useProductFinder((s) => s.ingestOpen);
  const setOpen = useProductFinder((s) => s.setIngestOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastReports, setLastReports] = useState<IngestRunReport[] | null>(null);

  // Load ingestion status whenever the panel opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void apiIngestStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function runAll(adapterIds?: string[]) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiIngestRun(adapterIds);
      if (res.error) {
        setMsg(res.error);
      } else {
        setMsg(res.headline ?? "Run complete.");
        setLastReports(res.reports ?? null);
        setStatus(await apiIngestStatus()); // refresh snapshot sizes / last-run times
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Data ingestion"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Data ingestion</h2>
            <p className="text-xs text-[#B7C9D3]">
              Renewable source adapters — fetch → parse → gate (≥95% provenance) → snapshot → diff. Re-run any time.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close data ingestion"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Live-source banner */}
          <div className="rounded-lg border border-[#B7C9D3] bg-[#F8FAFB] px-3 py-2.5 text-xs text-[#4F758B]">
            {status?.liveSourcesConfigured ? (
              <>Live external sources are configured (<code>INGEST_SOURCES</code>). Runs fetch those pages politely (≤1 req/s/host).</>
            ) : (
              <>
                Only the built-in <span className="font-semibold">self-test</span> source is active — runs are $0 and never touch the
                network. Declare live sources in <code>INGEST_SOURCES</code> to harvest real product pages.
              </>
            )}{" "}
            Persistence: {status?.persisted === "postgres" ? "durable (Neon)" : "in-memory (this instance)"}.
          </div>

          {/* Registered sources */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1D252D]">Registered sources</h3>
              <Button
                onClick={() => runAll()}
                disabled={busy}
                className="h-7 bg-[#00AA13] px-3 text-xs text-white hover:bg-[#008f10]"
              >
                {busy ? "Running…" : "Run all"}
              </Button>
            </div>
            <ul className="divide-y divide-[#EEF2F4] rounded-lg border border-[#B7C9D3]">
              {(status?.sources ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1D252D]">{s.label}</p>
                    <p className="truncate text-[11px] text-[#4F758B]">
                      <code>{s.id}</code> · {s.segment} · {s.records.toLocaleString()} records
                      {s.lastFetchedIso ? ` · last ${new Date(s.lastFetchedIso).toLocaleString()}` : " · never run"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => runAll([s.id])}
                    disabled={busy}
                    className="shrink-0 rounded-md border border-[#00AA13] px-2 py-1 text-[11px] font-medium text-[#00573F] hover:bg-[#00AA13]/10 disabled:opacity-50"
                  >
                    Run
                  </button>
                </li>
              ))}
              {(status?.sources ?? []).length === 0 && (
                <li className="px-3 py-3 text-xs text-[#4F758B]">No sources registered.</li>
              )}
            </ul>
          </div>

          {msg && <p className="rounded-md bg-[#00AA13]/5 px-3 py-2 text-sm text-[#1D252D]">{msg}</p>}

          {/* Last-run report */}
          {lastReports && lastReports.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#1D252D]">This run</h3>
              <ul className="space-y-1">
                {lastReports.map((r) => (
                  <li key={r.adapterId} className="rounded-md border border-[#EEF2F4] bg-white px-3 py-1.5 text-xs text-[#1D252D]">
                    <span className="font-medium">{r.label}</span>{" "}
                    {r.error ? (
                      <span className="text-[#DB6B30]">error: {r.error}</span>
                    ) : (
                      <span className="text-[#4F758B]">
                        kept {r.kept} · dropped {r.dropped} · +{r.diff.added} new / ~{r.diff.changed} changed / −{r.diff.removed} gone
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent run log */}
          {status && status.recentRuns.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-[#4F758B]">Recent run log ({status.recentRuns.length})</summary>
              <ul className="mt-1.5 space-y-0.5">
                {status.recentRuns.slice(0, 12).map((r, i) => (
                  <li key={i} className="text-[11px] text-[#4F758B]">
                    {new Date(r.runAtIso).toLocaleString()} · <code>{r.adapterId}</code> · kept {r.kept} · +{r.diff.added}
                    {r.error ? <span className="text-[#DB6B30]"> · {r.error}</span> : null}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
