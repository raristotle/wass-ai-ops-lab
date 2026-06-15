"use client";

import { useState, type ChangeEvent } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { parseBomLines, matchBomScored, type ScoredBomLine } from "@/lib/product-finder-bom";
import { apiSearch, apiCrossMatch } from "@/lib/product-finder-api";
import { suggestCorrection } from "@/lib/product-finder-suggest-correction";
import { emptyFilterState } from "@/lib/product-finder-url";
import { quoteNumber } from "@/lib/product-finder-quote";
import { summarizeRfq, rfqDraftLines, rfqHeadline, type RfqSummary } from "@/lib/product-finder-rfq";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/features/product-finder/types";

async function searchTop3(query: string): Promise<CatalogProduct[]> {
  try {
    const res = await apiSearch({ ...emptyFilterState(), query }, 0, 3);
    return res.items;
  } catch {
    return [];
  }
}

const TIER_BADGE: Record<string, string> = {
  high: "bg-[#00AA13] text-white",
  medium: "bg-[#EAAA00] text-[#1D252D]",
  low: "bg-[#DB6B30] text-white",
};

export function RfqImportModal() {
  const open = useProductFinder((s) => s.rfqOpen);
  const setOpen = useProductFinder((s) => s.setRfqOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));
  const addToCart = useProductFinder((s) => s.addToCart);
  const saveQuote = useProductFinder((s) => s.saveQuote);
  const openCartAt = useProductFinder((s) => s.openCartAt);

  const [text, setText] = useState("");
  const [customer, setCustomer] = useState("");
  const [project, setProject] = useState("");
  const [note, setNote] = useState("");
  const [matched, setMatched] = useState<ScoredBomLine[] | null>(null);
  const [crossable, setCrossable] = useState(0);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const summary: RfqSummary | null = matched ? summarizeRfq(matched, crossable) : null;

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") setText(ev.target.result);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleMatch() {
    const parsed = parseBomLines(text);
    if (parsed.length === 0) return;
    setBusy(true);
    try {
      const results = await matchBomScored(parsed, searchTop3, suggestCorrection);
      const crosses = await apiCrossMatch(parsed.map((l) => l.query));
      setMatched(results);
      setCrossable(crosses.filter(Boolean).length);
    } finally {
      setBusy(false);
    }
  }

  function handleCreateDraft() {
    if (!matched) return;
    const draft = rfqDraftLines(matched);
    if (draft.length === 0) return;
    for (const { product, qty } of draft) addToCart(product, qty);
    saveQuote({
      number: quoteNumber(new Date()),
      customer: customer.trim() || "RFQ customer",
      project: project.trim() || "Inbound RFQ",
      status: "draft",
      now: Date.now(),
      note: note.trim() || undefined,
    });
    reset();
    setOpen(false);
    openCartAt("quotes");
  }

  function reset() {
    setText("");
    setCustomer("");
    setProject("");
    setNote("");
    setMatched(null);
    setCrossable(0);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Inbound RFQ auto-quote"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Inbound RFQ → draft quote</h2>
            <p className="text-xs text-[#B7C9D3]">Paste or upload a customer&apos;s takeoff; we draft the quote.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close RFQ"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-[#1D252D]">
              Customer
              <input
                className="rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Gulf Coast Industrial"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[#1D252D]">
              Project
              <input
                className="rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Warehouse fit-out"
              />
            </label>
          </div>

          <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-[#1D252D]">
            Bill of materials / takeoff
            <textarea
              className="h-32 rounded border border-[#B7C9D3] px-2 py-1.5 font-mono text-xs focus:border-[#00AA13] focus:outline-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"12x 20A 1-pole breaker\n5 led troffer 2x4\n10x 3/4\" EMT conduit"}
            />
          </label>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded border border-[#4F758B] px-2 py-1 text-xs text-[#4F758B] hover:bg-[#4F758B]/5">
              Upload .csv / .txt
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </label>
            <Button
              className="h-8 bg-[#004986] text-white hover:bg-[#003a6b]"
              onClick={handleMatch}
              disabled={busy || text.trim().length === 0}
            >
              {busy ? "Matching…" : "Match BOM"}
            </Button>
          </div>

          {summary && (
            <div className="mt-4 rounded-lg border border-[#B7C9D3] bg-[#F1EFE8] px-4 py-3">
              <p className="text-sm font-semibold text-[#1D252D]">{rfqHeadline(summary)}</p>
              <div className="mt-2 max-h-48 overflow-y-auto rounded border border-[#B7C9D3] bg-white">
                {matched!.map((l, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 border-b border-[#B7C9D3]/40 px-2 py-1 text-xs last:border-0">
                    <span className="min-w-0 flex-1 truncate text-[#4F758B]">
                      {l.qty}× {l.query}
                    </span>
                    {l.match ? (
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-[#1D252D]">{l.match.name}</span>
                        {l.tier && (
                          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", TIER_BADGE[l.tier])}>
                            {Math.round(l.confidence * 100)}%
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="rounded bg-[#DB6B30] px-1.5 py-0.5 text-[10px] font-semibold text-white">no match</span>
                    )}
                  </div>
                ))}
              </div>
              <Button
                className="mt-3 w-full bg-[#00AA13] text-white hover:bg-[#00880F]"
                onClick={handleCreateDraft}
                disabled={summary.draftLineCount === 0}
              >
                Create draft quote ({summary.draftLineCount} line{summary.draftLineCount === 1 ? "" : "s"})
              </Button>
            </div>
          )}

          <p className="mt-3 text-[10px] leading-snug text-[#4F758B]">
            Deterministic matching — no AI key required. With an Anthropic key configured, an LLM extraction
            step can read more unstructured formats; the rep always reviews the draft before sending.
          </p>
        </div>
      </div>
    </div>
  );
}
