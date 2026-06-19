import { describe, it, expect, afterEach, vi } from "vitest";
import {
  b64uEncode,
  b64uDecode,
  encodeCart,
  decodeCart,
} from "@/lib/product-finder-share";

// ─── base64url helper functions (direct, Node/Buffer path) ─────────────────────
//
// The sibling test only exercises b64uEncode/b64uDecode indirectly through
// encodeCart/decodeCart. Here we hit them directly and — importantly — force the
// *browser* branch (btoa/atob/TextEncoder) that the Node Buffer path otherwise
// hides, by stubbing globalThis.Buffer to undefined.

describe("b64uEncode / b64uDecode — Node (Buffer) path", () => {
  it("round-trips ASCII", () => {
    expect(b64uDecode(b64uEncode("hello world"))).toBe("hello world");
  });

  it("round-trips multi-byte Unicode", () => {
    const s = "日本語 café — 😀";
    expect(b64uDecode(b64uEncode(s))).toBe(s);
  });

  it("round-trips the empty string", () => {
    expect(b64uEncode("")).toBe("");
    expect(b64uDecode("")).toBe("");
  });

  it("produces only URL-safe base64url characters (no + / =)", () => {
    // Inputs chosen so that standard base64 would contain + and / and padding.
    const encoded = b64uEncode("ÿÿÿþÿ");
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]*$/);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("decodes a value that requires re-padding (length not a multiple of 4)", () => {
    // "M" -> base64url "TQ" (2 chars; needs 2 '=' re-added internally)
    const encoded = b64uEncode("M");
    expect(encoded.length % 4).not.toBe(0);
    expect(b64uDecode(encoded)).toBe("M");
  });
});

// ─── Force the BROWSER branch by removing Buffer ───────────────────────────────

describe("b64uEncode / b64uDecode — browser (btoa/atob/TextEncoder) path", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("round-trips ASCII via btoa/atob when Buffer is undefined", () => {
    vi.stubGlobal("Buffer", undefined);
    expect(typeof Buffer).toBe("undefined");
    const encoded = b64uEncode("hello world");
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]*$/);
    expect(b64uDecode(encoded)).toBe("hello world");
  });

  it("round-trips multi-byte Unicode via the encodeURIComponent/TextDecoder path", () => {
    vi.stubGlobal("Buffer", undefined);
    const s = "日本語 café — 😀 €";
    const encoded = b64uEncode(s);
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]*$/);
    expect(b64uDecode(encoded)).toBe(s);
  });

  it("browser-encoded output decodes identically under the Node path", () => {
    // Encode with Buffer removed, then decode with Buffer restored: the two
    // implementations must agree on the wire format.
    vi.stubGlobal("Buffer", undefined);
    const browserEncoded = b64uEncode("café 😀");
    vi.unstubAllGlobals();
    expect(b64uDecode(browserEncoded)).toBe("café 😀");
  });

  it("Node-encoded output decodes identically under the browser path", () => {
    const nodeEncoded = b64uEncode("café 😀");
    vi.stubGlobal("Buffer", undefined);
    expect(b64uDecode(nodeEncoded)).toBe("café 😀");
  });

  it("encodeCart/decodeCart round-trip end-to-end on the browser path", () => {
    vi.stubGlobal("Buffer", undefined);
    const lines = [
      { id: "CB-SQD-QO115", qty: 10 },
      { id: "CB-EAT-CH115", qty: 5 },
    ];
    const encoded = encodeCart(lines, { customer: "Açme ☕", project: "Sité B" });
    const decoded = decodeCart(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.items).toEqual(lines);
    expect(decoded!.customer).toBe("Açme ☕");
    expect(decoded!.project).toBe("Sité B");
  });
});

// ─── encodeCart meta edge cases ────────────────────────────────────────────────

