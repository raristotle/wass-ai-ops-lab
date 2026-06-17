import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { slackConfigured, buildAlert, sendSlackAlert } from "@/lib/integration/slack-alerts";

export const dynamic = "force-dynamic";

/**
 * Reusable post-only Slack notify endpoint (#4). Lets an authenticated client push
 * a high-signal event (quote accepted, approval needed, counter-offer, RMA opened)
 * to the branch Slack channel via the shipped Incoming-Webhook seam. Post-only by
 * design — it never reads channel history (so it sidesteps Slack's 2025 history
 * rate-limit clampdown). Dormant until SLACK_WEBHOOK_URL is set. Auth-gated.
 */
const BodySchema = z.object({
  kind: z.enum(["quote-accepted", "approval-needed", "counter-offer", "rma-opened", "order-shipped"]),
  title: z.string().trim().min(1).max(150),
  text: z.string().trim().min(1).max(400),
  fields: z.array(z.object({ label: z.string().max(60), value: z.string().max(400) })).max(10).optional(),
  link: z.object({ url: z.string().url().max(500), label: z.string().max(80) }).optional(),
});

export function GET() {
  return NextResponse.json({ configured: slackConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!slackConfigured()) {
    return NextResponse.json({ configured: false, posted: false });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid notification." }, { status: 400 });
    const { kind, title, text, fields, link } = parsed.data;
    const result = await sendSlackAlert(buildAlert({ title, text, fields, link, context: `meridian • ${kind}` }));
    return NextResponse.json({ configured: true, posted: result.enabled });
  } catch (e) {
    logApiError("/api/notify/slack:POST", e);
    return NextResponse.json({ error: "Could not post the notification." }, { status: 400 });
  }
}
