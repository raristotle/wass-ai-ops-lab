"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { apiCrossMatch } from "@/lib/product-finder-api";
import { crossRefCsv, downloadCsv, type CrossCsvRow } from "@/lib/product-finder-csv";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BomCrossSuggestion } from "@/lib/catalog/bom-cross";

/** Hard cap on bulk cross lines. */
const BULK_CROSS_CAP = 100;

type BulkCrossRow = { input: string; suggestion: BomCrossSuggestion | null };

/** Split pasted/CSV text into part-number lines (first column of CSV rows). */
export function parseBulkCrossLines(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    if (out.length >= BULK_CROSS_CAP) break;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    out.push(trimmed);
  }
  return out;
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 12 0 12 0v4a8 8 0 00-8 8z" />
    </svg>
  );
}

export function BulkCrossModal() {
  const open = useProductFinder((s) => s.bulkCrossOpen);
  const setOpen = useProductFinder((s) => s.setBulkCrossOpen);
  const addToCart = useProductFinder((s) => s.addToCart);
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);

  const [text, setText] = useState("");
  const [matching, setMatching] = useState(false);
  const [rows, setRows] = useState<BulkCrossRow[] | null>(null);
  const [added, setAdded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleClose() {
    setOpen(false);
    setText("");
    setRows(null);
    setAdded(false);
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) handleClose();
  }
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") handleClose();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") {
        setText(content);
        setRows(null);
        setAdded(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleMatch() {
    const lines = parseBulkCrossLines(text);
    if (lines.length === 0) return;
    setMatching(true);
    setRows(null);
    setAdded(false);
    try {
      const suggestions = await apiCrossMatch(lines);
      setRows(lines.map((input, i) => ({ input, suggestion: suggestions[i] ?? null })));
    } finally {
      setMatching(false);
    }
  }

  function handleAddAll() {
    if (!rows) return;
    for (const r of rows) {
      if (r.suggestion) addToCart(r.suggestion.product, 1);
    }
    setAdded(true);
    setTimeout(() => handleClose(), 800);
  }

  function handleExport() {
    if (!rows) return;
    const csvRows: CrossCsvRow[] = rows.map((r) => {
      if (!r.suggestion) return { input: r.input };
      const s = r.suggestion;
      return {
        input: r.input,
        fromBrand: s.fromBrand,
        fromMpn: s.fromMpn,
        sku: s.product.sku,
        name: s.product.name,
        brand: s.product.brand,
        unitPrice: s.product.unitPrice,
        uom: s.product.uom,
        relation: s.relation,
        confidence: s.confidence,
        sourceUrl: s.sourceUrl,
      };
    });
    downloadCsv("meridian-cross-reference.csv", crossRefCsv(csvRows));
  }

  const total = rows ? rows.length : 0;
  const crossedCount = rows ? rows.filter((r) => r.suggestion !== null).length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Bulk cross-reference"
      tabIndex={-1}
    >
      <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-[#1D252D] px-6 py-4 rounded-t-xl">
          <div>
            <h2 className="text-white font-semibold text-lg [font-family:var(--font-titillium,'Arial_Bold',sans-serif)]">
              Bulk Cross-Reference
            </h2>
            <p className="text-[#B7C9D3] text-xs mt-0.5">
              Paste up to {BULK_CROSS_CAP} competitor part numbers — get the stocked equivalents we document
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-white/70 hover:text-white" aria-label="Close bulk cross-reference modal">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label htmlFor="bulk-cross-textarea" className="block text-sm font-medium text-[#1D252D] mb-1.5">
              Competitor / legacy part numbers
            </label>
            <textarea
              id="bulk-cross-textarea"
              value={text}
              onChange={(e) => { setText(e.target.value); setRows(null); setAdded(false); }}
              rows={7}
              placeholder={"One part number per line (CSV: first column):\n\nFRN-R-30\nQTP2X32T8/UNV-SC\nHBL5266C\nA1212CHFL"}
              className={cn(
                "w-full rounded-lg border border-[#B7C9D3] bg-white px-3 py-2 text-sm text-[#1D252D]",
                "placeholder:text-[#4F758B]/50 font-mono resize-y",
                "focus:outline-none focus:ring-2 focus:ring-[#00AA13] focus:border-[#00AA13]"
              )}
            />
            <p className="mt-1 text-xs text-[#4F758B]">
              Every match cites the document that states the cross. Up to {BULK_CROSS_CAP} lines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="sr-only"
              id="bulk-cross-file"
              aria-label="Upload .csv or .txt file"
              onChange={handleFileChange}
            />
            <label
              htmlFor="bulk-cross-file"
              className="cursor-pointer rounded-lg border border-[#B7C9D3] px-3 py-1.5 text-xs font-medium text-[#4F758B] hover:border-[#00AA13] hover:bg-[#00AA13]/10 hover:text-[#00AA13] transition-colors"
            >
              Upload .csv / .txt
            </label>
            <span className="text-xs text-[#4F758B]">— or paste above</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={handleMatch}
              disabled={matching || text.trim().length === 0}
              className={cn(
                "flex items-center gap-2 bg-[#00AA13] hover:bg-[#009911] text-white text-sm",
                (matching || text.trim().length === 0) && "opacity-60 cursor-not-allowed"
              )}
            >
              {matching && <SpinnerIcon />}
              {matching ? "Crossing…" : "Find equivalents"}
            </Button>
            {rows !== null && (
              <span className="text-sm text-[#4F758B]">
                <span className="font-semibold text-[#00573F]">{crossedCount}</span> of{" "}
                <span className="font-semibold text-[#1D252D]">{total}</span> crossed to a stocked equivalent
              </span>
            )}
            {added && <span className="text-sm font-semibold text-[#00AA13]">✓ Added to basket</span>}
          </div>

          {rows !== null && rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-[#B7C9D3]/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#B7C9D3]/60 text-left text-xs font-semibold text-[#4F758B]">
                    <th className="px-3 py-2">Input part</th>
                    <th className="px-3 py-2">Stocked equivalent</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-[#B7C9D3]/30 align-top last:border-0">
                      <td className="px-3 py-2 font-mono text-xs text-[#1D252D]">{r.input}</td>
                      <td className="px-3 py-2">
                        {r.suggestion ? (
                          <div>
                            <p className="text-sm font-medium text-[#1D252D]">{r.suggestion.product.name}</p>
                            <p className="text-xs text-[#4F758B]">
                              {r.suggestion.product.brand} · ${r.suggestion.product.unitPrice.toFixed(2)}/
                              {r.suggestion.product.uom} ·{" "}
                              <span className="font-semibold text-[#00573F]">{r.suggestion.confidence}%</span>{" "}
                              {r.suggestion.relation === "equivalent" ? "equivalent" : "substitute"}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            — no documented cross
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {r.suggestion && (
                          <a
                            href={r.suggestion.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#004986] underline underline-offset-2"
                          >
                            source ↗
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.suggestion && (
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailModalProduct(r.suggestion!.product)}
                              className="rounded border border-[#4F758B] px-2 py-0.5 text-[10px] font-medium text-[#4F758B] hover:border-[#1D252D] hover:text-[#1D252D]"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => addToCart(r.suggestion!.product, 1)}
                              className="rounded bg-[#00AA13] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#009911]"
                            >
                              + Add
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows !== null && rows.length === 0 && (
            <p className="text-sm text-[#4F758B] text-center py-4">No part numbers found. Paste some above.</p>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between border-t border-[#B7C9D3]/60 bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="text-sm border-[#B7C9D3] text-[#4F758B] hover:bg-gray-100">
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={!rows || rows.length === 0}
              className={cn("text-sm border-[#B7C9D3] text-[#1D252D]", (!rows || rows.length === 0) && "opacity-50 cursor-not-allowed")}
            >
              Export CSV
            </Button>
          </div>
          <Button
            type="button"
            onClick={handleAddAll}
            disabled={!rows || crossedCount === 0 || added}
            className={cn(
              "bg-[#1D252D] hover:bg-[#2d3843] text-white text-sm",
              (!rows || crossedCount === 0 || added) && "opacity-50 cursor-not-allowed"
            )}
          >
            Add {crossedCount > 0 ? `${crossedCount} crossed` : "crossed"} to basket
          </Button>
        </div>
      </div>
    </div>
  );
}
