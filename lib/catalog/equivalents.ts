import type { WescoProduct } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";
import { scoreProduct } from "@/lib/product-finder-scoring";

export function findEquivalents(product: WescoProduct, k = 8, branchId?: string): WescoProduct[] {
  const { products } = getCatalog();
  let pool = products.filter((p) => p.id !== product.id && p.subcategory === product.subcategory);
  if (pool.length < k) {
    const extra = products.filter(
      (p) => p.id !== product.id && p.category === product.category && p.subcategory !== product.subcategory,
    );
    pool = pool.concat(extra);
  }
  return pool
    .map((p) => ({ p, score: scoreProduct(p, product, branchId).total }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.p);
}
