"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CatalogProduct, ExternalSource } from "@/features/product-finder/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  product: CatalogProduct;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bestPriceIndex(sources: ExternalSource[]): number {
  let minIdx = 0;
  for (let i = 1; i < sources.length; i++) {
    if (sources[i].price < sources[minIdx].price) minIdx = i;
  }
  return minIdx;
}

function statusConfig(status: ExternalSource["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "in-stock":
      return { label: "In Stock", className: "bg-[#00AA13] text-white border-0" };
    case "low-stock":
      return { label: "Low Stock", className: "bg-[#EAAA00] text-white border-0" };
    case "out-of-stock":
      return { label: "Order Only", className: "bg-gray-300 text-gray-700 border-0" };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExternalSourcesCard({ product }: Props) {
  const { externalSources } = product;

  if (externalSources.length === 0) return null;

  const best = bestPriceIndex(externalSources);

  return (
    <Card
      className={cn(
        "border-l-4 border-l-[#64CCC9] border-t border-r border-b border-[#B7C9D3] shadow-sm overflow-hidden"
      )}
    >
      {/* Accent header bar */}
      <div className="bg-[#64CCC9]/15 border-b border-[#64CCC9]/30 px-4 py-3 flex items-center gap-2">
        {/* Info icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 text-[#64CCC9] flex-shrink-0"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <h3 className="text-sm font-semibold text-[#1D252D]">
            Available at External Distributors
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Not in stock at Wesco &mdash; verified external availability:
          </p>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#4F758B] w-[30%]">
                  Distributor
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#4F758B]">
                  Qty
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#4F758B]">
                  Unit Price
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#4F758B]">
                  Status
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#4F758B]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {externalSources.map((source, idx) => {
                const { label, className: statusCls } = statusConfig(source.status);
                const isBest = idx === best;
                return (
                  <tr
                    key={`${source.distributor}-${idx}`}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    {/* Distributor chip */}
                    <td className="px-4 py-3 align-middle">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#1D252D]/10 text-[#1D252D] text-xs font-medium">
                        {source.distributor}
                      </span>
                      {source.leadTime && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Lead: {source.leadTime}
                        </p>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="px-4 py-3 text-right align-middle text-[#1D252D]">
                      {source.quantity.toLocaleString()}
                    </td>

                    {/* Price */}
                    <td
                      className={cn(
                        "px-4 py-3 text-right align-middle font-semibold",
                        isBest ? "text-[#00AA13]" : "text-[#1D252D]"
                      )}
                    >
                      ${source.price.toFixed(2)}
                      {isBest && (
                        <span className="ml-1 text-xs bg-[#00AA13]/10 text-[#00AA13] px-1 py-0.5 rounded">
                          Best
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 text-center align-middle">
                      <Badge className={cn("text-xs", statusCls)}>{label}</Badge>
                    </td>

                    {/* Action link */}
                    <td className="px-4 py-3 text-center align-middle">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-[#004986] hover:text-[#64CCC9] hover:underline transition-colors inline-flex items-center gap-0.5"
                      >
                        Visit Site
                        <span aria-hidden="true"> &rarr;</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-400 px-4 py-2.5 border-t border-gray-100 leading-relaxed">
          Prices and availability sourced externally. Wesco is not responsible for third-party
          pricing.
        </p>
      </CardContent>
    </Card>
  );
}
