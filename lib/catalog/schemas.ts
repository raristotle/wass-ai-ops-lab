import { z } from "zod";

const csv = (v: string | null): string[] | undefined =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

export const SortKeySchema = z.enum(["relevance", "preferred", "branchStock", "priceLow", "priceHigh", "brand"]);

export function parseSearchQuery(sp: URLSearchParams) {
  const num = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const bool = (k: string) => sp.get(k) === "true";
  return {
    text: sp.get("q") ?? "",
    filters: {
      categories: csv(sp.get("category")) as ("electrical" | "datacom" | "oem-electrical" | "av" | "security" | "safety")[] | undefined,
      subcategories: csv(sp.get("subcategory")),
      brands: csv(sp.get("brand")),
      onlyBranchStock: bool("onlyBranchStock"),
      onlyDCStock: bool("onlyDCStock"),
      onlyPreferred: bool("onlyPreferred"),
      priceMin: num("priceMin"),
      priceMax: num("priceMax"),
    },
    sort: SortKeySchema.catch("relevance").parse(sp.get("sort") ?? "relevance"),
    page: Math.max(0, Number(sp.get("page") ?? 0) || 0),
    pageSize: Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 24) || 24)),
  };
}
