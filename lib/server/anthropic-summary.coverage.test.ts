import { describe, it, expect, afterEach, vi } from "vitest";
import { generateSummary, isAssistantEnabled } from "@/lib/server/anthropic-summary";

/**
 * Coverage for the gated Anthropic-summary seam. The module gates on
 * ANTHROPIC_API_KEY (dormant → null, no network) and otherwise calls the
 * Messages API via fetch, parsing { content: [{ type:"text", text }] } and
 * failing CLOSED to null on every error/non-OK/empty path so the caller can
 * fall back to its deterministic template. We set the gate var and mock fetch.
 */

function anthropicBody(blocks: unknown[]): string {
  return JSON.stringify({ content: blocks });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_MODEL;
});

describe("isAssistantEnabled (re-exported gate)", () => {
  it("is false when no key is set", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(isAssistantEnabled()).toBe(false);
  });
  it("is true once a non-empty key is set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    expect(isAssistantEnabled()).toBe(true);
  });
});

describe("generateSummary — dormant (no key)", () => {
  it("returns null and makes NO fetch call when ANTHROPIC_API_KEY is unset", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const out = await generateSummary("sys", "user");
    expect(out).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only key as dormant ($0)", async () => {
    process.env.ANTHROPIC_API_KEY = "   ";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await generateSummary("sys", "user")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("generateSummary — success path", () => {
  it("returns the concatenated, trimmed text of all text blocks", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            anthropicBody([
              { type: "text", text: "  Hello " },
              { type: "text", text: "world" },
            ]),
            { status: 200 },
          ),
      ),
    );
    expect(await generateSummary("sys", "user")).toBe("Hello world");
  });

  it("filters out non-text blocks (tool_use, thinking) before joining", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            anthropicBody([
              { type: "tool_use", id: "t1", name: "x", input: {} },
              { type: "text", text: "narration" },
              { type: "thinking", thinking: "ignore me" },
            ]),
            { status: 200 },
          ),
      ),
    );
    expect(await generateSummary("sys", "user")).toBe("narration");
  });

  it("tolerates a text block with a missing text field (coerced to empty)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(anthropicBody([{ type: "text" }, { type: "text", text: "kept" }]), {
            status: 200,
          }),
      ),
    );
    expect(await generateSummary("sys", "user")).toBe("kept");
  });

  it("returns null when the joined text is empty/whitespace only", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(anthropicBody([{ type: "text", text: "   " }]), { status: 200 })),
    );
    expect(await generateSummary("sys", "user")).toBeNull();
  });

  it("returns null when content is missing entirely", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })));
    expect(await generateSummary("sys", "user")).toBeNull();
  });

  it("returns null when the body is not valid JSON (json() rejects → caught to null)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not-json", { status: 200 })));
    expect(await generateSummary("sys", "user")).toBeNull();
  });
});

describe("generateSummary — request shaping", () => {
  it("sends the keyed headers, default model, and the max_tokens/system/messages body", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-secret";
    delete process.env.ANTHROPIC_MODEL;
    const fetchSpy = vi.fn(
      async () => new Response(anthropicBody([{ type: "text", text: "ok" }]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await generateSummary("SYSTEM PROMPT", "USER CONTENT", 123);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("sk-ant-secret");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    expect(headers["content-type"]).toBe("application/json");
    expect(init.signal).toBeInstanceOf(AbortSignal);

    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("claude-haiku-4-5-20251001"); // ASSISTANT_MODEL_DEFAULT
    expect(body.max_tokens).toBe(123);
    expect(body.system).toBe("SYSTEM PROMPT");
    expect(body.messages).toEqual([{ role: "user", content: "USER CONTENT" }]);
  });

  it("uses ANTHROPIC_MODEL override when set, and defaults max_tokens to 500", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-secret";
    process.env.ANTHROPIC_MODEL = "claude-custom-model";
    const fetchSpy = vi.fn(
      async () => new Response(anthropicBody([{ type: "text", text: "ok" }]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await generateSummary("sys", "user");

    const init = (fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1];
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("claude-custom-model");
    expect(body.max_tokens).toBe(500);
  });
});

describe("generateSummary — fail-closed error paths", () => {
  it("returns null and logs on a non-OK HTTP status", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));

    expect(await generateSummary("sys", "user")).toBeNull();
    expect(errSpy).toHaveBeenCalledTimes(1);
    const logged = String(errSpy.mock.calls[0][0]);
    expect(logged).toContain("anthropic:summary");
    expect(logged).toContain("Anthropic HTTP 500");
  });

  it("returns null and logs when fetch itself throws (network/abort)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("net down");
      }),
    );

    expect(await generateSummary("sys", "user")).toBeNull();
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(String(errSpy.mock.calls[0][0])).toContain("net down");
  });
});
