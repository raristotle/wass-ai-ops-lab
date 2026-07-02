"use client";

import { useState } from "react";
import { apiCaptureWescoSku } from "@/lib/product-finder-api";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * B17 — Wesco stock-number capture. A labeled entry point on the product detail so a rep who knows
 * this product's Wesco stock number can capture it in one click. It's appended to the catalog-number
 * crosswalk (deduped, provenance "captured"), so future searches for that number resolve here — real
 * identifiers accruing as a byproduct of daily use, complementing the batch crosswalk import (B7).
 */
export function WescoStockCapture({ product }: { product: CatalogProduct }) {
  const [open, setOpen] = useState(false);
  const [num, setNum] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    const n = num.trim();
    if (!n) return;
    setBusy(true);
    setMsg(null);
    const res = await apiCaptureWescoSku(n, product.sku);
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
    } else {
      setMsg(res.added ? "Captured — searchable by that number now." : "Updated.");
      setNum("");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-[#4F758B] underline underline-offset-2 hover:text-[#1D252D]"
      >
        {product.wescoSku ? `Wesco stock #: ${product.wescoSku} · update` : "+ Add Wesco stock #"}
      </button>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <label htmlFor="wesco-capture" className="text-[11px] font-semibold text-[#1D252D]">
        Wesco stock #
      </label>
      <input
        id="wesco-capture"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        placeholder={product.wescoSku ?? "e.g. 123456"}
        className="w-32 rounded border border-[#B7C9D3] px-2 py-0.5 text-xs focus:border-[#00AA13] focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
        }}
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={busy || num.trim().length === 0}
        className="rounded bg-[#00AA13] px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#008f10] disabled:opacity-50"
      >
        {busy ? "…" : "Save"}
      </button>
      {msg && <span className="text-[10px] text-[#4F758B]">{msg}</span>}
    </div>
  );
}
