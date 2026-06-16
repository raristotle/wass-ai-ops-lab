# Semantic search reranking — Cohere Rerank (dormant seam)

Env-gated dormant seam. Reranks an existing **fuzzy candidate list** (BOM lines /
cross-reference matches / search hits) by semantic relevance via
[Cohere Rerank v2](https://docs.cohere.com/reference/rerank), called with raw fetch
(no SDK). $0 until `COHERE_API_KEY` is set (free trial: 1000 calls/mo); the call is
fail-closed, so any error falls back to the existing order.

> **Standalone seam:** this ships as a reranking *endpoint* — no in-app flow calls it yet,
> so setting the key changes nothing until a caller `POST`s to `/api/rerank` (wiring a
> BOM / cross-ref action to it is a deliberate follow-up, gated on the `GET {configured}`
> probe). The wrapper pins `max_tokens_per_doc` and the route caps candidate text at 2000
> chars, so callers don't pre-truncate. The "v2" is the API version (`/v2/rerank`); the
> model is reported separately (default `rerank-v4.0-pro`).

## Files

| File | Role |
|---|---|
| `lib/integration/rerank-live.ts` | `rerankConfigured()`, pure `applyRerank()` merge-back, `rerankCandidates()` fetch wrapper (returns `{enabled:false}` when dormant). |
| `apps/web/app/api/rerank/route.ts` | `POST {query, candidates:[{id,text}], topN?}` → reranked id order + scores; `GET` → `{configured}`. Rate-limited + auth-gated. |
| `apps/web/app/api/health/route.ts` | reports `integrations.rerank`. |

## Dormant behavior

No `COHERE_API_KEY` ⇒ `rerankConfigured()` is false, `rerankCandidates()` returns
`{enabled:false}` **before** constructing any request, and `POST /api/rerank` returns
`{enabled:false, order:null}`. Callers keep their fuzzy order unchanged.

## Activate

Set in Vercel → redeploy:

```
COHERE_API_KEY = co-...                    # free trial key from dashboard.cohere.com
# COHERE_RERANK_MODEL = rerank-v4.0-pro    # optional (default); or rerank-v4.0-fast / rerank-v3.5
```

Cost: **$0.0025/search** (rerank-v4.0-pro); 1 search unit = 1 query with ≤100 documents.
Trial keys: 1000 calls/mo, 10 req/min. The wrapper fails closed on any 429/5xx (falls
back to the fuzzy order, never throws into search) — keep documents short and rerank only
deliberate actions (BOM/cross-ref), not every keystroke, to stay within the trial cap.

## Verify

- **Dormant:** `GET /api/rerank` → `{"configured":false}`; `/api/health` shows `rerank:false`.
- **Active:** `POST {query, candidates}` → `{enabled:true, model, order:[{id,rerankScore}…]}`
  sorted best-first; un-returned candidates are appended in original order (never dropped).
