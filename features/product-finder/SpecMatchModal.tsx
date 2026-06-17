"use client";

import { useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Spec-to-product matching agent (#20). Paste a free-text engineering spec; the
 * server parses it, retrieves candidates, and returns a pass/fail spec table +
 * compliance flags (always free) plus an optional one-line AI summary (when the
 * Anthropic key is set). Reached via Ctrl/⌘-K → "Spec match".
 */
type Check = { attr: string; required: string; actual: string | null; pass: boolean };
type Requirement = { attr: string; op: string; value: string };
type Match = {
  product: CatalogProduct;
  checks: Check[];
  passCount: number;
  total: number;
  allPass: boolean;
  complianceFlags: string[];
};
type SpecResult = { requirements: Requirement[]; matches: Match[]; summary: string | null };

export function SpecMatchModal() {
  const open = useProductFinder((s) => s.specMatchOpen);
  const setOpen = useProductFinder((s) => s.setSpecMatchOpen);
  const addToCart = useProductFinder((s) => s.addToCart);
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const [spec, setSpec] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SpecResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (!spec.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/spec-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (data && Array.isArray((data as SpecResult).matches)) setResult(data as SpecResult);
      else setErr("Could not match that spec — try again or rephrase.");
    } catch {
      setErr("Could not match that spec — try again.");
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
      aria-label="Spec match"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Spec match</h2>
            <p className="text-xs text-[#B7C9D3]">Paste an engineering spec — get ranked compliant SKUs with a pass/fail table.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close spec match"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          <label htmlFor="spec-input" className="mb-1 block text-xs font-medium text-[#1D252D]">
            Specification
          </label>
          <textarea
            id="spec-input"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            rows={2}
            placeholder="e.g. NEMA 4X disconnect, 60A, 480V 3-phase, SCCR ≥ 65kA"
            className="w-full rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={!spec.trim() || busy}
              className="rounded bg-[#00AA13] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#009911] disabled:opacity-50"
            >
              {busy ? "Matching…" : "Match"}
            </button>
            {err && <span className="text-xs text-[#DB6B30]">{err}</span>}
          </div>

          {result && (
            <div className="mt-4" aria-live="polite">
              {result.requirements.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {result.requirements.map((r) => (
                    <span key={r.attr} className="rounded-full bg-[#004986]/10 px-2 py-0.5 text-[11px] text-[#004986]">
                      {r.attr} {r.op} {r.value}
                    </span>
                  ))}
                </div>
              )}
              {result.summary && (
                <p className="mb-3 rounded-lg border border-[#00AA13]/30 bg-[#00AA13]/5 px-3 py-2 text-xs text-[#1D252D]">{result.summary}</p>
              )}
              <ul className="space-y-2">
                {result.matches.map((m) => (
                  <li key={m.product.id} className="rounded-lg border border-[#B7C9D3]/70 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailModalProduct(m.product)}
                        className="truncate text-left text-sm"
                      >
                        <b className="text-[#1D252D]">{m.product.sku}</b>{" "}
                        <span className="text-[#4F758B]">{m.product.name}</span>
                      </button>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white ${m.allPass ? "bg-[#00573F]" : "bg-[#DB6B30]"}`}
                      >
                        {m.passCount}/{m.total} pass
                      </span>
                    </div>
                    {m.total > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.checks.map((c) => (
                          <span
                            key={c.attr}
                            title={`${c.attr}: needs ${c.required}, has ${c.actual ?? "—"}`}
                            className={`rounded px-1.5 py-0.5 text-[10px] ${c.pass ? "bg-[#00AA13]/10 text-[#00573F]" : "bg-[#DB6B30]/10 text-[#993C1D]"}`}
                          >
                            {c.pass ? "✓" : "✗"} {c.attr}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.complianceFlags.length > 0 && (
                      <p className="mt-1 text-[10px] text-[#993C1D]">⚠ {m.complianceFlags.join(" · ")}</p>
                    )}
                    <div className="mt-1.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => addToCart(m.product, 1)}
                        className="rounded bg-[#1D252D] px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#2d3740]"
                      >
                        + Add
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
