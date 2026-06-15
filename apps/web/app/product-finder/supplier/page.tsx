"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Supplier collaboration portal — the sell-side surface. A supplier browses the
 * open RFQs the distributor has logged and submits a priced, lead-timed bid;
 * submitted bids are ranked best-first so the rep can compare. Standalone,
 * read-mostly page; persistence is the durable /api/rfq + /api/rfq-responses
 * seam (Neon when configured).
 */

type Rfq = { quoteNumber: string; lines: number; matched: number; at: number };
type RankedResponse = {
  id: string;
  rfqRef: string;
  supplier: string;
  total: number;
  leadTimeDays: number;
  rank: number;
  lines: { description: string; qty: number; unitPrice: number; leadTimeDays: number; inStock: boolean }[];
  submittedAt: number;
};
type Line = { description: string; qty: string; unitPrice: string; leadTimeDays: string; inStock: boolean };

const blankLine = (): Line => ({ description: "", qty: "1", unitPrice: "", leadTimeDays: "5", inStock: true });
const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function SupplierPortalPage() {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [supplier, setSupplier] = useState("");
  const [lines, setLines] = useState<Line[]>([blankLine()]);
  const [responses, setResponses] = useState<RankedResponse[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = (await (await fetch("/api/rfq")).json()) as { recent?: Rfq[] };
        setRfqs(data.recent ?? []);
      } catch {
        setRfqs([]);
      }
    })();
  }, []);

  const loadResponses = useCallback(async (rfqRef: string) => {
    try {
      const data = (await (await fetch(`/api/rfq-responses?rfqRef=${encodeURIComponent(rfqRef)}`)).json()) as {
        responses?: RankedResponse[];
      };
      setResponses(data.responses ?? []);
    } catch {
      setResponses([]);
    }
  }, []);

  function select(rfqRef: string) {
    setSelected(rfqRef);
    setMsg(null);
    void loadResponses(rfqRef);
  }

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    if (!selected) return;
    const parsed = lines
      .filter((l) => l.description.trim())
      .map((l) => ({
        description: l.description.trim(),
        qty: Math.max(1, Math.floor(Number(l.qty) || 1)),
        unitPrice: Math.max(0, Number(l.unitPrice) || 0),
        leadTimeDays: Math.max(0, Math.floor(Number(l.leadTimeDays) || 0)),
        inStock: l.inStock,
      }));
    if (!supplier.trim() || parsed.length === 0) {
      setMsg("Enter your company name and at least one priced line.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/rfq-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfqRef: selected, supplier: supplier.trim(), lines: parsed }),
      });
      const data = (await res.json()) as { ok?: boolean; total?: number; error?: string };
      if (!data.ok) setMsg(data.error ?? "Could not submit.");
      else {
        setMsg(`Bid submitted — ${usd(data.total ?? 0)} total. You can resubmit to revise it.`);
        setLines([blankLine()]);
        await loadResponses(selected);
      }
    } catch {
      setMsg("Network error — could not submit your bid. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between bg-[#1D252D] px-5 py-4">
        <div>
          <h1 className="text-lg font-bold text-white">Meridian — Supplier Portal</h1>
          <p className="text-xs text-[#B7C9D3]">Browse open RFQs and submit a priced bid.</p>
        </div>
        <Link href="/product-finder" className="text-xs text-[#64CCC9] underline underline-offset-2 hover:text-white">
          ← Back to Product Finder
        </Link>
      </header>

      <main className="mx-auto grid max-w-5xl gap-5 p-5 md:grid-cols-[300px_1fr]">
        {/* RFQ list */}
        <section>
          <h2 className="mb-2 text-sm font-bold text-[#1D252D]">Open RFQs</h2>
          {rfqs.length === 0 ? (
            <p className="text-xs text-[#4F758B]">
              No RFQs are open yet. (Reps log inbound RFQs from the Product Finder.)
            </p>
          ) : (
            <ul className="space-y-1.5">
              {rfqs.map((r) => (
                <li key={r.quoteNumber}>
                  <button
                    type="button"
                    onClick={() => select(r.quoteNumber)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                      selected === r.quoteNumber
                        ? "border-[#00AA13] bg-[#00AA13]/5"
                        : "border-[#B7C9D3] hover:border-[#4F758B]",
                    )}
                  >
                    <div className="font-semibold text-[#1D252D]">{r.quoteNumber}</div>
                    <div className="text-[#4F758B]">
                      {r.lines} line{r.lines === 1 ? "" : "s"} · {r.matched} matched
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bid form + ranked responses */}
        <section>
          {!selected ? (
            <p className="rounded-lg border border-dashed border-[#B7C9D3] p-6 text-center text-sm text-[#4F758B]">
              Select an RFQ to submit a bid.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#B7C9D3] p-4">
                <h2 className="mb-3 text-sm font-bold text-[#1D252D]">
                  Bid on <span className="text-[#004986]">{selected}</span>
                </h2>
                <label className="mb-3 block text-xs font-medium text-[#1D252D]">
                  Your company
                  <input
                    className="mt-1 w-full rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Gulf Coast Electrical Supply"
                  />
                </label>

                <div className="space-y-2">
                  {lines.map((l, i) => (
                    <div key={i} className="grid grid-cols-[1fr_56px_72px_64px_auto] items-end gap-1.5">
                      <label className="text-[10px] font-medium text-[#4F758B]">
                        {i === 0 && "Item"}
                        <input
                          className="mt-0.5 w-full rounded border border-[#B7C9D3] px-2 py-1 text-sm focus:border-[#00AA13] focus:outline-none"
                          value={l.description}
                          onChange={(e) => setLine(i, { description: e.target.value })}
                          placeholder="20A 1-pole breaker"
                          aria-label={`Item ${i + 1} description`}
                        />
                      </label>
                      <label className="text-[10px] font-medium text-[#4F758B]">
                        {i === 0 && "Qty"}
                        <input
                          type="number"
                          min={1}
                          className="mt-0.5 w-full rounded border border-[#B7C9D3] px-1.5 py-1 text-sm focus:border-[#00AA13] focus:outline-none"
                          value={l.qty}
                          onChange={(e) => setLine(i, { qty: e.target.value })}
                          aria-label={`Item ${i + 1} quantity`}
                        />
                      </label>
                      <label className="text-[10px] font-medium text-[#4F758B]">
                        {i === 0 && "$ / unit"}
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="mt-0.5 w-full rounded border border-[#B7C9D3] px-1.5 py-1 text-sm focus:border-[#00AA13] focus:outline-none"
                          value={l.unitPrice}
                          onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                          aria-label={`Item ${i + 1} unit price`}
                        />
                      </label>
                      <label className="text-[10px] font-medium text-[#4F758B]">
                        {i === 0 && "Lead d"}
                        <input
                          type="number"
                          min={0}
                          className="mt-0.5 w-full rounded border border-[#B7C9D3] px-1.5 py-1 text-sm focus:border-[#00AA13] focus:outline-none"
                          value={l.leadTimeDays}
                          onChange={(e) => setLine(i, { leadTimeDays: e.target.value })}
                          aria-label={`Item ${i + 1} lead time in days`}
                        />
                      </label>
                      <label className="flex items-center gap-1 pb-1.5 text-[10px] font-medium text-[#4F758B]">
                        <input
                          type="checkbox"
                          checked={l.inStock}
                          onChange={(e) => setLine(i, { inStock: e.target.checked })}
                        />
                        stock
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLines((ls) => [...ls, blankLine()])}
                    className="rounded border border-[#4F758B]/50 px-2 py-1 text-xs font-medium text-[#4F758B] hover:border-[#1D252D] hover:text-[#1D252D]"
                  >
                    + Add line
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={busy}
                    className="ml-auto rounded bg-[#00AA13] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#009911] disabled:opacity-50"
                  >
                    Submit bid
                  </button>
                </div>
                {msg && <p className="mt-2 rounded bg-[#004986]/10 px-3 py-1.5 text-xs text-[#004986]">{msg}</p>}
              </div>

              {/* Ranked responses */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-[#1D252D]">
                  Submitted bids {responses.length > 0 && <span className="text-[#4F758B]">({responses.length})</span>}
                </h3>
                {responses.length === 0 ? (
                  <p className="text-xs text-[#4F758B]">No bids yet for this RFQ.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {responses.map((r) => (
                      <li
                        key={r.id}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs",
                          r.rank === 1 ? "border-[#00AA13] bg-[#00AA13]/5" : "border-[#B7C9D3]",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-bold",
                              r.rank === 1 ? "bg-[#00AA13] text-white" : "bg-[#B7C9D3] text-[#1D252D]",
                            )}
                          >
                            #{r.rank}
                          </span>
                          <span className="flex-1 truncate font-semibold text-[#1D252D]">{r.supplier}</span>
                          <span className="text-[#1D252D]">{usd(r.total)}</span>
                          <span className="text-[#4F758B]">· {r.leadTimeDays}d lead</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
