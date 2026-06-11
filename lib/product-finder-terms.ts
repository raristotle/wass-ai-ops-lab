/**
 * Selectable terms & conditions blocks for quotes — pure data.
 * The rep ticks the blocks that apply; the texts print on the quote sheet
 * and travel inside the customer acceptance link (resolved, so the customer
 * page never depends on this module's version).
 */

export interface TermsBlock {
  id: string;
  /** Short label shown next to the checkbox. */
  label: string;
  /** The sentence that prints on the quote. */
  text: string;
}

export const TERMS_BLOCKS: readonly TermsBlock[] = [
  {
    id: "freight",
    label: "Freight",
    text: "Freight prepaid and added on orders under $2,500; freight allowed on orders of $2,500 or more shipped within our service area.",
  },
  {
    id: "returns",
    label: "Returns",
    text: "Stock material returnable within 30 days in resalable condition; a 15% restocking fee applies. Special-order and cut material are non-returnable.",
  },
  {
    id: "payment",
    label: "Payment",
    text: "Net 30 days on approved credit; 1.5% monthly service charge on past-due balances.",
  },
  {
    id: "escalation",
    label: "Price escalation",
    text: "Wire, cable, and conduit pricing is subject to commodity escalation at time of shipment if not released within the validity window.",
  },
  {
    id: "leadtime",
    label: "Lead times",
    text: "Quoted lead times are estimates as of the quote date and are confirmed at order placement.",
  },
] as const;

/** Resolve selected block ids to their texts — unknown ids dropped, canonical order kept. */
export function resolveTerms(ids: readonly string[]): string[] {
  const wanted = new Set(ids);
  return TERMS_BLOCKS.filter((b) => wanted.has(b.id)).map((b) => b.text);
}
