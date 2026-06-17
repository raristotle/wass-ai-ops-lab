import { describe, it, expect, afterEach, vi } from "vitest";
import {
  allowedDomains,
  groundingFetchConfigured,
  isAllowedUrl,
  stripHtml,
  fetchGrounded,
} from "@/lib/integration/grounding-fetch";

afterEach(() => {
  delete process.env.FETCH_GROUNDING_DOMAINS;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("allowedDomains / groundingFetchConfigured", () => {
  it("is dormant (empty) when unset", () => {
    expect(allowedDomains()).toEqual([]);
    expect(groundingFetchConfigured()).toBe(false);
  });
  it("parses, lowercases, strips leading dots, validates, de-dupes", () => {
    process.env.FETCH_GROUNDING_DOMAINS = "UL.com, .intertek.com, ul.com, not_a_domain, schneider-electric.com";
    expect(allowedDomains()).toEqual(["ul.com", "intertek.com", "schneider-electric.com"]);
    expect(groundingFetchConfigured()).toBe(true);
  });
});

describe("isAllowedUrl (SSRF guard)", () => {
  it("allows https on an allow-listed host or subdomain, refuses everything else", () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    expect(isAllowedUrl("https://ul.com/listing/123")).toBe(true);
    expect(isAllowedUrl("https://productspec.ul.com/x")).toBe(true);
    expect(isAllowedUrl("http://ul.com/x")).toBe(false); // not https
    expect(isAllowedUrl("https://evil.com/x")).toBe(false); // not allow-listed
    expect(isAllowedUrl("https://notul.com/x")).toBe(false); // suffix trick
    expect(isAllowedUrl("https://localhost/x")).toBe(false);
    expect(isAllowedUrl("https://169.254.169.254/latest/meta-data")).toBe(false); // metadata IP
    expect(isAllowedUrl("not a url")).toBe(false);
  });
});

describe("stripHtml", () => {
  it("drops script/style and tags, collapsing whitespace", () => {
    expect(stripHtml("<style>a{}</style><p>Hi <b>there</b></p><script>x()</script>")).toBe("Hi there");
  });
});

describe("fetchGrounded", () => {
  it("is dormant (no network) when unconfigured", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchGrounded("https://ul.com/x")).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blocks a non-allow-listed URL without fetching", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchGrounded("https://evil.com/x")).toEqual({ enabled: false, reason: "blocked" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns tag-stripped text for an allow-listed URL", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response("<p>UL listing <b>OK</b></p>", { status: 200 })));
    const r = await fetchGrounded("https://ul.com/listing/9");
    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.text).toBe("UL listing OK");
  });

  it("refuses a redirect that points off the allow-list (SSRF) and never exposes the target body", async () => {
    process.env.FETCH_GROUNDING_DOMAINS = "ul.com";
    const fetchSpy = vi.fn(async (): Promise<Response> =>
      new Response(null, { status: 302, headers: { Location: "https://169.254.169.254/latest/meta-data/" } }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchGrounded("https://ul.com/redirector")).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).toHaveBeenCalledTimes(1); // followed manually, refused before a 2nd hop
  });
});
