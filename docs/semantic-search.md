# Semantic search (embeddings + Neon pgvector) — v4-S3 #4

Adds a **semantic (meaning-based) ranking lane** to the shipped keyword + fuzzy
hybrid search. It's fused via the same reciprocal-rank fusion (RRF) the other
lanes use, so embedding relevance becomes a *fourth signal* — never an override.

**Dormant + $0 by default.** No embeddings key ⇒ no embed call, no Neon vector
read, search behaves exactly as today. Default provider is **Voyage AI
`voyage-4-lite`** (1024-dim); the voyage-4 family's **first 200M tokens are free**,
so embedding the whole ~200k-product catalog once (~30M tokens) costs **$0**, and
only the short query is embedded per request.

## Architecture

- **`lib/integration/embeddings-live.ts`** — provider-agnostic dormant seam
  (`embeddingsConfigured()` gate; Voyage / OpenAI / Cohere adapters, all
  normalized to 1024 dims; `embedTexts` / `embedQuery`, fail-soft to null).
- **`lib/server/vector-store.ts`** — Neon **pgvector** store (lazy driver import):
  `CREATE EXTENSION vector` + a `ProductVector(product_id, embedding vector(1024))`
  table + an HNSW cosine index; `upsertVectors`, `knnSearch` (cosine `<=>`),
  `vectorCount`. Dormant unless `POSTGRES_URL` is set.
- **`lib/catalog/semantic-search.ts`** — pure `fuseSemanticLane(items, ids)` that
  RRF-blends the KNN ranking into the result page (only re-ranks products already
  on the page — it can't inject an off-topic result).
- **`POST /api/embeddings/backfill`** — operator-triggered (NOT cron) batch that
  embeds a catalog slice and upserts the vectors.
- **Search route** (`/api/products/search`): when both gates are on, embeds the
  query, KNNs the vectors, and fuses — fail-closed to keyword+fuzzy on any error
  or when the catalog isn't backfilled yet.
- Health flag `embeddings`.

## Two gates

| Capability | Gate |
|---|---|
| Embedding generation (queries + backfill) | `EMBEDDINGS_API_KEY` |
| Vector storage + KNN | `POSTGRES_URL` (Neon — already used by the app) |

If either is missing, the semantic lane is skipped. Both on **and** the catalog
backfilled ⇒ semantic ranking is live.

---

## Step-by-step: activate semantic search

### 1. Get a free embeddings key (Voyage AI — recommended)
1. Sign up at **https://www.voyageai.com/** and open the **API Keys** page.
2. Create a key. The **voyage-4** family includes the first **200M tokens free**
   per account — enough to embed this catalog at $0.
3. (Alternatives: OpenAI `text-embedding-3-small` or Cohere `embed-v4.0` — set
   `EMBEDDINGS_PROVIDER` accordingly. Both are paid-per-use, ~$0.30–$3.60 for a
   one-time catalog pass.)

### 2. Set env vars in Vercel → Settings → Environment Variables (Production)
- `EMBEDDINGS_API_KEY` = your Voyage key.
- *(optional)* `EMBEDDINGS_PROVIDER` = `voyage` (default) | `openai` | `cohere`.
- Ensure `POSTGRES_URL` is set (Neon — the app's persistence; see
  [persistence.md](persistence.md)).
- **Redeploy.**

### 3. Verify the gates
- `GET /api/health` → `integrations.embeddings: true`.
- `GET /api/embeddings/backfill` → `{ "embeddings": true, "vectorStore": true }`.

### 4. Run the one-time backfill
Loop the backfill endpoint a page at a time until `done` is true. With an admin
session (or `WRITE_API_TOKEN`):

```bash
OFFSET=0
while : ; do
  RESP=$(curl -s -X POST https://YOUR-DOMAIN/api/embeddings/backfill \
    -H "Authorization: Bearer $WRITE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"offset\": $OFFSET, \"limit\": 500}")
  echo "$RESP"
  echo "$RESP" | grep -q '"done":true' && break
  OFFSET=$(echo "$RESP" | sed -n 's/.*"nextOffset":\([0-9]*\).*/\1/p')
done
```

The first call creates the `vector` extension, the `ProductVector` table, and the
HNSW index automatically. Re-running is idempotent (upsert).

### 5. Use it
With both keys set and the backfill complete, relevance-sorted searches now blend
semantic ranking automatically — no UI change. Re-run the backfill after a catalog
rebuild to refresh the vectors.

## Cost & guardrail notes
- Dormant = literally $0 (no key ⇒ no network). Voyage's free 200M tokens cover
  the catalog backfill; per-query embedding is a few hundred tokens, trivially
  inside the free allowance.
- pgvector is available on Neon's free plan; the vectors live in your existing
  database.
- The lane is conservative: it only re-ranks the current result page, so it can
  never surface an off-topic product — it only improves ordering.
