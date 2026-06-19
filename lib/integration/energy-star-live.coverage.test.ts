import { describe, it, expect, afterEach, vi } from "vitest";
import {
  energyStarConfigured,
  parseEnergyStarRow,
  buildWhere,
  lookupCertifiedLighting,
  DEFAULT_LIGHTING_DATASET,
  UPC_DATASET,
} from "@/lib/integration/energy-star-live";

const GATE = "ENERGY_STAR_APP_TOKEN";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.ENERGY_STAR_APP_TOKEN;
  delete process.env.ENERGY_STAR_DATASET;
});

/** A realistic Socrata "Connected Light Bulbs" row. */
const LIGHTING_ROW = {
  brand_name: "Cree",
  model_number: "BR30-100W",
  brightness_lumens: "1100",
  energy_used_watts: "11",
  efficacy_lumens_watt: "100",
  light_appearance_kelvin: "2700",
  color_quality_cri: "90",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("energyStarConfigured gate edge cases", () => {
  it("is false when the token is only whitespace (trimmed to empty)", () => {
    process.env[GATE] = "   ";
    expect(energyStarConfigured()).toBe(false);
  });
});

describe("parseEnergyStarRow extra edges", () => {
  it("falls back to model_name when model_number is absent", () => {
    const r = parseEnergyStarRow({ model_name: "ALT-1" });
    expect(r.model).toBe("ALT-1");
  });

  it("treats non-finite numeric strings and nullish values as null", () => {
    const r = parseEnergyStarRow({
      brightness_lumens: "not-a-number",
      energy_used_watts: "NaN",
      efficacy_lumens_watt: null,
      light_appearance_kelvin: undefined,
    });
    expect(r.lumens).toBeNull();
    expect(r.watts).toBeNull();
    expect(r.efficacy).toBeNull();
    expect(r.cct).toBeNull();
  });

  it('coerces an empty numeric string to 0 (Number("") === 0, documents num() behavior)', () => {
    // Number("") is 0 and finite, so empty strings are NOT treated as missing.
    const r = parseEnergyStarRow({ brightness_lumens: "" });
    expect(r.lumens).toBe(0);
  });

  it("reads upc when present (post-join shape)", () => {
    const r = parseEnergyStarRow({ ...LIGHTING_ROW, upc: "012345678905" });
    expect(r.upc).toBe("012345678905");
  });

  it("rejects a whitespace-only brand as null", () => {
    const r = parseEnergyStarRow({ brand_name: "   " });
    expect(r.brand).toBeNull();
  });
});

describe("buildWhere extra edges", () => {
  it("ignores a whitespace-only brand", () => {
    expect(buildWhere("   ", "ABC")).toBe("model_number='ABC'");
  });
  it("trims the brand before embedding it", () => {
    expect(buildWhere("  Cree  ", "ABC")).toBe(
      "model_number='ABC' AND upper(brand_name)=upper('Cree')",
    );
  });
});

describe("lookupCertifiedLighting — dormant / input guards (no network)", () => {
  it("returns no-keys and makes NO network call when the token is unset", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse([]));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupCertifiedLighting("BR30-100W", "Cree")).toEqual({
      enabled: false,
      reason: "no-keys",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns no-match for an empty / whitespace model without calling fetch", async () => {
    process.env[GATE] = "tok";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse([]));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupCertifiedLighting("   ")).toEqual({
      enabled: false,
      reason: "no-match",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("lookupCertifiedLighting — success path", () => {
  it("returns parsed records + ENERGY STAR source + ISO fetchedAt on a 200", async () => {
    process.env[GATE] = "tok";
    // 1st call: lighting dataset. 2nd call: UPC dataset (empty → no enrichment).
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse([LIGHTING_ROW]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([LIGHTING_ROW]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await lookupCertifiedLighting("BR30-100W", "Cree");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled");
    expect(r.source).toBe("ENERGY STAR");
    expect(r.records).toHaveLength(1);
    expect(r.records[0].model).toBe("BR30-100W");
    expect(r.records[0].lumens).toBe(1100);
    expect(r.records[0].certified).toBe(true);
    expect(r.records[0].upc).toBeNull();
    expect(() => new Date(r.fetchedAt).toISOString()).not.toThrow();
    expect(new Date(r.fetchedAt).toISOString()).toBe(r.fetchedAt);
  });

  it("sends the app token header and hits the default lighting dataset URL", async () => {
    process.env[GATE] = "secret-token";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse([]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([LIGHTING_ROW]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchSpy);

    await lookupCertifiedLighting("BR30-100W", "Cree");

    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain(`/resource/${DEFAULT_LIGHTING_DATASET}.json?`);
    // Only the $where VALUE is percent-encoded; the literal keys stay readable.
    expect(url).toContain("$where=");
    expect(url).toContain("$limit=10");
    // model_number='BR30-100W' — the '=' inside the clause is encoded as %3D.
    expect(url).toContain("model_number%3D'BR30-100W'");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-App-Token"]).toBe("secret-token");
    expect(headers.Accept).toBe("application/json");
  });

  it("honors the ENERGY_STAR_DATASET override", async () => {
    process.env[GATE] = "tok";
    process.env.ENERGY_STAR_DATASET = "abcd-1234";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse([]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([LIGHTING_ROW]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchSpy);

    await lookupCertifiedLighting("BR30-100W");
    const [url] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/resource/abcd-1234.json?");
  });

  it("enriches record[0] with a UPC from the UPC dataset join", async () => {
    process.env[GATE] = "tok";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse([]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([LIGHTING_ROW]));
    fetchSpy.mockImplementationOnce(async () =>
      jsonResponse([{ model_number: "BR30-100W", upc: "099555111222" }]),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const r = await lookupCertifiedLighting("BR30-100W", "Cree");
    if (!r.enabled) throw new Error("expected enabled");
    expect(r.records[0].upc).toBe("099555111222");

    // second call targets the UPC dataset
    const [upcUrl] = fetchSpy.mock.calls[1] as unknown as [string, RequestInit];
    expect(upcUrl).toContain(`/resource/${UPC_DATASET}.json?`);
    expect(upcUrl).toContain("$select=model_number,upc");
    expect(upcUrl).toContain("$limit=1");
  });

  it("still returns enabled when the UPC join itself rejects (best-effort, swallowed)", async () => {
    process.env[GATE] = "tok";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse([]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([LIGHTING_ROW]));
    fetchSpy.mockImplementationOnce(async () => {
      throw new Error("upc dataset down");
    });
    vi.stubGlobal("fetch", fetchSpy);

    const r = await lookupCertifiedLighting("BR30-100W", "Cree");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled");
    expect(r.records[0].upc).toBeNull();
  });

  it("leaves UPC null when the UPC row exists but has no usable upc value", async () => {
    process.env[GATE] = "tok";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse([]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([LIGHTING_ROW]));
    fetchSpy.mockImplementationOnce(async () => jsonResponse([{ model_number: "BR30-100W" }]));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await lookupCertifiedLighting("BR30-100W");
    if (!r.enabled) throw new Error("expected enabled");
    expect(r.records[0].upc).toBeNull();
  });
});

describe("lookupCertifiedLighting — failure paths fail closed", () => {
  it("returns fetch-failed on a non-OK lighting response (and logs)", async () => {
    process.env[GATE] = "tok";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response("", { status: 500 })));

    expect(await lookupCertifiedLighting("BR30-100W")).toEqual({
      enabled: false,
      reason: "fetch-failed",
    });
    expect(errSpy).toHaveBeenCalled();
    const logged = String(errSpy.mock.calls[0][0]);
    expect(logged).toContain("energy-star");
    expect(logged).toContain("500");
  });

  it("returns no-match when the lighting dataset returns an empty array", async () => {
    process.env[GATE] = "tok";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => jsonResponse([])));
    expect(await lookupCertifiedLighting("BR30-100W")).toEqual({
      enabled: false,
      reason: "no-match",
    });
  });

  it("returns fetch-failed when the body is valid JSON but not an array", async () => {
    process.env[GATE] = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => jsonResponse({ error: "bad query" })),
    );
    expect(await lookupCertifiedLighting("BR30-100W")).toEqual({
      enabled: false,
      reason: "fetch-failed",
    });
  });

  it("returns fetch-failed when the JSON body is malformed (res.json throws)", async () => {
    process.env[GATE] = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (): Promise<Response> =>
          new Response("<<not json>>", {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
    expect(await lookupCertifiedLighting("BR30-100W")).toEqual({
      enabled: false,
      reason: "fetch-failed",
    });
  });

  it("fails closed (fetch-failed) when fetch itself rejects (network/timeout)", async () => {
    process.env[GATE] = "tok";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("network down");
      }),
    );
    expect(await lookupCertifiedLighting("BR30-100W")).toEqual({
      enabled: false,
      reason: "fetch-failed",
    });
    expect(errSpy).toHaveBeenCalled();
  });
});
