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

  // Parse spec.<Name>=v1,v2 params into specFilters
  // spec names arrive URL-encoded; URLSearchParams decodes keys automatically
  const specFilters: Record<string, string[]> = {};
  for (const [key, val] of sp.entries()) {
    if (key.startsWith("spec.")) {
      const name = key.slice(5); // strip "spec." prefix — already decoded by URLSearchParams
      if (name) {
        const values = val.split(",").map((v) => decodeURIComponent(v.trim())).filter(Boolean);
        if (values.length > 0) {
          specFilters[name] = values;
        }
      }
    }
  }

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
      specFilters: Object.keys(specFilters).length > 0 ? specFilters : undefined,
    },
    sort: SortKeySchema.catch("relevance").parse(sp.get("sort") ?? "relevance"),
    page: Math.max(0, Number(sp.get("page") ?? 0) || 0),
    pageSize: Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 24) || 24)),
  };
}
