/**
 * Gated Claude-vision helper for visual part ID (v4-S3 #14). One Claude Haiku
 * call with an image block that returns plain text (expected to be JSON), or NULL
 * when the assistant is dormant (no ANTHROPIC_API_KEY) or on any error. Mirrors
 * lib/server/anthropic-summary.ts exactly — same gate, same model default, same
 * fail-soft contract — so visual part ID is $0 until ANTHROPIC_API_KEY is set and
 * reuses the existing `assistant` health flag (no new key, no new cost surface).
 *
 * The model only OBSERVES; it never returns a SKU. The caller maps the observed
 * attributes to a real catalog SKU deterministically (vision proposes, catalog
 * disposes). The image is never logged.
 */

import { isAssistantEnabled, ASSISTANT_MODEL_DEFAULT } from "@/lib/product-finder-assistant";
import { logApiError } from "@/lib/server/log";

export { isAssistantEnabled };

export interface VisionImage {
  /** e.g. "image/jpeg" | "image/png" | "image/webp". */
  mediaType: string;
  /** Raw base64 (no data: prefix). */
  dataBase64: string;
}

/** One gated Claude vision call: image + instruction → text, or null (dormant/error). */
export async function analyzeImage(
  system: string,
  instruction: string,
  image: VisionImage,
  maxTokens = 400,
): Promise<string | null> {
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
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.dataBase64 } },
              { type: "text", text: instruction },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      logApiError("anthropic:vision", new Error(`Anthropic HTTP ${res.status}`));
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
    logApiError("anthropic:vision", e);
    return null;
  }
}
