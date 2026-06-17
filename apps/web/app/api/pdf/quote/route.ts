import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { pdfConfigured, renderPdf } from "@/lib/integration/pdf-live";
import { decodeQuoteShare } from "@/lib/product-finder-quote-share";
import { quoteEmailHtml } from "@/lib/product-finder-email";

export const dynamic = "force-dynamic";

/**
 * Server-side branded PDF of a quote (#16) via Gotenberg. Dormant until
 * GOTENBERG_URL is set: POST then returns {configured:false} WITHOUT any render,
 * and the UI keeps client print-to-PDF. Renders the same branded HTML the email
 * uses, so the document honors white-label mode. Auth-gated.
 */
// Only http(s) links may flow into the rendered anchor — reject javascript:/data:
// URLs that z.string().url() would otherwise accept.
const httpUrl = (u: string): boolean => {
  try {
    return /^https?:$/.test(new URL(u).protocol);
  } catch {
    return false;
  }
};

const BodySchema = z.object({
  token: z.string().trim().min(10).max(40_000),
  linkUrl: z.string().url().max(600).refine(httpUrl, "Link must be http(s).").optional(),
});

export function GET() {
  return NextResponse.json({ configured: pdfConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 15, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!pdfConfigured()) {
    return NextResponse.json({ configured: false });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const payload = decodeQuoteShare(parsed.data.token);
    if (!payload) return NextResponse.json({ error: "Invalid quote token." }, { status: 400 });

    const html = quoteEmailHtml({
      customer: payload.customer,
      quoteNumber: payload.number,
      lines: payload.lines.map((l) => ({ sku: l.sku, name: l.name, qty: l.qty, unitPrice: l.unitPrice ?? 0 })),
      total: payload.total,
      rep: payload.rep ?? "",
      branch: payload.branch,
      linkUrl: parsed.data.linkUrl ?? "",
      note: payload.note,
      terms: payload.terms,
    });

    const result = await renderPdf(html);
    if (!result.enabled) {
      return NextResponse.json({ configured: true, error: "PDF render unavailable." }, { status: 502 });
    }
    // Sanitize the quote number before it lands in a response header — a stray
    // quote/CR/LF would otherwise break out of the filename (header injection).
    const safeName = payload.number.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 64) || "quote";
    return new NextResponse(result.pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeName}.pdf"`,
      },
    });
  } catch (e) {
    logApiError("/api/pdf/quote:POST", e);
    return NextResponse.json({ error: "Could not render the PDF." }, { status: 400 });
  }
}
