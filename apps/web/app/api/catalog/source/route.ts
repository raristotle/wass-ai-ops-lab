import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { getCatalogProvider } from "@/lib/integration/catalog-index";

export const dynamic = "force-dynamic";

/**
 * Catalog / PIM source descriptor (provenance strip in the filter sidebar).
 * Served from an API route so client code never imports the catalog graph —
 * computing this client-side shipped the generated datasets to the browser
 * (docs/perf-audit-2026-07-10.md). Open + rate-limited (like /api/products/suggest);
 * the payload is catalog METADATA only (product count + synthetic sync info).
 * Auth gate was removed 2026-07-11 because it hid the sidebar's provenance strip
 * in sessions-OFF pilot/dev mode. getCatalog() is process-cached so this is cheap warm.
 */
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  return NextResponse.json(getCatalogProvider().getSource(new Date()));
}
