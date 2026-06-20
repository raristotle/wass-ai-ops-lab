"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCompanions } from "@/lib/product-finder-api";
import { useProductFinder } from "@/lib/product-finder-store";
import { upgradeDeltaCompanions, pickUpgrade, type UpgradeCompanion } from "@/lib/product-finder-upgrade";
import { Badge } from "@/components/ui/badge";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Compare → complete-the-upgrade (v5-S3 #14) — on the compare modal, once the rep is
 * trading up to a richer SKU, show the companions that UPGRADE adds over the products
 * being compared (a GFCI's weather cover, a smart breaker's neutral kit), so they
 * attach exactly what the upgrade needs — not what they already had.
 *
 * Self-contained: picks the upgrade (priciest of the compared set), fetches its S1
 * companions, and subtracts the families already represented among the compared
 * products. Renders nothing for a single product or when the upgrade adds nothing new.
 */
export function UpgradeCompletePanel({ products, branchId }: { products: CatalogProduct[]; branchId?: string }) {
  const addToCart = useProductFinder((s) => s.addToCart);
  const upgrade = useMemo(() => pickUpgrade(products), [products]);
  const comparedSubcats = useMemo(() => products.map((p) => p.subcategory), [products]);

  const [companions, setCompanions] = useState<UpgradeCompanion[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!upgrade || products.length < 2) {
      setCompanions([]);
      return;
    }
    void apiCompanions(upgrade.id, { branchId, k: 8 }).then((res) => {
      if (!cancelled) {
        setCompanions(
          res.map((c) => ({ relation: c.relation, attachScore: c.attachScore, reasons: c.reasons, product: c.product })),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [upgrade, products.length, branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const delta = useMemo(() => upgradeDeltaCompanions(companions, comparedSubcats), [companions, comparedSubcats]);

  if (!upgrade || products.length < 2 || delta.length === 0) return null;

  return (
    <div className="print:hidden border-t border-[#B7C9D3]/60 px-6 py-4" data-testid="upgrade-complete">
      <h3 className="mb-1 text-sm font-semibold text-[#1D252D]">Complete the upgrade</h3>
      <p className="mb-3 text-xs text-[#4F758B]">
        Moving up to <span className="font-medium">{upgrade.name}</span>? It adds these companions the others didn’t need:
      </p>
      <ul className="space-y-1.5">
        {delta.map((c) => (
          <li key={c.product.id} className="flex items-center gap-2 text-sm">
            <span className="flex-shrink-0 text-lg" aria-hidden="true">
              {c.product.imageIcon ?? "•"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[#1D252D]">{c.product.name}</span>
                <Badge
                  className={
                    "flex-shrink-0 border-0 px-1.5 py-0 text-[10px] " +
                    (c.relation === "required" ? "bg-[#00AA13] text-white" : "bg-[#64CCC9] text-[#1D252D]")
                  }
                >
                  {c.relation === "required" ? "Required" : "Add-on"}
                </Badge>
              </div>
              <p className="truncate text-xs text-[#4F758B]">{c.product.subcategory}</p>
            </div>
            <span className="flex-shrink-0 tabular-nums text-sm font-semibold text-[#1D252D]">
              ${c.product.unitPrice.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => addToCart(c.product as CatalogProduct)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#00AA13] text-lg leading-none text-white hover:bg-[#008f10]"
              aria-label={`Add ${c.product.name} to basket`}
            >
              +
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
