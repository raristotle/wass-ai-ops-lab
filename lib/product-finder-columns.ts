/**
 * Dense-table column registry — pure column definitions + visibility helpers for
 * the results "table" view (smart column hiding). Surfaces the catalog's rich
 * metadata (price, branch/DC stock, lifecycle, cross-references, preferred line)
 * in a scannable Linear/Airtable-style table. Pure + unit-tested; the component
 * owns the persisted visibility state.
 */

import type { CatalogProduct, SortKey } from "@/features/product-finder/types";

export type ColumnId =
  | "sku"
  | "name"
  | "brand"
  | "price"
  | "branchStock"
  | "dcStock"
  | "lifecycle"
  | "crosses"
  | "preferred"
  | "category"
  | "uom";

export interface ColumnDef {
  id: ColumnId;
  label: string;
  defaultVisible: boolean;
  numeric: boolean;
  /** Display value for a product (already formatted). */
  value: (p: CatalogProduct) => string;
  /** Server-side sort applied when this column's header is clicked (v3-S2 #6). */
  sort?: SortKey;
}

function branchTotal(p: CatalogProduct): number {
  return p.branchStock.reduce((s, b) => s + b.quantity, 0);
}
function dcTotal(p: CatalogProduct): number {
  return p.dcStock.reduce((s, d) => s + d.quantity, 0);
}

export const COLUMNS: ColumnDef[] = [
  { id: "sku", label: "SKU", defaultVisible: true, numeric: false, value: (p) => p.sku, sort: "skuAsc" },
  { id: "name", label: "Product", defaultVisible: true, numeric: false, value: (p) => p.name, sort: "nameAsc" },
  { id: "brand", label: "Brand", defaultVisible: true, numeric: false, value: (p) => p.brand, sort: "brand" },
  { id: "price", label: "Price", defaultVisible: true, numeric: true, value: (p) => `$${p.unitPrice.toFixed(2)}`, sort: "priceLow" },
  { id: "branchStock", label: "Branch", defaultVisible: true, numeric: true, value: (p) => String(branchTotal(p)), sort: "branchStock" },
  { id: "dcStock", label: "DC", defaultVisible: false, numeric: true, value: (p) => String(dcTotal(p)), sort: "dcStock" },
  { id: "lifecycle", label: "Lifecycle", defaultVisible: true, numeric: false, value: (p) => p.lifecycleStatus ?? "Active", sort: "lifecycleActive" },
  { id: "crosses", label: "Crosses", defaultVisible: false, numeric: true, value: (p) => String(p.verifiedCrossCount ?? 0), sort: "crosses" },
  { id: "preferred", label: "Preferred", defaultVisible: false, numeric: false, value: (p) => (p.preferred ? "Yes" : "—"), sort: "preferred" },
  { id: "category", label: "Category", defaultVisible: false, numeric: false, value: (p) => p.subcategory, sort: "subcatAsc" },
  { id: "uom", label: "UoM", defaultVisible: false, numeric: false, value: (p) => p.uom, sort: "uomAsc" },
];

/** The default visibility map (each column's defaultVisible). */
export function defaultVisibility(): Record<ColumnId, boolean> {
  const out = {} as Record<ColumnId, boolean>;
  for (const c of COLUMNS) out[c.id] = c.defaultVisible;
  return out;
}

/**
 * The columns to render for a visibility map, in canonical order. Unknown/absent
 * keys fall back to the column's own default — so an older persisted map missing
 * a newly-added column still shows it by default.
 */
export function visibleColumns(vis: Partial<Record<ColumnId, boolean>>): ColumnDef[] {
  return COLUMNS.filter((c) => vis[c.id] ?? c.defaultVisible);
}
