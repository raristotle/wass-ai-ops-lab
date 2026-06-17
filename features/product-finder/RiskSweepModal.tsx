"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";

/**
 * Proactive risk sweep (#7). Collects the rep's open quotes + cart, sends the
 * line SKUs to the server-side sweep, and shows EOL / single-source risks with a
 * suggested replacement — all deterministic ($0). An optional AI summary appears
 * when the Anthropic key is set. Reached via Ctrl/⌘-K → "Risk sweep".
 */
type Finding = {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  qty: number;
  source: string;
  riskKind: "eol" | "single-source";
  severity: number;
  detail: string;
  suggestionSku: string | null;
  rationale: string;
};

const KIND_COLOR: Record<Finding["riskKind"], string> = { eol: "#DB6B30", "single-source": "#EAAA00" };
const KIND_LABEL: Record<Finding["riskKind"], string> = { eol: "EOL", "single-source": "Single-source" };

export function RiskSweepModal() {
  const open = useProductFinder((s) => s.riskSweepOpen);
  const setOpen = useProductFinder((s) => s.setRiskSweepOpen);
  const quotes = useProductFinder((s) => s.quotes);
  const cart = useProductFinder((s) => s.cart);
  const runNlSearch = useProductFinder((s) => s.runNlSearch);
  const closeRef = useModalA11y(open, () => setOpen(false));
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function collectLines() {
    const lines: { sku: string; qty: number; source: string }[] = [];
    for (const q of quotes) {
      if (q.status === "draft" || q.status === "sent") {
        for (const l of q.lines) lines.push({ sku: l.product.sku, qty: l.qty, source: `Quote ${q.number}` });
      }
    }
    for (const { product, qty } of Object.values(cart)) lines.push({ sku: product.sku, qty, source: "Cart" });
    return lines;
  }

  async function run() {
    setSummary(null);
    const lines = collectLines();
    if (lines.length === 0) {
      setErr("No open quotes or cart lines to sweep.");
      setFindings([]);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/agents/eol-sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.slice(0, 300) }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (data && Array.isArray((data as { findings?: Finding[] }).findings)) {
        setFindings((data as { findings: Finding[] }).findings);
        setSummary(typeof (data as { summary?: unknown }).summary === "string" ? (data as { summary: string }).summary : null);
      } else setErr("Could not run the sweep.");
    } catch {
      setErr("Could not run the sweep.");
      setFindings(null);
    } finally {
      setBusy(false);
    }
  }

  function searchReplacement(sku: string) {
    setOpen(false);
    void runNlSearch(sku);
    if (typeof window !== "undefined" && window.location.pathname !== "/product-finder") router.push("/product-finder");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Risk sweep"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Risk sweep</h2>
            <p className="text-xs text-[#B7C9D3]">Scan your open quotes &amp; cart for EOL and single-source supply risks.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close risk sweep"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy}
            className="rounded bg-[#00AA13] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#009911] disabled:opacity-50"
          >
            {busy ? "Scanning…" : "Run risk sweep"}
          </button>
          {err && <span className="ml-2 text-xs text-[#DB6B30]">{err}</span>}

          {findings && (
            <div className="mt-4" aria-live="polite">
              {summary && (
                <p className="mb-3 rounded-lg border border-[#00AA13]/30 bg-[#00AA13]/5 px-3 py-2 text-xs text-[#1D252D]">{summary}</p>
              )}
              {findings.length === 0 ? (
                <p className="text-sm text-[#00573F]">No EOL or single-source risks found in your open quotes &amp; cart. ✓</p>
              ) : (
                <ul className="space-y-2">
                  {findings.map((f, i) => (
                    <li key={`${f.source}-${f.productId}-${i}`} className="rounded-lg border border-[#B7C9D3]/70 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm">
                          <b className="text-[#1D252D]">{f.sku}</b>{" "}
                          <span className="text-[#4F758B]">{f.name}</span>
                          <span className="ml-1.5 text-[10px] text-[#4F758B]">· {f.source}</span>
                        </span>
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: KIND_COLOR[f.riskKind] }}
                        >
                          {KIND_LABEL[f.riskKind]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#4F758B]">{f.rationale}</p>
                      {f.suggestionSku && (
                        <div className="mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => searchReplacement(f.suggestionSku as string)}
                            className="rounded border border-[#00573F]/50 px-2 py-0.5 text-[11px] font-medium text-[#00573F] hover:bg-[#00573F]/5"
                          >
                            Find {f.suggestionSku}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
