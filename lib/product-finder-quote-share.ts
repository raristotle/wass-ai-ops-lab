/**
 * Customer-facing quote link — pure, isomorphic encode/decode.
 *
 * The payload bakes in everything the acceptance page needs (incl. per-line
 * unit prices), so the customer view never depends on the rep's pricing
 * provider, active-customer selection, or auth state.
 *
 * Wire format: versioned JSON → base64url via the shared b64u helpers.
 */

import { b64uEncode, b64uDecode } from "@/lib/product-finder-share";

export const QUOTE_SHARE_VERSION = 1;
const MAX_LINES = 200;

export interface QuoteShareLine {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  /** B13: quoted "price on request" — no unit price yet, pending a branch price-check. */
  pending?: boolean;
}

export interface QuoteSharePayload {
  v: typeof QUOTE_SHARE_VERSION;
  /** SavedQuote.id — lets the same browser convert the quote on accept. */
  id: string;
  /** Human quote number, e.g. Q-20260611-0042. */
  number: string;
  customer: string;
  project: string;
  lines: QuoteShareLine[];
  total: number;
  createdAt: number;
  /** Epoch ms — Accept disabled after this. */
  validUntil: number;
  rep?: string;
  branch?: string;
  /** True when the quote is still awaiting manager margin sign-off. */
  approvalPending?: boolean;
  /** Free-text note from the rep, shown under the line table. */
  note?: string;
  /** Resolved terms & conditions sentences (texts, not ids — page stays standalone). */
  terms?: string[];
}

export function encodeQuoteShare(payload: QuoteSharePayload): string {
  return b64uEncode(JSON.stringify({ ...payload, lines: payload.lines.slice(0, MAX_LINES) }));
}

function isLine(x: unknown): x is QuoteShareLine {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.sku === "string" &&
    typeof o.name === "string" &&
    typeof o.qty === "number" && Number.isFinite(o.qty) && o.qty >= 1 &&
    typeof o.unitPrice === "number" && Number.isFinite(o.unitPrice) && o.unitPrice >= 0 &&
    (o.pending === undefined || typeof o.pending === "boolean") // B13
  );
}

/**
 * Decode a quote-share string. Returns null on any malformed/garbage input —
 * never throws. Lines failing validation are dropped; an empty line list is
 * treated as malformed.
 */
export function decodeQuoteShare(str: string): QuoteSharePayload | null {
  if (!str) return null;
  try {
    const raw: unknown = JSON.parse(b64uDecode(str));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const o = raw as Record<string, unknown>;
    if (o.v !== QUOTE_SHARE_VERSION) return null;
    if (
      typeof o.id !== "string" ||
      typeof o.number !== "string" ||
      typeof o.customer !== "string" ||
      typeof o.project !== "string" ||
      !Array.isArray(o.lines) ||
      typeof o.total !== "number" || !Number.isFinite(o.total) ||
      typeof o.createdAt !== "number" ||
      typeof o.validUntil !== "number"
    ) {
      return null;
    }
    const lines = (o.lines as unknown[]).filter(isLine).slice(0, MAX_LINES);
    if (lines.length === 0) return null;

    const payload: QuoteSharePayload = {
      v: QUOTE_SHARE_VERSION,
      id: o.id,
      number: o.number,
      customer: o.customer,
      project: o.project,
      lines,
      total: o.total,
      createdAt: o.createdAt,
      validUntil: o.validUntil,
    };
    if (typeof o.rep === "string") payload.rep = o.rep;
    if (typeof o.branch === "string") payload.branch = o.branch;
    if (o.approvalPending === true) payload.approvalPending = true;
    if (typeof o.note === "string" && o.note.trim()) payload.note = o.note;
    if (Array.isArray(o.terms)) {
      const terms = (o.terms as unknown[]).filter((t): t is string => typeof t === "string" && t.trim().length > 0);
      if (terms.length > 0) payload.terms = terms;
    }
    return payload;
  } catch {
    return null;
  }
}

/** True when the quote's validity window has lapsed at `now`. */
export function isExpired(payload: Pick<QuoteSharePayload, "validUntil">, now: number): boolean {
  return now > payload.validUntil;
}
