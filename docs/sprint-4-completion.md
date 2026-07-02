# Sprint 4 — "Harden for scale" — Completion Report

Delivers the three Sprint 4 items from [roadmap-backlog-v6.md](./roadmap-backlog-v6.md). Theme:
durability once real usage exists. All backward-compatible; **$0** — B15's Postgres tier is dormant
until you run the one-time load and flip a flag.

## B16 · MCP / punchout API ergonomics
A shared **typed error envelope** and **opaque cursor pagination** so the MCP server and punchout
consumers can branch on machine codes and page deterministically — without changing anything for the
UI. Error bodies keep their human `error` string and gain a stable `code` (`invalid_request`,
`unauthorized`, `rate_limited`, …); every 429 now also carries `retryAfterMs`. List responses gain a
`nextCursor` (absent on the last page); echo it back as `?cursor=…`.
- Files: `lib/server/api-envelope.ts` (`apiError` + cursor helpers, + tests), `rate-limit.ts`
  (typed 429), `/api/crosses/match` (typed 400s), `/api/products/search` (`nextCursor`). Documented in
  [mcp-servers.md](./mcp-servers.md).

## B17 · Wesco stock-number capture
Every product's **View Details** now has a labeled **"+ Add Wesco stock #"** field. Whatever a rep
captures is appended to the catalog-number crosswalk (deduped by normalized number, provenance
`captured`), so a search for that number resolves to the part next time — real identifiers accruing
as a byproduct of daily use, complementing the batch crosswalk import (B7).
- Files: `lib/catalog/crosswalk.ts` (`captureCrosswalkEntry` + a source-preservation fix so
  `captured`/`import` provenance is honest), `/api/catalog/crosswalk/capture` (auth-gated, validates
  the SKU is carried), `WescoStockCapture.tsx` in the product detail, + tests.

## B15 · Crosses → Neon Postgres (DORMANT — you run the load)
The 766K cross pairs can move from the ~35 MB in-memory parse into an **indexed `xref_cross` table**
(btree on BOTH part columns) so a cold cross-match is a single indexed query, and B1/B2 reverse
lookups + corroboration become SQL. Built **behind a flag, defaulting to today's in-memory path** —
$0 until you opt in. Reads fail soft: any DB error falls back to the in-memory index.
- Files: `lib/server/xref-pg.ts` (`xrefPgEnabled`, `ensureXrefSchema`, batched `loadXrefBatch`,
  `lookupXrefPg`, `lookupXrefAsync` router, + tests), `/api/crosses/pg-load` (secret-gated batched
  loader), `/api/crosses/match` (now `lookupXrefAsync`), `/api/health` (`xrefSource: memory|postgres`).

## Gate results (all green)
| Gate | Result |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npm run typecheck` | ✅ clean |
| `npm test` | ✅ full suite green |
| `npm run build` | ✅ compiled successfully |

---

## ACTION REQUIRED (you) — optional, all $0-on-your-existing-plan

### 1. Enable the Postgres cross tier (B15) — only if you want the latency win
Neon (`POSTGRES_URL`) is already live for the KvStore, so this uses no new service — it does add
~766K rows of storage on your existing plan.

1. **Set `CRON_SECRET`** in Vercel (Production) if you haven't for B14 — a long random string.
2. **Run the load** — call the loader repeatedly, passing the prior `nextOffset`, until `done: true`:
   ```bash
   SECRET=your-cron-secret
   BASE=https://web-xi-virid-59.vercel.app
   off=0
   while :; do
     r=$(curl -s -X POST "$BASE/api/crosses/pg-load?offset=$off" -H "Authorization: Bearer $SECRET")
     echo "$r"
     off=$(echo "$r" | grep -o '"nextOffset":[0-9]*' | cut -d: -f2)
     echo "$r" | grep -q '"done":true' && break
   done
   ```
   (~8 calls of 100K rows each; the first call truncates + creates the schema.)
3. **Flip reads to SQL** — set `XREF_SOURCE=postgres` in Vercel (Production) and redeploy.
4. **Verify** — `GET /api/health` shows `"xrefSource":"postgres"`; cross-match returns the same
   results. To revert, unset `XREF_SOURCE` — reads go straight back to the in-memory index.

### 2. (From Sprint 3) Enable the datasheet link-rot cron (B14)
Steps in [sprint-3-completion.md](./sprint-3-completion.md#action-required-you--optional-0--enable-the-datasheet-link-rot-sweep-b14).

*(B16 and B17 need nothing — they're live on deploy. B15 stays fully dormant until step 1.)*
