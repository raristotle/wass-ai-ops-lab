import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { crosswalkIndex, resolveCustomerNumber, getCrosswalkManifest } from "@/lib/catalog/crosswalk";
import { parseOrderHistoryCsv } from "@/lib/catalog/order-history";
import { mineAssociationRules, type Basket } from "@/lib/catalog/market-basket";
import {
  saveOrderHistory,
  getOrderHistoryManifest,
  type OrderHistoryManifest,
  type TopPair,
} from "@/lib/catalog/order-history-rules";
import { saveDatedOrders, type ResolvedOrder } from "@/lib/catalog/order-history-orders";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

    // Scope to the operator's tenant (or global when sessions are off) so one customer's
    // co-purchase model never bleeds into another's rail. Built up front so the resolver
    // can consult the tenant's catalog-number crosswalk.
    const tenant = tenantForRequest(req);
    const store = forTenant(getStore(), tenant);
    const crosswalk = await crosswalkIndex(store, tenant ?? "global");
    // B7 (crosswalk-first guard): is a REAL customer crosswalk loaded, or only the
    // illustrative demo seed? With wescoSku/customer-number columns unresolvable
    // without it, a Wesco-numbered export resolves almost nothing — the #1 first-week
    // "it's broken" moment. When resolution is poor AND no real crosswalk exists, we
    // tell the operator to load the crosswalk first (structured flag, so the modal can
    // deep-link them straight to that import) rather than silently mining a thin model.
    const hasRealCrosswalk = (await getCrosswalkManifest(store)) !== null;

    // Resolve a line to a carried product: exact SKU first, then the customer
    // catalog-number crosswalk (so a real distributor's export that keys on THEIR own
    // numbers still resolves). Unresolved lines are counted, never invented.
    const resolveLine = (sku: string) => {
      const direct = resolveBySku(sku);
      if (direct) return direct;
      const hit = resolveCustomerNumber(crosswalk, sku);
      return hit ? resolveBySku(hit.sku) : null;
    };

    const baskets: Basket[] = [];
    const resolvedOrders: ResolvedOrder[] = [];
    const resolvedSkus = new Set<string>();
    const subcats = new Set<string>();
    let resolved = 0;
    let unresolved = 0;
    for (const order of parsed.orders) {
      const items = [];
      const orderLines = [];
      for (const line of order.lines) {
        const product = resolveLine(line.sku);
        if (!product) {
          unresolved++;
          continue;
        }
        resolved++;
        resolvedSkus.add(product.sku);
        subcats.add(product.subcategory);
        items.push({ productId: product.id, subcategory: product.subcategory });
        orderLines.push({ product, qty: line.qty });
      }
      if (items.length > 0) baskets.push({ items });
      if (orderLines.length > 0) resolvedOrders.push({ orderId: order.orderId, date: order.date, lines: orderLines });
    }

    if (baskets.length === 0) {
      return NextResponse.json(
        {
          error: hasRealCrosswalk
            ? "None of the order lines matched a carried product — tried exact SKU and your imported catalog-number crosswalk. Check the part-number column against the numbers your crosswalk maps."
            : "None of the order lines matched a carried product. If this file uses your own catalog or Wesco stock numbers, load your catalog-number crosswalk first — then re-import.",
          // B7: no real crosswalk + zero resolution → almost certainly the missing-crosswalk
          // failure mode. Flag it so the modal offers a one-click jump to the crosswalk import.
          needsCrosswalk: !hasRealCrosswalk,
        },
        { status: 422 },
      );
    }

    // Mine subcategory-grain association rules (positive-affinity only).
    const rules = mineAssociationRules(baskets, { grain: "subcategory", minCount: 2, minLift: 1.0 });
    const topPairs: TopPair[] = rules.slice(0, 8).map((r) => ({ a: r.a, b: r.b, lift: Math.round(r.lift * 100) / 100, count: r.count }));

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

    // B20: also persist a dated per-customer Order representation so the
    // date-windowed forecast/next-best-action/whitespace engines wake up on a
    // real import — not only the cross-sell rail above. Fails closed: a store
    // error here must never fail the (already-successful) rules import.
    let datedOrders;
    try {
      datedOrders = await saveDatedOrders(store, resolvedOrders, manifest.customer, Date.now());
    } catch (e) {
      logApiError("/api/order-history/import:datedOrders", e);
      datedOrders = null;
    }

    // B7: even when SOME lines matched, a low resolution rate with no real crosswalk
    // usually means the file keys on numbers the crosswalk would resolve — surface the
    // hint (non-blocking; the partial import still stands).
    const totalLines = resolved + unresolved;
    const poorResolution = totalLines > 0 && resolved / totalLines < 0.5;
    const needsCrosswalk = poorResolution && !hasRealCrosswalk;

    return NextResponse.json({
      ok: true,
      persisted: store.backend, // "postgres" (durable) or "memory" (per-instance demo)
      manifest,
      datedOrders,
      needsCrosswalk,
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
