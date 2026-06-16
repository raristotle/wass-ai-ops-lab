# Scheduled-report digest (#14)

An on-demand "recent activity + top movers" digest over the durable orders, emailed via Resend.

> **No scheduler is added by the app** — per CLAUDE.md ("do not add cron — use BullMQ") and
> because no BullMQ worker host ships here. `POST /api/reports/digest` builds and (optionally)
> sends the digest; the **scheduling** is yours to wire (any external scheduler that can POST,
> or a UI button). This keeps the project rule intact while still delivering the digest.

## Files

| File | Role |
|---|---|
| `lib/product-finder-digest.ts` | pure `buildDigest()` (windowed top movers + order count/value) + `digestHtml()`. Unit-tested. |
| `apps/web/app/api/reports/digest/route.ts` | `POST {to?, days?}` → builds from the durable orders; emails via Resend when configured **and** a recipient is given, else returns the digest JSON (`simulated:true`). Rate-limited + auth-gated. `GET` → `{configured}`. |

## Dormant behavior

No `RESEND_API_KEY` (or no `to`) ⇒ the route returns `{sent:false, simulated:true, digest}` and
sends nothing — $0, no email — so it's safe to call for the JSON summary alone.

## Schedule it (your choice)

Point any scheduler that can issue an authenticated POST at the endpoint, e.g.:

```
POST https://app.raristotle.com/api/reports/digest
Authorization: Bearer <WRITE_API_TOKEN>
Content-Type: application/json

{ "to": "ops@yourco.com", "days": 7 }
```

(Vercel Cron issues GET-only requests, so a POST-with-body digest needs an external scheduler
or a thin GET wrapper — deliberately not added here to honor the no-cron rule.)

## Verify

- **Dormant:** `GET /api/reports/digest` → `{"configured":false}` (until `RESEND_API_KEY`); a POST
  returns `{sent:false, simulated:true, digest:{ periodDays, orderCount, totalValue, topMovers }}`.
- **Active:** with `RESEND_API_KEY` + a verified sender, `POST {"to":"you@…","days":7}` → `{sent:true, id}`.
