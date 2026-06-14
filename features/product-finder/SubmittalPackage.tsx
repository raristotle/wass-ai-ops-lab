import type { CatalogProduct } from "@/features/product-finder/types";
import { getBrand, type BrandProfile } from "@/lib/brand";

interface SubmittalPackageProps {
  items: { product: CatalogProduct; qty: number }[];
  customer: string;
  project: string;
  packageNumber: string;
  dateLabel: string;
  preparedBy?: string;
  /** Active white-label brand; defaults to the configured default. */
  brand?: BrandProfile;
}

/**
 * Print-ready submittal package: a cover page plus one spec sheet per basket
 * item (full specification table with Required flags). Rendered inside the cart
 * drawer behind the same print isolation as the quote sheet — on screen it's a
 * scrollable preview; on print it fills the page.
 */
export function SubmittalPackage({
  items, customer, project, packageNumber, dateLabel, preparedBy, brand,
}: SubmittalPackageProps) {
  const b = brand ?? getBrand(null);
  return (
    <div className="text-[#1D252D]">
      {/* ── Cover page ───────────────────────────────────────── */}
      <div className="border-b-2 border-[#1D252D] pb-6 mb-6 print:break-after-page">
        <div className="flex items-center gap-2 mb-6">
          <span
            className="inline-flex items-center justify-center rounded px-2 py-1 text-xs font-bold tracking-widest text-white"
            style={{ backgroundColor: b.accent }}
          >
            {b.logoMark}
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#4F758B]">{b.logoSub}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-wide">SUBMITTAL PACKAGE</h1>
        <p className="mt-1 text-sm text-[#4F758B]">Product data sheets for approval</p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><dt className="text-[#4F758B]">Package No.</dt><dd className="font-semibold">{packageNumber}</dd></div>
          <div><dt className="text-[#4F758B]">Date</dt><dd className="font-semibold">{dateLabel}</dd></div>
          <div><dt className="text-[#4F758B]">Customer</dt><dd className="font-semibold">{customer || "—"}</dd></div>
          <div><dt className="text-[#4F758B]">Project / PO</dt><dd className="font-semibold">{project || "—"}</dd></div>
          {preparedBy && <div><dt className="text-[#4F758B]">Prepared by</dt><dd className="font-semibold">{preparedBy}</dd></div>}
          <div><dt className="text-[#4F758B]">Items</dt><dd className="font-semibold">{items.length}</dd></div>
        </dl>

        {/* Index */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-[#B7C9D3] text-left text-[#4F758B]">
              <th className="py-1.5 font-semibold">#</th>
              <th className="py-1.5 font-semibold">Product</th>
              <th className="py-1.5 font-semibold">SKU</th>
              <th className="py-1.5 text-right font-semibold">Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ product, qty }, i) => (
              <tr key={product.id} className="border-b border-[#B7C9D3]/40">
                <td className="py-1.5">{i + 1}</td>
                <td className="py-1.5">{product.name}</td>
                <td className="py-1.5 font-mono text-xs">{product.sku}</td>
                <td className="py-1.5 text-right">{qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── One spec sheet per item ──────────────────────────── */}
      {items.map(({ product, qty }, i) => (
        <section key={product.id} className="mb-8 print:break-inside-avoid">
          <div className="flex items-baseline justify-between gap-3 border-b border-[#1D252D] pb-1">
            <h2 className="text-lg font-bold">
              {i + 1}. {product.name}
            </h2>
            <span className="text-xs text-[#4F758B]">Qty {qty}</span>
          </div>
          <p className="mt-1 text-xs text-[#4F758B]">
            {product.brand} · SKU {product.sku} · {product.subcategory}
          </p>
          <p className="mt-1 text-sm">{product.description}</p>

          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-[#B7C9D3] text-left text-[#4F758B]">
                <th className="py-1 font-semibold">Specification</th>
                <th className="py-1 font-semibold">Value</th>
                <th className="py-1 text-right font-semibold">Required</th>
              </tr>
            </thead>
            <tbody>
              {product.specs.map((s) => (
                <tr key={s.name} className="border-b border-[#B7C9D3]/30">
                  <td className="py-1 text-[#4F758B]">{s.name}</td>
                  <td className="py-1 font-medium">{s.value}</td>
                  <td className="py-1 text-right">
                    {s.isNonNeg ? <span className="font-semibold text-[#00573F]">Yes</span> : <span className="text-[#B7C9D3]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <p className="mt-6 text-[10px] italic text-[#4F758B]">
        Generated by {b.name} Product Finder. Specifications are representative; confirm against the manufacturer&apos;s datasheet before installation.
      </p>
    </div>
  );
}
