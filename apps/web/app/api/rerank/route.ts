import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { rerankConfigured, rerankCandidates } from "@/lib/integration/rerank-live";

export const dynamic = "force-dynamic";

/**
 * Semantic reranking of an existing fuzzy candidate list (Cohere Rerank v2).
 * Dormant until COHERE_API_KEY is set: POST then returns {enabled:false,order:null}
 * WITHOUT any Cohere call, so the caller keeps its current fuzzy ordering. Returns
 * only the reranked id order + scores; the client reorders its own objects.
 */

const BodySchema = z.object({
  query: z.string().trim().min(1).max(500),
  candidates: z
    .array(z.object({ id: z.string().trim().min(1).max(120), text: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(100),
  topN: z.number().int().positive().max(100).optional(),
});

/** GET → whether real reranking is configured (UI/caller decides whether to call). */
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  return NextResponse.json({ configured: rerankConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  // Dormant: no key ⇒ no Cohere call; the caller keeps its fuzzy order.
  if (!rerankConfigured()) return NextResponse.json({ enabled: false, order: null });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid rerank request." }, { status: 400 });
    const { query, candidates, topN } = parsed.data;
    const r = await rerankCandidates(query, candidates, (c) => c.text, topN ? { topN } : undefined);
    if (!r.enabled) return NextResponse.json({ enabled: false, order: null });
    return NextResponse.json({
      enabled: true,
      model: r.model,
      order: r.items.map((it) => ({ id: it.id, rerankScore: it.rerankScore })),
    });
  } catch (e) {
    logApiError("/api/rerank:POST", e);
    return NextResponse.json({ error: "Could not rerank." }, { status: 400 });
  }
}
