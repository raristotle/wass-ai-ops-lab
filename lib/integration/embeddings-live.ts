/**
 * Embeddings seam for semantic product search (v4-S3 #4) — env-gated DORMANT,
 * provider-agnostic. Generates text embeddings ONLY when EMBEDDINGS_API_KEY is
 * set; otherwise every call returns null and search falls back to the shipped
 * keyword + fuzzy RRF — $0, zero network, identical to today.
 *
 * Default provider is Voyage AI (voyage-4-lite, 1024-dim): its voyage-4 family
 * includes the first 200M tokens free per account, so a one-time offline
 * embedding of the ~200k-product catalog (~30M tokens) is $0, and only the short
 * query is embedded per request. OpenAI (text-embedding-3-small) and Cohere
 * (embed-v4.0) are supported too; all are normalized to 1024 dims so the pgvector
 * column width is fixed. Anthropic has no first-party embeddings API (they
 * recommend Voyage), so there is no "reuse ANTHROPIC_API_KEY" path here.
 *
 *   EMBEDDINGS_API_KEY   — the gate (Bearer token for the chosen provider).
 *   EMBEDDINGS_PROVIDER  — voyage | openai | cohere (default voyage).
 *   EMBEDDINGS_MODEL     — optional model override.
 *
 * Server-only; the key never reaches the client. Raw fetch, no SDK.
 */

import { logApiError } from "@/lib/server/log";
import { brandEntityFor } from "@/lib/catalog/brand-entity";
import { etimClassFor } from "@/lib/catalog/etim-specs";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export type EmbeddingProvider = "voyage" | "openai" | "cohere";
export type EmbeddingInputType = "document" | "query";

/** Fixed vector width — the pgvector column is vector(1024); all providers emit 1024. */
export const EMBEDDING_DIM = 1024;

/** True only when an embeddings key is present. Single source of dormancy. */
export function embeddingsConfigured(): boolean {
  return Boolean(env("EMBEDDINGS_API_KEY"));
}

export function embeddingProvider(): EmbeddingProvider {
  const p = (env("EMBEDDINGS_PROVIDER") ?? "voyage").toLowerCase();
  return p === "openai" || p === "cohere" ? p : "voyage";
}

function defaultModel(p: EmbeddingProvider): string {
  return p === "openai" ? "text-embedding-3-small" : p === "cohere" ? "embed-v4.0" : "voyage-4-lite";
}

export function embeddingModel(): string {
  return env("EMBEDDINGS_MODEL") ?? defaultModel(embeddingProvider());
}

export interface EmbeddingRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

/** Pure: build the provider-specific HTTP request. Unit-tested per provider. */
export function buildEmbeddingRequest(
  provider: EmbeddingProvider,
  model: string,
  texts: string[],
  inputType: EmbeddingInputType,
  key: string,
): EmbeddingRequest {
  const auth = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  if (provider === "openai") {
    return {
      url: "https://api.openai.com/v1/embeddings",
      headers: auth,
      body: { model, input: texts, dimensions: EMBEDDING_DIM },
    };
  }
  if (provider === "cohere") {
    return {
      url: "https://api.cohere.com/v2/embed",
      headers: auth,
      body: {
        model,
        texts,
        input_type: inputType === "query" ? "search_query" : "search_document",
        output_dimension: EMBEDDING_DIM,
        embedding_types: ["float"],
      },
    };
  }
  // voyage (default)
  return {
    url: "https://api.voyageai.com/v1/embeddings",
    headers: auth,
    body: { model, input: texts, input_type: inputType, output_dimension: EMBEDDING_DIM },
  };
}

/** Pure: extract the vector array from a provider response, or null on a bad shape. */
export function parseEmbeddingResponse(provider: EmbeddingProvider, json: unknown): number[][] | null {
  if (!json || typeof json !== "object") return null;
  if (provider === "cohere") {
    const e = (json as { embeddings?: { float?: unknown } }).embeddings?.float;
    return Array.isArray(e) ? (e as number[][]) : null;
  }
  // voyage + openai share { data: [{ embedding: number[] }] }
  const data = (json as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  const out = data.map((d) => (d as { embedding?: unknown }).embedding).filter((v): v is number[] => Array.isArray(v));
  return out.length === data.length ? out : null;
}

/**
 * Embed a batch of texts. Dormant (no network) when the key is unset; fail-soft
 * to null on any error. `inputType` is "document" for the catalog backfill and
 * "query" for a search query (asymmetric retrieval).
 */
export async function embedTexts(texts: string[], inputType: EmbeddingInputType): Promise<number[][] | null> {
  const key = env("EMBEDDINGS_API_KEY");
  if (!key || texts.length === 0) return null; // ← dormant: no key ⇒ no network
  const provider = embeddingProvider();
  const model = embeddingModel();
  const { url, headers, body } = buildEmbeddingRequest(provider, model, texts, inputType, key);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      logApiError("embeddings", new Error(`Embeddings HTTP ${res.status}`), { provider });
      return null;
    }
    const json = await res.json().catch(() => null);
    const vecs = parseEmbeddingResponse(provider, json);
    return vecs && vecs.length === texts.length ? vecs : null;
  } catch (e) {
    logApiError("embeddings", e);
    return null;
  }
}

/** Embed a single query string, or null when dormant / on error. */
export async function embedQuery(text: string): Promise<number[] | null> {
  const out = await embedTexts([text], "query");
  return out ? out[0] : null;
}

/** The text we embed per product: name + brand + subcategory + spec values. */
export function productEmbeddingText(p: {
  name: string;
  brand: string;
  subcategory: string;
  specs?: { name: string; value: string }[];
}): string {
  const specs = (p.specs ?? []).map((s) => `${s.name} ${s.value}`).join(" ");
  return `${p.name} ${p.brand} ${p.subcategory} ${specs}`.replace(/\s+/g, " ").trim();
}

/**
 * Embedding text enriched with the ingested datasets (v-DI #1): the manufacturer
 * entity (parent / aliases / former names — so a query for "Cutler-Hammer" or the
 * parent company embeds near the product) and the ETIM class name (the standard
 * engineering term for the category). Richer, real text → better semantic recall.
 */
export function enrichedEmbeddingText(p: {
  name: string;
  brand: string;
  subcategory: string;
  specs?: { name: string; value: string }[];
}): string {
  const base = productEmbeddingText(p);
  const entity = brandEntityFor(p.brand);
  const brandExtra = entity
    ? [entity.parentCompany, entity.ultimateParent, ...entity.aliases, ...entity.formerNames].filter(Boolean)
    : [];
  const etim = etimClassFor(p.subcategory);
  const etimExtra = etim?.className ? [etim.className] : [];
  return [base, ...brandExtra, ...etimExtra].join(" ").replace(/\s+/g, " ").trim();
}
