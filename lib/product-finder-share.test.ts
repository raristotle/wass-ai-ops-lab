import { describe, it, expect } from "vitest";
import { encodeCart, decodeCart } from "@/lib/product-finder-share";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LINES = [
  { id: "CB-SQD-QO115", qty: 10 },
  { id: "CB-EAT-CH115", qty: 5 },
];

const META = { customer: "Acme Corp", project: "Site B" };

// ─── Round-trip ───────────────────────────────────────────────────────────────

describe("encodeCart / decodeCart round-trip", () => {
  it("round-trips lines without meta", () => {
    const encoded = encodeCart(LINES);
    const decoded = decodeCart(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.items).toEqual(LINES);
    expect(decoded!.customer).toBeUndefined();
    expect(decoded!.project).toBeUndefined();
  });

  it("round-trips lines with full meta", () => {
    const encoded = encodeCart(LINES, META);
    const decoded = decodeCart(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.items).toEqual(LINES);
    expect(decoded!.customer).toBe("Acme Corp");
    expect(decoded!.project).toBe("Site B");
  });

  it("round-trips a single item", () => {
    const lines = [{ id: "P-001", qty: 1 }];
    const encoded = encodeCart(lines);
    const decoded = decodeCart(encoded);
    expect(decoded!.items).toEqual(lines);
  });

  it("round-trips Unicode in meta fields", () => {
    const encoded = encodeCart(LINES, { customer: "日本語テスト", project: "café" });
    const decoded = decodeCart(encoded);
    expect(decoded!.customer).toBe("日本語テスト");
    expect(decoded!.project).toBe("café");
  });
});

// ─── URL-safe charset ─────────────────────────────────────────────────────────

describe("encodeCart output charset", () => {
  it("contains no + characters", () => {
    const encoded = encodeCart(LINES, META);
    expect(encoded).not.toContain("+");
  });

  it("contains no / characters", () => {
    const encoded = encodeCart(LINES, META);
    expect(encoded).not.toContain("/");
  });

  it("contains no = padding characters", () => {
    const encoded = encodeCart(LINES, META);
    expect(encoded).not.toContain("=");
  });

  it("output only contains URL-safe base64url chars (A-Z a-z 0-9 - _)", () => {
    const encoded = encodeCart(LINES, META);
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/);
  });
});

// ─── Malformed input → null ───────────────────────────────────────────────────

describe("decodeCart malformed input", () => {
  it("returns null for an empty string", () => {
    expect(decodeCart("")).toBeNull();
  });

  it("returns null for random garbage", () => {
    expect(decodeCart("!!!not-valid!!!")).toBeNull();
  });

  it("returns null for valid base64 but invalid JSON inside", () => {
    // base64url of "not json"
    const bad = Buffer.from("not json").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodeCart(bad)).toBeNull();
  });

  it("returns null for JSON that is missing the `l` array", () => {
    const payload = Buffer.from(JSON.stringify({ c: "customer" })).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodeCart(payload)).toBeNull();
  });

  it("returns null for a truncated string", () => {
    const encoded = encodeCart(LINES);
    expect(decodeCart(encoded.slice(0, 3))).toBeNull();
  });
});

// ─── Empty cart ───────────────────────────────────────────────────────────────

describe("empty cart handling", () => {
  it("encodes an empty lines array without throwing", () => {
    expect(() => encodeCart([])).not.toThrow();
  });

  it("round-trips an empty cart", () => {
    const encoded = encodeCart([]);
    const decoded = decodeCart(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.items).toEqual([]);
  });
});

// ─── qty clamping ─────────────────────────────────────────────────────────────

describe("decodeCart qty clamping", () => {
  it("clamps fractional qty to integer", () => {
    // Build raw payload with fractional qty
    const payload = JSON.stringify({ l: [["P-001", 3.7]] });
    const encoded = Buffer.from(payload).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const decoded = decodeCart(encoded);
    expect(decoded!.items[0].qty).toBe(3);
  });

  it("clamps qty 0 up to 1", () => {
    const payload = JSON.stringify({ l: [["P-001", 0]] });
    const encoded = Buffer.from(payload).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const decoded = decodeCart(encoded);
    expect(decoded!.items[0].qty).toBe(1);
  });

  it("clamps negative qty up to 1", () => {
    const payload = JSON.stringify({ l: [["P-001", -5]] });
    const encoded = Buffer.from(payload).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const decoded = decodeCart(encoded);
    expect(decoded!.items[0].qty).toBe(1);
  });
});

// ─── Entries without string id ignored ───────────────────────────────────────

describe("decodeCart ignores invalid entries", () => {
  it("ignores entries where id is not a string", () => {
    const payload = JSON.stringify({ l: [[123, 2], ["P-valid", 1]] });
    const encoded = Buffer.from(payload).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const decoded = decodeCart(encoded);
    expect(decoded!.items).toEqual([{ id: "P-valid", qty: 1 }]);
  });

  it("ignores entries where id is null", () => {
    const payload = JSON.stringify({ l: [[null, 5], ["P-valid", 2]] });
    const encoded = Buffer.from(payload).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const decoded = decodeCart(encoded);
    expect(decoded!.items).toEqual([{ id: "P-valid", qty: 2 }]);
  });
});

// ─── Cap at 200 items ─────────────────────────────────────────────────────────

describe("decodeCart item cap", () => {
  it("caps items at 200 even if payload has more", () => {
    const manyLines = Array.from({ length: 250 }, (_, i) => [`P-${i}`, i + 1]);
    const payload = JSON.stringify({ l: manyLines });
    const encoded = Buffer.from(payload).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const decoded = decodeCart(encoded);
    expect(decoded!.items.length).toBe(200);
  });

  it("exactly 200 items passes through intact", () => {
    const lines = Array.from({ length: 200 }, (_, i) => ({ id: `P-${i}`, qty: i + 1 }));
    const encoded = encodeCart(lines);
    const decoded = decodeCart(encoded);
    expect(decoded!.items.length).toBe(200);
  });
});
