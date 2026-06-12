"use client";

import { useEffect, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { apiGetProduct } from "@/lib/product-finder-api";
import type { CatalogProduct, ProductDetail } from "@/features/product-finder/types";
import type { VerifiedCrossResult } from "@/lib/catalog/verified-crosses";
import type { BrandNode } from "@/lib/catalog/brand-hierarchy";

/**
 * Source-backed cross-references for verified/curated products. Every row is
 * a documented cross (manufacturer cross tool, datasheet, or published cross
 * table) with its source linked — nothing here is similarity-generated, and
 * only ≥95-confidence results reach this panel.
 */
export function VerifiedCrossPanel({ product }: { product: CatalogProduct }) {
  const addToCart = useProductFinder((s) => s.addToCart);
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);

  const [crosses, setCrosses] = useState<VerifiedCrossResult[] | null>(null);
  const [hierarchy, setHierarchy] = useState<BrandNode | null>(null);

  useEffect(() => {
    if (product.dataSource !== "verified" && product.dataSource !== "curated") {
      setCrosses([]);
      return;
    }
    let cancelled = false;
    apiGetProduct(product.id)
      .then((detail: ProductDetail) => {
        if (cancelled) return;
        setCrosses(detail.verifiedCrosses ?? []);
        setHierarchy(detail.brandHierarchy ?? null);
      })
      .catch(() => {
        if (!cancelled) setCrosses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id, product.dataSource]);

  const showHierarchy = hierarchy && hierarchy.parentCompany.toLowerCase() !== product.brand.toLowerCase();
  if ((crosses === null || crosses.length === 0) && !showHierarchy) return null;

  return (
    <div className="rounded-lg border border-[#00573F]/40 bg-[#00573F]/5 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[#00573F]">
          Verified cross-references
        </p>
        <span className="text-[9px] italic text-[#4F758B]">
          source-backed · ≥95% confidence ·{" "}
          <a
            href="/product-finder/crosses"
            target="_blank"
            rel="noopener noreferrer"
            className="not-italic font-semibold text-[#004986] underline underline-offset-2"
          >
            browse all
          </a>
        </span>
      </div>

      {showHierarchy && (
        <p className="mb-2 text-[11px] text-[#1D252D]">
          {hierarchy.brand}
          {hierarchy.division ? ` (${hierarchy.division})` : ""} is part of{" "}
          <span className="font-semibold">{hierarchy.parentCompany}</span>{" "}
          <a
            href={hierarchy.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#004986] underline underline-offset-2"
          >
            source
          </a>
        </p>
      )}

      {crosses && crosses.length > 0 && (
        <ul className="space-y-2">
          {crosses.map((c) => (
            <li key={`${c.substituteBrand}-${c.substituteSku}`} className="rounded border border-[#00573F]/20 bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1D252D]">
                    {c.substituteBrand} {c.substituteSku}
                  </p>
                  <p className="text-[10px] text-[#4F758B]">{c.matchReason}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#00573F] px-2 py-0.5 text-[10px] font-bold text-white">
                  {c.confidence.toFixed(0)}%
                </span>
                {c.substituteProduct ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDetailModalProduct(c.substituteProduct)}
                      className="shrink-0 rounded border border-[#4F758B] px-2 py-1 text-[10px] font-medium text-[#4F758B] hover:border-[#1D252D] hover:text-[#1D252D]"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => addToCart(c.substituteProduct as CatalogProduct, 1)}
                      className="shrink-0 rounded bg-[#00AA13] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#009911]"
                    >
                      + Add
                    </button>
                  </>
                ) : (
                  <span className="shrink-0 text-[9px] uppercase tracking-wide text-[#EAAA00]">not stocked</span>
                )}
              </div>
              {c.matchingAttributes.length > 0 && (
                <p className="mt-1 text-[10px] text-[#00573F]">
                  ✓ matches: {c.matchingAttributes.join(", ")}
                </p>
              )}
              {c.statedAttributes && !c.substituteProduct && (
                <p className="mt-0.5 text-[10px] text-[#4F758B]">
                  Source states:{" "}
                  {Object.entries(c.statedAttributes)
                    .map(([n, v]) => `${n} ${v}`)
                    .join(" · ")}
                </p>
              )}
              {c.warnings.map((w, i) => (
                <p key={i} className="mt-0.5 text-[10px] text-[#DB6B30]">⚠ {w}</p>
              ))}
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[10px] text-[#004986] underline underline-offset-2"
              >
                View source document ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
