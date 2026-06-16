import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getCatalog } from "@/lib/catalog/index";
import { searchCatalog } from "@/lib/catalog/search";
import { parseSearchQuery } from "@/lib/catalog/schemas";
import { isAssistantEnabled, ASSISTANT_MODEL_DEFAULT, textFrom } from "@/lib/product-finder-assistant";
import {
  retrieveSpecChunks,
  buildRagUserContent,
  extractiveAnswer,
  RAG_SYSTEM_PROMPT,
  RAG_MAX_QUESTION,
  type SpecChunk,
} from "@/lib/product-finder-datasheet-rag";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

/**
 * Datasheet RAG. Retrieval is FREE lexical (always runs). Generation is gated on
 * ANTHROPIC_API_KEY: dormant ⇒ {enabled:false} with the retrieved spec context
 * EXTRACTIVELY (no model call, $0); active ⇒ one cheap grounded Haiku call.
 * Rate-limited (the active path is paid) + auth-gated. $0 / zero tokens until the
 * key is set and the endpoint is invoked.
 */

const BodySchema = z.object({
  question: z.string().trim().min(1).max(RAG_MAX_QUESTION),
  productIds: z.array(z.string().max(120)).max(20).optional(),
  k: z.number().int().positive().max(10).optional(),
});

const citationsOf = (chunks: SpecChunk[]) =>
  chunks.map((c) => ({ sku: c.sku, name: c.name, specSheetUrl: c.specSheetUrl }));

/** GET → whether grounded AI answers are configured (retrieval works either way). */
export function GET() {
  return NextResponse.json({ configured: isAssistantEnabled() });
}

export async function POST(req: Request) {
  // Tight cap — the active path calls a paid model per request.
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const { question, productIds, k } = parsed.data;

    // Candidate products: explicit ids, else the top search hits for the question.
    const catalog = getCatalog();
    let candidates: CatalogProduct[];
    if (productIds && productIds.length > 0) {
      candidates = productIds.map((id) => catalog.byId.get(id)).filter((p): p is CatalogProduct => Boolean(p));
    } else {
      const sp = new URLSearchParams({ q: question, pageSize: "24" });
      candidates = searchCatalog(parseSearchQuery(sp)).items;
    }
    const chunks = retrieveSpecChunks(question, candidates, k ?? 6);

    // Dormant: no key ⇒ extractive (retrieval only). No model call, $0.
    if (!isAssistantEnabled()) {
      return NextResponse.json({ enabled: false, reply: extractiveAnswer(chunks), citations: citationsOf(chunks) });
    }

    // Active: a single grounded Haiku call over the retrieved context.
    const model = process.env.ANTHROPIC_MODEL || ASSISTANT_MODEL_DEFAULT;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": String(process.env.ANTHROPIC_API_KEY),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: RAG_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildRagUserContent(question, chunks) }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      logApiError("/api/datasheet/ask", new Error(`Anthropic ${res.status}`));
      // Fail soft to the extractive answer.
      return NextResponse.json({ enabled: true, reply: extractiveAnswer(chunks), citations: citationsOf(chunks), modelError: true });
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return NextResponse.json({ enabled: true, reply: textFrom(data.content) || extractiveAnswer(chunks), citations: citationsOf(chunks) });
  } catch (e) {
    logApiError("/api/datasheet/ask", e);
    return NextResponse.json({ error: "Could not answer the question." }, { status: 400 });
  }
}
