"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { COLUMNS, defaultVisibility, visibleColumns, type ColumnId } from "@/lib/product-finder-columns";
import { prefetchProductDetail } from "@/lib/product-finder-prefetch";
import { volumeTierHint } from "@/lib/product-finder-pricing";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Known-item fast path (v3-S1 #3): a compact qty stepper + Add directly on each
 * table row, so a buyer who knows the SKU never opens the detail page. The Add
 * button's title surfaces the volume-pricing tier that applies at the chosen qty.
 */
function RowAddToCart({ product }: { product: CatalogProduct }) {
  const addToCart = useProductFinder((s) => s.addToCart);
  const [qty, setQty] = useState(1);
  const clamp = (n: number) => setQty(Math.max(1, n));
  const hint = volumeTierHint(product, qty);
  const tierTitle =
    hint.appliedMinQty > 1
      ? `Volume price $${hint.unitPrice.toFixed(2)} ea (save ${hint.savedPct}%)`
      : hint.next
        ? `Add ${hint.next.addQty} more for $${hint.next.unitPrice.toFixed(2)} ea at ${hint.next.minQty}+`
        : undefined;

  return (
    <div className="flex items-center justify-end gap-1.5">
      <div className="flex items-center rounded border border-[#B7C9D3]">
        <button
          type="button"
          aria-label={`Decrease quantity of ${product.name}`}
          onClick={() => clamp(qty - 1)}
          className="px-1.5 text-[#4F758B] hover:bg-[#B7C9D3]/20 text-sm font-semibold"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => clamp(parseInt(e.target.value, 10) || 1)}
          className="w-9 border-x border-[#B7C9D3] py-0.5 text-center text-xs text-[#1D252D] focus:outline-none"
          aria-label={`Quantity of ${product.name}`}
        />
        <button
          type="button"
          aria-label={`Increase quantity of ${product.name}`}
          onClick={() => clamp(qty + 1)}
          className="px-1.5 text-[#4F758B] hover:bg-[#B7C9D3]/20 text-sm font-semibold"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => addToCart(product, qty)}
        title={tierTitle}
        className="rounded bg-[#00AA13] px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#009911]"
        // Fold the tier hint into the accessible name — `title` alone is skipped by many SRs.
        aria-label={`Add ${qty} ${product.name} to basket${tierTitle ? ` — ${tierTitle}` : ""}`}
      >
        Add
      </button>
    </div>
  );
}

/**
 * Dense results table (#11) — a scannable, Linear-style view of the catalog's
 * rich metadata with SMART COLUMN HIDING (toggle which columns show; persisted to
 * localStorage). Each row's name opens the product detail; a per-row checkbox feeds
 * the existing compare flow. Column definitions + visibility logic live in the pure
 * lib (product-finder-columns).
 */

const STORAGE_KEY = "pf_table_columns";

// Which column sorts read ascending (A→Z / low→high) vs descending — drives the
// header arrow direction + aria-sort. Everything else is high→low / active-first.
const ASC_SORTS = new Set(["nameAsc", "skuAsc", "brand", "subcatAsc", "uomAsc", "priceLow"]);

function loadVisibility(): Record<ColumnId, boolean> {
  const def = defaultVisibility();
  if (typeof localStorage === "undefined") return def;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return def;
    return { ...def, ...(JSON.parse(raw) as Partial<Record<ColumnId, boolean>>) };
  } catch {
    return def;
  }
}

