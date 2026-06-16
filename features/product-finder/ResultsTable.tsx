"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { COLUMNS, defaultVisibility, visibleColumns, type ColumnId } from "@/lib/product-finder-columns";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Dense results table (#11) — a scannable, Linear-style view of the catalog's
 * rich metadata with SMART COLUMN HIDING (toggle which columns show; persisted to
 * localStorage). Each row's name opens the product detail; a per-row checkbox feeds
 * the existing compare flow. Column definitions + visibility logic live in the pure
 * lib (product-finder-columns).
 */

const STORAGE_KEY = "pf_table_columns";

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
              {cols.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`px-3 py-2 font-semibold text-[#4F758B] ${c.numeric ? "text-right" : "text-left"}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr
                key={p.id}
                data-result-index={i}
                aria-selected={activeResultIndex === i || undefined}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
