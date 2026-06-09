"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useProductFinder, selectActiveCustomer } from "@/lib/product-finder-store";
import { parseBomLines } from "@/lib/product-finder-bom";
import { apiResolve } from "@/lib/product-finder-api";
import { getPricingProvider } from "@/lib/integration/index";
import { resolveBulk, bulkQuoteCsv, matchedCount, type BulkRow } from "@/lib/product-finder-bulk-quote";
import { downloadCsv } from "@/lib/product-finder-csv";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/features/product-finder/types";

const VIA_LABEL: Record<string, string> = { sku: "SKU", "cross-ref": "Cross-ref", search: "Search" };
const VIA_COLOR: Record<string, string> = { sku: "#004986", "cross-ref": "#00573F", search: "#4F758B" };

export function BulkQuoteModal() {
  const open = useProductFinder((s) => s.bulkModalOpen);
  const setOpen = useProductFinder((s) => s.setBulkModalOpen);
  const addToCart = useProductFinder((s) => s.addToCart);
  const activeCustomer = useProductFinder(selectActiveCustomer);
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [rows, setRows] = useState<BulkRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const close = () => { setOpen(false); setRows(null); setText(""); };

  async function handleResolve() {
    const parsed = parseBomLines(text);
    if (parsed.length === 0) { setRows([]); return; }
    setLoading(true);
    const priceFn = (product: CatalogProduct, qty: number) =>
      getPricingProvider().getPricing(product, { customer: activeCustomer, qty }).effectiveUnitPrice;
    const result = await resolveBulk(parsed, apiResolve, priceFn);
    setRows(result);
    setLoading(false);
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  const matched = rows ? matchedCount(rows) : 0;
  const grandTotal = rows ? rows.reduce((s, r) => s + (r.lineTotal ?? 0), 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Bulk price and availability">
      <div className="relative my-8 w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 rounded-t-xl bg-[#1D252D] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Bulk Price &amp; Availability</h2>
            <p className="text-xs text-[#B7C9D3]">Paste SKUs, competitor part numbers, or descriptions — one per line.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="text-2xl font-light leading-none text-white/80 hover:text-white">&#x2715;</button>
        </div>

        <div className="px-6 py-5">
          {rows === null ? (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder={"QO115\nGRN-1A2B3C4D\n12x 20A breaker\nCAT6-BLU-1000"}
                aria-label="Bulk input"
                className="w-full resize-y rounded border border-[#B7C9D3] px-3 py-2 font-mono text-sm text-[#1D252D] placeholder:text-[#B7C9D3] focus:border-[#4F758B] focus:outline-none"
              />
              <div className="mt-3 flex items-center gap-2">
                <Button onClick={handleResolve} disabled={loading || text.trim() === ""} className="bg-[#00AA13] text-white hover:bg-[#009911]">
                  {loading ? "Resolving…" : "Get Prices & Stock"}
                </Button>
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" aria-label="Upload list" />
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="border-[#4F758B] text-[#4F758B]">Upload .csv / .txt</Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm text-[#1D252D]">
                  <span className="font-semibold">{matched}</span> of {rows.length} resolved ·{" "}
                  <span className="font-semibold">${grandTotal.toFixed(2)}</span> total
                </p>
                <button type="button" onClick={() => setRows(null)} className="text-xs text-[#4F758B] underline hover:text-[#1D252D]">← Edit list</button>
              </div>

              <div className="max-h-[50vh] overflow-auto rounded border border-[#B7C9D3]">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#F8FAFB] text-[#4F758B]">
                    <tr>
                      <th className="px-2 py-1.5 font-semibold">Qty</th>
                      <th className="px-2 py-1.5 font-semibold">Input</th>
                      <th className="px-2 py-1.5 font-semibold">Matched</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Unit</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Total</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-[#B7C9D3]/40">
                        <td className="px-2 py-1.5 font-mono text-[#4F758B]">{r.qty}</td>
                        <td className="px-2 py-1.5"><span className="block max-w-[120px] truncate" title={r.query}>{r.query}</span></td>
                        <td className="px-2 py-1.5">
                          {r.product ? (
                            <div className="flex items-center gap-1.5">
                              <span className="min-w-0">
                                <span className="block max-w-[180px] truncate font-medium text-[#1D252D]">{r.product.name}</span>
                                <span className="text-[10px] text-[#4F758B]">{r.product.sku}</span>
                              </span>
                              {r.matchedVia && (
                                <span className="rounded px-1 py-0.5 text-[8px] font-semibold uppercase text-white" style={{ backgroundColor: VIA_COLOR[r.matchedVia] }}>
                                  {VIA_LABEL[r.matchedVia]}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#DB6B30]">Not found</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right text-[#1D252D]">{r.unitPrice !== null ? `$${r.unitPrice.toFixed(2)}` : "—"}</td>
                        <td className="px-2 py-1.5 text-right font-semibold text-[#1D252D]">{r.lineTotal !== null ? `$${r.lineTotal.toFixed(2)}` : "—"}</td>
                        <td className="px-2 py-1.5 text-right">
                          {r.available === null ? "—" : (
                            <span className={cn("font-semibold", r.available > 0 ? "text-[#00AA13]" : "text-[#DB6B30]")}>{r.available}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={() => downloadCsv("bulk-quote.csv", bulkQuoteCsv(rows))} className="bg-[#004986] text-white hover:bg-[#003a6d]">Export CSV</Button>
                <Button
                  variant="outline"
                  disabled={matched === 0}
                  onClick={() => { for (const r of rows) if (r.product) addToCart(r.product, r.qty); close(); }}
                  className="border-[#00AA13] text-[#00AA13] hover:bg-[#00AA13]/10"
                >
                  Add {matched} matched to basket
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
