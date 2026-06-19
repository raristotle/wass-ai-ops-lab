import { describe, it, expect, afterEach, vi } from "vitest";
import { analyzeImage, isAssistantEnabled } from "@/lib/server/anthropic-vision";
import { ASSISTANT_MODEL_DEFAULT } from "@/lib/product-finder-assistant";

const IMG = { mediaType: "image/jpeg", dataBase64: "Zm9vYmFy" };

/** A realistic Anthropic Messages API body with the given text blocks. */
function anthropicBody(blocks: Array<{ type: string; text?: string }>) {
  return JSON.stringify({ id: "msg_1", type: "message", role: "assistant", content: blocks });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_MODEL;
});

describe("analyzeImage — dormant gate (no ANTHROPIC_API_KEY)", () => {
  it("returns null and makes NO network call when the assistant is disabled", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    // No key set → dormant.
    expect(isAssistantEnabled()).toBe(false);
    expect(await analyzeImage("sys", "describe", IMG)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("re-exports isAssistantEnabled and treats a whitespace-only key as dormant", async () => {
    process.env.ANTHROPIC_API_KEY = "   ";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(isAssistantEnabled()).toBe(false);
    expect(await analyzeImage("sys", "describe", IMG)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("analyzeImage — success path (keyed, network mocked)", () => {
  it("returns the concatenated trimmed text from text blocks only", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            anthropicBody([
              { type: "text", text: "  {\"brand\":\"Square D\"" },
              { type: "thinking", text: "IGNORED" },
              { type: "text", text: ",\"series\":\"QO\"}  " },
            ]),
            { status: 200 },
          ),
      ),
    );
    const out = await analyzeImage("sys", "identify the part", IMG);
    expect(out).toBe('{"brand":"Square D","series":"QO"}');
  });

  it("sends a well-formed request: endpoint, headers, image+text content, default model & maxTokens", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-key-42";
    const fetchSpy = vi.fn(async () => new Response(anthropicBody([{ type: "text", text: "ok" }]), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    await analyzeImage("SYSTEM", "INSTRUCTION", IMG);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("sk-key-42");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    expect(headers["content-type"]).toBe("application/json");

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(ASSISTANT_MODEL_DEFAULT);
    expect(body.max_tokens).toBe(400); // default
    expect(body.system).toBe("SYSTEM");
    const content = body.messages[0].content;
    expect(content[0]).toEqual({
      type: "image",
      source: { type: "base64", media_type: IMG.mediaType, data: IMG.dataBase64 },
    });
    expect(content[1]).toEqual({ type: "text", text: "INSTRUCTION" });
  });

  it("honors a custom maxTokens and the ANTHROPIC_MODEL override", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.ANTHROPIC_MODEL = "claude-custom-vision";
    const fetchSpy = vi.fn(async () => new Response(anthropicBody([{ type: "text", text: "ok" }]), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    await analyzeImage("sys", "go", IMG, 1234);

    const body = JSON.parse((fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.model).toBe("claude-custom-vision");
    expect(body.max_tokens).toBe(1234);
  });

  it("returns null when the model produces only whitespace text (text || null)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(anthropicBody([{ type: "text", text: "   " }]), { status: 200 })));
    expect(await analyzeImage("sys", "go", IMG)).toBeNull();
  });

  it("returns null when there are no text blocks at all", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(anthropicBody([{ type: "thinking", text: "x" }]), { status: 200 })));
    expect(await analyzeImage("sys", "go", IMG)).toBeNull();
  });

  it("treats a block missing its text field as empty string (b.text ?? \"\")", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(anthropicBody([{ type: "text" }, { type: "text", text: "kept" }]), { status: 200 })),
    );
    expect(await analyzeImage("sys", "go", IMG)).toBe("kept");
  });
});

describe("analyzeImage — fail-closed error paths (all return null)", () => {
  it("returns null on a non-OK HTTP response (e.g. 500) and logs", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("upstream boom", { status: 500 })));
    expect(await analyzeImage("sys", "go", IMG)).toBeNull();
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(String(errSpy.mock.calls[0][0])).toContain("Anthropic HTTP 500");
  });

  it("returns null on a 429 rate-limit (non-OK) without throwing", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 429 })));
    expect(await analyzeImage("sys", "go", IMG)).toBeNull();
  });

  it("returns null when the OK body is not valid JSON (json().catch → null)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not-json{", { status: 200 })));
    expect(await analyzeImage("sys", "go", IMG)).toBeNull();
  });

  it("returns null and logs when fetch itself throws (network/timeout)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    expect(await analyzeImage("sys", "go", IMG)).toBeNull();
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(String(errSpy.mock.calls[0][0])).toContain("network down");
  });

  it("returns null when the abort timeout fires (AbortError)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("The operation was aborted.", "AbortError");
      }),
    );
    expect(await analyzeImage("sys", "go", IMG)).toBeNull();
  });
});
