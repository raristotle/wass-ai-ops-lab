"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { getTotalBranchStock, getTotalDCStock } from "@/data/mock/wesco-products";
import { externalSearchLinks } from "@/lib/product-finder-links";
import { ProductArt } from "@/features/product-finder/ProductArt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)}
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

  const [qty, setQty] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Reset qty each time a new product opens
  useEffect(() => {
    if (product) setQty(1);
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 print:static print:bg-white print:p-0 print:block"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Product details: ${product.name}`}
    >
      {/* Dialog container */}
      <div className="relative w-full max-w-3xl my-8 rounded-xl bg-white shadow-2xl flex flex-col print:shadow-none print:rounded-none print:my-0 print:max-w-none">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="print:hidden flex items-start justify-between px-6 py-4 bg-[#1D252D] rounded-t-xl gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-white font-semibold text-base leading-snug">
              {product.name}
            </h2>
            <p className="text-[#B7C9D3] text-xs">
              {product.brand} · SKU: {product.sku}
            </p>
            {product.preferred && (
              <Badge className="w-fit text-xs bg-[#00AA13] text-white border-0 mt-0.5">
                Preferred
              </Badge>
            )}
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

        {/* ── Top section: art + actions ───────────────────────── */}
        <div className="print:hidden flex flex-col sm:flex-row gap-6 px-6 py-5 border-b border-[#B7C9D3]/40">
          {/* Left: product art */}
          <div className="w-full sm:w-56 flex-shrink-0">
            <ProductArt product={product} className="rounded-lg overflow-hidden" />
          </div>

          {/* Right: price, stock, actions */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Price */}
            <div>
              <span className="text-2xl font-bold text-[#1D252D]">
                ${product.unitPrice.toFixed(2)}
              </span>
              <span className="text-sm text-[#4F758B] ml-1">/ {product.uom}</span>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <span
                className={cn("inline-block h-2.5 w-2.5 rounded-full flex-shrink-0", dotColor)}
                aria-hidden="true"
              />
              <span className="text-sm text-[#1D252D]">
                <span className="font-semibold">{branchQty}</span>
                <span className="text-[#4F758B]"> branch</span>
                {"  /  "}
                <span className="font-semibold">{dcQty}</span>
                <span className="text-[#4F758B]"> DC</span>
              </span>
            </div>

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
          <div className="flex items-center justify-between mb-3 print:hidden">
            <h3 className="text-sm font-semibold text-[#1D252D] uppercase tracking-wide">
              Spec Sheet
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-[#B7C9D3] text-[#1D252D]"
              onClick={handlePrint}
            >
              Download Spec Sheet (PDF)
            </Button>
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
      </div>
    </div>
  );
}
