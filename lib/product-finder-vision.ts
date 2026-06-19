/**
 * Visual part ID — pure parsing layer (v4-S3 #14). Turns a Claude-vision JSON
 * response into the SAME NameplateFields the OCR path produces, then builds a
 * catalog query. The model proposes observed attributes; this layer is
 * deterministic and the existing catalog resolver disposes (a real SKU only ever
 * comes from the catalog, never the model). $0, fully unit-testable.
 */

import { nameplateQuery, type NameplateFields } from "@/lib/product-finder-nameplate";

export const VISION_SYSTEM =
  "You identify electrical and industrial parts from a photo of the product or its nameplate/label. " +
  "You NEVER invent a part number — return only what you can actually read or confidently observe.";

export const VISION_INSTRUCTION =
  'Identify this electrical/industrial part. Respond with ONLY a compact JSON object (no prose, no markdown fences) ' +
  'with these optional string keys, omitting any you cannot read: ' +
  '{"manufacturer","catalogNumber","voltage","amperage","horsepower","interruptRating","phase","descriptors"}. ' +
  '"descriptors" is a short space-separated phrase of the visible product type (e.g. "molded case circuit breaker"). ' +
  "Do not guess a catalogNumber you cannot clearly read.";

/** Parse a base64 image data URL into { mediaType, dataBase64 }, or null if malformed. */
export function parseImageDataUrl(dataUrl: string): { mediaType: string; dataBase64: string } | null {
  const m = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!m) return null;
  return { mediaType: m[1], dataBase64: m[2] };
}

export interface VisionParse {
  fields: NameplateFields;
  /** Free-text product-type phrase the model observed (for a fallback search). */
  descriptors?: string;
}

/**
 * Defensively parse the vision model's text (expected JSON) into structured
 * fields + a descriptor phrase. Tolerates surrounding prose / code fences by
 * extracting the first {...} block. Returns null when nothing usable is found.
 */
export function parseVisionFields(text: string): VisionParse | null {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const str = (k: string): string | undefined => {
    const v = o[k];
    return typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined;
  };
  const fields: NameplateFields = {
    manufacturer: str("manufacturer"),
    catalogNumber: str("catalogNumber")?.toUpperCase(),
    voltage: str("voltage"),
    amperage: str("amperage"),
    horsepower: str("horsepower"),
    interruptRating: str("interruptRating"),
    phase: str("phase"),
  };
  const descriptors = str("descriptors");
  if (!Object.values(fields).some(Boolean) && !descriptors) return null;
  return { fields, descriptors };
}

/**
 * Build a catalog search query from a vision parse: the catalog number when read
 * (most specific → exact / cross-reference), else manufacturer + key specs +
 * the observed product-type descriptors. Reuses nameplateQuery for the field part.
 */
export function visionQuery(parsed: VisionParse): string {
  const base = nameplateQuery(parsed.fields);
  if (parsed.fields.catalogNumber) return base; // an exact catalog number stands alone
  const combined = [base, parsed.descriptors].filter((s) => s && s.trim()).join(" ").trim();
  return combined;
}