export function ResultsTable({ products }: { products: CatalogProduct[] }) {
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);
  const compareIds = useProductFinder((s) => s.compareIds);
  const toggleCompare = useProductFinder((s) => s.toggleCompare);
  const activeResultIndex = useProductFinder((s) => s.activeResultIndex);
  const branchId = useProductFinder((s) => s.user?.branchId);
  const sortKey = useProductFinder((s) => s.filters.sortKey);
  const setSortKey = useProductFinder((s) => s.setSortKey);

  const [vis, setVis] = useState<Record<ColumnId, boolean>>(loadVisibility);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cols = useMemo(() => visibleColumns(vis), [vis]);

  // Close the column menu on Escape or an outside click (matches the app's
  // dialog-dismissal bar; the menu is a non-modal disclosure).
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [menuOpen]);

  function toggleColumn(id: ColumnId) {
    setVis((prev) => {
      const next = { ...prev, [id]: !prev[id] }; // vis is always a complete map
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota / disabled storage */
        }
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Smart column hiding */}
      <div ref={menuRef} className="relative self-end">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          className="rounded-md border border-[#B7C9D3] bg-white px-2 py-1.5 text-xs text-[#4F758B] hover:border-[#1D252D] hover:text-[#1D252D]"
        >
          ▦ Columns
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-[#B7C9D3] bg-white p-2 shadow-lg"
            role="group"
            aria-label="Toggle columns"
          >
            {COLUMNS.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 px-1 py-1 text-xs text-[#1D252D]">
                <input type="checkbox" checked={vis[c.id] ?? c.defaultVisible} onChange={() => toggleColumn(c.id)} />
                {c.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#B7C9D3]">
        <table className="w-full text-sm" aria-label="Product results">
          <thead>
            <tr className="border-b border-[#B7C9D3] bg-[#F8FAFB]">
              <th scope="col" className="w-8 px-2 py-2">
                <span className="sr-only">Select to compare</span>
              </th>
              {cols.map((c) => {
                const active = c.sort != null && sortKey === c.sort;
                const ariaSort = active ? (ASC_SORTS.has(c.sort!) ? "ascending" : "descending") : undefined;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`px-3 py-2 font-semibold text-[#4F758B] ${c.numeric ? "text-right" : "text-left"}`}
                  >
                    {c.sort ? (
                      <button
                        type="button"
                        onClick={() => setSortKey(c.sort!)}
                        className={`inline-flex items-center gap-1 hover:text-[#1D252D] ${c.numeric ? "flex-row-reverse" : ""} ${active ? "text-[#1D252D]" : ""}`}
                        title={`Sort by ${c.label}`}
                      >
                        {c.label}
                        <span aria-hidden="true" className={`text-[10px] ${active ? "text-[#00AA13]" : "text-[#B7C9D3]"}`}>
                          {active ? (ariaSort === "ascending" ? "▲" : "▼") : "⇅"}
                        </span>
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
              <th scope="col" className="px-3 py-2 text-right font-semibold text-[#4F758B]">
                Add
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr
                key={p.id}
                data-result-index={i}
                aria-selected={activeResultIndex === i || undefined}
                onMouseEnter={() => prefetchProductDetail(p.id, branchId)}
                onFocus={() => prefetchProductDetail(p.id, branchId)}
                className={`border-b border-[#B7C9D3]/40 hover:bg-[#00AA13]/[0.03] ${
                  activeResultIndex === i ? "bg-[#00AA13]/[0.06] outline outline-2 -outline-offset-2 outline-[#00AA13]" : ""
                }`}
              >
                <td className="px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={compareIds.has(p.id)}
                    disabled={!compareIds.has(p.id) && compareIds.size >= 4}
                    onChange={() => toggleCompare(p.id)}
                    aria-label={`Compare ${p.name}`}
                  />
                </td>
                {cols.map((c) => (
                  <td
                    key={c.id}
                    className={`px-3 py-1.5 ${c.numeric ? "text-right tabular-nums text-[#1D252D]" : "text-[#4F758B]"}`}
                  >
                    {c.id === "name" ? (
                      <button
                        type="button"
                        onClick={() => setDetailModalProduct(p)}
                        className="text-left font-medium text-[#1D252D] hover:text-[#00AA13] hover:underline"
                      >
                        {c.value(p)}
                      </button>
                    ) : (
                      c.value(p)
                    )}
                  </td>
                ))}
                <td className="px-3 py-1.5">
                  <RowAddToCart product={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
