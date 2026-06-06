/**
 * product-finder-share.ts
 *
 * Pure, isomorphic (no window/Date) encode/decode for cart sharing via URL.
 *
 * Wire format: minimal JSON  { l: [[id, qty], ...], c?: string, p?: string }
 * Encoding: UTF-8 bytes → base64url (URL-safe, no padding)
 *
 * base64 cross-env strategy:
 *   Node (Vitest): Buffer is defined → use Buffer.from().toString("base64")
 *   Browser: btoa/atob with manual UTF-8 encode via TextEncoder/encodeURIComponent
 */

const MAX_ITEMS = 200;

// ─── Base64url helpers ────────────────────────────────────────────────────────

/** Encode a UTF-8 string to a URL-safe base64 string (no padding). */
function b64uEncode(str: string): string {
  if (typeof Buffer !== "undefined") {
    // Node / Vitest environment
    return Buffer.from(str, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  // Browser: encode utf-8 via encodeURIComponent then use btoa
  // This handles multi-byte characters correctly.
  const utf8 = encodeURIComponent(str).replace(
    /%([0-9A-F]{2})/g,
    (_match, p1: string) => String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode a URL-safe base64 string back to a UTF-8 string. */
function b64uDecode(str: string): string {
  // Re-pad to a multiple of 4
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
  // Re-introduce standard base64 chars
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");

  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf8");
  }
  // Browser
  const binary = atob(b64);
  // Decode UTF-8 bytes that were produced by the encodeURIComponent path
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

// ─── Wire format type ─────────────────────────────────────────────────────────

interface WirePayload {
  l: [string, number][];
  c?: string;
  p?: string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type CartLine = { id: string; qty: number };
export type CartMeta = { customer?: string; project?: string };
export type DecodedCart = {
  items: CartLine[];
  customer?: string;
  project?: string;
};

/**
 * Encode cart lines (+ optional quote meta) into a compact, URL-safe string.
 * Pure — no side effects, no Date/window references.
 */
export function encodeCart(lines: CartLine[], meta?: CartMeta): string {
  const payload: WirePayload = {
    l: lines.map(({ id, qty }) => [id, qty]),
  };
  if (meta?.customer) payload.c = meta.customer;
  if (meta?.project) payload.p = meta.project;

  return b64uEncode(JSON.stringify(payload));
}

/**
 * Decode a cart string produced by encodeCart.
 * Returns null on any malformed / garbage input (never throws).
 * - Clamps qty to >= 1 integer.
 * - Ignores entries where id is not a string.
 * - Caps output at MAX_ITEMS (200) entries.
 */
export function decodeCart(str: string): DecodedCart | null {
  if (!str) return null;
  try {
    const json = b64uDecode(str);
    const raw: unknown = JSON.parse(json);

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;

    if (!Array.isArray(obj.l)) return null;

    const items: CartLine[] = [];
    for (const entry of obj.l as unknown[]) {
      if (!Array.isArray(entry)) continue;
      const [rawId, rawQty] = entry as unknown[];
      if (typeof rawId !== "string") continue;
      const qty = Math.max(1, Math.trunc(Number(rawQty) || 1));
      items.push({ id: rawId, qty });
      if (items.length >= MAX_ITEMS) break;
    }

    const result: DecodedCart = { items };
    if (typeof obj.c === "string") result.customer = obj.c;
    if (typeof obj.p === "string") result.project = obj.p;

    return result;
  } catch {
    return null;
  }
}
