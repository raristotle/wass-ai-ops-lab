import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * B13 — "Price on request" fast path.
 *
 * Some real, carried parts (verified/curated real-tier records — e.g. identity records from a
 * manufacturer catalog or a customer's stock list) have no researched list price, so their
 * `unitPrice` is 0 and they carry a `priceNote` ending "price on request". Left as-is they read as a
 * $0 line — a dead end that looks broken on a quote. Instead a rep can quote them as PENDING PRICE:
 * the line flows through the basket → quote → revisions → audit trail exactly like any other, but is
 * clearly flagged "price on request — confirm with the branch" and excluded from the numeric total,
 * so the quote goes out honestly with the branch price-check pending.
 */

/** A real part we carry but hold no list price for → quote it "price on request", not $0. */
export function isPriceOnRequest(product: CatalogProduct): boolean {
  return (
    product.unitPrice <= 0 &&
    (product.dataSource === "verified" || product.dataSource === "curated")
  );
}

/** Customer-facing label for a pending-price line (printed quote, shared basket, cart). */
export const PRICE_ON_REQUEST_LABEL = "Price on request";

/** Rep-facing hint shown next to a pending-price line. */
export const PRICE_ON_REQUEST_HINT = "Pending branch price-check";
