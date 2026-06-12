"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useProductFinder, selectActiveCustomer } from "@/lib/product-finder-store";
import { getTotalBranchStock, getTotalDCStock } from "@/data/mock/catalog-products";
import { externalSearchLinks } from "@/lib/product-finder-links";
import { priceTiers } from "@/lib/product-finder-pricing";
import { apiGoesWith } from "@/lib/product-finder-api";
import { ProductImage } from "@/features/product-finder/ProductImage";
import { LiveDistributorPanel } from "@/features/product-finder/LiveDistributorPanel";
import { VerifiedCrossPanel } from "@/features/product-finder/VerifiedCrossPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/features/product-finder/types";
import { isInStock } from "@/lib/product-finder-leadtime";
import { getPricingProvider, getInventoryProvider, getCrossReferenceProvider } from "@/lib/integration/index";

// ─── External-link icon ───────────────────────────────────────────────────────

function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="inline-block ml-1 flex-shrink-0"
    >
      <path
        d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3m0 0v3m0-3L5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Qty Stepper (self-contained, same pattern as ProductCard) ────────────────

function QtyStepper({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center border border-[#B7C9D3] rounded-md overflow-hidden">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, qty - 1))}
        className="px-2 py-1 text-[#4F758B] hover:bg-[#B7C9D3]/20 text-sm font-semibold"
      >
        −
      </button>
      <input
        type="number"
        min="1"
        value={qty}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
        className="w-12 text-center text-sm text-[#1D252D] border-x border-[#B7C9D3] py-1 focus:outline-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
        className="px-2 py-1 text-[#4F758B] hover:bg-[#B7C9D3]/20 text-sm font-semibold"
      >
        +
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function ProductDetailModal() {
  const product        = useProductFinder((s) => s.detailModalProduct);
  const setDetailModal = useProductFinder((s) => s.setDetailModalProduct);
  const addToCart      = useProductFinder((s) => s.addToCart);
  const setActiveProduct = useProductFinder((s) => s.setActiveProduct);
  const watches        = useProductFinder((s) => s.watches);
  const toggleWatch    = useProductFinder((s) => s.toggleWatch);
  const activeCustomer = useProductFinder(selectActiveCustomer);
  const repUser        = useProductFinder((s) => s.user);

  const [qty, setQty] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Goes-with cross-sell
  const [goesWithItems, setGoesWithItems] = useState<CatalogProduct[]>([]);

  // Reset qty and fetch goes-with each time a new product opens
  useEffect(() => {
    if (product) setQty(1);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!product) {
      setGoesWithItems([]);
      return;
    }
    let cancelled = false;
    setGoesWithItems([]);
    void apiGoesWith(product.id).then((items) => {
      if (!cancelled) setGoesWithItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape closes
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailModal(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [product, setDetailModal]);

  // Focus ✕ on open
  useEffect(() => {
    if (product) closeRef.current?.focus();
  }, [product]);

  if (!product) return null;

  const branchQty = getTotalBranchStock(product);
  const dcQty     = getTotalDCStock(product);
  const dotColor  = branchQty > 0 ? "bg-[#00AA13]" : dcQty > 0 ? "bg-[#EAAA00]" : "bg-gray-300";
  const links     = externalSearchLinks(product);
  const productInStock = isInStock(product);
  const isWatched = watches.some((w) => w.id === product.id);

  const nonNegSpecs = product.specs.filter((s) => s.isNonNeg);
  const otherSpecs  = product.specs.filter((s) => !s.isNonNeg);

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setDetailModal(null);
  };

  const handleAddToCart = () => {
    addToCart(product, qty);
  };

  const handleFindAlternatives = () => {
    setDetailModal(null);
    void setActiveProduct(product);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    // Overlay — print: lift out of fixed stacking so spec sheet fills the page
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 print:static print:bg-white print:p-0 print:block print:h-auto print:overflow-visible"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Product details: ${product.name}`}
    >
      {/* Dialog container — bounded height on screen; body scrolls internally */}
      <div className="relative w-full max-w-3xl my-8 rounded-xl bg-white shadow-2xl flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden print:shadow-none print:rounded-none print:my-0 print:max-w-none print:max-h-none print:overflow-visible">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="print:hidden flex items-start justify-between px-6 py-4 bg-[#1D252D] rounded-t-xl gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-white font-semibold text-base leading-snug">
              {product.name}
            </h2>
            <p className="text-[#B7C9D3] text-xs">
              {product.brand} · SKU: {product.sku}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {product.preferred && (
                <Badge className="w-fit text-xs bg-[#00AA13] text-white border-0">
                  Preferred
                </Badge>
              )}
              {product.dataSource === "verified" && (
                <Badge
                  className="w-fit text-xs bg-transparent text-[#00AA13] border border-[#00AA13]"
                  title="Real manufacturer part number — specs and spec-sheet link verified against public manufacturer sources"
                >
                  ✓ Verified real product
                </Badge>
              )}
              {product.dataSource === "curated" && (
                <Badge
                  className="w-fit text-xs bg-transparent text-[#B7C9D3] border border-[#B7C9D3]"
                  title="Built around a real part number; demo pricing and inventory"
                >
                  Real part № · demo data
                </Badge>
              )}
              {product.dataSource === "simulated" && (
                <Badge
                  className="w-fit text-xs bg-transparent text-[#B7C9D3] border border-[#B7C9D3]/60"
                  title="Generated demo item — SKU, price, and inventory are simulated"
                >
                  Simulated demo item
                </Badge>
              )}
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={() => setDetailModal(null)}
            className="text-white/80 hover:text-white transition-colors text-2xl leading-none font-light flex-shrink-0 mt-0.5"
            aria-label="Close product detail modal"
          >
            &#x2715;
          </button>
        </div>

        {/* ── Scrollable body (header above stays fixed) ───────── */}
        <div className="flex-1 overflow-y-auto print:overflow-visible print:flex-none">

        {/* ── Top section: art + actions ───────────────────────── */}
        <div className="print:hidden flex flex-col sm:flex-row gap-6 px-6 py-5 border-b border-[#B7C9D3]/40">
          {/* Left: product art */}
          <div className="w-full sm:w-56 flex-shrink-0">
            <ProductImage product={product} className="rounded-lg overflow-hidden" showCallout />
          </div>

          {/* Right: price, stock, actions */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Price */}
            {(() => {
              const pricing = getPricingProvider().getPricing(product, { customer: activeCustomer, qty });
              const hasContract = pricing.contractPrice !== null;
              return (
                <div>
                  {hasContract ? (
                    <>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl font-bold text-[#00AA13]">
                          ${pricing.effectiveUnitPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-[#4F758B]">/ {product.uom}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-sm text-[#4F758B] line-through">
                          List ${pricing.listPrice.toFixed(2)}
                        </span>
                        {pricing.savingsPct > 0 && (
                          <span className="text-xs font-semibold text-[#00AA13] bg-[#00AA13]/10 px-2 py-0.5 rounded">
                            You save {pricing.savingsPct}%
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#4F758B] italic mt-0.5">contract pricing — simulated</p>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-[#1D252D]">
                        ${pricing.effectiveUnitPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-[#4F758B] ml-1">/ {product.uom}</span>
                    </>
                  )}
                </div>
              );
            })()}
            {product.priceNote && (
              <p className="text-[10px] text-[#4F758B] italic -mt-2">{product.priceNote}</p>
            )}

            {/* Volume pricing table */}
            <div>
              <p className="text-xs font-semibold text-[#4F758B] uppercase tracking-wide mb-1">
                Published volume pricing
              </p>
              {(() => {
                const activeTierMinQty = [...priceTiers(product)].reverse().find((t) => qty >= t.minQty)?.minQty;
                return (
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFB]">
                        <th className="text-left px-2 py-1 font-semibold text-[#4F758B] border border-[#B7C9D3]/60">
                          Qty
                        </th>
                        <th className="text-right px-2 py-1 font-semibold text-[#4F758B] border border-[#B7C9D3]/60">
                          Unit price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceTiers(product).map((tier) => (
                        <tr
                          key={tier.minQty}
                          className={cn(
                            "border-b border-[#B7C9D3]/40",
                            activeTierMinQty === tier.minQty && "bg-[#00AA13]/5"
                          )}
                        >
                          <td className="px-2 py-1 text-[#1D252D] border border-[#B7C9D3]/60">
                            {tier.minQty}+
                          </td>
                          <td className="px-2 py-1 text-right font-semibold text-[#1D252D] border border-[#B7C9D3]/60">
                            ${tier.unitPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* ── Availability panel ─────────────────────────────── */}
            {(() => {
              const availability = getInventoryProvider().getAvailability(product, {
                branchId: repUser?.branchId,
                today: new Date(),
              });
              return (
                <div className="rounded-lg border border-[#B7C9D3]/60 bg-[#F8FAFB] px-3 py-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#1D252D] uppercase tracking-wide">
                      Availability
                    </span>
                    <span className="text-[10px] text-[#4F758B] italic">
                      live inventory — simulated
                    </span>
                  </div>

                  {/* Branch + DC qty row */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("inline-block h-2.5 w-2.5 rounded-full flex-shrink-0", dotColor)}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-[#1D252D]">
                      <span className="font-semibold">{availability.branchQty}</span>
                      <span className="text-[#4F758B]"> branch</span>
                      {"  /  "}
                      <span className="font-semibold">{availability.dcQty}</span>
                      <span className="text-[#4F758B]"> DC</span>
                    </span>
                  </div>

                  {/* ATP date + lead time for OOS */}
                  {!availability.inStock && (
                    <div className="flex flex-col gap-0.5">
                      {availability.leadTime && (
                        <span className="text-xs text-[#4F758B]">
                          Lead time:{" "}
                          <span className="font-medium text-[#1D252D]">{availability.leadTime}</span>
                        </span>
                      )}
                      {availability.atpDate && (
                        <span className="text-xs text-[#4F758B]">
                          Available to promise:{" "}
                          <span className="font-medium text-[#1D252D]">{availability.atpDate}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Also stocked at (other branches with qty > 0) */}
                  {availability.otherBranches.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#4F758B] uppercase tracking-wide mb-0.5">
                        Also stocked at
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {availability.otherBranches.map((b) => (
                          <li key={b.branchId} className="flex items-center justify-between text-xs">
                            <span className="text-[#1D252D]">{b.name}</span>
                            <span className="font-semibold text-[#1D252D] ml-2">{b.qty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Branch transfer ETA */}
                  {availability.transferEtaDays !== null && (
                    <p className="text-xs text-[#4F758B]">
                      Branch transfer{" "}
                      <span className="font-medium text-[#1D252D]">~{availability.transferEtaDays} days</span>
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Notify when OOS */}
            {!productInStock && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleWatch(product.id, { name: product.name })}
                  aria-pressed={isWatched}
                  className={cn(
                    "flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition-colors",
                    isWatched
                      ? "border-[#00AA13] bg-[#00AA13]/10 text-[#00AA13]"
                      : "border-[#4F758B] text-[#4F758B] hover:border-[#1D252D] hover:text-[#1D252D]"
                  )}
                >
                  {isWatched ? "✓ We'll notify you" : "Notify when available"}
                </button>
              </div>
            )}

            {/* Qty stepper + Add to Basket */}
            <div className="flex items-center gap-2 flex-wrap">
              <QtyStepper qty={qty} onChange={setQty} />
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="bg-[#00AA13] hover:bg-[#00AA13]/90 text-white border-0"
              >
                Add to Basket
              </Button>
            </div>

            {/* Find Alternatives */}
            <div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-[#B7C9D3]"
                onClick={handleFindAlternatives}
              >
                Find Alternatives
              </Button>
            </div>
          </div>
        </div>

        {/* ── Live distributor data (real, on-demand; renders only when the
               Mouser/Digi-Key seam is configured and the SKU is real) ── */}
        <VerifiedCrossPanel product={product} />

        <LiveDistributorPanel product={product} />

        {/* ── Spec Sheet section ──────────────────────────────── */}
        {/*
          Print scope: this block stays visible; everything else above/below is
          print:hidden. The overlay gets print:static so the sheet renders at
          normal document flow. App chrome behind the modal may still print in
          some browsers (v1 caveat — see task notes).
        */}
        <div
          id="product-spec-sheet"
          className="px-6 py-5 border-b border-[#B7C9D3]/40 print:border-0 print:px-0 print:py-0"
        >
          {/* Print-only header (hidden on screen) */}
          <div className="hidden print:block mb-4">
            <p className="text-xs text-[#4F758B]">
              {product.brand} · SKU: {product.sku}
            </p>
            <h1 className="text-lg font-bold text-[#1D252D]">{product.name}</h1>
            {product.preferred && (
              <span className="inline-block text-xs font-semibold bg-[#00AA13] text-white px-2 py-0.5 rounded mt-1">
                Preferred
              </span>
            )}
            <p className="text-sm text-[#1D252D] mt-1">
              ${product.unitPrice.toFixed(2)} / {product.uom}
            </p>
          </div>

          {/* Spec sheet heading + download button */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3 print:hidden">
            <h3 className="text-sm font-semibold text-[#1D252D] uppercase tracking-wide">
              Spec Sheet
            </h3>
            <div className="flex items-center gap-2">
              {product.specSheetUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-[#00AA13] text-[#00AA13]"
                  asChild
                >
                  <a href={product.specSheetUrl} target="_blank" rel="noreferrer">
                    Manufacturer Spec Sheet
                    <ExternalLinkIcon />
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-[#B7C9D3] text-[#1D252D]"
                onClick={handlePrint}
              >
                Download Spec Sheet (PDF)
              </Button>
            </div>
          </div>

          {/* Spec table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 bg-[#1D252D] text-white font-semibold text-xs uppercase tracking-wide border border-[#B7C9D3] w-2/5">
                    Specification
                  </th>
                  <th className="text-left px-3 py-2 bg-[#1D252D] text-white font-semibold text-xs uppercase tracking-wide border border-[#B7C9D3]">
                    Value
                  </th>
                  <th className="text-left px-3 py-2 bg-[#1D252D] text-white font-semibold text-xs uppercase tracking-wide border border-[#B7C9D3] w-20">
                    Required
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Non-negotiable specs first */}
                {nonNegSpecs.map((spec) => (
                  <tr key={spec.name} className="border-b border-[#B7C9D3]/60">
                    <td className="px-3 py-2 text-[#4F758B] font-medium border border-[#B7C9D3]/60 bg-[#F8FAFB]">
                      {spec.name}
                    </td>
                    <td className="px-3 py-2 text-[#1D252D] border border-[#B7C9D3]/60">
                      {spec.value}
                    </td>
                    <td className="px-3 py-2 border border-[#B7C9D3]/60 text-center">
                      <span className="inline-block text-[10px] font-bold bg-[#EAAA00] text-[#1D252D] px-1.5 py-0.5 rounded">
                        REQ
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Regular specs */}
                {otherSpecs.map((spec) => (
                  <tr key={spec.name} className="border-b border-[#B7C9D3]/60">
                    <td className="px-3 py-2 text-[#4F758B] font-medium border border-[#B7C9D3]/60 bg-[#F8FAFB]">
                      {spec.name}
                    </td>
                    <td className="px-3 py-2 text-[#1D252D] border border-[#B7C9D3]/60">
                      {spec.value}
                    </td>
                    <td className="px-3 py-2 border border-[#B7C9D3]/60" />
                  </tr>
                ))}

                {/* Meta rows */}
                <tr className="border-b border-[#B7C9D3]/60">
                  <td className="px-3 py-2 text-[#4F758B] font-medium border border-[#B7C9D3]/60 bg-[#F8FAFB]">
                    Description
                  </td>
                  <td className="px-3 py-2 text-[#1D252D] border border-[#B7C9D3]/60 italic text-xs leading-relaxed" colSpan={2}>
                    {product.description}
                  </td>
                </tr>
                <tr className="border-b border-[#B7C9D3]/60">
                  <td className="px-3 py-2 text-[#4F758B] font-medium border border-[#B7C9D3]/60 bg-[#F8FAFB]">
                    Category › Subcategory
                  </td>
                  <td className="px-3 py-2 text-[#1D252D] border border-[#B7C9D3]/60" colSpan={2}>
                    {product.category} › {product.subcategory}
                  </td>
                </tr>
                <tr className="border-b border-[#B7C9D3]/60">
                  <td className="px-3 py-2 text-[#4F758B] font-medium border border-[#B7C9D3]/60 bg-[#F8FAFB]">
                    Unit of Measure
                  </td>
                  <td className="px-3 py-2 text-[#1D252D] border border-[#B7C9D3]/60" colSpan={2}>
                    {product.uom}
                  </td>
                </tr>
                <tr className="border-b border-[#B7C9D3]/60">
                  <td className="px-3 py-2 text-[#4F758B] font-medium border border-[#B7C9D3]/60 bg-[#F8FAFB]">
                    SKU
                  </td>
                  <td className="px-3 py-2 text-[#1D252D] font-mono border border-[#B7C9D3]/60" colSpan={2}>
                    {product.sku}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[#4F758B] font-medium border border-[#B7C9D3]/60 bg-[#F8FAFB]">
                    Brand
                  </td>
                  <td className="px-3 py-2 text-[#1D252D] border border-[#B7C9D3]/60" colSpan={2}>
                    {product.brand}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Cross-references / Replaces ────────────────────── */}
        {(() => {
          const refs = getCrossReferenceProvider().referencesFor(product);
          if (refs.length === 0) return null;
          return (
            <div className="print:hidden px-6 py-4 border-b border-[#B7C9D3]/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-[#1D252D] uppercase tracking-wide">
                  Cross-references / Replaces
                </h3>
                <span className="text-[10px] text-[#4F758B] italic">
                  cross-reference data — simulated
                </span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {refs.map((ref) => (
                  <li
                    key={ref.competitorSku}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#B7C9D3] bg-[#F8FAFB] px-2.5 py-0.5 text-xs"
                  >
                    <span className="font-mono font-semibold text-[#1D252D]">
                      {ref.competitorSku}
                    </span>
                    <span className="text-[#4F758B]">{ref.brand}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* ── Goes well with ──────────────────────────────────── */}
        {goesWithItems.length > 0 && (
          <div className="print:hidden px-6 py-5 border-b border-[#B7C9D3]/40">
            <h3 className="text-sm font-semibold text-[#1D252D] uppercase tracking-wide mb-3">
              Goes well with
            </h3>
            <ul className="divide-y divide-[#B7C9D3]/40">
              {goesWithItems.map((gwp) => (
                <li key={gwp.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 py-2 text-left hover:bg-[#F8FAFB] transition-colors rounded"
                    onClick={() => setDetailModal(gwp)}
                    aria-label={`View details for ${gwp.name}`}
                  >
                    <span className="text-xl flex-shrink-0" role="img" aria-hidden="true">
                      {gwp.imageIcon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1D252D] truncate">{gwp.name}</p>
                      <p className="text-xs text-[#4F758B]">{gwp.brand}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#1D252D] flex-shrink-0">
                      ${gwp.unitPrice.toFixed(2)}
                    </span>
                    {gwp.preferred && (
                      <Badge className="text-[10px] bg-[#00AA13] text-white border-0 flex-shrink-0 px-1.5 py-0.5">
                        Preferred
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Where to Buy section ────────────────────────────── */}
        <div className="print:hidden px-6 py-5">
          <h3 className="text-sm font-semibold text-[#1D252D] uppercase tracking-wide mb-3">
            Where to Buy
          </h3>

          <div className="rounded-lg border border-[#B7C9D3]/60 overflow-hidden">
            {links.map((link, i) => {
              const hasMeta = link.price !== undefined || link.quantity !== undefined || link.leadTime !== undefined;
              return (
                <div
                  key={link.distributor}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-3 text-sm",
                    i > 0 && "border-t border-[#B7C9D3]/40",
                    "hover:bg-[#F8FAFB] transition-colors"
                  )}
                >
                  {/* Distributor link */}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#004986] hover:text-[#003366] hover:underline flex items-center"
                  >
                    {link.distributor}
                    <ExternalLinkIcon />
                  </a>

                  {/* Price / qty / lead time (sourced rows only) */}
                  {hasMeta && (
                    <span className="text-xs text-[#4F758B] text-right">
                      {link.price !== undefined && (
                        <span className="font-semibold text-[#1D252D]">
                          ${link.price.toFixed(2)}
                        </span>
                      )}
                      {link.quantity !== undefined && (
                        <span className="ml-1">· {link.quantity} units</span>
                      )}
                      {link.leadTime && (
                        <span className="ml-1">· {link.leadTime}</span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Disclaimer — only show when there are sourced rows with prices */}
          {links.some((l) => l.price !== undefined) && (
            <p className="text-[10px] text-[#4F758B] mt-2 leading-relaxed">
              Availability shown is simulated; links open live distributor search.
            </p>
          )}
        </div>
        {/* end scrollable body */}
        </div>
      </div>
    </div>
  );
}
