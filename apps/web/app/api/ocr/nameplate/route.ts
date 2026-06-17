import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { ocrConfigured, ocrImage } from "@/lib/integration/ocr-live";
import { parseNameplate, nameplateQuery } from "@/lib/product-finder-nameplate";

export const dynamic = "force-dynamic";

/**
 * Nameplate-photo → spec capture (#9). Dormant until OCRSPACE_API_KEY is set:
 * POST then returns {configured:false, parsed:null} WITHOUT any OCR call, so the
 * scanner keeps its barcode + manual-entry paths. OCRs the image, then runs the
 * pure nameplate parser to return the extracted fields + a catalog search query.
 * Rate-limited (OCR is heavier) + auth-gated; the image is never logged.
 */
const BodySchema = z.object({
  // base64 data URL of the photo — generously bounded (≈9 MB image).
  image: z.string().trim().min(20).max(12_000_000),
});

export function GET() {
  return NextResponse.json({ configured: ocrConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!ocrConfigured()) {
    return NextResponse.json({ configured: false, parsed: null });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid image." }, { status: 400 });

    const ocr = await ocrImage(parsed.data.image);
    if (!ocr.enabled) {
      return NextResponse.json({ configured: true, parsed: null });
    }
    const fields = parseNameplate(ocr.text);
    return NextResponse.json({
      configured: true,
      text: ocr.text.slice(0, 2000),
      fields,
      query: nameplateQuery(fields),
    });
  } catch (e) {
    logApiError("/api/ocr/nameplate:POST", e);
    return NextResponse.json({ error: "Could not read the nameplate." }, { status: 400 });
  }
}
