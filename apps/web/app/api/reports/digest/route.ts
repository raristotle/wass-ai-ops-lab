import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { getStore, forTenant } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import { buildDigest, digestHtml, type DigestOrder } from "@/lib/product-finder-digest";
import type { PlacedOrder } from "@/lib/product-finder-order-intake";

export const dynamic = "force-dynamic";

const NS = "orders";

/**
 * On-demand activity digest (top movers + recent order summary) over the durable
 * orders, emailed via Resend. NO scheduler is added here (CLAUDE.md: "do not add
 * cron"); schedule it externally (e.g. Vercel Cron POSTing with a service token +
 * a `to`). Dormant when Resend is unconfigured or no recipient is given: returns
 * the digest JSON with simulated:true and sends nothing.
 */

function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const BodySchema = z.object({
  to: z.string().email().optional(),
  days: z.number().int().positive().max(90).optional(),
});

/** GET → whether real sending is configured (Resend). */
export function GET() {
  return NextResponse.json({ configured: resendConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const { to, days } = parsed.data;

    const store = forTenant(getStore(), tenantForRequest(req));
    const orders = await store.list<PlacedOrder>(NS, { limit: 500 });
    const digestOrders: DigestOrder[] = orders.map((o) => ({
      id: o.id,
      total: o.total,
      placedAt: o.placedAt,
      lines: o.lines.map((l) => ({ sku: l.sku, name: l.name, qty: l.qty })),
    }));
    const digest = buildDigest(digestOrders, Date.now(), days ? { days } : undefined);

    // Dormant: no Resend key or no recipient ⇒ return the digest, send nothing.
    if (!resendConfigured() || !to) {
      return NextResponse.json({ sent: false, simulated: true, digest });
    }

    const html = digestHtml(digest, { title: `Meridian — last ${digest.periodDays}-day digest` });
    const from = process.env.RESEND_FROM || "Meridian Supply Co. <onboarding@resend.dev>";
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Meridian digest — ${digest.orderCount} order${digest.orderCount === 1 ? "" : "s"}, last ${digest.periodDays} days`,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!r.ok) {
      const message = typeof data?.message === "string" ? data.message : `Send failed (${r.status})`;
      return NextResponse.json({ sent: false, error: message, digest }, { status: 502 });
    }
    return NextResponse.json({ sent: true, id: data?.id ?? null, digest });
  } catch (e) {
    logApiError("/api/reports/digest:POST", e);
    return NextResponse.json({ error: "Could not build the digest." }, { status: 400 });
  }
}
