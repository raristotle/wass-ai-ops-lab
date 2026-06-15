import { NextResponse } from "next/server";
import {
  parsePunchOutSetupRequest,
  buildPunchOutSetupResponse,
  punchoutStartUrl,
} from "@/lib/procurement/punchout-setup";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";

export const dynamic = "force-dynamic";

// cXML PunchOut SETUP endpoint. A buyer's procurement system POSTs a
// PunchOutSetupRequest; we answer with a PunchOutSetupResponse whose StartPage
// URL their browser opens. Level 2: when the request carries a SelectedItem, we
// deep-link the StartPage to that product. Parsing/response are a pure tested lib.
// cXML setup requests are small; cap the body so an unauthenticated caller can't
// stream a huge payload into memory + the regex scans.
const MAX_BODY_BYTES = 256_000;

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return new Response("Payload too large.", { status: 413 });
    const body = await req.text();
    if (body.length > MAX_BODY_BYTES) return new Response("Payload too large.", { status: 413 });
    const parsed = parsePunchOutSetupRequest(body);
    const startUrl = punchoutStartUrl(new URL(req.url).origin, parsed.selectedItemId);
    const xml = buildPunchOutSetupResponse({
      payloadID: parsed.buyerCookie || "punchout",
      timestamp: new Date().toISOString(),
      startUrl,
    });
    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8", "X-PunchOut-Level": String(parsed.level) },
    });
  } catch (e) {
    logApiError("/api/procurement/punchout", e);
    return new Response("PunchOut setup failed.", { status: 400 });
  }
}

export function GET() {
  return NextResponse.json({
    endpoint: "cXML PunchOutSetupRequest",
    method: "POST",
    levels: [1, 2],
    note: "POST a cXML PunchOutSetupRequest. A <SelectedItem> with a SupplierPartID deep-links the StartPage to that product (Level 2); otherwise it lands on the store home (Level 1).",
  });
}
