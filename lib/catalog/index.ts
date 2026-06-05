import type { WescoProduct } from "@/features/product-finder/types";
import { generateCatalog } from "@/lib/catalog/generate";

export interface Catalog {
  products: WescoProduct[];
  byId: Map<string, WescoProduct>;
  haystack: string[];
}

function build(): Catalog {
  const products = generateCatalog();
  const byId = new Map(products.map((p) => [p.id, p]));
  const haystack = products.map((p) =>
    [p.name, p.sku, p.brand, p.category, p.subcategory, p.description, ...p.specs.map((s) => `${s.name} ${s.value}`)]
      .join(" ")
      .toLowerCase(),
  );
  return { products, byId, haystack };
}

// Cache on globalThis so warm serverless invocations and HMR reuse one instance.
const g = globalThis as unknown as { __wescoCatalog?: Catalog };
export function getCatalog(): Catalog {
  if (!g.__wescoCatalog) g.__wescoCatalog = build();
  return g.__wescoCatalog;
}
