import { ALL_BRANDS } from "@/data/mock/wesco-products";
import type { ParsedFilter, ParsedFilterKind, ParsedQuery, ProductCategory } from "@/features/product-finder/types";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const CATEGORIES: ProductCategory[] = ["electrical", "datacom"];

export function parseQuery(raw: string): ParsedQuery {
  let working = ` ${raw.toLowerCase()} `;
  const filters: ParsedFilter[] = [];
  const push = (kind: ParsedFilterKind, label: string, value: string | number | boolean) =>
    filters.push({ id: `${kind}:${value}`, kind, label, value });

  // Price range first ($10-$30 / 10 to 30)
  const range = working.match(/\$?(\d+(?:\.\d+)?)\s*(?:-|to)\s*\$?(\d+(?:\.\d+)?)/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    push("priceMin", `Over $${lo}`, lo);
    push("priceMax", `Under $${hi}`, hi);
    working = working.replace(range[0], " ");
  } else {
    const under = working.match(/(?:under|below|less than|<)\s*\$?(\d+(?:\.\d+)?)/);
    if (under) {
      push("priceMax", `Under $${Number(under[1])}`, Number(under[1]));
      working = working.replace(under[0], " ");
    }
    const over = working.match(/(?:over|above|more than|>)\s*\$?(\d+(?:\.\d+)?)/);
    if (over) {
      push("priceMin", `Over $${Number(over[1])}`, Number(over[1]));
      working = working.replace(over[0], " ");
    }
  }

  // Stock
  if (/\b(in[ -]?stock|at my branch)\b/.test(working)) {
    push("branchStock", "In stock", true);
    working = working.replace(/\b(in[ -]?stock|at my branch)\b/g, " ");
  }

  // Preferred
  if (/\bpreferred\b/.test(working)) {
    push("preferred", "Preferred", true);
    working = working.replace(/\bpreferred\b/g, " ");
  }

  // Category
  for (const cat of CATEGORIES) {
    const re = new RegExp(`\\b${cat}\\b`);
    if (re.test(working)) {
      push("category", cat.charAt(0).toUpperCase() + cat.slice(1), cat);
      working = working.replace(re, " ");
    }
  }

  // Brand (longest first so multi-word brands win)
  for (const brand of [...ALL_BRANDS].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${escapeRe(brand.toLowerCase())}\\b`);
    if (re.test(working)) {
      push("brand", brand, brand);
      working = working.replace(re, " ");
    }
  }

  const text = working.replace(/\s+/g, " ").trim();
  return { text, filters };
}
