"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StockBadge } from "@/features/product-finder/StockBadge";
import { useProductFinder, selectActiveCustomer } from "@/lib/product-finder-store";
import { getTotalBranchStock, getTotalDCStock } from "@/data/mock/catalog-products";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";
import { RecommendationExplanation } from "@/features/product-finder/RecommendationExplanation";
import { ProductImage } from "@/features/product-finder/ProductImage";
import { isInStock, leadTimeFor } from "@/lib/product-finder-leadtime";
import { getPricingProvider } from "@/lib/integration/index";

interface ProductCardProps {
  product: CatalogProduct;
  isAlternative?: boolean;
  referenceProduct?: CatalogProduct;
}

function SpecRow({
  spec,
  referenceSpec,
}: {
  spec: ProductSpec;
  referenceSpec?: ProductSpec;
}) {
  const isMatch =
    referenceSpec === undefined || referenceSpec.value === spec.value;
  return (
    <li className="flex items-start gap-1.5 text-xs text-[#1D252D]">
      {spec.isNonNeg ? (
        isMatch ? (
          <span className="text-[#00AA13] font-bold flex-shrink-0">✓</span>
        ) : (
          <span className="text-[#EAAA00] flex-shrink-0">⚠</span>
        )
      ) : (
        <span className="w-3 flex-shrink-0" />
      )}
      <span className="text-[#4F758B]">{spec.name}:</span>
      <span className="font-medium">{spec.value}</span>
    </li>
  );
}

