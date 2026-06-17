# Cross-reference confidence UX + demand-ranked coverage gaps (Sprint 4 · #8)

Makes the bulk cross-reference engine trustworthy at scale and tells the catalog team where to expand
crosses. Free; reuses shipped data.

## Banded confidence (a)

`lib/product-finder-cross-confidence.ts` (pure) bands the verified-cross engine's 0-100 confidence into
**Verified** (≥95, production-ready), **Probable** (≥80), **Needs review** (<80), each with a color +
blurb. Surfaced as a chip on every row of the bulk cross-upload results (`BulkCrossModal`), so a rep
sees the trust band at a glance instead of a bare percentage. (The bulk path only emits production-grade
crosses — ≥95 — so those rows read "Verified"; the band function is generic for any surface that shows
sub-95 candidates, e.g. the Cross-Reference Explorer's review tab.)

## Demand-ranked coverage gaps (b)

When a competitor/legacy part is looked up for a Wesco cross and there's **none**, the miss is recorded
as an atomic per-SKU counter in the Neon/Memory KV (`lib/server/cross-misses.ts`, `cross-misses`
namespace) — best-effort, never blocking the request. Wired into `POST /api/crosses/match` (the bulk
cross path), bounded to 50 misses/request.

- `GET /api/crosses/gaps` (auth-gated, internal) → the top missed competitor SKUs, ranked by how often
  customers actually hit them.
- A **"Coverage gaps"** card on the manager dashboard (`CoverageGapsCard`) shows that demand-ranked
  list — expand crosses where demand is highest first. Hidden until gap data accumulates.

## Cost

$0 — pure banding + a counter on the existing Neon KV; no external service, no env vars.
