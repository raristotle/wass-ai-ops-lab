import { describe, it, expect, afterEach, vi } from "vitest";
import { pdfConfigured, renderPdf } from "@/lib/integration/pdf-live";

const GATE = "GOTENBERG_URL";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env[GATE];
});

describe("pdfConfigured (dormancy gate)", () => {
  it("is false when GOTENBERG_URL is unset", () => {
    expect(pdfConfigured()).toBe(false);
  });

  it("is false when GOTENBERG_URL is only whitespace", () => {
    process.env[GATE] = "   ";
    expect(pdfConfigured()).toBe(false);
  });

  it("is true once GOTENBERG_URL is set", () => {
    process.env[GATE] = "http://localhost:3000";
    expect(pdfConfigured()).toBe(true);
  });
});

describe("renderPdf", () => {
  it("is dormant and makes NO network call when unconfigured", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await renderPdf("<html><body>quote</body></html>")).toEqual({
      enabled: false,
      reason: "not-configured",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns the rendered PDF bytes on a 200 response", async () => {
    process.env[GATE] = "http://localhost:3000";
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(bytes, { status: 200, headers: { "content-type": "application/pdf" } }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const r = await renderPdf("<html><body>quote</body></html>");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(new Uint8Array(r.pdf)).toEqual(bytes);

    // POSTs multipart form to the Chromium HTML route.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/forms/chromium/convert/html");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("strips trailing slashes from the base URL before appending the route", async () => {
    process.env[GATE] = "http://localhost:3000///";
    const fetchSpy = vi.fn(
      async (): Promise<Response> => new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await renderPdf("<html></html>");
    const [url] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/forms/chromium/convert/html");
  });

  it("attaches the document as index.html in the multipart form", async () => {
    process.env[GATE] = "http://localhost:3000";
    const fetchSpy = vi.fn(
      async (): Promise<Response> => new Response(new Uint8Array([0]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await renderPdf("<h1>hi</h1>");
    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const form = init.body as FormData;
    const file = form.get("files");
    expect(file).toBeInstanceOf(Blob);
    expect((file as File).name).toBe("index.html");
    expect(await (file as Blob).text()).toBe("<h1>hi</h1>");
  });

  it("fails closed (no throw) on a non-OK upstream response", async () => {
    process.env[GATE] = "http://localhost:3000";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("boom", { status: 500 })),
    );
    expect(await renderPdf("<html></html>")).toEqual({ enabled: false, reason: "error" });
  });

  it("logs the upstream status code on a non-OK response", async () => {
    process.env[GATE] = "http://localhost:3000";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("nope", { status: 422 })),
    );
    await renderPdf("<html></html>");
    expect(errSpy).toHaveBeenCalledTimes(1);
    const logged = String(errSpy.mock.calls[0][0]);
    expect(logged).toContain("pdf:render");
    expect(logged).toContain("422");
  });

  it("fails closed (no throw) when fetch itself rejects (network/timeout)", async () => {
    process.env[GATE] = "http://localhost:3000";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("network down");
      }),
    );
    expect(await renderPdf("<html></html>")).toEqual({ enabled: false, reason: "error" });
  });

  it("fails closed when arrayBuffer() throws on an otherwise-OK response", async () => {
    process.env[GATE] = "http://localhost:3000";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const badResponse = {
      ok: true,
      status: 200,
      arrayBuffer: async () => {
        throw new Error("body read failed");
      },
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => badResponse));
    expect(await renderPdf("<html></html>")).toEqual({ enabled: false, reason: "error" });
  });
});
