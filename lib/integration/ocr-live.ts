/**
 * Nameplate OCR (REAL) — env-gated DORMANT. OCR.space (free 25k requests/mo, no
 * card) turns a photographed nameplate / equipment label into text; the
 * deterministic parser (lib/product-finder-nameplate.ts) then extracts specs. So
 * the parsing is free + always works, and ONLY the image→text step is gated.
 *
 *  - Dormant until OCRSPACE_API_KEY is set: no key ⇒ no network, $0.
 *  - Fail-closed: any OCR/parse error degrades to "no text" (the scanner keeps
 *    the manual-entry path).
 *  - Server-only secret; the image is sent to OCR.space, never logged.
 *
 *   OCRSPACE_API_KEY — free OCR.space key. The gate.
 */

import { z } from "zod";
import { logApiError } from "@/lib/server/log";

const OCR_URL = "https://api.ocr.space/parse/image";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export function ocrConfigured(): boolean {
  return Boolean(env("OCRSPACE_API_KEY"));
}

const OcrSchema = z.object({
  OCRExitCode: z.number().optional(),
  IsErroredOnProcessing: z.boolean().optional(),
  ParsedResults: z.array(z.object({ ParsedText: z.string().optional() })).optional(),
});

/** Pure: extract the joined ParsedText from an OCR.space response, or null. */
export function ocrSpaceToText(json: unknown): string | null {
  const parsed = OcrSchema.safeParse(json);
  if (!parsed.success || parsed.data.IsErroredOnProcessing) return null;
  // OCRExitCode: 1=success, 2=partial, 3=failed, 4=error → treat >2 as failure.
  if (parsed.data.OCRExitCode != null && parsed.data.OCRExitCode > 2) return null;
  const text = (parsed.data.ParsedResults ?? [])
    .map((r) => r.ParsedText ?? "")
    .join("\n")
    .trim();
  return text || null;
}

export type OcrResult =
  | { enabled: false; reason: "not-configured" | "error" }
  | { enabled: true; text: string };

/**
 * OCR a base64 data-URL image. Dormant (no network) when no key is set;
 * fail-closed on any error.
 */
export async function ocrImage(base64DataUrl: string): Promise<OcrResult> {
  const key = env("OCRSPACE_API_KEY");
  if (!key) return { enabled: false, reason: "not-configured" };
  try {
    const form = new URLSearchParams();
    form.set("base64Image", base64DataUrl); // OCR.space accepts a data URL here
    form.set("OCREngine", "2"); // better engine for labels
    form.set("scale", "true");
    const res = await fetch(OCR_URL, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      logApiError("ocr:parse", new Error(`OCR.space HTTP ${res.status}`));
      return { enabled: false, reason: "error" };
    }
    const text = ocrSpaceToText(await res.json().catch(() => null));
    return text ? { enabled: true, text } : { enabled: false, reason: "error" };
  } catch (e) {
    logApiError("ocr:parse", e);
    return { enabled: false, reason: "error" };
  }
}
