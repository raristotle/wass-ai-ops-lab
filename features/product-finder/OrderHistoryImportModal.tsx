"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import {
  apiOrderHistoryStatus,
  apiImportOrderHistory,
  apiClearOrderHistory,
  type OrderHistoryManifest,
} from "@/lib/product-finder-api";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics-client";

/**
 * Order History Import (pilot data onboarding) — the single highest-leverage data
 * action: paste/upload a customer's historical order export (CSV) and the app mines
 * real co-purchase rules that wake the cross-sell rail's behavioral signal. Until an
 * import lands, the rail runs on the deterministic spec-rule + affinity backbone;
 * after, it blends in genuine "bought-together" lift from real orders.
 *
 * Auth-gated server-side (operator action); the modal is same-origin so the import
 * posts with the app's own credentials. Shows the current import manifest on open and
 * the mining summary after an import.
 */
export function OrderHistoryImportModal() {
  const open = useProductFinder((s) => s.orderHistoryOpen);
  const setOpen = useProductFinder((s) => s.setOrderHistoryOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const [csv, setCsv] = useState("");
  const [customer, setCustomer] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [manifest, setManifest] = useState<OrderHistoryManifest | null>(null);
  const [durable, setDurable] = useState(false);

  // Load the current import status whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void apiOrderHistoryStatus().then((s) => {
      if (cancelled) return;
      setManifest(s.manifest);
      setDurable(s.durable);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") setCsv(ev.target.result);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImport() {
    if (!csv.trim()) {
      setMsg("Paste or upload a CSV of order lines first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiImportOrderHistory(csv, customer.trim() || undefined);
      if (res.error) {
        setMsg(res.error);
      } else {
        setManifest(res.manifest ?? null);
        setMsg(res.headline ?? "Imported.");
        setCsv("");
        // B4: activation event — counts only (orders / resolved lines), no customer identifiers.
        track("order_history_import", { orders: res.manifest?.orders, resolved: res.manifest?.resolved });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    setBusy(true);
    try {
      await apiClearOrderHistory();
      setManifest(null);
      setMsg("Cleared — the cross-sell rail is back to the deterministic view.");
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
      aria-label="Import order history"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Import order history</h2>
            <p className="text-xs text-[#B7C9D3]">
              Paste a customer&rsquo;s past orders (CSV) — the cross-sell rail learns real &ldquo;bought-together&rdquo; lift from them.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close import order history"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Current status */}
          {manifest ? (
            <div className="rounded-lg border border-[#00AA13]/30 bg-[#00AA13]/5 px-3 py-2.5 text-sm">
              <p className="font-semibold text-[#1D252D]">
                Behavioral signal active{manifest.customer ? ` — ${manifest.customer}` : ""}
              </p>
              <p className="text-xs text-[#4F758B]">
                {manifest.orders.toLocaleString()} orders · {manifest.resolved.toLocaleString()} matched lines ·{" "}
                {manifest.rulesMined} co-purchase rules · {durable ? "durable" : "in-memory (this instance)"}
              </p>
              {manifest.topPairs.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {manifest.topPairs.slice(0, 4).map((p, i) => (
                    <li key={i} className="text-xs text-[#1D252D]">
                      {p.a} → <span className="font-medium">{p.b}</span>{" "}
                      <span className="text-[#00573F]">{p.lift.toFixed(1)}× lift</span>{" "}
                      <span className="text-gray-400">({p.count} orders)</span>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={handleClear} disabled={busy} className="mt-1.5 text-xs text-[#DB6B30] underline hover:text-[#993C1D] disabled:opacity-50">
                Clear imported history
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-[#B7C9D3] bg-[#F8FAFB] px-3 py-2.5 text-sm text-[#4F758B]">
              No order history imported yet — the cross-sell rail is running on the deterministic spec-rule + affinity model. Import a file to add real co-purchase lift.
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1D252D]" htmlFor="oh-customer">
              Customer / account label (optional)
            </label>
            <input
              id="oh-customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Gulf Coast Industrial"
              className="w-full rounded-lg border border-[#B7C9D3] px-3 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1D252D]" htmlFor="oh-csv">
                Order lines (CSV)
              </label>
              <label className="cursor-pointer text-xs text-[#4F758B] underline hover:text-[#1D252D]">
                Upload file
                <input type="file" accept=".csv,.tsv,.txt,text/csv" onChange={handleFile} className="hidden" />
              </label>
            </div>
            <textarea
              id="oh-csv"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={7}
              placeholder={"order,sku,qty\n1001,CB-SQU-28,10\n1001,WP-1G,10\n1002,CB-SQU-28,5"}
              className="w-full rounded-lg border border-[#B7C9D3] px-3 py-2 font-mono text-xs focus:border-[#00AA13] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Header row required. Recognized columns: order/PO/invoice · sku/part/item · qty/quantity. Unmatched SKUs are reported, never guessed.
            </p>
          </div>

          {msg && <p className="text-sm text-[#1D252D]">{msg}</p>}

          <Button onClick={handleImport} disabled={busy || csv.trim().length === 0} className="w-full bg-[#00AA13] text-white hover:bg-[#008f10]">
            {busy ? "Mining…" : "Import & mine co-purchase rules"}
          </Button>
        </div>
      </div>
    </div>
  );
}
