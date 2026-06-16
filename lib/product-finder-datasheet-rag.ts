/**
 * Semantic datasheet RAG (#17) — answer dense spec/NEC questions grounded in the
 * catalog's datasheet/spec text.
 *
 * COST DESIGN (respects the hard cost guardrail):
 *  - RETRIEVAL is a pure, in-repo LEXICAL scorer — NO embeddings, NO vector DB,
 *    NO token cost. $0 always. (Semantic embeddings are a future upgrade if the
 *    budget allows; lexical retrieval keeps the seam free.)
 *  - GENERATION (the grounded answer) is gated on the existing ANTHROPIC_API_KEY,
 *    exactly like Ask Meridian. Dormant (no key) → the route returns the retrieved
 *    spec context EXTRACTIVELY (no model call, $0). Active → one cheap Claude Haiku
 *    call per question (no embedding index to build). The user opts in by adding
 *    the key; building/shipping this seam incurs nothing.
 *
 * This module is pure (retrieval + prompt building) and unit-tested; the model
 * call lives in /api/datasheet/ask.
 */

import type { CatalogProduct } from "@/features/product-finder/types";

export const RAG_MODEL_DEFAULT = "claude-haiku-4-5-20251001";
export const RAG_MAX_QUESTION = 1000;

export interface SpecChunk {
  productId: string;
  sku: string;
  name: string;
  specSheetUrl: string | null;
  /** The product's datasheet/spec text used for grounding. */
  text: string;
  /** 0..1 query-term coverage. */
  score: number;
}

const STOP = new Set([
  "the", "a", "an", "of", "for", "to", "is", "in", "on", "at", "and", "or", "with",
  "what", "which", "does", "do", "how", "i", "my", "this", "that", "it", "are", "be",
]);

function tokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+(?:[./-][a-z0-9]+)*/g) ?? []).filter(
    (t) => t.length > 1 && !STOP.has(t),
  );
}

/** Build the searchable datasheet text for a product (name + brand + specs + description). */
export function productSpecText(p: CatalogProduct): string {
  const specs = p.specs.map((s) => `${s.name}: ${s.value}`).join("; ");
  return [p.name, p.brand, p.subcategory, p.description, specs].filter(Boolean).join(". ");
}

/**
 * Pure LEXICAL retrieval over product datasheet text — no embeddings, $0. Scores
 * each product by how many DISTINCT query tokens its spec text covers, returns the
 * top-k chunks for grounding (ties broken by name). Products with zero overlap are
 * dropped; an all-stopword query returns nothing.
 */
export function retrieveSpecChunks(query: string, products: CatalogProduct[], k = 6): SpecChunk[] {
  const qTokens = [...new Set(tokens(query))];
  if (qTokens.length === 0) return [];
  const scored: SpecChunk[] = [];
  for (const p of products) {
    const text = productSpecText(p);
    const hay = new Set(tokens(text));
    let hits = 0;
    for (const t of qTokens) if (hay.has(t)) hits += 1;
    if (hits === 0) continue;
    scored.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      specSheetUrl: p.specSheetUrl ?? null,
      text,
      score: hits / qTokens.length,
    });
  }
  return scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, k);
}

export const RAG_SYSTEM_PROMPT = [
  "You are the Meridian datasheet assistant for an electrical/industrial distributor.",
  "Answer the question ONLY from the provided product spec/datasheet context. Cite the product by BRAND + SKU.",
  "If the answer is not in the provided specs, say so plainly — NEVER invent a spec, rating, or value.",
  "For NEC / electrical-engineering questions (voltage drop, ampacity, conduit fill, OCPD sizing), show the relevant spec value and which product it came from, and remind the rep to verify against the applicable code edition.",
  "Be concise: a sentence or two plus the part(s).",
].join("\n");

/** Pure: the grounded user message from the question + retrieved chunks. */
export function buildRagUserContent(question: string, chunks: SpecChunk[]): string {
  const ctx = chunks.map((c, i) => `[${i + 1}] ${c.name} (SKU ${c.sku})\n${c.text}`).join("\n\n");
  return `Question: ${question}\n\nProduct spec context:\n${ctx || "(no matching products)"}`;
}

/** Extractive fallback (NO model) — the retrieved context, for the dormant state. */
export function extractiveAnswer(chunks: SpecChunk[]): string {
  if (chunks.length === 0) {
    return "No products matched that question. Try a SKU or a more specific spec term.";
  }
  const top = chunks[0];
  return [
    `Closest match: ${top.name} (SKU ${top.sku}).`,
    top.text,
    top.specSheetUrl ? `Datasheet: ${top.specSheetUrl}` : "",
    "(Grounded AI answers activate when ANTHROPIC_API_KEY is set — this is the retrieved spec context, no model used.)",
  ]
    .filter(Boolean)
    .join("\n");
}
