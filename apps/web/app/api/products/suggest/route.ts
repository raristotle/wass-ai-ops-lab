import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { crosswalkIndex, resolveCustomerNumber } from "@/lib/catalog/crosswalk";
import { getStore, forTenant } from "@/lib/server/persistence";
import { tenantForRequest } from "@/lib/server/api-auth";
import type { SuggestItem } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("q") ?? "").trim();
  const q = raw.toLowerCase();
  if (!q) return NextResponse.json({ items: [] });

  const items: SuggestItem[] = [];

  // Customer catalog-number match first: if the typed query is a customer's own
  // number, surface the carried product it maps to (labeled with their number).
  const tenant = tenantForRequest(req);
  const hit = resolveCustomerNumber(await crosswalkIndex(forTenant(getStore(), tenant), tenant ?? "global"), raw);
  if (hit) {
    const p = resolveBySku(hit.sku);
    if (p) items.push({ id: p.id, name: p.name, sku: p.sku, brand: p.brand, imageIcon: p.imageIcon, customerNumber: hit.customerNumber });
  }

  const terms = q.split(/\s+/).filter(Boolean);
  const { products, haystack } = getCatalog();
  for (let i = 0; i < products.length && items.length < 6; i++) {
    if (terms.every((t) => haystack[i].includes(t))) {
      const p = products[i];
      if (items.some((it) => it.id === p.id)) continue; // don't duplicate the crosswalk hit
      items.push({ id: p.id, name: p.name, sku: p.sku, brand: p.brand, imageIcon: p.imageIcon });
    }
  }
  return NextResponse.json({ items });
}
