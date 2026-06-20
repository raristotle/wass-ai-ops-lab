import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { getAdapters, liveSourcesConfigured } from "@/lib/ingest/registry";
import { loadSnapshot, recentRunReports } from "@/lib/ingest/snapshot-store";

export const dynamic = "force-dynamic";

/**
 * Ingestion status (Sprint D1) — what sources are registered, their last snapshot
 * size, and the recent run log. Backs the admin "Data ingestion" panel and the MCP
 * `ingest_status` tool. Read-only, auth-gated, tenant-scoped.
 *
 * GET → { sources[], recentRuns[], liveSourcesConfigured, persisted }
 */
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    const adapters = getAdapters();
    const sources = await Promise.all(
      adapters.map(async (a) => {
        const snap = await loadSnapshot(store, a.id);
        return {
          id: a.id,
          label: a.label,
          segment: a.segment,
          dataTypes: a.dataTypes,
          license: a.license,
          records: snap?.records.length ?? 0,
          lastFetchedIso: snap?.fetchedAtIso ?? null,
        };
      }),
    );
    const recentRuns = await recentRunReports(store, 25);
    return NextResponse.json({
      ok: true,
      persisted: store.backend,
      liveSourcesConfigured: liveSourcesConfigured(),
      sources,
      recentRuns,
    });
  } catch (e) {
    logApiError("/api/ingest/status:GET", e);
    return NextResponse.json({ error: "Failed to read ingestion status" }, { status: 500 });
  }
}
