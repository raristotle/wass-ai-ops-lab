/**
 * High-signal Slack alerts (REAL) — Incoming Webhook, env-gated exactly like the
 * FRED commodity and Stripe Tax seams: a Slack post ONLY when SLACK_WEBHOOK_URL
 * is set (and not kill-switched); otherwise a silent no-op, $0, zero network.
 * Called with raw fetch — no @slack/web-api SDK. Best-effort: failures are logged
 * (status only) and swallowed, never thrown into the caller, so an order/quote
 * action is never blocked or failed by a slow/refused Slack endpoint.
 *
 *   SLACK_WEBHOOK_URL     — the gate (the URL IS the secret; bound to one channel).
 *   SLACK_ALERTS_ENABLED  — optional kill-switch ('0'/'false' forces dormant).
 *
 * Webhook success is the literal body "ok" (NOT JSON). Only high-signal events
 * (new order, approval needed) — the webhook is ~1 msg/sec. Project rule: never
 * log raw payment payloads — we log only status + a coarse event label, never the
 * message body.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True when alerts are configured AND not kill-switched off. Single source of dormancy. */
export function slackConfigured(): boolean {
  if (!env("SLACK_WEBHOOK_URL")) return false;
  const sw = env("SLACK_ALERTS_ENABLED")?.toLowerCase();
  return sw !== "0" && sw !== "false";
}

export interface AlertField {
  label: string;
  value: string;
}
export interface AlertInput {
  /** Header (plain text, capped at Slack's 150-char limit). */
  title: string;
  /** Fallback / push-notification text — required by Slack (else `no_text`). */
  text: string;
  fields?: AlertField[];
  link?: { url: string; label: string };
  /** Small footer line, e.g. the event name. */
  context?: string;
}

export interface SlackMessage {
  text: string;
  blocks: unknown[];
}

/** Pure: build a Block Kit message from an alert. No I/O — unit-tested. */
export function buildAlert(input: AlertInput): SlackMessage {
  const blocks: unknown[] = [
    { type: "header", text: { type: "plain_text", text: input.title.slice(0, 150) } },
  ];
  if (input.fields && input.fields.length > 0) {
    blocks.push({
      type: "section",
      // Slack allows up to 10 fields, each mrkdwn text ≤ 2000 chars.
      fields: input.fields.slice(0, 10).map((f) => ({ type: "mrkdwn", text: `*${f.label}:*\n${f.value}` })),
    });
  }
  if (input.link) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: `<${input.link.url}|${input.link.label}>` } });
  }
  if (input.context) {
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: input.context }] });
  }
  return { text: input.text, blocks };
}

export type SlackResult =
  | { enabled: false; reason: "not-configured" }
  | { enabled: false; reason: "error" }
  | { enabled: true };

/**
 * Post an alert to Slack. Returns {enabled:false} when dormant (no webhook /
 * kill-switched) or on any error — never throws. Safe to call best-effort
 * (fire-and-forget) from a request path.
 */
export async function sendSlackAlert(msg: SlackMessage): Promise<SlackResult> {
  const url = env("SLACK_WEBHOOK_URL");
  if (!url || !slackConfigured()) return { enabled: false, reason: "not-configured" }; // ← dormant guard

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
      signal: AbortSignal.timeout(10_000),
    });
    // Webhook success is the literal text "ok", not JSON.
    const ok = res.ok && (await res.text()) === "ok";
    if (!ok) {
      logApiError("slack:alert", new Error(`Slack webhook HTTP ${res.status}`));
      return { enabled: false, reason: "error" };
    }
    return { enabled: true };
  } catch (e) {
    logApiError("slack:alert", e);
    return { enabled: false, reason: "error" };
  }
}
