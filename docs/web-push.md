# Web Push (PWA alerts) — #17

Push a quote/approval/order alert to a field rep **even when the Meridian PWA is
closed**. Self-hosted VAPID, **$0**, dormant until you set keys, and built on
`node:crypto` — **no new dependency**.

## How it works

- **No-payload "tickle" push.** We never send a message body. A push wakes the
  service worker, which shows a generic *"You have a new Meridian alert"*
  notification that opens `/product-finder`. No payload ⇒ **no ECDH payload
  encryption** to get wrong, and **no customer data ever leaves in the push**.
- **VAPID auth** (RFC 8292): each push carries an ES256 JWT signed with the
  server's private key. `lib/server/web-push.ts` builds the JWT with `node:crypto`
  (`createPrivateKey` from a JWK + `sign(... dsaEncoding:"ieee-p1363")`).
- **Fail-closed / dormant:** with the VAPID keys unset, `sendPush()` returns
  without any network call and the opt-in button stays hidden.

## Endpoints

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/push/subscribe` | `GET` | none | `{ configured, publicKey }` — the client needs the public key to subscribe |
| `/api/push/subscribe` | `POST` | yes | Store a browser `PushSubscription` (keyed by `sha256(endpoint)`) |
| `/api/push/send` | `POST` | yes | Operator broadcast: tickle every stored sub, prune any the service reports `gone` (404/410) |

Subscriptions live in the KV namespace `push-subs` (Neon when `POSTGRES_URL` is
set, else in-memory). `/api/push/send` is **operator-triggered** — there is **no
cron** (per project rule, scheduled fan-out would use BullMQ).

## The client opt-in

`features/product-finder/PushSubscribeButton.tsx` sits in the shell header. It is
**invisible** unless the server reports `configured:true` *and* the browser
supports the Push API. One click asks notification permission, registers the SW,
subscribes with the VAPID public key, and POSTs the subscription same-origin (so
the existing API auth gate covers it).

## Enabling it

1. Generate a P-256 VAPID keypair, e.g. `npx web-push generate-vapid-keys`.
2. In Vercel (project **web**), set:
   - `VAPID_PUBLIC_KEY` — the public key (safe to expose; served to the browser).
   - `VAPID_PRIVATE_KEY` — **secret**, server-only, never `NEXT_PUBLIC_`.
   - `VAPID_SUBJECT` — optional `mailto:` / `https:` contact.
3. Redeploy. `/api/health` flips `integrations.webpush` to `true`; the **Enable
   alerts** button appears for supported browsers.

> iOS Safari requires the PWA to be **installed to the Home Screen** before push
> works (Apple platform limitation).
