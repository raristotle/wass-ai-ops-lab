import { describe, it, expect } from "vitest";
import { resolveImageUrl, isLikelyPlaceholder, pickBestImage } from "@/lib/ingest/image";

const PAGE = "https://mfr.example/products/breaker-20a";

describe("resolveImageUrl", () => {
  it("returns absolute http(s) URLs unchanged", () => {
    expect(resolveImageUrl("https://cdn.mfr.example/a.jpg", PAGE)).toBe("https://cdn.mfr.example/a.jpg");
  });
  it("resolves protocol-relative refs against the page protocol", () => {
    expect(resolveImageUrl("//cdn.mfr.example/a.jpg", PAGE)).toBe("https://cdn.mfr.example/a.jpg");
  });
  it("resolves root-relative and path-relative refs against the page", () => {
    expect(resolveImageUrl("/img/a.jpg", PAGE)).toBe("https://mfr.example/img/a.jpg");
    expect(resolveImageUrl("thumb.jpg", PAGE)).toBe("https://mfr.example/products/thumb.jpg");
  });
  it("rejects data URIs, non-http schemes, and garbage", () => {
    expect(resolveImageUrl("data:image/png;base64,AAAA", PAGE)).toBeNull();
    expect(resolveImageUrl("ftp://x/a.jpg", PAGE)).toBeNull();
    expect(resolveImageUrl("   ", PAGE)).toBeNull();
    // A relative ref with no usable base resolves to null rather than throwing.
    expect(resolveImageUrl("a.jpg", "not-a-url")).toBeNull();
  });
  it("rejects URLs carrying embedded credentials", () => {
    expect(resolveImageUrl("https://user:pass@evil.example/x.jpg", PAGE)).toBeNull();
  });
});

describe("isLikelyPlaceholder", () => {
  it("flags placeholder/spinner/no-image URLs (whole-basename markers, incl. size suffix)", () => {
    for (const u of [
      "https://m/no-image.png",
      "https://m/img/spinner.gif",
      "https://m/placeholder.jpg",
      "https://m/coming-soon.png",
      "https://m/assets/no-image-300x300.png", // trailing dimension stripped
      "https://m/1x1.gif",
      "https://m/default.png",
    ]) {
      expect(isLikelyPlaceholder(u), u).toBe(true);
    }
  });

  it("does NOT drop real product images whose name merely CONTAINS a marker word (the HIGH bug)", () => {
    for (const u of [
      "https://cdn.eaton.com/loading-dock-panel.jpg",
      "https://cdn.mfr.com/products/blank-cover-plate.jpg",
      "https://cdn.panduit.com/transparent-housing.jpg",
      "https://cdn.mfr.com/spacer-bar-3in.jpg",
      "https://cdn.mfr.com/default-config-switch.jpg",
      "https://cdn.mfr.com/missing-link-chain.jpg",
      "https://cdn.leviton.com/1x1-gang-box.jpg",
      "https://cdn.mfr.example/products/eaton-br120.jpg",
    ]) {
      expect(isLikelyPlaceholder(u), u).toBe(false);
    }
  });
});

describe("pickBestImage", () => {
  it("returns the first non-placeholder absolute URL, resolving relatives", () => {
    expect(pickBestImage(["/img/placeholder.png", "thumb-br120.jpg"], PAGE)).toBe("https://mfr.example/products/thumb-br120.jpg");
  });
  it("returns undefined when no candidate qualifies (never fabricates)", () => {
    expect(pickBestImage(["data:image/x,AAAA", "https://m/no-image.png"], PAGE)).toBeUndefined();
    expect(pickBestImage([], PAGE)).toBeUndefined();
  });
});
