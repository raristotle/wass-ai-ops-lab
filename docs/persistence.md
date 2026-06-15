# Durable persistence & global rate limiting

Two infra seams ship **dormant** (zero cost, no behavior change) and activate by
setting environment variables. Nothing is built or billed until you provision the
service and set the vars in Vercel.

| Seam | Env var(s) | Off (default) | On |
|---|---|---|---|
| Durable server store | `POSTGRES_URL` | per-instance in-memory KV | Neon Postgres (`PersistedRecord` table) |
| Global rate limiter | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | per-instance in-memory counter | Upstash Redis, global across instances |
| Background-worker signal | `REDIS_URL` | jobs run inline | `/api/health` reports `queue:true` (worker runs on a separate host; none ships in-app) |

`/api/health` reports the live state of each: `integrations.database`,
`integrations.ratelimit`, `integrations.queue`.

Code: `lib/server/persistence.ts` (`NeonStore` / `MemoryStore`),
`lib/server/rate-limit.ts` (Upstash REST + in-memory fallback). Both are
lazy/guarded — the Neon driver is imported only when `POSTGRES_URL` is set, so the
build and the dormant path never load it.

---

## Why these choices

- **Neon serverless driver** (`@neondatabase/serverless`) talks to Postgres over
  **HTTP**, not a TCP pool — so it works inside Vercel functions with no pooler, no
  connection-leak risk, and **no build-time client generation** (unlike Prisma).
  For a single namespaced-KV table that is the lower-risk path.
- **Upstash Redis over REST** gives a true **cross-instance** rate limit on
  serverless, where the in-memory limiter is only per-instance. One
  `INCR`/`PEXPIRE`/`PTTL` pipeline per request. A Redis blip falls back to the
  in-memory limiter — it never 500s a route.
- **No BullMQ worker ships.** Vercel functions can't host a long-lived worker;
  `REDIS_URL` is only a readiness signal for when a separate worker host exists.

---

## Activate Neon Postgres (durable store)

1. Create a free project at **neon.tech** (free tier is ample for a pilot).
2. Copy the **pooled** connection string (Neon dashboard → *Connection Details* →
   "Pooled connection"). It looks like
   `postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require`.
3. In **Vercel → project → Settings → Environment Variables**, add
   `POSTGRES_URL` = that string, for **Production** (and Preview if you want).
4. Redeploy (any new deploy picks up the var). **No migration step** — the
   `PersistedRecord` table is created on first write (`CREATE TABLE IF NOT EXISTS`).

Verify:

```bash
curl https://app.raristotle.com/api/health | jq .integrations.database   # → true
# Draft a quote from an inbound RFQ in the app, then:
curl https://app.raristotle.com/api/rfq | jq '{backend, count}'          # → "postgres", >=1
```

In Neon's SQL editor you can also confirm rows landed:
`SELECT namespace, key, "updatedAt" FROM "PersistedRecord" ORDER BY "updatedAt" DESC;`

## Activate Upstash Redis (global rate limiter)

1. Create a free database at **upstash.com** (Redis, free tier).
2. From the database page, copy the **REST API** values: `UPSTASH_REDIS_REST_URL`
   and `UPSTASH_REDIS_REST_TOKEN` (the REST URL/token, *not* the `redis://` URL).
3. In Vercel, add both env vars for Production.
4. Redeploy.

Verify:

```bash
curl https://app.raristotle.com/api/health | jq .integrations.ratelimit  # → true
```

Headers on any rate-limited route (`X-RateLimit-Remaining`) now decrement
consistently regardless of which serverless instance served the request.

---

## Cost

Both Neon and Upstash have free tiers that comfortably cover a pilot's traffic.
Leaving the vars unset keeps the app fully functional on the in-memory/localStorage
path at **zero** added cost — provision only when durable cross-instance state is
actually needed.

## What persists today

The `rfq-intake` namespace (inbound RFQs the rep drafted) is the first concrete
consumer, written best-effort from the RFQ→draft-quote modal. The store is a
general namespaced JSON KV, so additional entities (RMAs, shipment overrides,
saved searches) can adopt it without schema work — `getStore().put(namespace,
key, value)`.