describe("encodeCart meta handling", () => {
  it("omits empty-string customer/project from the wire payload", () => {
    // Empty strings are falsy, so payload.c / payload.p must NOT be set.
    const encoded = encodeCart([{ id: "P-1", qty: 1 }], {
      customer: "",
      project: "",
    });
    const decoded = decodeCart(encoded);
    expect(decoded!.customer).toBeUndefined();
    expect(decoded!.project).toBeUndefined();
  });

  it("includes only customer when project is omitted", () => {
    const encoded = encodeCart([{ id: "P-1", qty: 1 }], { customer: "Acme" });
    const decoded = decodeCart(encoded);
    expect(decoded!.customer).toBe("Acme");
    expect(decoded!.project).toBeUndefined();
  });

  it("includes only project when customer is omitted", () => {
    const encoded = encodeCart([{ id: "P-1", qty: 1 }], { project: "Site C" });
    const decoded = decodeCart(encoded);
    expect(decoded!.project).toBe("Site C");
    expect(decoded!.customer).toBeUndefined();
  });

  it("treats a fully-empty meta object the same as no meta", () => {
    const encoded = encodeCart([{ id: "P-1", qty: 1 }], {});
    const decoded = decodeCart(encoded);
    expect(decoded!.customer).toBeUndefined();
    expect(decoded!.project).toBeUndefined();
  });
});

// ─── decodeCart additional branch coverage ─────────────────────────────────────

const toB64u = (s: string) =>
  Buffer.from(s)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

describe("decodeCart branch coverage", () => {
  it("returns null when the top-level JSON value is an array", () => {
    expect(decodeCart(toB64u(JSON.stringify([1, 2, 3])))).toBeNull();
  });

  it("returns null when the top-level JSON value is the literal null", () => {
    expect(decodeCart(toB64u(JSON.stringify(null)))).toBeNull();
  });

  it("returns null when the top-level JSON value is a number (typeof !== object)", () => {
    expect(decodeCart(toB64u(JSON.stringify(42)))).toBeNull();
  });

  it("returns null when `l` is present but not an array", () => {
    expect(decodeCart(toB64u(JSON.stringify({ l: "nope" })))).toBeNull();
  });

  it("skips line entries that are not arrays", () => {
    const payload = JSON.stringify({ l: ["just-a-string", 99, { id: "x" }, ["P-ok", 3]] });
    const decoded = decodeCart(toB64u(payload));
    expect(decoded!.items).toEqual([{ id: "P-ok", qty: 3 }]);
  });

  it("defaults non-numeric qty (NaN) to 1 via `Number(rawQty) || 1`", () => {
    const payload = JSON.stringify({ l: [["P-1", "abc"]] });
    const decoded = decodeCart(toB64u(payload));
    expect(decoded!.items).toEqual([{ id: "P-1", qty: 1 }]);
  });

  it("defaults a missing qty (undefined) to 1", () => {
    // entry has only the id element
    const payload = JSON.stringify({ l: [["P-1"]] });
    const decoded = decodeCart(toB64u(payload));
    expect(decoded!.items).toEqual([{ id: "P-1", qty: 1 }]);
  });

  it("accepts a numeric-string qty by coercion", () => {
    const payload = JSON.stringify({ l: [["P-1", "7"]] });
    const decoded = decodeCart(toB64u(payload));
    expect(decoded!.items).toEqual([{ id: "P-1", qty: 7 }]);
  });

  it("ignores a non-string customer (c) field", () => {
    const payload = JSON.stringify({ l: [["P-1", 1]], c: 123 });
    const decoded = decodeCart(toB64u(payload));
    expect(decoded!.customer).toBeUndefined();
  });

  it("ignores a non-string project (p) field", () => {
    const payload = JSON.stringify({ l: [["P-1", 1]], p: { nested: true } });
    const decoded = decodeCart(toB64u(payload));
    expect(decoded!.project).toBeUndefined();
  });

  it("keeps customer/project when both are valid strings", () => {
    const payload = JSON.stringify({ l: [["P-1", 1]], c: "Cust", p: "Proj" });
    const decoded = decodeCart(toB64u(payload));
    expect(decoded!.customer).toBe("Cust");
    expect(decoded!.project).toBe("Proj");
  });

  it("returns an empty-item cart for an empty `l` array (not null)", () => {
    const decoded = decodeCart(toB64u(JSON.stringify({ l: [] })));
    expect(decoded).not.toBeNull();
    expect(decoded!.items).toEqual([]);
  });

  it("stops at MAX_ITEMS (200) and does not read past the cap", () => {
    const many = Array.from({ length: 205 }, (_, i) => [`P-${i}`, 1]);
    const decoded = decodeCart(toB64u(JSON.stringify({ l: many })));
    expect(decoded!.items.length).toBe(200);
    expect(decoded!.items[199]).toEqual({ id: "P-199", qty: 1 });
  });
});
