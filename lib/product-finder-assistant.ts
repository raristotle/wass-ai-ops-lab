/**
 * Ask Meridian (conversational) — the pure layer of the AI assistant.
 *
 * The assistant answers counter-rep questions ("what do you stock that replaces
 * a Bussmann FRN-R-30?", "is the LC1D09G7 in stock and what crosses to it?")
 * grounded ONLY in tool results over the real catalog and the source-backed
 * cross dataset. The live model call (Anthropic Messages API with tool use)
 * lives in /api/assistant and is env-gated behind ANTHROPIC_API_KEY — when no
 * key is set the route returns `assistantDisabledReply()` and the UI shows a
 * labeled "ready to activate" state, exactly like the Resend email seam.
 *
 * This module is pure: tool definitions, the system prompt, request validation,
 * and Anthropic response shaping — all unit-testable without a network or key.
 */

export const ASSISTANT_MODEL_DEFAULT = "claude-haiku-4-5-20251001";

/** Max conversation turns and per-message length accepted by the route. */
export const ASSISTANT_MAX_MESSAGES = 20;
export const ASSISTANT_MAX_CONTENT = 4000;

export interface AssistantTextMessage {
  role: "user" | "assistant";
  content: string;
}

/** Tool names the assistant may call (dispatched server-side in the route). */
export type AssistantToolName = "search_products" | "cross_reference" | "product_detail";

/** Anthropic tool-use definitions. Mirror the MCP server's tool surface. */
export const ASSISTANT_TOOLS = [
  {
    name: "search_products",
    description:
      "Search the Meridian product catalog by natural-language query. Returns stocked products with SKU, brand, price, stock, and verified-cross count. Use for 'what do you carry for X'.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text, e.g. '20A breaker' or 'cat6 plenum'." },
        inStockOnly: { type: "boolean", description: "Only return products in stock at a branch." },
        limit: { type: "number", description: "Max results (default 6, max 12)." },
      },
      required: ["query"],
    },
  },
  {
    name: "cross_reference",
    description:
      "Convert ONE competitor or legacy part number to the stocked Meridian equivalent we DOCUMENT, with source citation and confidence. Only >=95% source-backed crosses are returned.",
    input_schema: {
      type: "object",
      properties: { partNumber: { type: "string", description: "Competitor/legacy part number, e.g. 'FRN-R-30'." } },
      required: ["partNumber"],
    },
  },
  {
    name: "product_detail",
    description:
      "Full detail for one product by SKU or id: specs, datasheet link, price, branch/DC stock, and source-backed cross-references. Use to answer spec questions and check substitutes.",
    input_schema: {
      type: "object",
      properties: { idOrSku: { type: "string", description: "Product id (REAL-…) or a SKU/part number." } },
      required: ["idOrSku"],
    },
  },
] as const;

export const ASSISTANT_SYSTEM_PROMPT = [
  "You are “Ask Meridian,” the AI assistant inside Meridian Supply Co.'s Product Finder — an electrical/industrial distributor's counter tool.",
  "Help reps find stocked products, cross-reference competitor parts to what Meridian stocks, answer spec questions, and check availability.",
  "RULES:",
  "- Ground every factual claim in tool results. NEVER invent SKUs, prices, specs, stock, or cross-references. If a tool returns nothing, say so plainly.",
  "- For 'what replaces / equivalent to <competitor part>' questions, use cross_reference. Only documented, source-backed crosses exist; cite the source and confidence, and note when a part is a functional substitute vs a direct equivalent.",
  "- For spec or 'will it fit' questions, use product_detail and answer from the returned specs; link the datasheet when present.",
  "- Prefer in-stock, preferred-line products. Quote prices as 'est. list' — they are researched estimates, not a quote.",
  "- Be concise and counter-friendly: a sentence or two plus the part(s), not an essay. Use the product's brand + SKU.",
  "- You cannot place orders or send anything; suggest the rep add items to the basket or open the Job Wizard for a full bill of materials.",
].join("\n");

/** The reply returned when ANTHROPIC_API_KEY is not configured. */
export function assistantDisabledReply(): string {
  return [
    "Ask Meridian (AI) is wired up but not yet activated — it needs an `ANTHROPIC_API_KEY` on the deployment to start answering.",
    "Once a key is set, I can search the catalog, cross-reference competitor parts to what we stock (with sources), answer spec questions, and check availability in plain English.",
    "In the meantime: use the search bar, **Bulk Cross-Ref** for competitor parts, or **Ask Meridian — Job Wizard** to build a full bill of materials. All of that works today with zero AI cost.",
  ].join("\n\n");
}

export function isAssistantEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return typeof env.ANTHROPIC_API_KEY === "string" && env.ANTHROPIC_API_KEY.trim().length > 0;
}

/** Validate + clamp an incoming { messages } body. Returns null when unusable. */
export function validateMessages(input: unknown): AssistantTextMessage[] | null {
  const raw = (input as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: AssistantTextMessage[] = [];
  for (const m of raw.slice(-ASSISTANT_MAX_MESSAGES)) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed) continue;
    out.push({ role, content: trimmed.slice(0, ASSISTANT_MAX_CONTENT) });
  }
  if (out.length === 0 || out[out.length - 1].role !== "user") return null;
  return out;
}

// ── Anthropic response shaping (pure) ─────────────────────────────────────────

export interface ToolUseBlock {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: string; [k: string]: unknown };

/** The tool_use blocks in an Anthropic message's content. */
export function toolUsesFrom(content: ContentBlock[] | undefined): ToolUseBlock[] {
  if (!Array.isArray(content)) return [];
  return content
    .filter((b): b is { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } => b.type === "tool_use")
    .map((b) => ({ id: b.id, name: b.name, input: b.input ?? {} }));
}

/** The concatenated text of an Anthropic message's content. */
export function textFrom(content: ContentBlock[] | undefined): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
