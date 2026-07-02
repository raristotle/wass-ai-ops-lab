"use client";

import { useEffect, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import {
  apiOrderHistoryStatus,
  apiCrosswalkStatus,
  type OrderHistoryManifest,
  type CrosswalkManifest,
} from "@/lib/product-finder-api";
import {
  SAMPLE_ORDER_HISTORY_CSV,
  SAMPLE_CROSSWALK_CSV,
  downloadTextFile,
} from "@/lib/product-finder-samples";
import { Button } from "@/components/ui/button";

/**
 * B6 — "Load your data" hub. A single visible, named home for the two pilot
 * data-onboarding imports that were previously buried among ~24 flattened ⌘K targets.
 *
 * Shows each import's live status (rows loaded, last import) from the existing manifests,
 * recommends the correct order (crosswalk first, so a Wesco-numbered order file resolves —
 * see the B7 guard), opens either import, and offers one-click sample templates (B9) so a
 * pilot admin can try the whole flow before real data lands.
 *
 * Read-only status calls are same-origin (the app's own auth); $0.
 */
export function DataHubModal() {
  const open = useProductFinder((s) => s.dataHubOpen);
  const setOpen = useProductFinder((s) => s.setDataHubOpen);
  const setOrderHistoryOpen = useProductFinder((s) => s.setOrderHistoryOpen);
  const setCrosswalkOpen = useProductFinder((s) => s.setCrosswalkOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const [orderManifest, setOrderManifest] = useState<OrderHistoryManifest | null>(null);
  const [crosswalkManifest, setCrosswalkManifest] = useState<CrosswalkManifest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([apiOrderHistoryStatus(), apiCrosswalkStatus()]).then(([oh, cw]) => {
      if (cancelled) return;
      setOrderManifest(oh.manifest);
      setCrosswalkManifest(cw.manifest);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  function openImport(which: "order-history" | "crosswalk") {
    setOpen(false);
    if (which === "order-history") setOrderHistoryOpen(true);
    else setCrosswalkOpen(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Load your data"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Load your data</h2>
            <p className="text-xs text-[#B7C9D3]">
              Bring your own numbers and order history in — the recommender gets sharper the moment you do.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close load your data"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Recommended order — ties to the B7 crosswalk-first guard. */}
          <div className="rounded-lg border border-[#004986]/30 bg-[#004986]/5 px-3 py-2 text-xs text-[#1D252D]">
            <span className="font-semibold text-[#004986]">Recommended order:</span> load your{" "}
            <span className="font-semibold">catalog crosswalk first</span>, then your{" "}
            <span className="font-semibold">order history</span> — so an order file that uses your own catalog
            or Wesco stock numbers resolves to carried products instead of coming up empty.
          </div>

          {/* ── 1. Catalog crosswalk ─────────────────────────────────────────── */}
          <section className="rounded-lg border border-[#B7C9D3] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1D252D]">
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#004986] text-[11px] font-bold text-white">1</span>
                  Catalog crosswalk
                </p>
                <p className="mt-0.5 text-xs text-[#4F758B]">
                  Map your own item numbers / Wesco stock numbers → carried products, so buyers search the way they think.
                </p>
              </div>
              <StatusPill
                loading={loading}
                active={crosswalkManifest !== null}
                activeLabel={crosswalkManifest ? `${crosswalkManifest.entries.toLocaleString()} mappings` : ""}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Button onClick={() => openImport("crosswalk")} className="bg-[#00AA13] text-white hover:bg-[#008f10]">
                {crosswalkManifest ? "Manage crosswalk" : "Import crosswalk"}
              </Button>
              <button
                type="button"
                onClick={() => downloadTextFile("meridian-sample-crosswalk.csv", SAMPLE_CROSSWALK_CSV)}
                className="text-xs text-[#4F758B] underline hover:text-[#1D252D]"
              >
                Download sample CSV
              </button>
            </div>
          </section>

          {/* ── 2. Order history ─────────────────────────────────────────────── */}
          <section className="rounded-lg border border-[#B7C9D3] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1D252D]">
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#004986] text-[11px] font-bold text-white">2</span>
                  Order history
                </p>
                <p className="mt-0.5 text-xs text-[#4F758B]">
                  Import past orders and the cross-sell rail learns real &ldquo;bought-together&rdquo; lift from them.
                </p>
              </div>
              <StatusPill
                loading={loading}
                active={orderManifest !== null}
                activeLabel={orderManifest ? `${orderManifest.rulesMined} rules · ${orderManifest.orders.toLocaleString()} orders` : ""}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Button onClick={() => openImport("order-history")} className="bg-[#00AA13] text-white hover:bg-[#008f10]">
                {orderManifest ? "Manage order history" : "Import order history"}
              </Button>
              <button
                type="button"
                onClick={() => downloadTextFile("meridian-sample-order-history.csv", SAMPLE_ORDER_HISTORY_CSV)}
                className="text-xs text-[#4F758B] underline hover:text-[#1D252D]"
              >
                Download sample CSV
              </button>
            </div>
          </section>

          <p className="text-[11px] text-gray-400">
            Everything imported stays in your workspace. Unmatched numbers are reported, never invented. Clearing an import
            reverts the affected surfaces to the deterministic demo view.
          </p>
        </div>
      </div>
    </div>
  );
}

/** A small loaded/not-loaded status pill for a data source. */
function StatusPill({ loading, active, activeLabel }: { loading: boolean; active: boolean; activeLabel: string }) {
  if (loading) return <span className="whitespace-nowrap rounded-full bg-[#B7C9D3]/30 px-2.5 py-0.5 text-[11px] text-[#4F758B]">Checking…</span>;
  if (active)
    return (
      <span className="whitespace-nowrap rounded-full bg-[#00AA13]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#00573F]">
        ✓ {activeLabel}
      </span>
    );
  return <span className="whitespace-nowrap rounded-full bg-[#DB6B30]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#993C1D]">Not loaded</span>;
}
