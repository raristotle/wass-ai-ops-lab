# Outbound Slack notifications — #4

A reusable, **post-only** Slack notify endpoint plus an automatic inbound-RFQ
alert. Builds on the existing [`slack-alerts`](slack-alerts.md) seam — **dormant**
and **$0** until `SLACK_WEBHOOK_URL` is set; Slack messaging is free even when
active.

## `POST /api/notify/slack`

`rateLimit(30/min) → requireApiAuth → dormant-gate → Zod`. Posts a Block Kit
message (best-effort) for a high-signal business event.

```jsonc
{
  "kind": "quote-accepted",   // quote-accepted | approval-needed | counter-offer | rma-opened | order-shipped
  "title": "Quote Q-10421 accepted",
  "text": "Acme Electric accepted $48,210 — margin 21%",
  "fields": [{ "label": "Branch", "value": "Houston" }],   // optional
  "link": "https://app.raristotle.com/product-finder/quote/…"  // optional
}
```

`GET` returns `{ configured }`. When the webhook is unset, `POST` returns
`{ configured:false }` with **no network call**. The `kind` enum and field/length
bounds keep the channel from being used as an open spam relay; the route is
auth-gated so only the app (same-origin) or a token holder can post.

## Automatic inbound-RFQ alert

`POST /api/rfq` now fires a best-effort Slack notification after it persists a
matched RFQ (`meridian • rfq.received` — customer + lines matched), so a rep sees
new inbound demand without polling. It is wrapped in `slackConfigured()` and
never blocks or fails the RFQ if Slack is down.

## Enabling it

Set `SLACK_WEBHOOK_URL` (an Incoming Webhook URL — the URL *is* the secret, bound
to one channel) in Vercel → redeploy. `/api/health` already reports
`integrations.slack`. Optional `SLACK_ALERTS_ENABLED=0` kill-switch silences
without deleting the URL.
