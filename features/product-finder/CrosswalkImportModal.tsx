"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import {
  apiCrosswalkStatus,
  apiImportCrosswalk,
  apiClearCrosswalk,
  type CrosswalkManifest,
} from "@/lib/product-finder-api";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics-client";

/**
 * Customer Catalog-Number Crosswalk import (pilot data onboarding) — load the
 * customer's own item-number → product mapping so their buyers search/paste THEIR
 * numbers and resolve to carried products. Until a real crosswalk is imported, a
 * small illustrative DEMO crosswalk (e.g. "WX-100000") is active so the feature
 * demos; importing replaces it with the customer's real numbers.
 *
 * Auth-gated server-side; the modal is same-origin so it posts with the app's
 * credentials. Resolution order is always exact-SKU first, so a customer number can
 * never shadow a real SKU.
 */
export function CrosswalkImportModal() {
  const open = useProductFinder((s) => s.crosswalkOpen);
  const setOpen = useProductFinder((s) => s.setCrosswalkOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const [csv, setCsv] = useState("");
  const [customer, setCustomer] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [manifest, setManifest] = useState<CrosswalkManifest | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void apiCrosswalkStatus().then((s) => {
      if (!cancelled) setManifest(s.manifest);
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
      setMsg("Paste or upload a customer-number → sku CSV first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiImportCrosswalk(csv, customer.trim() || undefined);
      if (res.error) setMsg(res.error);
      else {
        setManifest(res.manifest ?? null);
        setMsg(res.headline ?? "Imported.");
        setCsv("");
        // B4: activation event — mapping count only, no customer identifiers.
        track("crosswalk_import", { entries: res.manifest?.entries });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    setBusy(true);
    try {
      await apiClearCrosswalk();
      setManifest(null);
      setMsg("Cleared — back to the illustrative demo crosswalk.");
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
      aria-label="Import catalog crosswalk"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Import catalog numbers</h2>
            <p className="text-xs text-[#B7C9D3]">
              Load a customer&rsquo;s own item numbers so their buyers find parts by the numbers they already use.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close import catalog numbers"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {manifest ? (
            <div className="rounded-lg border border-[#00AA13]/30 bg-[#00AA13]/5 px-3 py-2.5 text-sm">
              <p className="font-semibold text-[#1D252D]">
                Real crosswalk active{manifest.customer ? ` — ${manifest.customer}` : ""}
              </p>
              <p className="text-xs text-[#4F758B]">
                {manifest.entries.toLocaleString()} catalog-number mappings
                {manifest.unresolved ? ` · ${manifest.unresolved} skipped (not carried)` : ""}
              </p>
              <button type="button" onClick={handleClear} disabled={busy} className="mt-1.5 text-xs text-[#DB6B30] underline hover:text-[#993C1D] disabled:opacity-50">
                Clear imported crosswalk
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-[#B7C9D3] bg-[#F8FAFB] px-3 py-2.5 text-sm text-[#4F758B]">
              Running on an illustrative DEMO crosswalk (try searching <span className="font-mono">WX-100000</span>). Import the
              customer&rsquo;s real numbers to replace it.
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1D252D]" htmlFor="cw-customer">
              Customer / account label (optional)
            </label>
            <input
              id="cw-customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Gulf Coast Industrial"
              className="w-full rounded-lg border border-[#B7C9D3] px-3 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1D252D]" htmlFor="cw-csv">
                Crosswalk (CSV)
              </label>
              <label className="cursor-pointer text-xs text-[#4F758B] underline hover:text-[#1D252D]">
                Upload file
                <input type="file" accept=".csv,.tsv,.txt,text/csv" onChange={handleFile} className="hidden" />
              </label>
            </div>
            <textarea
              id="cw-csv"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={7}
              placeholder={"your number,our_sku\nWX-100023,CB-SQU-28\nWX-100024,QO115"}
              className="w-full rounded-lg border border-[#B7C9D3] px-3 py-2 font-mono text-xs focus:border-[#00AA13] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Header row required: a customer-number column + a sku column. SKUs we don&rsquo;t carry are reported, never invented.
            </p>
          </div>

          {msg && <p className="text-sm text-[#1D252D]">{msg}</p>}

          <Button onClick={handleImport} disabled={busy || csv.trim().length === 0} className="w-full bg-[#00AA13] text-white hover:bg-[#008f10]">
            {busy ? "Importing…" : "Import catalog crosswalk"}
          </Button>
        </div>
      </div>
    </div>
  );
}
