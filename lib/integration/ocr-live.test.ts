import { describe, it, expect, afterEach, vi } from "vitest";
import { ocrSpaceToText, ocrConfigured, ocrImage } from "@/lib/integration/ocr-live";

afterEach(() => {
  delete process.env.OCRSPACE_API_KEY;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ocrSpaceToText", () => {
  it("joins ParsedText across results", () => {
    expect(ocrSpaceToText({ ParsedResults: [{ ParsedText: "SQUARE D" }, { ParsedText: "QO260" }] })).toBe("SQUARE D\nQO260");
  });
  it("returns null on an errored or empty payload", () => {
    expect(ocrSpaceToText({ IsErroredOnProcessing: true, ParsedResults: [{ ParsedText: "x" }] })).toBeNull();
    expect(ocrSpaceToText({ ParsedResults: [] })).toBeNull();
    expect(ocrSpaceToText({ nope: true })).toBeNull();
  });
});

describe("ocrConfigured / ocrImage", () => {
  it("is dormant and makes NO network call when unconfigured", async () => {
    expect(ocrConfigured()).toBe(false);
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await ocrImage("data:image/jpeg;base64,AAAA")).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns text on a good response", async () => {
    process.env.OCRSPACE_API_KEY = "k";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response(JSON.stringify({ ParsedResults: [{ ParsedText: "EATON 100A" }] }), { status: 200 })),
    );
    const r = await ocrImage("data:image/jpeg;base64,AAAA");
    expect(r).toEqual({ enabled: true, text: "EATON 100A" });
  });

  it("fails closed (no throw) on an upstream error", async () => {
    process.env.OCRSPACE_API_KEY = "k";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response("no", { status: 500 })));
    expect(await ocrImage("data:image/jpeg;base64,AAAA")).toEqual({ enabled: false, reason: "error" });
  });
});
