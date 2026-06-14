import { describe, it, expect } from "vitest";
import {
  ASSISTANT_TOOLS,
  ASSISTANT_SYSTEM_PROMPT,
  assistantDisabledReply,
  isAssistantEnabled,
  validateMessages,
  toolUsesFrom,
  textFrom,
} from "@/lib/product-finder-assistant";

describe("assistant tool defs + prompt", () => {
  it("exposes the three grounded tools with required inputs", () => {
    const names = ASSISTANT_TOOLS.map((t) => t.name);
    expect(names).toEqual(["search_products", "cross_reference", "product_detail"]);
    for (const t of ASSISTANT_TOOLS) {
      expect(t.input_schema.type).toBe("object");
      expect(Array.isArray(t.input_schema.required)).toBe(true);
    }
  });

  it("the system prompt forbids fabrication and points at sourced crosses", () => {
    expect(ASSISTANT_SYSTEM_PROMPT).toContain("NEVER invent");
    expect(ASSISTANT_SYSTEM_PROMPT).toContain("cross_reference");
  });
});

describe("isAssistantEnabled", () => {
  it("is gated on a non-empty ANTHROPIC_API_KEY", () => {
    expect(isAssistantEnabled({})).toBe(false);
    expect(isAssistantEnabled({ ANTHROPIC_API_KEY: "" })).toBe(false);
    expect(isAssistantEnabled({ ANTHROPIC_API_KEY: "  " })).toBe(false);
    expect(isAssistantEnabled({ ANTHROPIC_API_KEY: "sk-ant-x" })).toBe(true);
  });
});

describe("assistantDisabledReply", () => {
  it("names the missing key and points at the zero-cost alternatives", () => {
    const r = assistantDisabledReply();
    expect(r).toContain("ANTHROPIC_API_KEY");
    expect(r).toMatch(/Bulk Cross-Ref|Job Wizard/);
  });
});

describe("validateMessages", () => {
  it("accepts a clean conversation ending in a user turn", () => {
    const out = validateMessages({ messages: [{ role: "user", content: "  hi  " }] });
    expect(out).toEqual([{ role: "user", content: "hi" }]);
  });

  it("rejects empty, malformed, or non-user-final inputs", () => {
    expect(validateMessages({})).toBeNull();
    expect(validateMessages({ messages: [] })).toBeNull();
    expect(validateMessages({ messages: [{ role: "system", content: "x" }] })).toBeNull();
    expect(validateMessages({ messages: [{ role: "user", content: 5 }] })).toBeNull();
    expect(validateMessages({ messages: [{ role: "assistant", content: "x" }] })).toBeNull();
  });

  it("clamps to the last N messages and per-message length", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ role: "user" as const, content: `m${i}` }));
    expect(validateMessages({ messages: many })!.length).toBeLessThanOrEqual(20);
    const long = validateMessages({ messages: [{ role: "user", content: "x".repeat(9999) }] });
    expect(long![0].content.length).toBe(4000);
  });
});

describe("Anthropic response shaping", () => {
  const content = [
    { type: "text", text: "Here you go. " },
    { type: "tool_use", id: "t1", name: "cross_reference", input: { partNumber: "FRN-R-30" } },
    { type: "text", text: "Checking." },
  ];
  it("extracts tool_use blocks", () => {
    expect(toolUsesFrom(content)).toEqual([{ id: "t1", name: "cross_reference", input: { partNumber: "FRN-R-30" } }]);
    expect(toolUsesFrom(undefined)).toEqual([]);
  });
  it("concatenates text blocks", () => {
    expect(textFrom(content)).toBe("Here you go. Checking.");
    expect(textFrom(undefined)).toBe("");
  });
});
