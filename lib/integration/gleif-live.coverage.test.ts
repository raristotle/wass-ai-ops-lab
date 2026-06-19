import { describe, it, expect, afterEach, vi } from "vitest";
import { gleifConfigured, lookupEntity, GLEIF_DEFAULT_BASE } from "@/lib/integration/gleif-live";

const GATE = "GLEIF_API_BASE_URL";

// A valid 20-char LEI + a JSON:API lei-records resource for it.
const LEI = "HWUPKR0MPOU8FGXBT394";
const PARENT_LEI = "5493001KJTIIGC8Y1R12";

function record(id: string, name: string) {
  return {
    id,
    attributes: {
      lei: id,
      entity: { legalName: { name }, status: "ACTIVE", jurisdiction: "US-OH" },
    },
  };
}

const LIST_BODY = { data: [record(LEI, "Eaton Corporation")] };

/** Build a JSON Response with the GLEIF media type. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/vnd.api+json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env[GATE];
});

describe("gleifConfigured (dormancy gate)", () => {
  it("is false when the base URL is only whitespace", () => {
    process.env[GATE] = "   ";
    expect(gleifConfigured()).toBe(false);
  });
});

describe("lookupEntity — dormant / no-network branches", () => {
  it("is dormant and makes NO network call when the base URL is unset", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse(LIST_BODY));
    vi.stubGlobal("fetch", fetchSpy);

    expect(await lookupEntity("Eaton Corp")).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns no-match (no network) when the name is blank/whitespace", async () => {
    process.env[GATE] = GLEIF_DEFAULT_BASE;
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse(LIST_BODY));
    vi.stubGlobal("fetch", fetchSpy);

    expect(await lookupEntity("   ")).toEqual({ enabled: false, reason: "no-match" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("lookupEntity — error / fail-closed branches", () => {
  it("fails closed with fetch-failed on a non-OK list response (and logs)", async () => {
    process.env[GATE] = GLEIF_DEFAULT_BASE;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => jsonResponse("", 500)));

    expect(await lookupEntity("Eaton Corp")).toEqual({ enabled: false, reason: "fetch-failed" });
    // The 500 on the search call is a genuine failure → it is logged.
    expect(errSpy).toHaveBeenCalledTimes(1);
    const logged = String(errSpy.mock.calls[0][0]);
    expect(logged).toContain("gleif");
    expect(logged).toContain("500");
  });

  it("returns no-match when the list response parses to zero usable records", async () => {
    process.env[GATE] = GLEIF_DEFAULT_BASE;
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => jsonResponse({ data: [] })));

    expect(await lookupEntity("Nonexistent Co")).toEqual({ enabled: false, reason: "no-match" });
  });

  it("returns no-match when the list body has no data array at all", async () => {
    process.env[GATE] = GLEIF_DEFAULT_BASE;
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => jsonResponse({ meta: {} })));

    expect(await lookupEntity("Whatever")).toEqual({ enabled: false, reason: "no-match" });
  });

  it("fails closed with fetch-failed when the list body is invalid JSON (200)", async () => {
    process.env[GATE] = GLEIF_DEFAULT_BASE;
    // 200 OK but body isn't JSON → getJson's .catch(() => null) → null → fetch-failed.
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (): Promise<Response> =>
          new Response("<<<not json>>>", {
            status: 200,
            headers: { "content-type": "application/vnd.api+json" },
          }),
      ),
    );

    expect(await lookupEntity("Eaton Corp")).toEqual({ enabled: false, reason: "fetch-failed" });
  });

  it("fails closed with fetch-failed when fetch itself rejects (network/timeout)", async () => {
    process.env[GATE] = GLEIF_DEFAULT_BASE;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("net down");
      }),
    );

    expect(await lookupEntity("Eaton Corp")).toEqual({ enabled: false, reason: "fetch-failed" });
  });
});

describe("lookupEntity — success path + parent walk", () => {
  it("resolves a match and walks BOTH parents, hitting the documented URLs/headers", async () => {
    process.env[GATE] = GLEIF_DEFAULT_BASE;
    const urls: string[] = [];
    const fetchSpy = vi.fn(async (url: string, init?: RequestInit): Promise<Response> => {
      urls.push(url);
      // Assert every call carries the JSON:API Accept header and a timeout signal.
      expect((init?.headers as Record<string, string>).Accept).toBe("application/vnd.api+json");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      if (url.includes("/direct-parent")) return jsonResponse({ data: record(PARENT_LEI, "Parent A") });
      if (url.includes("/ultimate-parent")) return jsonResponse({ data: record(PARENT_LEI, "Ultimate A") });
      return jsonResponse(LIST_BODY); // the search call
    });
    vi.stubGlobal("fetch", fetchSpy);

    const r = await lookupEntity("  Eaton Corp  ");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(r.source).toBe("GLEIF");
    expect(r.lookup.query).toBe("Eaton Corp"); // trimmed
    expect(r.lookup.matches).toHaveLength(1);
    expect(r.lookup.matches[0].lei).toBe(LEI);
    expect(r.lookup.directParent?.legalName).toBe("Parent A");
    expect(r.lookup.ultimateParent?.legalName).toBe("Ultimate A");
    expect(typeof r.fetchedAt).toBe("string");
    expect(Number.isNaN(Date.parse(r.fetchedAt))).toBe(false);

    // 3 calls: search + direct-parent + ultimate-parent.
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    const search = urls.find((u) => u.includes("/lei-records?"));
    expect(search).toContain(`${GLEIF_DEFAULT_BASE}/lei-records?filter[entity.legalName]=`);
    expect(search).toContain("Eaton%20Corp");
    expect(search).toContain("page[size]=5");
    expect(urls.some((u) => u === `${GLEIF_DEFAULT_BASE}/lei-records/${LEI}/direct-parent`)).toBe(true);
    expect(urls.some((u) => u === `${GLEIF_DEFAULT_BASE}/lei-records/${LEI}/ultimate-parent`)).toBe(true);
  });

  it("treats a 404 on a parent sub-resource as 'no parent' WITHOUT logging it", async () => {
    process.env[GATE] = GLEIF_DEFAULT_BASE;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("-parent")) return jsonResponse("", 404); // undeclared parent
        return jsonResponse(LIST_BODY);
      }),
    );

    const r = await lookupEntity("Eaton Corp");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(r.lookup.directParent).toBeNull();
    expect(r.lookup.ultimateParent).toBeNull();
    // quiet404 path: a 404 on the parent relationship must NOT reach the error log.
    expect(errSpy).not.toHaveBeenCalled();
  });

  it("yields null parents when the parent body has no data (200, empty relationship)", async () => {
    process.env[GATE] = GLEIF_DEFAULT_BASE;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("-parent")) return jsonResponse({ data: null });
        return jsonResponse(LIST_BODY);
      }),
    );

    const r = await lookupEntity("Eaton Corp");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(r.lookup.directParent).toBeNull();
    expect(r.lookup.ultimateParent).toBeNull();
  });

  it("normalizes a trailing slash on the override base URL", async () => {
    process.env[GATE] = "https://gleif.example.test/api/v1///";
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        urls.push(url);
        if (url.includes("-parent")) return jsonResponse({ data: null });
        return jsonResponse(LIST_BODY);
      }),
    );

    await lookupEntity("Eaton Corp");
    // No "//lei-records" — the trailing slashes were stripped.
    expect(urls.every((u) => u.startsWith("https://gleif.example.test/api/v1/lei-records"))).toBe(true);
    expect(urls.some((u) => u.includes("/v1//lei-records"))).toBe(false);
  });
});
