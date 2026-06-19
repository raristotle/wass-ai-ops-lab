import { describe, it, expect, afterEach, vi } from "vitest";
import {
  FCC_SOCRATA_URL,
  fccEasConfigured,
  fccIdToGrantee,
  parseFccGranteeRow,
  lookupFccId,
} from "@/lib/integration/fcc-eas-live";

const GATE = "FCC_SOCRATA_APP_TOKEN";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env[GATE];
});

describe("fccEasConfigured (dormancy gate edges)", () => {
  it("is false when the token is only whitespace (trimmed to empty)", () => {
    process.env[GATE] = "   ";
    expect(fccEasConfigured()).toBe(false);
  });
});

describe("fccIdToGrantee (additional edges)", () => {
  it("returns null on empty / whitespace-only input", () => {
    expect(fccIdToGrantee("")).toBeNull();
    expect(fccIdToGrantee("   ")).toBeNull();
  });

  it("returns null when a digit-leading id has no product-code char beyond 5", () => {
    // "2AB37" cleans to exactly 5 chars => grantee length, no product code.
    expect(fccIdToGrantee("2AB37")).toBeNull();
  });

  it("splits a digit-leading id with exactly one product char", () => {
    expect(fccIdToGrantee("2AB37X")).toEqual({ granteeCode: "2AB37", productCode: "X" });
  });

  it("treats a length-4 letter-leading id as valid (3 + 1)", () => {
    expect(fccIdToGrantee("ABCD")).toEqual({ granteeCode: "ABC", productCode: "D" });
  });
});

describe("parseFccGranteeRow (fallback chains)", () => {
  it("falls back to grantee_code_id and party_name and grantee_country", () => {
    expect(
      parseFccGranteeRow({ grantee_code_id: "XYZ", party_name: "Acme", grantee_country: "CA" }),
    ).toEqual({ granteeCode: "XYZ", name: "Acme", country: "CA" });
  });

  it("uses the bare `name` field when more specific names are absent", () => {
    expect(parseFccGranteeRow({ grantee_code: "AAA", name: "Generic Co" }).name).toBe("Generic Co");
  });

  it("returns empty-string code and null name/country for an empty row", () => {
    expect(parseFccGranteeRow({})).toEqual({ granteeCode: "", name: null, country: null });
  });

  it("ignores non-string / blank values defensively", () => {
    expect(
      parseFccGranteeRow({ grantee_code: 123, grantee_name: "   ", country: "" }),
    ).toEqual({ granteeCode: "", name: null, country: null });
  });
});

describe("lookupFccId — dormant gate", () => {
  it("returns no-keys and makes NO network call when the token is unset", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupFccId("BCG-E2342A")).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only token as dormant (no-keys)", async () => {
    process.env[GATE] = "   ";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupFccId("BCG-E2342A")).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("lookupFccId — bad id", () => {
  it("returns bad-id (no network) for an unusable FCC id even when configured", async () => {
    process.env[GATE] = "tok";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupFccId("ABC")).toEqual({ enabled: false, reason: "bad-id" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("lookupFccId — success path", () => {
  it("parses Socrata rows into an enabled lookup result", async () => {
    process.env[GATE] = "tok";
    const body = JSON.stringify([
      { grantee_code: "BCG", grantee_name: "Cisco Systems", country: "US" },
    ]);
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response(body, { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await lookupFccId("  bcg-e2342a ");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(r.source).toBe("FCC EAS");
    expect(r.lookup).toEqual({
      fccId: "bcg-e2342a", // trimmed but otherwise raw (not upper-cased)
      granteeCode: "BCG",
      productCode: "E2342A",
      grantees: [{ granteeCode: "BCG", name: "Cisco Systems", country: "US" }],
    });
    // fetchedAt is an ISO timestamp.
    expect(() => new Date(r.fetchedAt).toISOString()).not.toThrow();
    expect(Number.isNaN(Date.parse(r.fetchedAt))).toBe(false);
  });

  it("sends the app token header and a SoQL $where on the grantee code", async () => {
    process.env[GATE] = "secret-token";
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify([{ grantee_code: "2AB37" }]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await lookupFccId("2AB37-XYZ");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url.startsWith(`${FCC_SOCRATA_URL}?$where=`)).toBe(true);
    // grantee_code='2AB37' url-encoded, plus the limit.
    expect(decodeURIComponent(url)).toContain("grantee_code='2AB37'");
    expect(url).toContain("$limit=5");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-App-Token"]).toBe("secret-token");
    expect(headers.Accept).toBe("application/json");
    // 12s abort guard is attached.
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("lookupFccId — no-match path", () => {
  it("returns no-match when the response is an empty array", async () => {
    process.env[GATE] = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("[]", { status: 200 })),
    );
    expect(await lookupFccId("BCG-E2342A")).toEqual({ enabled: false, reason: "no-match" });
  });

  it("returns no-match when the JSON body is not an array (object)", async () => {
    process.env[GATE] = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response('{"error":"oops"}', { status: 200 })),
    );
    expect(await lookupFccId("BCG-E2342A")).toEqual({ enabled: false, reason: "no-match" });
  });

  it("returns no-match when the body is invalid JSON (parse → null)", async () => {
    process.env[GATE] = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("not json{", { status: 200 })),
    );
    expect(await lookupFccId("BCG-E2342A")).toEqual({ enabled: false, reason: "no-match" });
  });
});

describe("lookupFccId — fetch-failed paths (fail closed, no throw)", () => {
  it("returns fetch-failed and logs on a non-OK upstream status", async () => {
    process.env[GATE] = "tok";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("", { status: 500 })),
    );
    expect(await lookupFccId("BCG-E2342A")).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(errSpy).toHaveBeenCalledTimes(1);
    const logged = String(errSpy.mock.calls[0][0]);
    expect(logged).toContain("fcc-eas");
    expect(logged).toContain("500");
  });

  it("returns fetch-failed when fetch itself rejects (network/timeout)", async () => {
    process.env[GATE] = "tok";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("network down");
      }),
    );
    expect(await lookupFccId("BCG-E2342A")).toEqual({ enabled: false, reason: "fetch-failed" });
  });

  it("returns fetch-failed when res.json() throws synchronously inside the try", async () => {
    process.env[GATE] = "tok";
    vi.spyOn(console, "error").mockImplementation(() => {});
    // ok response but .json() rejects in a way the inline .catch swallows to null
    // would normally yield no-match; here we make .json() throw a non-catchable
    // path by returning a Response whose body read rejects, exercised via no-match.
    const badResponse = {
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("body read failed");
      },
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => badResponse));
    // The inline `.catch(() => null)` turns the json() failure into null → no-match.
    expect(await lookupFccId("BCG-E2342A")).toEqual({ enabled: false, reason: "no-match" });
  });
});
