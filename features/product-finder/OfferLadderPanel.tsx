"use client";

import { useEffect, useState } from "react";
import type { CatalogProduct } from "@/features/product-finder/types";
import { priceCurve, type Offer, type OfferBreak } from "@/lib/product-finder-offers";

interface OffersResponse {
  productId: string;
  realPart: boolean;
  ladder: Offer[];
  best: Offer | null;
  sourceCount: number;
  lanes: Record<string, string>;
  fetchedAt: string;
}

/** Mini quantity-break price curve for the best offer (renders nothing under 2 breaks). */
function PriceCurve({ breaks }: { breaks: OfferBreak[] }) {
  const pts = priceCurve(breaks);
  if (pts.length < 2) return null;
  const w = 140;
  const h = 36;
  const pad = 5;
  const prices = pts.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const coords = pts.map((p, i) => ({
    x: pad + (i / (pts.length - 1)) * (w - 2 * pad),
    y: pad + (1 - (p.price - min) / span) * (h - 2 * pad),
    qty: p.qty,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`Volume price curve: ${pts.map((p) => `${p.qty}+ at $${p.price.toFixed(2)}`).join(", ")}`}
      className="shrink-0"
    >
      <path d={path} fill="none" stroke="#00AA13" strokeWidth={1.5} />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={2} fill="#00AA13" />
      ))}
    </svg>
  );
}

/**
 * Aggregated offer ladder (v3-S5 #12) — the internal Meridian offer plus every
 * CONFIGURED external source (live Mouser/Digi-Key, ECIA TrustedParts, OEMsecrets)
 * stacked into one ranked seller/stock/lead/price table with a qty-break price
 * curve. Dormant by default: with no external keys set, the API returns just the
 * Meridian offer and makes zero outbound calls, so this shows the internal volume
 * ladder and a note that more sources appear once enabled.
 */
export function OfferLadderPanel({ product }: { product: CatalogProduct }) {
  const [data, setData] = useState<OffersResponse | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    fetch(`/api/products/${encodeURIComponent(product.id)}/offers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [product.id]);

  if (!data || data.ladder.length === 0) return null;

  const externalConfigured = ["live", "ecia", "oemsecrets"].some((k) => k in data.lanes);

  return (
    <div className="px-6 py-5 border-b border-[#B7C9D3]/40 print:hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#1D252D] uppercase tracking-wide">
          Offer Ladder
        </h3>
        <span className="text-[10px] text-[#4F758B]">
          {data.sourceCount} source{data.sourceCount === 1 ? "" : "s"}
          {data.best?.priceBreaks && data.best.priceBreaks.length > 1 ? " · volume curve" : ""}
        </span>
      </div>

      <ul className="space-y-1.5">
        {data.ladder.map((o, i) => {
          const isBest = i === 0;
          return (
            <li
              key={`${o.source}-${i}`}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded border px-3 py-2 text-sm ${
                isBest ? "border-[#00AA13]/60 bg-[#00AA13]/5" : "border-[#B7C9D3]/60"
              }`}
            >
              {isBest && (
                <span className="rounded bg-[#00AA13] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                  Best
                </span>
              )}
              <span className="font-semibold text-[#1D252D]">{o.source}</span>
              {o.authorized && (
                <span className="rounded bg-[#004986]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#004986]">
                  Authorized
                </span>
              )}
              {o.unitPrice != null ? (
                <span className={`font-semibold ${isBest ? "text-[#00AA13]" : "text-[#1D252D]"}`}>
                  ${o.unitPrice.toFixed(2)}
                </span>
              ) : (
                <span className="text-xs italic text-[#4F758B]">price on request</span>
              )}
              {o.stock != null && (
                <span className="text-xs text-[#1D252D]">{o.stock.toLocaleString()} in stock</span>
              )}
              {o.leadDays != null && o.leadDays > 0 && (
                <span className="text-xs text-[#4F758B]">{o.leadDays}-day lead</span>
              )}
              {isBest && <PriceCurve breaks={o.priceBreaks} />}
              {o.url && (
                <a
                  href={o.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-xs font-semibold text-[#4F758B] underline"
                >
                  View
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-[10px] text-[#4F758B] italic">
        {externalConfigured
          ? "Live, fetched on demand — not stored. External sources are real pricing/availability, independent of the simulated demo inventory above."
          : "Showing the Meridian volume ladder. Authorized-distributor and aggregator offers (Mouser/Digi-Key, ECIA TrustedParts, OEMsecrets) stack in here once their API keys are set."}
      </p>
    </div>
  );
}
