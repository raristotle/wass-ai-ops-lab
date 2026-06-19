import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { analyzeImage, isAssistantEnabled } from "@/lib/server/anthropic-vision";
import {
  parseImageDataUrl,
  parseVisionFields,
  visionQuery,
  VISION_SYSTEM,
  VISION_INSTRUCTION,
} from "@/lib/product-finder-vision";

export const dynamic = "force-dynamic";

/**
 * Visual part ID (v4-S3 #14). Photograph a part (or its nameplate) → Claude vision
 * reads identifying attributes → the pure parser turns them into a catalog query.
 * DORMANT until ANTHROPIC_API_KEY is set (reuses the assistant gate / health flag):
 * GET reports {configured}; POST returns {configured:false, query:null} WITHOUT any
 * model call. Vision proposes attributes; the catalog resolves the real SKU. Rate-
 * limited (vision is heavy) + auth-gated; the image is never logged.
 */
const BodySchema = z.object({
  // base64 image data URL — generously bounded (≈9 MB).
  image: z.string().trim().min(20).max(12_000_000),
});

export function GET() {
  return NextResponse.json({ configured: isAssistantEnabled() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 8, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!isAssistantEnabled()) {
    return NextResponse.json({ configured: false, query: null });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid image." }, { status: 400 });

    const image = parseImageDataUrl(parsed.data.image);
    if (!image) return NextResponse.json({ error: "Unsupported image format." }, { status: 400 });

    const text = await analyzeImage(VISION_SYSTEM, VISION_INSTRUCTION, image);
    if (!text) return NextResponse.json({ configured: true, query: null });

    const fields = parseVisionFields(text);
    if (!fields) return NextResponse.json({ configured: true, query: null });

    return NextResponse.json({
      configured: true,
      fields: fields.fields,
      descriptors: fields.descriptors ?? null,
      query: visionQuery(fields),
    });
  } catch (e) {
    logApiError("/api/vision/part-id:POST", e);
    return NextResponse.json({ error: "Could not identify the part." }, { status: 400 });
  }
}
