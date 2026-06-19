import { describe, it, expect, afterEach, vi } from "vitest";
import {
  createSignatureRequest,
  type SignatureRequestInput,
} from "@/lib/integration/esign-live";

const KEY = "test-api-key-abc";

const INPUT: SignatureRequestInput = {
  quoteId: "Q-7",
  quoteNumber: "Q-20260618-0007",
  signerName: "Jane Buyer",
  signerEmail: "jane@example.com",
  fileUrl: "https://app.example.com/doc.pdf",
  testMode: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.DROPBOX_SIGN_API_KEY;
  delete process.env.DROPBOX_SIGN_TEST_MODE;
});

describe("createSignatureRequest — dormant gate (no network when unconfigured)", () => {
  it("returns not-configured and never touches fetch when the key is unset", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await createSignatureRequest(INPUT);

    expect(res).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only key as unset (dormant)", async () => {
    process.env.DROPBOX_SIGN_API_KEY = "   ";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await createSignatureRequest(INPUT);

    expect(res).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("createSignatureRequest — live path (key set, network mocked)", () => {
  it("returns enabled with the parsed signature_request_id on a 200", async () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    const body = { signature_request: { signature_request_id: "sig-123" } };
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const res = await createSignatureRequest(INPUT);

    expect(res).toEqual({ enabled: true, signatureRequestId: "sig-123", testMode: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Verify the request seam: correct URL, POST, Basic auth (apiKey + blank password), JSON body.
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.hellosign.com/v3/signature_request/send");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`,
    );
    expect(headers["Content-Type"]).toBe("application/json");
    const sent = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(sent.test_mode).toBe(true);
    expect((sent.metadata as { quote_id: string }).quote_id).toBe("Q-7");
  });

  it("propagates input.testMode=false into the result on success", async () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    const body = { signature_request: { signature_request_id: "sig-live" } };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));

    const res = await createSignatureRequest({ ...INPUT, testMode: false });

    expect(res).toEqual({ enabled: true, signatureRequestId: "sig-live", testMode: false });
  });

  it("fails closed (reason:error) on a non-OK HTTP status with a parseable error body", async () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const body = { error: { error_name: "bad_request" } };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 400 })));

    const res = await createSignatureRequest(INPUT);

    expect(res).toEqual({ enabled: false, reason: "error" });
    expect(errSpy).toHaveBeenCalledTimes(1);
    // Must not log the signer email / payload — only coarse context.
    const logged = String(errSpy.mock.calls[0]?.[0]);
    expect(logged).not.toContain("jane@example.com");
    expect(logged).toContain("error");
  });

  it("fails closed on a non-OK status whose body is not JSON (catch → {})", async () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<<not json>>", { status: 500 })));

    const res = await createSignatureRequest(INPUT);

    expect(res).toEqual({ enabled: false, reason: "error" });
  });

  it("fails closed (reason:error) on a 200 whose body is missing signature_request_id", async () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ signature_request: {} }), { status: 200 })));

    const res = await createSignatureRequest(INPUT);

    expect(res).toEqual({ enabled: false, reason: "error" });
  });

  it("fails closed on a 200 with an empty-string id (falsy guard)", async () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    vi.spyOn(console, "error").mockImplementation(() => {});
    const body = { signature_request: { signature_request_id: "" } };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));

    const res = await createSignatureRequest(INPUT);

    expect(res).toEqual({ enabled: false, reason: "error" });
  });

  it("fails closed on a 200 whose top-level JSON is not an object (null)", async () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("null", { status: 200 })));

    const res = await createSignatureRequest(INPUT);

    expect(res).toEqual({ enabled: false, reason: "error" });
  });

  it("fails closed (reason:error) when fetch itself throws (network/timeout)", async () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("net");
    }));

    const res = await createSignatureRequest(INPUT);

    expect(res).toEqual({ enabled: false, reason: "error" });
    expect(errSpy).toHaveBeenCalledTimes(1);
  });
});
