/**
 * Shared gated-generation helper for the Sprint-4 agents (#7, #20). One Claude
 * Haiku call that returns plain text, or NULL when the assistant is dormant
 * (no ANTHROPIC_API_KEY) or on any error — so the caller falls back to its
 * deterministic template. Mirrors the datasheet-RAG generation path: candidate
 * finding stays free + deterministic; only this narration spends tokens, and
 * only when keyed. $0 until activated.
 */

import { isAssistantEnabled, ASSISTANT_MODEL_DEFAULT } from "@/lib/product-finder-assistant";
import { logApiError } from "@/lib/server/log";

export { isAssistantEnabled };

export async function generateSummary(system: string, userContent: string, maxTokens = 500): Promise<string | null> {
  if (!isAssistantEnabled()) return null; // dormant → no call, $0
  try {
    const model = process.env.ANTHROPIC_MODEL || ASSISTANT_MODEL_DEFAULT;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": String(process.env.ANTHROPIC_API_KEY),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: userContent }] }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      logApiError("anthropic:summary", new Error(`Anthropic HTTP ${res.status}`));
      return null;
    }
    const json = (await res.json().catch(() => null)) as { content?: { type?: string; text?: string }[] } | null;
    const text = (json?.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch (e) {
    logApiError("anthropic:summary", e);
    return null;
  }
}
