import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { getStore } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import {
  createSignatureRequest,
  esignConfigured,
  esignTestMode,
  isAllowedFileUrl,
} from "@/lib/integration/esign-live";
import {
  ESIGN_NAMESPACE,
  newEsignRecord,
  publicEsign,
  type EsignRecord,
} from "@/lib/product-finder-esign";

export const dynamic = "force-dynamic";

/**
 * Send a quote for e-signature (v4-S2 #3) — env-gated DORMANT. POST is the
 * explicit operator "Send for signature" action: it asks Dropbox Sign to email
 * the customer a signing link and persists an EsignRecord (auth-gated). GET reads
 * a request's status (tenant-scoped) or reports {configured, testMode}. With
 * DROPBOX_SIGN_API_KEY unset this makes no network call and returns {enabled:false}.
 *
 * The record lives in a FIXED global namespace (not tenant-prefixed) so the
 * sessionless Dropbox webhook can update it; it carries the owning tenantId so a
 * tenant operator only ever reads their own.
 */

const InputSchema = z.object({
  quoteId: z.string().trim().min(1).max(120),
  quoteNumber: z.string().trim().min(1).max(120),
  signerName: z.string().trim().min(1).max(200),
  signerEmail: z.string().trim().email().max(200),
  /** https URL of the quote document Dropbox will fetch (same-origin enforced). */
  fileUrl: z.string().trim().url().max(1000),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().max(1000).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const esignId = url.searchParams.get("esignId");
  if (!esignId) {
    return NextResponse.json({ configured: esignConfigured(), testMode: esignTestMode() });
  }
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const rec = await getStore().get<EsignRecord>(ESIGN_NAMESPACE, esignId);
    if (!rec || rec.tenantId !== tenantForRequest(req)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ esign: publicEsign(rec) });
  } catch (e) {
    logApiError("/api/esign/request GET", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 15, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  const denied = requireApiAuth(req);
  if (denied) return denied;

  // Dormant: never reach Dropbox when the key is unset.
  if (!esignConfigured()) {
    return NextResponse.json({ enabled: false, reason: "not-configured" });
  }

  let input: z.infer<typeof InputSchema>;
  try {
    input = InputSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // SSRF guard: Dropbox fetches file_urls server-side, so the document must live
  // on our own deployment (or an explicit allowlist) — never an arbitrary URL.
  const originHost = new URL(req.url).host;
  if (!isAllowedFileUrl(input.fileUrl, originHost)) {
    return NextResponse.json({ error: "Document URL not allowed" }, { status: 400 });
  }

  const tenantId = tenantForRequest(req);
  const testMode = esignTestMode();

  try {
    const result = await createSignatureRequest({
      quoteId: input.quoteId,
      quoteNumber: input.quoteNumber,
      signerName: input.signerName,
      signerEmail: input.signerEmail,
      fileUrl: input.fileUrl,
      subject: input.subject,
      message: input.message,
      testMode,
    });
    if (!result.enabled) {
      return NextResponse.json({ enabled: false, reason: result.reason }, { status: 502 });
    }

    const record = newEsignRecord({
      id: result.signatureRequestId,
      quoteId: input.quoteId,
      quoteNumber: input.quoteNumber,
      tenantId,
      testMode,
      now: Date.now(),
    });
    await getStore().put(ESIGN_NAMESPACE, record.id, record);

    return NextResponse.json({ enabled: true, esignId: record.id, status: record.status, testMode });
  } catch (e) {
    logApiError("/api/esign/request POST", e);
    return NextResponse.json({ error: "Signature request failed" }, { status: 500 });
  }
}
