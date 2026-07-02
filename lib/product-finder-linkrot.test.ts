import { describe, it, expect } from "vitest";
import {
  normalizeUrl,
  datasheetUrls,
  selectSweepBatch,
  mergeStatuses,
  isDeadLink,
  type LinkStatusMap,
} from "@/lib/product-finder-linkrot";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(specSheetUrl?: string): CatalogProduct {
  return {
    id: specSheetUrl ?? "x", sku: "x", name: "x", brand: "B", category: "electrical", subcategory: "S",
    description: "", unitPrice: 1, uom: "EA", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x", specSheetUrl,
  };
}

describe("B14 link-rot pure helpers", () => {
  it("normalizeUrl trims, drops trailing slash, and rejects non-http(s)", () => {
    expect(normalizeUrl("  https://a.com/d/  ")).toBe("https://a.com/d");
    expect(normalizeUrl("http://a.com")).toBe("http://a.com");
    expect(normalizeUrl("ftp://a.com")).toBe("");
    expect(normalizeUrl(undefined)).toBe("");
  });

  it("datasheetUrls dedupes + sorts the catalog's datasheet links, http(s) only", () => {
    const urls = datasheetUrls([
      prod("https://b.com/2"),
      prod("https://a.com/1/"),
      prod("https://a.com/1"), // dup after normalize
      prod(undefined),
      prod("not-a-url"),
    ]);
    expect(urls).toEqual(["https://a.com/1", "https://b.com/2"]);
  });

  it("selectSweepBatch walks the list round-robin, wrapping past the end", () => {
    const urls = ["u0", "u1", "u2", "u3"];
    const a = selectSweepBatch(urls, 0, 2);
    expect(a).toEqual({ batch: ["u0", "u1"], nextCursor: 2 });
    const b = selectSweepBatch(urls, a.nextCursor, 2);
    expect(b).toEqual({ batch: ["u2", "u3"], nextCursor: 0 });
    // wraps
    const c = selectSweepBatch(urls, 3, 2);
    expect(c.batch).toEqual(["u3", "u0"]);
    // empty list is safe
    expect(selectSweepBatch([], 0, 5)).toEqual({ batch: [], nextCursor: 0 });
  });

  it("mergeStatuses lets fresh results win over prior ones", () => {
    const prev: LinkStatusMap = { a: { ok: true, code: 200, checkedAtIso: "t0" } };
    const fresh: LinkStatusMap = { a: { ok: false, code: 404, checkedAtIso: "t1" }, b: { ok: true, code: 200, checkedAtIso: "t1" } };
    const merged = mergeStatuses(prev, fresh);
    expect(merged.a.code).toBe(404);
    expect(merged.b.code).toBe(200);
  });

  it("isDeadLink only flags a URL with a recorded non-OK status — never unknown links", () => {
    const map: LinkStatusMap = {
      "https://dead.com/d": { ok: false, code: 404, checkedAtIso: "t" },
      "https://ok.com/d": { ok: true, code: 200, checkedAtIso: "t" },
    };
    expect(isDeadLink(map, "https://dead.com/d/")).toBe(true); // normalized
    expect(isDeadLink(map, "https://ok.com/d")).toBe(false);
    expect(isDeadLink(map, "https://unchecked.com/d")).toBe(false); // never checked
    expect(isDeadLink(null, "https://dead.com/d")).toBe(false);
  });
});
