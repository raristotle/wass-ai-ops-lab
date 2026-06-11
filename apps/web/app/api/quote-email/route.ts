import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Real quote email via Resend — active only when RESEND_API_KEY is set
// (free tier). Without a key the UI falls back to the simulated send.
// Free-tier note: with the default onboarding@resend.dev sender, Resend
// only delivers to the account owner's address until a domain is verified.

const SendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(200_000),
});

function configured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** GET → whether real sending is configured (UI switches its messaging). */
export async function GET() {
  return NextResponse.json({ configured: configured() });
}

export async function POST(req: Request) {
  if (!configured()) {
    return NextResponse.json({ sent: false, simulated: true });
  }

  let body: z.infer<typeof SendSchema>;
  try {
    body = SendSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const from = process.env.RESEND_FROM || "Meridian Supply Co. <onboarding@resend.dev>";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [body.to], subject: body.subject, html: body.html }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      // Surface Resend's reason (e.g. free-tier "can only send to your own
      // address until a domain is verified") without leaking internals.
      const message = typeof data?.message === "string" ? data.message : `Send failed (${r.status})`;
      return NextResponse.json({ sent: false, error: message }, { status: 502 });
    }
    return NextResponse.json({ sent: true, id: data?.id ?? null });
  } catch {
    return NextResponse.json({ sent: false, error: "Email service unreachable" }, { status: 502 });
  }
}