export function ProductCard({
  product,
  isAlternative = false,
  referenceProduct,
}: ProductCardProps) {
  const [specsOpen, setSpecsOpen] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);
  const [qty, setQty] = useState(1);

  const user = useProductFinder((s) => s.user);
  const compareIds = useProductFinder((s) => s.compareIds);
  const toggleCompare = useProductFinder((s) => s.toggleCompare);
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);
  const addToCart = useProductFinder((s) => s.addToCart);
  const isFavorite = useProductFinder((s) => s.favorites.includes(product.id));
  const toggleFavorite = useProductFinder((s) => s.toggleFavorite);
  const setActiveProduct = useProductFinder((s) => s.setActiveProduct);
  const isWatched = useProductFinder((s) => s.watches.includes(product.id));
  const toggleWatch = useProductFinder((s) => s.toggleWatch);
  const activeCustomer = useProductFinder(selectActiveCustomer);

  const branchQty = getTotalBranchStock(product);
  const dcQty = getTotalDCStock(product);
  const isComparing = compareIds.has(product.id);
  const compareMaxReached = compareIds.size >= 4 && !isComparing;

  const productInStock = isInStock(product);
  const leadTime = leadTimeFor(product);

  const showExternalAlert =
    branchQty === 0 && dcQty === 0 && product.externalSources.length > 0;

  const nonNegSpecs = product.specs.filter((s) => s.isNonNeg);
  const otherSpecs = product.specs.filter((s) => !s.isNonNeg);

  function handleQtyChange(value: number) {
    setQty(Math.max(1, value));
  }

  function handleAddToCart() {
    addToCart(product, qty);
  }

  function handleToggleCompare() {
    if (compareMaxReached) return;
    toggleCompare(product.id);
  }

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white rounded-lg border shadow-sm overflow-hidden",
        product.preferred
          ? "border-l-4 border-l-[#00AA13]"
          : "border-l-4 border-l-[#B7C9D3]"
      )}
      data-testid={`product-card-${product.id}`}
    >
      <button
        type="button"
        onClick={() => toggleFavorite(product)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
        className={cn(
          "absolute right-2 top-2 z-10 p-1 text-lg leading-none transition-colors",
          isFavorite ? "text-[#EAAA00]" : "text-[#B7C9D3] hover:text-[#EAAA00]",
        )}
      >
        <span aria-hidden="true">{isFavorite ? "★" : "☆"}</span>
      </button>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="p-4 flex gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden">
          <ProductImage product={product} className="w-10 h-10 object-cover rounded" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 mb-0.5">
            <span className="font-semibold text-[#1D252D] text-sm leading-snug">
              {product.name}
            </span>
            {product.preferred && (
              <Badge
                variant="success"
                className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
              >
                PREFERRED
              </Badge>
            )}
            {isAlternative && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0 text-[#4F758B] border-[#B7C9D3]"
              >
                ALTERNATIVE
              </Badge>
            )}
          </div>

          <p className="text-xs text-[#4F758B] mb-1">
            {product.brand} · SKU: {product.sku}
          </p>

          <p className="text-xs text-[#1D252D] line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {referenceProduct != null && referenceProduct.id !== product.id && (
            <RecommendationExplanation product={product} reference={referenceProduct} />
          )}
        </div>
      </div>

      {/* ── Specs (collapsible) ──────────────────────────────────── */}
      <div className="border-t border-[#B7C9D3]/40 px-4 py-2">
        <button
          type="button"
          onClick={() => setSpecsOpen((v) => !v)}
          className="flex items-center gap-1 text-xs text-[#4F758B] hover:text-[#1D252D] w-full"
          aria-expanded={specsOpen}
        >
          <span
            className={cn(
              "inline-block transition-transform duration-150 text-[10px]",
              specsOpen ? "rotate-90" : "rotate-0"
            )}
          >
            ▶
          </span>
          <span>Specifications ({product.specs.length})</span>
        </button>

        {specsOpen && (
          <div className="mt-2 space-y-2">
            {nonNegSpecs.length > 0 && (
              <ul className="space-y-1">
                {nonNegSpecs.map((spec) => (
                  <SpecRow
                    key={spec.name}
                    spec={spec}
                    referenceSpec={
                      referenceProduct?.specs.find(
                        (s) => s.name === spec.name
                      )
                    }
                  />
                ))}
              </ul>
            )}

            {otherSpecs.length > 0 && (
              <>
                {nonNegSpecs.length > 0 && (
                  <Separator className="bg-[#B7C9D3]/40" />
                )}
                <ul className="space-y-1">
                  {otherSpecs.map((spec) => (
                    <SpecRow key={spec.name} spec={spec} />
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Stock ───────────────────────────────────────────────── */}
      <div className="border-t border-[#B7C9D3]/40 px-4 py-2">
        <StockBadge
          branchQty={branchQty}
          dcQty={dcQty}
          userBranchId={user?.branchId}
          branchStock={product.branchStock}
        />
      </div>

      {/* ── External sources alert ───────────────────────────────── */}
      {showExternalAlert && (
        <div className="mx-4 mb-2 rounded border border-[#004986]/30 bg-[#004986]/5 px-3 py-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-xs text-[#004986]"
            onClick={() => setExternalOpen((v) => !v)}
            aria-expanded={externalOpen}
          >
            <span>
              Not in stock at Meridian Supply Co. — available at{" "}
              <span className="font-semibold">
                {product.externalSources.length}
              </span>{" "}
              external distributor
              {product.externalSources.length !== 1 ? "s" : ""}
            </span>
            <span
              className={cn(
                "transition-transform duration-150",
                externalOpen ? "rotate-180" : "rotate-0"
              )}
            >
              ▾
            </span>
          </button>

          {externalOpen && (
            <ul className="mt-2 space-y-1.5">
              {product.externalSources.map((src) => (
                <li
                  key={src.distributor}
                  className="flex items-center justify-between text-xs text-[#1D252D]"
                >
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#004986] hover:underline"
                  >
                    {src.distributor}
                  </a>
                  <span className="text-[#4F758B]">
                    ${src.price.toFixed(2)} · {src.quantity} units
                    {src.leadTime && ` · ${src.leadTime}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── OOS: lead-time + notify-when-available ────────────────── */}
      {!productInStock && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-2">
          {leadTime && (
            <span className="text-xs text-[#4F758B]">
              Lead time:{" "}
              <span className="font-medium text-[#1D252D]">{leadTime}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => toggleWatch(product.id)}
            aria-pressed={isWatched}
            className={cn(
              "ml-auto flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition-colors",
              isWatched
                ? "border-[#00AA13] bg-[#00AA13]/10 text-[#00AA13]"
                : "border-[#4F758B] text-[#4F758B] hover:border-[#1D252D] hover:text-[#1D252D]"
            )}
          >
            {isWatched ? "✓ We'll notify you" : "Notify when available"}
          </button>
        </div>
      )}

      {/* ── Price + Actions ──────────────────────────────────────── */}
      <div className="border-t border-[#B7C9D3]/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Price */}
        <div className="flex-shrink-0">
          {(() => {
            const pricing = getPricingProvider().getPricing(product, { customer: activeCustomer, qty });
            const hasContract = pricing.contractPrice !== null;
            return hasContract ? (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-[#00AA13]">
                    ${pricing.effectiveUnitPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-[#4F758B]">/ {product.uom}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-[#4F758B] line-through">
                    List ${pricing.listPrice.toFixed(2)}
                  </span>
                  {pricing.savingsPct > 0 && (
                    <span className="text-[10px] font-semibold text-[#00AA13] bg-[#00AA13]/10 px-1.5 py-0.5 rounded">
                      You save {pricing.savingsPct}%
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-[#4F758B] italic">contract pricing — simulated</p>
              </div>
            ) : (
              <>
                <span className="text-lg font-semibold text-[#1D252D]">
                  ${pricing.effectiveUnitPrice.toFixed(2)}
                </span>
                <span className="text-xs text-[#4F758B] ml-1">/ {product.uom}</span>
              </>
            );
          })()}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:ml-auto">
          {/* Qty stepper + add to basket */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-[#B7C9D3] rounded-md overflow-hidden">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => handleQtyChange(qty - 1)}
                className="px-2 py-1 text-[#4F758B] hover:bg-[#B7C9D3]/20 text-sm font-semibold"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => handleQtyChange(parseInt(e.target.value, 10) || 1)}
                className="w-12 text-center text-sm text-[#1D252D] border-x border-[#B7C9D3] py-1 focus:outline-none"
                aria-label="Quantity"
              />
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => handleQtyChange(qty + 1)}
                className="px-2 py-1 text-[#4F758B] hover:bg-[#B7C9D3]/20 text-sm font-semibold"
              >
                +
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-[#00AA13] hover:bg-[#00AA13]/90 text-white border-0"
            >
              Add to Basket
            </Button>
          </div>

          {/* Compare + Find Alternatives + View Details */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleCompare}
              disabled={compareMaxReached}
              className={cn(
                "text-xs border-[#B7C9D3]",
                isComparing && "border-[#00AA13] text-[#00AA13]"
              )}
              title={
                compareMaxReached
                  ? "Maximum 4 products in compare"
                  : undefined
              }
            >
              {isComparing ? "✓ Comparing" : "Compare"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="text-xs border-[#B7C9D3]"
              onClick={() => setActiveProduct(product)}
            >
              Find Alternatives
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="text-xs border-[#B7C9D3]"
              onClick={() => setDetailModalProduct(product)}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
