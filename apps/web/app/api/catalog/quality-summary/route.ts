import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { getCatalog } from "@/lib/catalog/index";
import { summarizeQuality, type CatalogQualitySummary } from "@/lib/catalog/data-quality-score";

export const dynamic = "force-dynamic";

/**
 * Catalog data-quality summary (v4-S3 #11) — average score, tier counts, and the
 * biggest completeness gaps across the whole catalog. Pure/$0; computed once and
 * cached on the process (the catalog is immutable per build). Auth-gated +
 * rate-limited, like the other manager-dashboard endpoints.
 */
const g = globalThis as unknown as { __qualitySummary?: CatalogQualitySummary };

function summary(): CatalogQualitySummary {
  if (!g.__qualitySummary) g.__qualitySummary = summarizeQuality(getCatalog().products);
  return g.__qualitySummary;
}

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  return NextResponse.json({ summary: summary() });
}
