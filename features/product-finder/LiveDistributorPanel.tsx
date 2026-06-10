"use client";

import { useEffect, useState } from "react";
import type { CatalogProduct } from "@/features/product-finder/types";

interface LiveQuote {
  distributor: string;
  matchedPart: string;
  manufacturer: string;
  description: string;
  unitPrice: number | null;
  priceBreaks: { qty: number; price: number }[];
  stock: number | null;
  datasheetUrl: string | null;
  productUrl: string | null;
}

interface LiveResponse {
  enabled: boolean;
  reason?: string;
  configured?: string[];
  quotes: LiveQuote[];
  fetchedAt?: string;
}

/**
 * Live distributor data (REAL prices/stock/datasheets) for products with real
 * part numbers, via the optional Mouser/Digi-Key API seam. Renders nothing
 * when the seam is unconfigured or the SKU is simulated — the rest of the
 * modal already covers those cases honestly.
 */
export function LiveDistributorPanel({ product }: { product: CatalogProduct }) {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setData(null);
    fetch(`/api/products/${encodeURIComponent(product.id)}/live`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [product.id]);

  // Unconfigured seam or simulated SKU → stay quiet (no clutter).
  if (loading || !data?.enabled) return null;

  return (
    <div className="px-6 py-5 border-b border-[#B7C9D3]/40 print:hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#1D252D] uppercase tracking-wide">
          Live Distributor Data
        </h3>
        <span className="text-[10px] text-[#4F758B]">
          fetched {data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString() : "now"} ·{" "}
          {(data.configured ?? []).join(" + ")}
        </span>
      </div>
      {data.quotes.length === 0 ? (
        <p className="text-xs text-[#4F758B]">
          No live match for part “{product.sku}” at the configured distributors (they carry mostly
          electronic components — construction SKUs often won’t match).
        </p>
      ) : (
        <ul className="space-y-2">
          {data.quotes.map((q, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-[#B7C9D3]/60 px-3 py-2 text-sm"
            >
              <span className="font-semibold text-[#1D252D]">{q.distributor}</span>
              <span className="text-xs text-[#4F758B]">{q.matchedPart}</span>
              {q.unitPrice != null && (
                <span className="font-semibold text-[#00AA13]">${q.unitPrice.toFixed(2)}</span>
              )}
              {q.stock != null && (
                <span className="text-xs text-[#1D252D]">{q.stock.toLocaleString()} in stock</span>
              )}
              {q.datasheetUrl && (
                <a
                  href={q.datasheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#4F758B] underline"
                >
                  Datasheet
                </a>
              )}
              {q.productUrl && (
                <a
                  href={q.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#4F758B] underline"
                >
                  View at distributor
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[10px] text-[#4F758B] italic">
        Live data, fetched on demand — not stored. This is real pricing/availability from the
        distributor APIs, independent of the simulated demo inventory above.
      </p>
    </div>
  );
}
