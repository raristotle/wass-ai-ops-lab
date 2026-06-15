"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { commodityIndex, type CommodityQuote } from "@/lib/product-finder-commodity";

function TrendArrow({ quote }: { quote: CommodityQuote }) {
  if (quote.trend === "flat") return <span className="text-[#4F758B]" aria-label="flat">→</span>;
  if (quote.trend === "up") return <span className="text-[#DB6B30]" aria-label="up">▲</span>;
  return <span className="text-[#00AA13]" aria-label="down">▼</span>;
}

/**
 * Slim commodity-index strip on the landing view. Advisory only (catalog
 * pricing itself is unchanged). With FRED_API_KEY set it shows REAL copper/
 * aluminum prices (per request, never stored); otherwise it falls back to the
 * deterministic simulation. Copper trending up drives a wire-&-cable nudge.
 */
export function CommodityStrip() {
  const runNlSearch = useProductFinder((s) => s.runNlSearch);

  // Read the clock after mount so SSR and the first client render match.
  const [now, setNow] = useState<number | null>(null);
  const [live, setLive] = useState<{ quotes: CommodityQuote[]; source: string; asOf?: string } | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  // Try the live FRED feed; silently stay on simulation if it's not configured.
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/commodity")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { enabled?: boolean; source?: string; quotes?: (CommodityQuote & { asOf?: string })[] } | null) => {
        if (cancelled || !data?.enabled || !data.quotes?.length) return;
        setLive({ quotes: data.quotes, source: data.source ?? "live feed", asOf: data.quotes[0]?.asOf });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const simulated = useMemo(() => (now === null ? [] : commodityIndex(now)), [now]);
  const index = live ? live.quotes : simulated;
  const copper = index.find((q) => q.id === "copper");

  if (index.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-[#B7C9D3] bg-[#1D252D] px-3 py-2"
      data-tour="commodity"
      aria-label={live ? "Commodity index (live)" : "Commodity index (simulated)"}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#B7C9D3]">
        📈 Metals index
      </span>

      {index.map((q) => (
        <span key={q.id} className="flex items-center gap-1.5 text-xs text-white">
          <span className="font-semibold">{q.label}</span>
          <span>
            ${q.price.toFixed(2)}
            <span className="ml-0.5 text-[10px] text-[#B7C9D3]">{q.unit}</span>
          </span>
          <TrendArrow quote={q} />
          <span className="text-[10px] text-[#B7C9D3]">
            {q.change30d > 0 ? "+" : ""}
            {q.change30d.toFixed(1)}% 30d
          </span>
        </span>
      ))}

      {/* Copper nudge — wire & cable pricing follows copper */}
      {copper && copper.trend === "up" && (
        <button
          type="button"
          onClick={() => runNlSearch("wire & cable")}
          className="text-xs font-semibold text-[#EAAA00] underline underline-offset-2 hover:text-white"
        >
          Copper trending up — quote wire &amp; cable now to lock 30-day pricing
        </button>
      )}
      {copper && copper.trend === "down" && (
        <span className="text-xs text-[#64CCC9]">
          Copper easing — good window for wire &amp; cable buys
        </span>
      )}

      <span className="ml-auto text-[9px] italic text-[#4F758B]">
        {live ? `${live.source}${live.asOf ? ` · as of ${live.asOf}` : ""}` : "simulated index"}
      </span>
    </div>
  );
}
