import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import type { SuggestItem } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json({ items: [] });
  const terms = q.split(/\s+/).filter(Boolean);
  const { products, haystack } = getCatalog();
  const items: SuggestItem[] = [];
  for (let i = 0; i < products.length && items.length < 6; i++) {
    if (terms.every((t) => haystack[i].includes(t))) {
      const p = products[i];
      items.push({ id: p.id, name: p.name, sku: p.sku, brand: p.brand, imageIcon: p.imageIcon });
    }
  }
  return NextResponse.json({ items });
}
