import { describe, it, expect } from "vitest";
import {
  encodeQuoteShare,
  decodeQuoteShare,
  isExpired,
  QUOTE_SHARE_VERSION,
  type QuoteSharePayload,
} from "@/lib/product-finder-quote-share";
import { b64uEncode } from "@/lib/product-finder-share";

const NOW = 1_780_000_000_000;

function samplePayload(): QuoteSharePayload {
  return {
    v: QUOTE_SHARE_VERSION,
    id: "quote-123",
    number: "Q-20260611-0042",
    customer: "Gulf Coast Industrial",
    project: "Panel upgrade — Bldg 4",
    lines: [
      { id: "CB-SQD-QO115", sku: "QO115", name: "QO 15A Breaker", qty: 10, unitPrice: 12.5 },
      { id: "WC-SOU-12NM", sku: "12NM", name: "12/2 NM-B 250ft", qty: 2, unitPrice: 89.99 },
    ],
    total: 304.98,
    createdAt: NOW,
    validUntil: NOW + 30 * 86_400_000,
    rep: "Sarah Chen",
    branch: "Houston Downtown",
  };
}

describe("encode/decode round-trip", () => {
  it("round-trips a full payload", () => {
    const p = samplePayload();
    expect(decodeQuoteShare(encodeQuoteShare(p))).toEqual(p);
  });

  it("round-trips approvalPending and omits it when false-y", () => {
    const p = { ...samplePayload(), approvalPending: true };
    expect(decodeQuoteShare(encodeQuoteShare(p))?.approvalPending).toBe(true);
    const q = samplePayload();
    expect(decodeQuoteShare(encodeQuoteShare(q))?.approvalPending).toBeUndefined();
  });

  it("handles multi-byte characters in customer/project", () => {
    const p = { ...samplePayload(), customer: "Café Müller — 现场" };
    expect(decodeQuoteShare(encodeQuoteShare(p))?.customer).toBe("Café Müller — 现场");
  });

  it("produces a URL-safe string (no +, /, =)", () => {
    const s = encodeQuoteShare(samplePayload());
    expect(s).not.toMatch(/[+/=]/);
  });
});

describe("decodeQuoteShare defensiveness", () => {
  it("returns null on garbage / empty / non-JSON", () => {
    expect(decodeQuoteShare("")).toBeNull();
    expect(decodeQuoteShare("not-base64!!!")).toBeNull();
    expect(decodeQuoteShare(b64uEncode("plain text"))).toBeNull();
    expect(decodeQuoteShare(b64uEncode("[1,2,3]"))).toBeNull();
  });

  it("returns null on wrong version", () => {
    const bad = { ...samplePayload(), v: 99 };
    expect(decodeQuoteShare(b64uEncode(JSON.stringify(bad)))).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    const { total: _total, ...rest } = samplePayload();
    expect(decodeQuoteShare(b64uEncode(JSON.stringify(rest)))).toBeNull();
  });

  it("drops invalid lines and rejects an all-invalid line list", () => {
    const p = samplePayload();
    const mixed = { ...p, lines: [p.lines[0], { id: 5, qty: "x" }] };
    expect(decodeQuoteShare(b64uEncode(JSON.stringify(mixed)))?.lines).toEqual([p.lines[0]]);
    const allBad = { ...p, lines: [{ id: 5 }] };
    expect(decodeQuoteShare(b64uEncode(JSON.stringify(allBad)))).toBeNull();
  });

  it("caps lines at 200", () => {
    const p = samplePayload();
    const many = Array.from({ length: 250 }, (_, i) => ({ ...p.lines[0], id: `p-${i}` }));
    const decoded = decodeQuoteShare(b64uEncode(JSON.stringify({ ...p, lines: many })));
    expect(decoded?.lines).toHaveLength(200);
  });
});

describe("isExpired", () => {
  it("is false within validity and true after", () => {
    const p = samplePayload();
    expect(isExpired(p, p.validUntil - 1)).toBe(false);
    expect(isExpired(p, p.validUntil)).toBe(false);
    expect(isExpired(p, p.validUntil + 1)).toBe(true);
  });
});
