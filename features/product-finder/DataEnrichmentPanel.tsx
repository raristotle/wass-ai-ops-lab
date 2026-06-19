"use client";

import { brandEntityFor } from "@/lib/catalog/brand-entity";
import { etimCoverage } from "@/lib/catalog/etim-specs";
import { substancesForProduct } from "@/lib/catalog/compliance-substances";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Ingested-data enrichment (v-DI #1) for the product detail view — surfaces the
 * real, sourced data layers: the manufacturer ENTITY (parent / ultimate parent /
 * GLEIF LEI / former names — entity resolution), the ETIM attribute class +
 * required-spec coverage (attributes), and the regulatory substances a product
 * may contain (compliance). All client-side pure lookups over the shipped
 * datasets; renders only the sections that have data.
 */
const LIST_COLOR: Record<string, string> = {
  "REACH-SVHC": "#DB6B30",
  RoHS: "#004986",
  Prop65: "#854F0B",
};

export function DataEnrichmentPanel({ product }: { product: CatalogProduct }) {
  const entity = brandEntityFor(product.brand);
  const etim = etimCoverage(product);
  const substances = substancesForProduct(product);

  if (!entity && !etim && substances.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-[#B7C9D3] bg-[#F8FAFB] px-4 py-3 text-xs">
      {/* Manufacturer entity */}
      {entity && (
        <div className="mb-2">
          <p className="font-semibold text-[#1D252D]">🏢 Manufacturer</p>
          <p className="mt-0.5 text-[#4F758B]">
            {entity.parentCompany && entity.parentCompany !== product.brand ? (
              <>
                <span className="text-[#1D252D]">{product.brand}</span> · part of{" "}
                <span className="font-medium text-[#1D252D]">{entity.parentCompany}</span>
                {entity.ultimateParent && entity.ultimateParent !== entity.parentCompany ? (
                  <> (ultimately {entity.ultimateParent})</>
                ) : null}
              </>
            ) : (
              <span className="text-[#1D252D]">{entity.ultimateParent ?? product.brand}</span>
            )}
            {entity.lei ? <> · LEI <span className="font-mono">{entity.lei}</span></> : null}
          </p>
          {entity.formerNames.length > 0 && (
            <p className="mt-0.5 text-[11px] text-[#4F758B]">Formerly: {entity.formerNames.join(", ")}</p>
          )}
        </div>
      )}

      {/* ETIM attribute class + coverage */}
      {etim && (
        <div className="mb-2">
          <p className="font-semibold text-[#1D252D]">
            📐 ETIM {etim.classCode || "class"}
            <span className="ml-1 font-normal text-[#4F758B]">{etim.className}</span>
          </p>
          <p className="mt-0.5 text-[#4F758B]">
            {etim.present.length}/{etim.required.length} required specs ({etim.coveragePct}%)
            {etim.missing.length > 0 && (
              <span className="text-[#DB6B30]"> · missing: {etim.missing.slice(0, 3).join("; ")}{etim.missing.length > 3 ? "…" : ""}</span>
            )}
          </p>
        </div>
      )}

      {/* Compliance substances */}
      {substances.length > 0 && (
        <div>
          <p className="font-semibold text-[#1D252D]">⚠ May contain (from stated materials)</p>
          <ul className="mt-0.5 space-y-0.5">
            {substances.slice(0, 4).map((s) => (
              <li key={s.cas} className="text-[#4F758B]">
                {s.name.replace(/\s*\(.*\)$/, "")} <span className="font-mono text-[10px]">CAS {s.cas}</span>{" "}
                {s.lists.map((l) => (
                  <span
                    key={l}
                    className="ml-0.5 rounded px-1 py-0 text-[9px] font-bold text-white"
                    style={{ backgroundColor: LIST_COLOR[l] ?? "#4F758B" }}
                  >
                    {l}
                  </span>
                ))}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[10px] italic text-[#4F758B]">
            Indicative — inferred from stated materials against the ECHA REACH SVHC, EU RoHS, and CA Prop 65 lists.
            Confirm with the manufacturer's declaration.
          </p>
        </div>
      )}
    </div>
  );
}
