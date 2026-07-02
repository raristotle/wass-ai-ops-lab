import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { captureCrosswalkEntry } from "@/lib/catalog/crosswalk";
import { apiError } from "@/lib/server/api-envelope";

export const dynamic = "force-dynamic";

/**
 * B17 — Wesco stock-number capture. A rep who knows a product's Wesco stock number (or any customer
 * number) captures it here; it's appended to the catalog-number crosswalk (deduped, provenance
 * "captured") so future searches for that number resolve to the product. The per-entry complement to
 * the batch crosswalk import (B7) — real identifiers accrue as a byproduct of daily use.
 *
 * Auth-gated (operator action; same-origin app UI or server bearer) + rate-limited. The SKU must be a
 * carried product — never invented.
 *
 * POST { number, sku }
 */
const BodySchema = z.object({
  number: z.string().min(1).max(80),
  sku: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return apiError("invalid_request", "A number and a carried sku are required.", 400);
  }
  const product = resolveBySku(body.sku);
  if (!product) {
    return apiError("not_found", "That SKU isn't a carried product — nothing captured.", 404);
  }
  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    const res = await captureCrosswalkEntry(store, body.number, product.sku);
    return NextResponse.json({ ok: true, ...res, sku: product.sku, name: product.name });
  } catch (e) {
    logApiError("/api/catalog/crosswalk/capture", e);
    return apiError("internal", "Capture failed", 500);
  }
}
