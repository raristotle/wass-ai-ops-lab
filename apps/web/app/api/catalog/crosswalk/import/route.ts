import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { resolveBySku } from "@/lib/catalog/sku-index";
import {
  parseCrosswalkCsv,
  saveCrosswalk,
  getCrosswalkManifest,
  type CrosswalkEntry,
  type CrosswalkManifest,
} from "@/lib/catalog/crosswalk";

export const dynamic = "force-dynamic";

/**
 * Import a customer catalog-number crosswalk (CSV of `customer number,sku`) so the
 * customer's buyers can search/paste THEIR own part numbers and resolve to carried
 * products. Each row's SKU is verified against the catalog; rows whose SKU we don't
 * carry are reported (`unresolved`), never invented. Replaces the illustrative DEMO
 * crosswalk with real mappings.
 *
 * Auth-gated (operator action) + rate-limited; tenant-scoped. $0 (durable store).
 *
 * POST { csv, customer? }
 */
const BodySchema = z.object({
  csv: z.string().min(1).max(5_000_000),
  customer: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { entries: raw, stats } = parseCrosswalkCsv(body.csv);
    if (stats.mapping.customerNumber === null || stats.mapping.sku === null) {
      return NextResponse.json(
        { error: "Need a customer-number column AND a sku column (e.g. 'your number' and 'our_sku')." },
        { status: 400 },
      );
    }

    // Keep only entries whose SKU resolves to a carried product (verified, not invented).
    const entries: CrosswalkEntry[] = [];
    let unresolved = 0;
    for (const e of raw) {
      const product = resolveBySku(e.sku);
      if (!product) {
        unresolved++;
        continue;
      }
      // Store the canonical catalog SKU so resolution is stable.
      entries.push({ customerNumber: e.customerNumber, sku: product.sku, source: "import" });
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No crosswalk rows mapped to carried products — check the SKUs." },
        { status: 422 },
      );
    }

    const store = forTenant(getStore(), tenantForRequest(req));
    const prev = await getCrosswalkManifest(store);
    const manifest: CrosswalkManifest = {
      version: (prev?.version ?? 0) + 1,
      customer: body.customer?.trim() || null,
      entries: entries.length,
      resolved: entries.length,
      unresolved,
      importedAtIso: new Date().toISOString(),
    };
    await saveCrosswalk(store, entries, manifest);

    return NextResponse.json({
      ok: true,
      persisted: store.backend,
      manifest,
      headline: `Imported ${entries.length} catalog-number mappings${unresolved ? ` (${unresolved} skipped — not carried)` : ""}. Buyers can now search their own numbers.`,
    });
  } catch (e) {
    logApiError("/api/catalog/crosswalk/import:POST", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
