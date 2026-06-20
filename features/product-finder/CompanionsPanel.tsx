"use client";

import { useEffect, useState } from "react";
import { apiCompanions, type CompanionItem } from "@/lib/product-finder-api";
import { useProductFinder, selectActiveCustomer } from "@/lib/product-finder-store";
import { contractForCustomer, isOnContract, contractPrice, type Contract } from "@/lib/product-finder-contract";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * CompanionsPanel (v5-S1) — the richer cross-sell rail on the product-detail modal.
 *
 * Unlike the legacy "Goes well with" affinity list, every row here carries:
 *   - a RELATION badge — `required` (engineering-mandatory: a switch needs a wall
 *     plate, conduit needs fittings) vs `recommended` (commonly attached);
 *   - an attach score (0-100) the engine used to rank it; and
 *   - the WHY (spec-rule / market-basket lift / affinity reasons).
 *
 * Required companions are grouped first under a "Complete the assembly" header with
 * a one-click "Add all required" CTA, so a rep never sends a quote missing the
 * mandatory parts. Data comes from GET /api/products/{id}/companions ($0, deterministic).
 */

interface Props {
  product: CatalogProduct;
  branchId?: string;
}

// Relation → badge styling. Required = Meridian Green (must-have); recommended =
// Circuit Blue (nice-to-have). Brand palette per CLAUDE.md.
const RELATION_BADGE: Record<CompanionItem["relation"], { label: string; className: string }> = {
  required: { label: "Required", className: "bg-[#00AA13] text-white" },
  recommended: { label: "Add-on", className: "bg-[#64CCC9] text-[#1D252D]" },
};

function CompanionRow({ item, contract }: { item: CompanionItem; contract: Contract | null }) {
  const addToCart = useProductFinder((s) => s.addToCart);
  const setDetailModal = useProductFinder((s) => s.setDetailModalProduct);
  const p = item.product;
  const badge = RELATION_BADGE[item.relation];
  // The single most informative reason, shown inline (full list is in the title attr).
  const primaryReason = item.reasons[0] ?? "";
  // v5-S3 #11: is this companion on the active account's contract?
  const onContract = isOnContract(p, contract);
  const cPrice = onContract ? contractPrice(p.unitPrice, p, contract) : p.unitPrice;

  return (
    <li className="flex items-center gap-3 py-2">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 rounded text-left transition-colors hover:bg-[#F8FAFB]"
        onClick={() => setDetailModal(p)}
        aria-label={`View details for ${p.name}`}
      >
        <span className="flex-shrink-0 text-xl" role="img" aria-hidden="true">
          {p.imageIcon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-[#1D252D]">{p.name}</span>
            <Badge className={cn("flex-shrink-0 border-0 px-1.5 py-0 text-[10px]", badge.className)}>
              {badge.label}
            </Badge>
            {onContract && (
              <Badge className="flex-shrink-0 border-0 bg-[#004986] px-1.5 py-0 text-[10px] text-white" title="On the account's contract">
                On contract
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-[#4F758B]" title={item.reasons.join(" · ")}>
            {primaryReason || `${p.brand} · ${p.sku}`}
          </p>
        </div>
      </button>

      {/* Attach score — the engine's confidence this belongs with the seed. */}
      <span
        className="hidden flex-shrink-0 tabular-nums text-xs font-semibold text-[#4F758B] sm:inline"
        title="Attach score (0-100): how strongly this companion belongs with the selected product"
      >
        {item.attachScore}
      </span>

      <span className="flex-shrink-0 text-right tabular-nums text-sm font-semibold text-[#1D252D]">
        {onContract && cPrice < p.unitPrice ? (
          <>
            <span className="mr-1 text-xs font-normal text-gray-400 line-through">${p.unitPrice.toFixed(2)}</span>
            <span className="text-[#004986]">${cPrice.toFixed(2)}</span>
          </>
        ) : (
          <>${p.unitPrice.toFixed(2)}</>
        )}
      </span>

      <button
        type="button"
        onClick={() => addToCart(p)}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#00AA13] text-lg leading-none text-white transition-colors hover:bg-[#008f10]"
        aria-label={`Add ${p.name} to basket`}
      >
        +
      </button>
    </li>
  );
}

export function CompanionsPanel({ product, branchId }: Props) {
  const addToCart = useProductFinder((s) => s.addToCart);
  const activeCustomer = useProductFinder(selectActiveCustomer);
  const contract = contractForCustomer(activeCustomer?.name);
  const [items, setItems] = useState<CompanionItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setLoaded(false);
    void apiCompanions(product.id, { branchId, k: 8 }).then((res) => {
      if (!cancelled) {
        setItems(res);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [product.id, branchId]);

  // Render nothing until we have data — keeps the modal clean for products with no
  // companions (and avoids a flash of an empty section).
  if (!loaded || items.length === 0) return null;

  const required = items.filter((c) => c.relation === "required");
  const recommended = items.filter((c) => c.relation === "recommended");
  const addAllRequired = () => required.forEach((c) => addToCart(c.product));

  return (
    <div className="border-b border-[#B7C9D3]/40 px-6 py-5 print:hidden" data-testid="companions-panel">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#1D252D]">
        Cross-sell companions
      </h3>

      {required.length > 0 && (
        <section className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
              Complete the assembly
            </p>
            {required.length >= 2 && (
              <Button
                size="sm"
                className="h-7 flex-shrink-0 bg-[#00AA13] px-3 text-xs text-white hover:bg-[#008f10]"
                onClick={addAllRequired}
              >
                Add all required ({required.length})
              </Button>
            )}
          </div>
          <ul className="divide-y divide-[#B7C9D3]/40">
            {required.map((c) => (
              <CompanionRow key={c.product.id} item={c} contract={contract} />
            ))}
          </ul>
        </section>
      )}

      {recommended.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
            Frequently attached
          </p>
          <ul className="divide-y divide-[#B7C9D3]/40">
            {recommended.map((c) => (
              <CompanionRow key={c.product.id} item={c} contract={contract} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
