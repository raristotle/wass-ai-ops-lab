import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { resolveBySku } from "@/lib/catalog/sku-index";
import {
  parseCrosswalkCsv,
  resolveCrosswalkRows,
  saveCrosswalk,
  saveCrosswalkRejects,
  buildCrosswalkRejectReport,
  getCrosswalkManifest,
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
 * PF-5 — rows that DON'T become mappings are no longer discarded after counting. Every
 * one is returned (and persisted) as a triage row carrying its source line number, the
 * cells as supplied, and a failure reason, so the operator can export → fix the source
 * CSV → re-import. The taxonomy lives in `lib/catalog/crosswalk-reject.ts`; this route
 * only merges the parse-time and resolve-time rejects into one line-ordered list.
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
    // Store the canonical catalog SKU so resolution is stable.
    const { entries, rejects: resolveRejects } = resolveCrosswalkRows(raw, (id) => resolveBySku(id)?.sku ?? null);

    // One triage list for the whole file: rows the PARSER dropped (blank cell) plus rows
    // the RESOLVER dropped (SKU not carried), ordered the way the operator reads the file.
    const rejects = [...stats.rejects, ...resolveRejects].sort((a, b) => a.line - b.line);
    const report = buildCrosswalkRejectReport(rejects, new Date().toISOString());

    if (entries.length === 0) {
      // Nothing imported — but this is exactly when the triage list is most valuable
      // (usually swapped columns or the wrong SKU column). Hand it back with the error
      // so the modal can still offer the export. Nothing is persisted: there is no
      // import for the report to belong to.
      return NextResponse.json(
        {
          error: "No crosswalk rows mapped to carried products — check the SKUs.",
          rejects: report,
        },
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
      // Unchanged meaning: rows whose SKU we don't carry. The full triage list is
      // broader (it also covers blank cells) and is reported separately as `rejects`.
      unresolved: resolveRejects.length,
      importedAtIso: report.importedAtIso,
    };
    await saveCrosswalk(store, entries, manifest);
    // Replace (or clear) the triage report so it always describes THIS import.
    await saveCrosswalkRejects(store, report);

    return NextResponse.json({
      ok: true,
      persisted: store.backend,
      manifest,
      rejects: report,
      headline: `Imported ${entries.length} catalog-number mappings${resolveRejects.length ? ` (${resolveRejects.length} skipped — not carried)` : ""}. Buyers can now search their own numbers.`,
    });
  } catch (e) {
    logApiError("/api/catalog/crosswalk/import:POST", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
