import { describe, it, expect, afterEach, vi } from "vitest";
import {
  lookupBrandOwnership,
  WIKIDATA_ENDPOINT,
  buildBrandQuery,
} from "@/lib/integration/wikidata-live";

const GATE = "WIKIDATA_USER_AGENT";
const UA = "MeridianProductFinder/1.0 (ops@example.com)";

/** A SPARQL-JSON Response with the documented media type. */
function sparqlResponse(body: unknown, status = 200): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/sparql-results+json" },
  });
}

/** A full single-brand result body (owner/parent/names/gtin/lei present). */
const FULL_BODY = {
  results: {
    bindings: [
      {
        ownerLabel: { value: "Schneider Electric" },
        parentLabel: { value: "Schneider Electric SE" },
        officialName: { value: "Square D Company" },
        shortName: { value: "Square D" },
        gtin: { value: "00785901234560" },
        lei: { value: "F5WCUMTUM4RKZ1MAVA99" },
      },
      { shortName: { value: "SQD" } },
    ],
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env[GATE];
});

describe("lookupBrandOwnership — dormant / no-network branches", () => {
  it("is dormant (no-keys) and makes NO network call when the User-Agent is unset", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => sparqlResponse(FULL_BODY));
    vi.stubGlobal("fetch", fetchSpy);

    expect(await lookupBrandOwnership("Square D")).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("is dormant when the User-Agent is only whitespace", async () => {
    process.env[GATE] = "   ";
    const fetchSpy = vi.fn(async (): Promise<Response> => sparqlResponse(FULL_BODY));
    vi.stubGlobal("fetch", fetchSpy);

    expect(await lookupBrandOwnership("Square D")).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns no-match (no network) when the brand is blank/whitespace", async () => {
    process.env[GATE] = UA;
    const fetchSpy = vi.fn(async (): Promise<Response> => sparqlResponse(FULL_BODY));
    vi.stubGlobal("fetch", fetchSpy);

    expect(await lookupBrandOwnership("   ")).toEqual({ enabled: false, reason: "no-match" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("lookupBrandOwnership — error / fail-closed branches", () => {
  it("fails closed with fetch-failed on a non-OK response (and logs the status)", async () => {
    process.env[GATE] = UA;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => sparqlResponse("", 500)));

    expect(await lookupBrandOwnership("Square D")).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(errSpy).toHaveBeenCalledTimes(1);
    const logged = String(errSpy.mock.calls[0][0]);
    expect(logged).toContain("wikidata");
    expect(logged).toContain("500");
  });

  it("honors a 429 (rate-limit) as a non-OK fail-closed", async () => {
    process.env[GATE] = UA;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => sparqlResponse("", 429)));

    expect(await lookupBrandOwnership("Square D")).toEqual({ enabled: false, reason: "fetch-failed" });
  });

  it("fails closed with fetch-failed when fetch itself rejects (network/timeout)", async () => {
    process.env[GATE] = UA;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("net down");
      }),
    );

    expect(await lookupBrandOwnership("Square D")).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(String(errSpy.mock.calls[0][0])).toContain("wikidata");
  });

  it("treats invalid JSON (200) as no-match — parse yields an all-empty record", async () => {
    process.env[GATE] = UA;
    // 200 OK but body is not JSON → res.json().catch(() => null) → null →
    // parseBrandOwnership(null) → all-empty → the `empty` guard → no-match.
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => sparqlResponse("<<<not json>>>", 200)));

    expect(await lookupBrandOwnership("Square D")).toEqual({ enabled: false, reason: "no-match" });
  });

  it("returns no-match when the result set is empty (brand not in Wikidata)", async () => {
    process.env[GATE] = UA;
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => sparqlResponse({ results: { bindings: [] } })));

    expect(await lookupBrandOwnership("Nonexistent Brand")).toEqual({ enabled: false, reason: "no-match" });
  });

  it("returns no-match when bindings exist but every field is null/absent", async () => {
    process.env[GATE] = UA;
    // A row with only unrelated/empty vars resolves nothing usable.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => sparqlResponse({ results: { bindings: [{ other: { value: "x" } }] } })),
    );

    expect(await lookupBrandOwnership("Square D")).toEqual({ enabled: false, reason: "no-match" });
  });
});

describe("lookupBrandOwnership — success path", () => {
  it("resolves a full ownership record and hits the documented URL + headers", async () => {
    process.env[GATE] = UA;
    let seenUrl = "";
    let seenInit: RequestInit | undefined;
    const fetchSpy = vi.fn(async (url: string, init?: RequestInit): Promise<Response> => {
      seenUrl = url;
      seenInit = init;
      return sparqlResponse(FULL_BODY);
    });
    vi.stubGlobal("fetch", fetchSpy);

    const r = await lookupBrandOwnership("  Square D  ");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(r.source).toBe("Wikidata");
    expect(r.ownership.brand).toBe("Square D"); // trimmed
    expect(r.ownership.owner).toBe("Schneider Electric");
    expect(r.ownership.parent).toBe("Schneider Electric SE");
    expect(r.ownership.officialName).toBe("Square D Company");
    expect(r.ownership.lei).toBe("F5WCUMTUM4RKZ1MAVA99");
    expect(r.ownership.shortNames.sort()).toEqual(["SQD", "Square D"]);
    expect(r.ownership.gtins).toEqual(["00785901234560"]);
    expect(typeof r.fetchedAt).toBe("string");
    expect(Number.isNaN(Date.parse(r.fetchedAt))).toBe(false);

    // URL: endpoint + the encoded query for the trimmed name + format=json.
    expect(seenUrl.startsWith(`${WIKIDATA_ENDPOINT}?query=`)).toBe(true);
    expect(seenUrl).toContain(encodeURIComponent(buildBrandQuery("Square D")));
    expect(seenUrl).toContain("format=json");
    // Required Wikimedia identity + SPARQL-JSON Accept header + a timeout signal.
    const headers = seenInit?.headers as Record<string, string>;
    expect(headers["User-Agent"]).toBe(UA);
    expect(headers.Accept).toBe("application/sparql-results+json");
    expect(seenInit?.signal).toBeInstanceOf(AbortSignal);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("counts a single non-empty field (just a GTIN) as a match", async () => {
    process.env[GATE] = UA;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (): Promise<Response> =>
          sparqlResponse({ results: { bindings: [{ gtin: { value: "00012345678905" } }] } }),
      ),
    );

    const r = await lookupBrandOwnership("Some Brand");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(r.ownership.gtins).toEqual(["00012345678905"]);
    expect(r.ownership.owner).toBeNull();
  });
});
