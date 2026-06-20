import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { parseOrderHistoryCsv } from "@/lib/catalog/order-history";
import { mineAssociationRules, type Basket } from "@/lib/catalog/market-basket";
import {
  saveOrderHistory,
  getOrderHistoryManifest,
  type OrderHistoryManifest,
  type TopPair,
} from "@/lib/catalog/order-history-rules";

export const dynamic = "force-dynamic";

/**
 * Import a customer's historical order export (CSV) and WAKE the behavioral engines.
 *
 * Flow: parse the CSV → resolve each line's SKU to a catalog product → build one
 * basket per order → mine subcategory-grain association rules (lift/confidence/
 * support) → persist them app-globally. From then on the always-on companion rail
 * blends this REAL co-purchase lift on top of the deterministic spec-rule + affinity
 * signal — the single highest-leverage input for the cross-sell engine.
 *
 * Auth-gated (operator action; same-origin app UI or server bearer) + rate-limited.
 * $0: reuses the durable store. Scope is app-global for the pilot (one distributor
 * co-purchase model); per-customer models are a documented future enhancement.
 *
 * POST { csv, customer? }   ·   DELETE → clears the imported history
 */
const BodySchema = z.object({
  csv: z.string().min(1).max(5_000_000), // ~5 MB of order lines
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
    const parsed = parseOrderHistoryCsv(body.csv);
    if (parsed.stats.mapping.sku === null) {
      return NextResponse.json(
        { error: "No SKU/part-number column found. Include a header row with a column like 'sku', 'part number', or 'item'." },
        { status: 400 },
      );
    }
    if (parsed.orders.length === 0) {
      return NextResponse.json({ error: "No order rows parsed from the file." }, { status: 400 });
    }

    // Resolve SKUs → products, build one basket per order. Unresolved lines (parts
    // we don't carry) are counted, never invented.
    const baskets: Basket[] = [];
    const resolvedSkus = new Set<string>();
    const subcats = new Set<string>();
    let resolved = 0;
    let unresolved = 0;
    for (const order of parsed.orders) {
      const items = [];
      for (const line of order.lines) {
        const product = resolveBySku(line.sku);
        if (!product) {
          unresolved++;
          continue;
        }
        resolved++;
        resolvedSkus.add(product.sku);
        subcats.add(product.subcategory);
        items.push({ productId: product.id, subcategory: product.subcategory });
      }
      if (items.length > 0) baskets.push({ items });
    }

    if (baskets.length === 0) {
      return NextResponse.json(
        { error: "None of the order SKUs matched the catalog — nothing to mine. Check the SKUs or run the catalog crosswalk first." },
        { status: 422 },
      );
    }

    // Mine subcategory-grain association rules (positive-affinity only).
    const rules = mineAssociationRules(baskets, { grain: "subcategory", minCount: 2, minLift: 1.0 });
    const topPairs: TopPair[] = rules.slice(0, 8).map((r) => ({ a: r.a, b: r.b, lift: Math.round(r.lift * 100) / 100, count: r.count }));

    // Scope to the operator's tenant (or global when sessions are off) so one
    // customer's co-purchase model never bleeds into another's rail.
    const store = forTenant(getStore(), tenantForRequest(req));
    const prev = await getOrderHistoryManifest(store);
    const manifest: OrderHistoryManifest = {
      version: (prev?.version ?? 0) + 1,
      customer: body.customer?.trim() || null,
      orders: parsed.orders.length,
      lines: parsed.stats.lines,
      resolved,
      unresolved,
      distinctSkus: resolvedSkus.size,
      distinctSubcategories: subcats.size,
      rulesMined: rules.length,
      topPairs,
      importedAtIso: new Date().toISOString(),
    };
    await saveOrderHistory(store, rules, manifest);

    return NextResponse.json({
      ok: true,
      persisted: store.backend, // "postgres" (durable) or "memory" (per-instance demo)
      manifest,
      // A clear, honest signal of what mining found — the demo headline.
      headline:
        rules.length > 0
          ? `Imported ${manifest.orders} orders → mined ${rules.length} co-purchase rules. The cross-sell rail now reflects real order history.`
          : `Imported ${manifest.orders} orders, but no co-purchase pairs cleared the noise floor yet — add more order history to sharpen the signal.`,
    });
  } catch (e) {
    logApiError("/api/order-history/import:POST", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
