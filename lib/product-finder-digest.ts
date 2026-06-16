/**
 * Scheduled-report digest — pure builder for a "recent activity + top movers"
 * summary over order history, plus branded HTML for the email body.
 *
 * NOTE — no scheduler here. Per CLAUDE.md ("do not add cron — use BullMQ") and
 * because no BullMQ worker host ships with this deployment, the digest is built
 * ON DEMAND and emailed through the existing Resend transport; the *scheduling*
 * (Vercel Cron hitting /api/reports/digest, or any external trigger) is left to
 * the operator. Pure + unit-tested; the route owns the data fetch + send.
 */

const DAY_MS = 86_400_000;

export interface DigestOrderLine {
  sku: string;
  name: string;
  qty: number;
}
export interface DigestOrder {
  id: string;
  total: number;
  placedAt: number;
  lines: DigestOrderLine[];
}

export interface TopMover {
  sku: string;
  name: string;
  /** Total quantity ordered across the window. */
  qty: number;
  /** Distinct orders that contained this SKU. */
  orders: number;
}
export interface Digest {
  periodDays: number;
  orderCount: number;
  totalValue: number;
  topMovers: TopMover[];
  generatedAt: number;
}

/** Build a digest from orders over the trailing `days` window. Pure; `now` injected. */
export function buildDigest(orders: DigestOrder[], now: number, opts?: { days?: number; topN?: number }): Digest {
  const days = opts?.days ?? 7;
  const topN = opts?.topN ?? 5;
  const cutoff = now - days * DAY_MS;
  const recent = orders.filter((o) => o.placedAt >= cutoff);

  const bySku = new Map<string, TopMover>();
  for (const o of recent) {
    // Sum per-SKU quantity within the order, then attribute one order to each
    // distinct SKU (a SKU appearing twice in one order still counts as 1 order).
    const qtyBySku = new Map<string, number>();
    const nameBySku = new Map<string, string>();
    for (const l of o.lines) {
      qtyBySku.set(l.sku, (qtyBySku.get(l.sku) ?? 0) + l.qty);
      if (!nameBySku.has(l.sku)) nameBySku.set(l.sku, l.name);
    }
    for (const [sku, q] of qtyBySku) {
      const e = bySku.get(sku);
      if (e) {
        e.qty += q;
        e.orders += 1;
      } else {
        bySku.set(sku, { sku, name: nameBySku.get(sku) ?? sku, qty: q, orders: 1 });
      }
    }
  }

  const topMovers = [...bySku.values()]
    .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name))
    .slice(0, topN);

  return {
    periodDays: days,
    orderCount: recent.length,
    totalValue: recent.reduce((s, o) => s + o.total, 0),
    topMovers,
    generatedAt: now,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Branded, table-based HTML for the digest email. Pure — unit-testable. */
export function digestHtml(digest: Digest, opts?: { title?: string }): string {
  const title = opts?.title ?? `Meridian — last ${digest.periodDays}-day digest`;
  const rows =
    digest.topMovers.length > 0
      ? digest.topMovers
          .map(
            (m) => `<tr>
<td style="padding:6px 10px;border-bottom:1px solid #B7C9D3;font-family:monospace;color:#4F758B;">${escapeHtml(m.sku)}</td>
<td style="padding:6px 10px;border-bottom:1px solid #B7C9D3;color:#1D252D;">${escapeHtml(m.name)}</td>
<td style="padding:6px 10px;border-bottom:1px solid #B7C9D3;text-align:right;color:#1D252D;">${m.qty}</td>
<td style="padding:6px 10px;border-bottom:1px solid #B7C9D3;text-align:right;color:#4F758B;">${m.orders}</td>
</tr>`,
          )
          .join("")
      : `<tr><td colspan="4" style="padding:10px;color:#4F758B;">No orders in this window.</td></tr>`;

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#F8FAFB;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #B7C9D3;border-radius:10px;padding:24px;">
<p style="margin:0 0 4px;"><span style="background:#00AA13;color:#FFFFFF;font-weight:bold;letter-spacing:2px;padding:4px 8px;border-radius:4px;font-size:13px;">MERIDIAN</span> <span style="color:#4F758B;font-size:11px;letter-spacing:2px;">SUPPLY CO.</span></p>
<h1 style="margin:12px 0 4px;color:#1D252D;font-size:20px;">${escapeHtml(title)}</h1>
<p style="margin:0 0 16px;color:#4F758B;font-size:13px;">Last ${digest.periodDays} days &middot; ${digest.orderCount} order${digest.orderCount === 1 ? "" : "s"} &middot; $${digest.totalValue.toFixed(2)}</p>
<p style="margin:0 0 8px;color:#1D252D;font-weight:bold;">Top movers</p>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
<tr style="background:#1D252D;color:#FFFFFF;"><th style="padding:6px 10px;text-align:left;">SKU</th><th style="padding:6px 10px;text-align:left;">Product</th><th style="padding:6px 10px;text-align:right;">Qty</th><th style="padding:6px 10px;text-align:right;">Orders</th></tr>
${rows}
</table>
<p style="margin:24px 0 0;color:#4F758B;font-size:11px;">Demonstration digest from the Meridian AI Product Recommender — simulated catalog data.</p>
</div></body></html>`;
}
