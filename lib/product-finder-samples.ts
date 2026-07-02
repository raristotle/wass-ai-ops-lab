/**
 * lib/product-finder-samples.ts — B9: one-click sample templates for the two pilot
 * data-onboarding imports (order history + catalog crosswalk).
 *
 * The SKUs below are REAL carried products (verified against the live catalog), so a
 * user who downloads a sample and imports it immediately sees the feature work end to
 * end — order lines resolve, co-purchase rules mine, and the crosswalk resolves to
 * carried products. They are illustrative example data, not real customer orders.
 *
 * $0, pure data + a tiny browser download helper (guarded for SSR).
 */

/**
 * A realistic multi-order electrical basket set. The same subcategories recur across
 * orders (breaker + wire + receptacle + wall plate = a device rough-in), so importing
 * this mines genuine co-purchase pairs rather than a thin/empty model.
 */
export const SAMPLE_ORDER_HISTORY_CSV = `order,sku,qty
1001,CB-ABB-6,12
1001,12THHN-BLK-500,2
1001,HBL2310,24
1001,80401-W,24
1002,CB-SQU-28,10
1002,12THHN-BLK-500,3
1002,HBL2310,18
1002,80401-W,18
1003,CB-ABB-6,6
1003,30-074,100
1003,HBL2310,12
1003,80401-W,12
1004,QO115,8
1004,12THHN-BLK-500,1
1004,30-074,50
1005,CB-ABB-6,10
1005,HBL2310,20
1005,80401-W,20
1005,CF-BRI-72330,15
1006,CB-SQU-28,6
1006,12THHN-BLK-500,2
1006,CF-BRI-72330,10
1007,HBL2310,16
1007,80401-W,16
1007,30-074,75
1008,CB-ABB-6,8
1008,12THHN-BLK-500,2
1008,HBL2310,14
`;

/**
 * A customer catalog-number crosswalk: the buyer's own item numbers on the left, the
 * carried product SKU they map to on the right. The `our_sku` side is real, so imported
 * numbers resolve to carried products. Replace the left column with the customer's own.
 */
export const SAMPLE_CROSSWALK_CSV = `customer_number,our_sku
ACME-1001,CB-ABB-6
ACME-1002,CB-SQU-28
ACME-1003,QO115
ACME-2001,HBL2310
ACME-2002,80401-W
ACME-3001,30-074
ACME-3002,CF-BRI-72330
ACME-4001,12THHN-BLK-500
`;

/**
 * Trigger a client-side download of a text file. No-op on the server (guards `document`),
 * so it is safe to import into a Server Component tree; it only runs from a click handler.
 */
export function downloadTextFile(filename: string, text: string, mime = "text/csv"): void {
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof Blob === "undefined") return;
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Release the object URL on the next tick so the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
