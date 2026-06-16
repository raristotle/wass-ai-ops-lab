"use client";

import { useEffect, useState } from "react";

/**
 * Indicative secondary-currency total for a quote. Fetches the dormant FX seam
 * (`GET /api/fx/quote`) and, when configured, renders an "≈ CA$X" line beside
 * the authoritative USD total. Renders NOTHING when the seam is dormant
 * (FX_QUOTE_CURRENCIES unset) or unavailable — so it is invisible and $0 until
 * turned on. Display-only: USD remains the authoritative price.
 */
type Rate = { currency: string; rate: number };

export function IndicativeFxTotal({ amountUsd }: { amountUsd: number }) {
  const [rates, setRates] = useState<Rate[] | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/fx/quote")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { configured?: boolean; asOf?: string; rates?: Rate[] } | null) => {
        if (!alive || !d || !d.configured || !Array.isArray(d.rates)) return;
        // Fail-closed on a malformed rate, matching the server's posture.
        const clean = d.rates.filter(
          (r) => r && typeof r.currency === "string" && typeof r.rate === "number" && Number.isFinite(r.rate) && r.rate > 0,
        );
        if (clean.length === 0) return;
        setRates(clean);
        setAsOf(typeof d.asOf === "string" ? d.asOf : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!rates || rates.length === 0) return null;

  const fmt = (currency: string, value: number) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-[#004986]/30 bg-[#004986]/5 px-3 py-2" aria-live="polite">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#004986]">
        Indicative total in other currencies
      </p>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {rates.map((r) => (
          <span key={r.currency} className="text-sm text-[#1D252D]">
            &#8776; {fmt(r.currency, amountUsd * r.rate)}
          </span>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-[#4F758B]">
        USD is the authoritative price. Indicative only, for reference{asOf ? `, ECB rates as of ${asOf}` : ""}.
      </p>
    </div>
  );
}
