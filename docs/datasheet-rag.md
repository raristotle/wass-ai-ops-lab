# Semantic datasheet RAG (#17)

Answers dense spec / NEC questions ("is the QO 20A breaker single-pole?", "what's the
voltage rating?") grounded in the catalog's datasheet/spec text, with citations.

## Cost design (respects the hard cost guardrail)

- **Retrieval is free** — a pure in-repo **lexical** scorer (`retrieveSpecChunks`), no
  embeddings, no vector DB, no token cost. $0 always.
- **Generation is gated on `ANTHROPIC_API_KEY`** (the same key as Ask Meridian):
  - **Dormant** (no key) → the endpoint returns the retrieved spec context **extractively**
    (no model call) — $0, zero tokens.
  - **Active** (key set) → **one Claude Haiku call per question** over the retrieved context
    (no embedding index to build). Roughly a fraction of a cent per question; rate-limited to
    20/min. **You opt in by adding the key** — building/shipping this seam incurs nothing.

> Lexical retrieval is a deliberate $0 substitute for semantic embeddings; upgrading to
> embeddings is a future option only if the budget allows.

## Files

| File | Role |
|---|---|
| `lib/product-finder-datasheet-rag.ts` | pure `retrieveSpecChunks` (lexical), `buildRagUserContent`, `extractiveAnswer`, system prompt. Unit-tested. |
| `apps/web/app/api/datasheet/ask/route.ts` | `POST {question, productIds?, k?}` → `{reply, citations}`; rate-limited + auth-gated. `GET` → `{configured}`. |

`/api/health` already reports `assistant` (the `ANTHROPIC_API_KEY` gate this reuses).

## Activate

Set `ANTHROPIC_API_KEY` in Vercel (optionally `ANTHROPIC_MODEL`, default
`claude-haiku-4-5-20251001`) → redeploy. Until then, retrieval still works and the endpoint
returns the extractive context.

## Verify

- **Dormant:** `GET /api/datasheet/ask` → `{"configured":false}`; `POST {"question":"20A breaker voltage"}`
  → `{enabled:false, reply:"Closest match: …", citations:[…]}` with **no** model call.
- **Active:** with `ANTHROPIC_API_KEY`, the same POST → `{enabled:true, reply:"…grounded answer citing BRAND + SKU…", citations}`.
