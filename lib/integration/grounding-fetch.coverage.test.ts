import { describe, it, expect, afterEach, vi } from "vitest";
import {
  allowedDomains,
  isAllowedUrl,
  stripHtml,
  fetchGrounded,
} from "@/lib/integration/grounding-fetch";

afterEach(() => {
  delete process.env.FETCH_GROUNDING_DOMAINS;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("allowedDomains — token edge cases", () => {
  it("drops empty/whitespace tokens and single-label (no-TLD) hosts", () => {
    process.env.FETCH_GROUNDING_DOMAINS = " , ul.com, , localhost , a, x.io ";
    // "localhost"/"a" are single-label (fail the \.[a-z]{2,} requirement); empties dropped.
    expect(allowedDomains()).toEqual(["ul.com", "x.io"]);
  });

  it("returns [] when the var is only whitespace/commas", () => {
    process.env.FETCH_GROUNDING_DOMAINS = "   ,  , ";
    expect(allowedDomains()).toEqual([]);
  });

  it("treats a present-but-empty var as dormant", () => {
    process.env.FETCH_GROUNDING_DOMAINS = "";
    expect(allowedDomains()).toEqual([]);
  });
});

describe("isAllowedUrl — remaining SSRF branches", () => {
  it("refuses .local and .internal hosts even if they suffix-match a list entry", () => {
    process.env.FETCH_GROUNDING_DOMAINS = "internal,local,ul.com";
    // The list entries themselves are single-label and rejected by allowedDomains,
    // but assert the explicit host-shape guards regardless of list contents.
    expect(isAllowedUrl("https://foo.local/x")).toBe(false);
    expect(isAllowedUrl("https://foo.internal/x")).toBe(false);
  });

  it("refuses an IPv6 literal host (contains ':')", () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    expect(isAllowedUrl("https://[::1]/x")).toBe(false);
    expect(isAllowedUrl("https://[fe80::1]/meta")).toBe(false);
  });

  it("refuses literal IPv4 even when the list is non-empty", () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    expect(isAllowedUrl("https://10.0.0.5/x")).toBe(false);
    expect(isAllowedUrl("https://127.0.0.1/x")).toBe(false);
  });

  it("is dormant: refuses an otherwise-fine https URL when the list is empty", () => {
    expect(isAllowedUrl("https://ul.com/x")).toBe(false);
  });
});

describe("stripHtml — additional shapes", () => {
  it("returns empty string for an all-tags / all-script input", () => {
    expect(stripHtml("<script>let a=1;</script>")).toBe("");
    expect(stripHtml("<div></div>")).toBe("");
  });

  it("collapses runs of whitespace/newlines between text nodes", () => {
    expect(stripHtml("a\n\n   <span>b</span>\t c")).toBe("a b c");
  });
});

describe("fetchGrounded — error / non-OK paths", () => {
  it("non-OK response fails closed and logs with the host", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response("", { status: 500 })));
    expect(await fetchGrounded("https://ul.com/listing/1")).toEqual({ enabled: false, reason: "error" });
    // logApiError emits one JSON line containing the host + the HTTP status.
    expect(errSpy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(errSpy.mock.calls[0][0] as string);
    expect(line.route).toBe("grounding:fetch");
    expect(line.host).toBe("ul.com");
    expect(line.message).toContain("500");
  });

  it("fails closed when fetch throws (network/timeout) and logs", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => { throw new Error("net"); }));
    expect(await fetchGrounded("https://ul.com/x")).toEqual({ enabled: false, reason: "error" });
    expect(errSpy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(errSpy.mock.calls[0][0] as string);
    expect(line.message).toBe("net");
  });
});

describe("fetchGrounded — manual redirect handling", () => {
  it("follows an allow-listed redirect and returns the final body", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    const fetchSpy = vi.fn(async (url: string): Promise<Response> => {
      if (url === "https://ul.com/start") {
        return new Response(null, { status: 301, headers: { Location: "https://productspec.ul.com/final" } });
      }
      return new Response("<p>Final <b>doc</b></p>", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);
    const r = await fetchGrounded("https://ul.com/start");
    expect(r.enabled).toBe(true);
    if (r.enabled) {
      expect(r.text).toBe("Final doc");
      // The returned url is the ORIGINAL request url, not the redirect target.
      expect(r.url).toBe("https://ul.com/start");
    }
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("resolves a RELATIVE Location against the current url before re-validating", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    const fetchSpy = vi.fn(async (url: string): Promise<Response> => {
      if (url === "https://ul.com/a/b") {
        return new Response(null, { status: 302, headers: { Location: "/c/d" } });
      }
      return new Response("ok", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);
    const r = await fetchGrounded("https://ul.com/a/b");
    expect(r.enabled).toBe(true);
    expect(fetchSpy).toHaveBeenNthCalledWith(2, "https://ul.com/c/d", expect.anything());
  });

  it("fails closed on a 30x with no Location header", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response(null, { status: 302 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchGrounded("https://ul.com/x")).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("fails closed on a 30x whose Location cannot be parsed as a URL", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    // A bare scheme with no host (e.g. "https:") + base does not yield a valid URL
    // that passes isAllowedUrl; an unparseable value hits the new URL() catch.
    const fetchSpy = vi.fn(async (): Promise<Response> => {
      // Header values can't carry raw control chars via the Headers API, so build
      // a Response whose Location is a value new URL() rejects relative to the base.
      const h = new Headers();
      h.set("Location", "http://");
      return new Response(null, { status: 302, headers: h });
    });
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchGrounded("https://ul.com/x")).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("fails closed on a 30x whose Location resolves to a non-https / unsafe scheme", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    const fetchSpy = vi.fn(async (): Promise<Response> =>
      new Response(null, { status: 307, headers: { Location: "http://ul.com/downgrade" } }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    // http:// is not allowed by isAllowedUrl, so the hop is refused.
    expect(await fetchGrounded("https://ul.com/x")).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("fails closed when redirects exceed MAX_REDIRECTS (allow-listed loop)", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    // Every hop redirects to another allow-listed URL → hop cap is hit.
    let n = 0;
    const fetchSpy = vi.fn(async (): Promise<Response> => {
      n += 1;
      return new Response(null, { status: 302, headers: { Location: `https://ul.com/hop/${n}` } });
    });
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchGrounded("https://ul.com/loop")).toEqual({ enabled: false, reason: "error" });
    // hop runs for hop=0..3 (MAX_REDIRECTS=3) ⇒ 4 fetches, then returns null.
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it("truncates the returned snippet to MAX_TEXT (8000 chars)", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    const big = "x".repeat(20_000);
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response(big, { status: 200 })));
    const r = await fetchGrounded("https://ul.com/big");
    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.text.length).toBe(8_000);
  });
});
