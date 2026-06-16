# Slack alerts + Slack MCP

## Slack alerts (Incoming Webhook) — dormant seam

Posts high-signal events (a new order today; extendable to approvals / won-lost) to a
Slack channel via an Incoming Webhook, called with raw fetch. **$0** (Slack messaging APIs
are free on every plan) and zero network until `SLACK_WEBHOOK_URL` is set.

### Files

| File | Role |
|---|---|
| `lib/integration/slack-alerts.ts` | `slackConfigured()`, pure `buildAlert()` (Block Kit), `sendSlackAlert()` fetch wrapper. Best-effort — never throws. |
| `apps/web/app/api/orders/route.ts` | fires `sendSlackAlert()` fire-and-forget on a new order (only when configured). |
| `apps/web/app/api/health/route.ts` | reports `integrations.slack`. |

### Dormant behavior

No `SLACK_WEBHOOK_URL` ⇒ `slackConfigured()` is false and `sendSlackAlert()` returns
before any fetch — the order path is byte-identical. A slow/refused Slack endpoint can
never add latency to or fail checkout (the call is fire-and-forget with a 10s timeout).

### Activate

In Slack: create an app → **Incoming Webhooks** → add to a channel → copy the URL. Then in
Vercel → redeploy:

```
SLACK_WEBHOOK_URL = https://hooks.slack.com/services/T.../B.../...
# SLACK_ALERTS_ENABLED = 0    # optional kill-switch: silence without deleting the URL
```

The webhook URL **is** the secret (server-only, never `NEXT_PUBLIC_`, never committed);
regenerate it in Slack if leaked. Success is the literal body `"ok"`. Rate ~1 msg/sec — only
high-signal events.

> **Data classification:** the order alert intentionally carries the customer name + order
> total (operational business data — `PlacedOrder` holds no card / ACH / payment instrument).
> If payment fields are ever added to the order model, do **not** let them flow into `buildAlert`.

### Verify

- **Dormant:** `/api/health` shows `slack:false`; placing an order posts nothing.
- **Active:** place an order → a Block Kit alert lands in the channel.

## Slack MCP (dev tooling)

Official hosted OAuth server at `https://mcp.slack.com/mcp`. Add via Claude Code:

```bash
/plugin install slack          # then complete the OAuth prompt
```

or in `.mcp.json`:

```json
{ "mcpServers": { "slack": { "type": "http", "url": "https://mcp.slack.com/mcp" } } }
```

OAuth — no committed secret; a workspace admin must enable MCP for the workspace. Avoid the
archived `@modelcontextprotocol/server-slack`. For a self-hosted alternative,
`korotovsky/slack-mcp-server` works with an `xoxp`/`xoxb` OAuth token (never the browser
`xoxc`/`xoxd` session tokens), kept out of git.
