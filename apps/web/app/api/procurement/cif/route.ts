import { getCatalog } from "@/lib/catalog/index";
import { unspscCode } from "@/lib/catalog/unspsc";
import { buildCif, type CifRow } from "@/lib/procurement/cif";
import { punchoutStartUrl } from "@/lib/procurement/punchout-setup";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

// CIF 3.0 static catalog export for Ariba / SAP. Capped sample by default; each
// row carries the item's Level-2 punchout deep link. Generator is pure/tested;
// here we map catalog products to CIF rows and stream the flat file.
const CAP = 1000;
const SUPPLIER_ID = "0000000000"; // demo DUNS
const SUPPLIER_NAME = "Meridian Supply Co.";

function estLeadDays(p: CatalogProduct): number {
  const branch = p.branchStock.reduce((s, b) => s + b.quantity, 0);
  const dc = p.dcStock.reduce((s, d) => s + d.quantity, 0);
  return branch > 0 ? 2 : dc > 0 ? 4 : 10;
}

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 12, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    const url = new URL(req.url);
    const limit = Math.min(CAP, Math.max(1, Number(url.searchParams.get("limit")) || 200));
    const base = url.origin;
    const rows: CifRow[] = getCatalog()
      .products.slice(0, limit)
      .map((p) => ({
        sku: p.sku,
        manufacturerPartId: p.sku,
        description: p.name,
        unspsc: unspscCode(p),
        unitPrice: p.unitPrice,
        uom: p.uom,
        leadTimeDays: estLeadDays(p),
        manufacturerName: p.brand,
        supplierUrl: punchoutStartUrl(base, p.sku),
      }));
    const cif = buildCif({ supplierId: SUPPLIER_ID, supplierName: SUPPLIER_NAME, timestamp: new Date().toISOString(), rows });
    return new Response(cif, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="meridian-catalog.cif"',
        "X-Catalog-Items": String(rows.length),
      },
    });
  } catch (e) {
    logApiError("/api/procurement/cif", e);
    return new Response("CIF export failed.", { status: 500 });
  }
}
