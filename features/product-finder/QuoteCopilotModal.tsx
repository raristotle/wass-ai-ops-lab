"use client";

import { useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { parseBomLines, matchBomScored } from "@/lib/product-finder-bom";
import { suggestCorrection } from "@/lib/product-finder-suggest-correction";
import { apiSearch, apiCompanions } from "@/lib/product-finder-api";
import { emptyFilterState } from "@/lib/product-finder-url";
import {
  buildCopilotDraft,
  copilotHeadline,
  type CopilotAttachItem,
  type CopilotDraft,
} from "@/lib/product-finder-quote-copilot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CatalogProduct } from "@/features/product-finder/types";

async function searchTop3(query: string): Promise<CatalogProduct[]> {
  try {
    const res = await apiSearch({ ...emptyFilterState(), query }, 0, 3);
    return res.items;
  } catch {
    return [];
  }
}

/**
 * Quote Copilot (v5-S2 #5) — paste an RFQ / takeoff, get a draft quote where every
 * resolved line arrives pre-loaded with its cross-sell companions, so the rep
 * upsells by default. Reuses the shipped RFQ resolution (parseBomLines →
 * matchBomScored) and the S1 companion engine (per-line companions, gathered into a
 * single attach rail via /api/products/{id}/companions). The pure assembly +
 * summary live in lib/product-finder-quote-copilot.
 *
 * Deterministic + $0. An LLM step that parses messy prose RFQ emails into clean BOM
 * lines is the documented env-gated upgrade; the deterministic parser is always the
 * fallback used here.
 */
export function QuoteCopilotModal() {
  const open = useProductFinder((s) => s.copilotOpen);
  const setOpen = useProductFinder((s) => s.setCopilotOpen);
  const addToCart = useProductFinder((s) => s.addToCart);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const branchId = useProductFinder((s) => s.user?.branchId);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const [text, setText] = useState("");
  const [draft, setDraft] = useState<CopilotDraft | null>(null);
  const [busy, setBusy] = useState(false);
  // Companions the rep has chosen to attach (defaults to all required).
  const [attachIds, setAttachIds] = useState<Set<string>>(new Set());

  async function handleDraft() {
    const parsed = parseBomLines(text);
    if (parsed.length === 0) return;
    setBusy(true);
    try {
      const scored = await matchBomScored(parsed, searchTop3, suggestCorrection);
      const drafted = scored.filter((l) => l.match !== null);

      // Gather each drafted line's companions into one rail (the S1 engine).
      const rails = await Promise.all(
        drafted.map((l) => apiCompanions(l.match!.id, { branchId, k: 4 })),
      );
      const attach: CopilotAttachItem[] = rails.flat().map((c) => ({
        relation: c.relation,
        attachScore: c.attachScore,
        reasons: c.reasons,
        product: c.product,
      }));

      const built = buildCopilotDraft(scored, attach);
      setDraft(built);
      // Pre-check every required companion — the rep opts the rest in.
      setAttachIds(new Set(built.attach.filter((a) => a.relation === "required").map((a) => a.product.id)));
    } finally {
      setBusy(false);
    }
  }

  function toggleAttach(id: string) {
    setAttachIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addDraftToCart() {
    if (!draft) return;
    for (const l of draft.lines) addToCart(l.product, l.qty);
    for (const a of draft.attach) {
      if (attachIds.has(a.product.id)) addToCart(a.product as CatalogProduct, 1);
    }
    setOpen(false);
    setCartOpen(true);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quote Copilot"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Quote Copilot</h2>
            <p className="text-xs text-[#B7C9D3]">
              Paste an RFQ or takeoff — every line drafts a quote with its cross-sell companions attached.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close Quote Copilot"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Paste the RFQ, one line each, e.g.\n10 20A single pole breaker\n500ft 12awg THHN\n24 decorator switch white"}
            rows={6}
            className="w-full rounded-lg border border-[#B7C9D3] px-3 py-2 text-sm focus:border-[#00AA13] focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            <Button
              onClick={handleDraft}
              disabled={busy || text.trim().length === 0}
              className="bg-[#00AA13] text-white hover:bg-[#008f10]"
            >
              {busy ? "Drafting…" : "Draft quote + companions"}
            </Button>
            {draft && <p className="text-xs text-[#4F758B]">{copilotHeadline(draft.summary)}</p>}
          </div>

          {draft && draft.lines.length > 0 && (
            <div className="space-y-4">
              {/* Drafted lines */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
                  Draft lines ({draft.lines.length})
                </h3>
                <ul className="divide-y divide-[#B7C9D3]/40 rounded-lg border border-[#B7C9D3]/60">
                  {draft.lines.map((l, i) => (
                    <li key={`${l.product.id}-${i}`} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <span className="w-8 flex-shrink-0 tabular-nums text-[#4F758B]">{l.qty}×</span>
                      <span className="min-w-0 flex-1 truncate text-[#1D252D]">{l.product.name}</span>
                      {l.needsReview && (
                        <Badge className="flex-shrink-0 border-0 bg-[#EAAA00] px-1.5 py-0 text-[10px] text-[#1D252D]">
                          review
                        </Badge>
                      )}
                      <span className="flex-shrink-0 tabular-nums text-[#1D252D]">
                        ${(l.product.unitPrice * l.qty).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Companion attach rail */}
              {draft.attach.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
                    Attach companions ({draft.summary.requiredCompanionCount} required)
                  </h3>
                  <ul className="space-y-1">
                    {draft.attach.map((a) => (
                      <li key={a.product.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={attachIds.has(a.product.id)}
                          onChange={() => toggleAttach(a.product.id)}
                          className="h-4 w-4 accent-[#00AA13]"
                          aria-label={`Attach ${a.product.name}`}
                        />
                        <Badge
                          className={
                            "flex-shrink-0 border-0 px-1.5 py-0 text-[10px] " +
                            (a.relation === "required" ? "bg-[#00AA13] text-white" : "bg-[#64CCC9] text-[#1D252D]")
                          }
                        >
                          {a.relation === "required" ? "Required" : "Add-on"}
                        </Badge>
                        <span className="min-w-0 flex-1 truncate text-[#1D252D]">{a.product.name}</span>
                        <span className="flex-shrink-0 tabular-nums text-[#1D252D]">${a.product.unitPrice.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <Button onClick={addDraftToCart} className="w-full bg-[#00AA13] text-white hover:bg-[#008f10]">
                Add draft + {attachIds.size} companion{attachIds.size === 1 ? "" : "s"} to cart
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
