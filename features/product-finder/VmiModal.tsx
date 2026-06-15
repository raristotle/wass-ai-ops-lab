"use client";

import { useCallback, useEffect, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import type { ReorderLine, ReorderStatus } from "@/lib/product-finder-vmi";

const STATUS_COLOR: Record<ReorderStatus, { bg: string; text: string; label: string }> = {
  ok: { bg: "#00AA13", text: "#FFFFFF", label: "OK" },
  reorder: { bg: "#EAAA00", text: "#1D252D", label: "Reorder" },
  critical: { bg: "#DB6B30", text: "#FFFFFF", label: "Critical" },
};

/**
 * Vendor-managed inventory — set per-SKU min/max stocking policies and see a live
 * replenishment view: on-hand (catalog) vs projected demand (durable orders), with
 * a recommended reorder quantity. One click drafts a replenishment order through
 * the same durable /api/orders path. Server-persisted via /api/vmi.
 */
export function VmiModal() {
  const open = useProductFinder((s) => s.vmiOpen);
  const setOpen = useProductFinder((s) => s.setVmiOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const [lines, setLines] = useState<ReorderLine[]>([]);
  const [backend, setBackend] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sku, setSku] = useState("");
  const [min, setMin] = useState("10");
  const [max, setMax] = useState("40");
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vmi");
      const data = (await res.json()) as { lines?: ReorderLine[]; backend?: string };
      setLines(data.lines ?? []);
      setBackend(data.backend ?? "");
    } catch {
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  async function addPolicy() {
    const s = sku.trim();
    const lo = Number(min);
    const hi = Number(max);
    if (!s || !Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) {
      setMsg("Enter a SKU and a max ≥ min.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/vmi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: s, min: lo, max: hi }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) setMsg(data.error ?? "Could not add the policy.");
      else {
        setSku("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function deletePolicy(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/vmi?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function draftReplenishment(line: ReorderLine) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRef: `vmi-${line.sku}-${Date.now()}`,
          items: [{ sku: line.sku, qty: line.reorderQty }],
          customer: "VMI replenishment",
          source: "web",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; order?: { id: string; total: number } };
      setMsg(data.ok && data.order ? `Drafted order ${data.order.id} — ${line.reorderQty} × ${line.sku}.` : "Could not draft the order.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const needing = lines.filter((l) => l.status !== "ok").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Vendor-managed inventory"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Vendor-managed inventory</h2>
            <p className="text-xs text-[#B7C9D3]">
              Min/max stocking with auto-replenishment.{" "}
              {lines.length > 0 && (
                <span className={needing > 0 ? "text-[#EAAA00]" : "text-[#64CCC9]"}>
                  {needing > 0 ? `${needing} SKU${needing === 1 ? "" : "s"} need reorder.` : "All SKUs OK."}
                </span>
              )}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close VMI"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Add policy */}
          <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-[#B7C9D3] bg-[#F8FAFB] p-3">
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[#1D252D]">
              SKU
              <input
                className="rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="QO115"
              />
            </label>
            <label className="flex w-20 flex-col gap-1 text-xs font-medium text-[#1D252D]">
              Min
              <input
                type="number"
                min={0}
                className="rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
            </label>
            <label className="flex w-20 flex-col gap-1 text-xs font-medium text-[#1D252D]">
              Max
              <input
                type="number"
                min={1}
                className="rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => void addPolicy()}
              disabled={busy || !sku.trim()}
              className="rounded bg-[#00AA13] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#009911] disabled:opacity-50"
            >
              Set policy
            </button>
          </div>

          {msg && <p className="mb-3 rounded bg-[#004986]/10 px-3 py-1.5 text-xs text-[#004986]">{msg}</p>}

          {/* Replenishment view */}
          {loading ? (
            <p className="py-6 text-center text-sm text-[#4F758B]">Loading policies…</p>
          ) : lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#4F758B]">
              No VMI policies yet — set a min/max for a SKU above to start managing its replenishment.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {lines.map((l) => {
                const sc = STATUS_COLOR[l.status];
                return (
                  <li key={l.policyId} className="rounded-lg border border-[#B7C9D3]/70 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: sc.bg, color: sc.text }}
                      >
                        {sc.label}
                      </span>
                      <span className="flex-1 truncate text-sm font-semibold text-[#1D252D]">
                        {l.sku}
                        <span className="ml-1.5 font-normal text-[#4F758B]">{l.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => deletePolicy(l.policyId)}
                        aria-label={`Delete policy for ${l.sku}`}
                        className="text-[11px] text-[#DB6B30] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#4F758B]">
                      <span>on-hand <b className="text-[#1D252D]">{l.onHand}</b></span>
                      <span>− 30-day demand <b className="text-[#1D252D]">{l.projectedDemand}</b></span>
                      <span>= available <b className="text-[#1D252D]">{l.available}</b></span>
                      <span>· min/max {l.min}/{l.max}</span>
                      {l.status !== "ok" && (
                        <span className="ml-auto flex items-center gap-2">
                          <span className="font-semibold text-[#1D252D]">reorder {l.reorderQty}</span>
                          <button
                            type="button"
                            onClick={() => void draftReplenishment(l)}
                            disabled={busy}
                            className="rounded border border-[#00573F]/50 px-2 py-0.5 font-medium text-[#00573F] hover:bg-[#00573F]/5 disabled:opacity-50"
                          >
                            Draft replenishment order
                          </button>
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-[10px] italic text-[#4F758B]">
            Demand is summed from durable orders over the trailing 30 days; on-hand is current catalog stock.
            {backend === "memory" && " Policies are in-memory (per-instance) until a database is configured."}
          </p>
        </div>
      </div>
    </div>
  );
}
