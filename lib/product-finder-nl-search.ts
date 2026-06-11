import { ALL_BRANDS } from "@/data/mock/catalog-products";
import { applySynonyms } from "@/lib/product-finder-synonyms";
import type { ParsedFilter, ParsedFilterKind, ParsedQuery, ProductCategory } from "@/features/product-finder/types";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Keep in sync with the ProductCategory union in features/product-finder/types.ts.
const CATEGORIES: ProductCategory[] = ["electrical", "datacom", "oem-electrical", "av", "security", "safety"];

export function parseQuery(raw: string): ParsedQuery {
  // Trade-slang expansion runs FIRST so every later pass sees catalog terms.
  const synonyms = applySynonyms(raw);
  let working = ` ${synonyms.text.toLowerCase()} `;
  const filters: ParsedFilter[] = [];
  const push = (kind: ParsedFilterKind, label: string, value: string | number | boolean) =>
    filters.push({ id: `${kind}:${value}`, kind, label, value });

  // Subcategory chips from applied synonyms (e.g. "romex" → Wire & Cable).
  const pushedSubcategories = new Set<string>();
  for (const applied of synonyms.applied) {
    if (applied.subcategory !== undefined && !pushedSubcategories.has(applied.subcategory)) {
      pushedSubcategories.add(applied.subcategory);
      push("subcategory", `In ${applied.subcategory}`, applied.subcategory);
    }
  }

  // Price range first. Require at least one '$' so product specs such as
  // "12-2" (NM cable) or "10-32" (screw thread) are NOT read as price ranges.
  const range = working.match(
    /\$\s*(\d+(?:\.\d+)?)\s*(?:-|to)\s*\$?\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:-|to)\s*\$\s*(\d+(?:\.\d+)?)/,
  );
  if (range) {
    const lo = Number(range[1] ?? range[3]);
    const hi = Number(range[2] ?? range[4]);
    const min = Math.min(lo, hi);
    const max = Math.max(lo, hi);
    push("priceMin", `Over $${min}`, min);
    push("priceMax", `Under $${max}`, max);
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

  // Category (longest first so "oem-electrical" is matched before "electrical")
  for (const cat of [...CATEGORIES].sort((a, b) => b.length - a.length)) {
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
