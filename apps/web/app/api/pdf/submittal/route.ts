import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { pdfConfigured, renderPdf } from "@/lib/integration/pdf-live";
import { buildSubmittalHtml } from "@/lib/product-finder-submittal";

export const dynamic = "force-dynamic";

/**
 * Server-side branded PDF of a submittal package via Gotenberg (#2 v4-S1).
 * Dormant until GOTENBERG_URL is set — POST returns {configured:false} without
 * any render; the UI keeps client print-to-PDF. Auth-gated, rate-limited, body-
 * capped, input validated.
 */

const SpecSchema = z.object({
  name: z.string().max(100),
  value: z.string().max(200),
});

const LineSchema = z.object({
  sku: z.string().max(100),
  name: z.string().max(500),
  qty: z.number().int().positive(),
  uom: z.string().max(20),
  unitPrice: z.number().nonnegative(),
  specs: z.array(SpecSchema).max(30),
  specSheetUrl: z.string().url().max(500).nullable().optional(),
});

const BodySchema = z.object({
  packageNumber: z.string().trim().max(100),
  dateLabel: z.string().max(100),
  customer: z.string().max(300),
  project: z.string().max(300),
  preparedBy: z.string().max(300).optional(),
  lines: z.array(LineSchema).min(1).max(200),
  brandName: z.string().max(100).optional(),
  brandAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export function GET() {
  return NextResponse.json({ configured: pdfConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!pdfConfigured()) {
    return NextResponse.json({ configured: false });
  }

  try {
    const body = await req.text();
    if (body.length > 500_000) {
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    }
    const parsed = BodySchema.safeParse(JSON.parse(body));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const html = buildSubmittalHtml(parsed.data);
    const result = await renderPdf(html);
    if (!result.enabled) {
      return NextResponse.json({ configured: true, error: "PDF render unavailable." }, { status: 502 });
    }
    const safeName = parsed.data.packageNumber.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 64) || "submittal";
    return new NextResponse(result.pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeName}.pdf"`,
      },
    });
  } catch (e) {
    logApiError("/api/pdf/submittal:POST", e);
    return NextResponse.json({ error: "Could not render the PDF." }, { status: 400 });
  }
}
