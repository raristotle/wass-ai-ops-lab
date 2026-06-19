import { describe, it, expect } from "vitest";
import { parseImageDataUrl, parseVisionFields, visionQuery } from "@/lib/product-finder-vision";

describe("parseImageDataUrl", () => {
  it("parses a valid jpeg data URL", () => {
    const out = parseImageDataUrl("data:image/jpeg;base64,/9j/abc123==");
    expect(out).toEqual({ mediaType: "image/jpeg", dataBase64: "/9j/abc123==" });
  });
  it("accepts png and webp", () => {
    expect(parseImageDataUrl("data:image/png;base64,iVBOR")?.mediaType).toBe("image/png");
    expect(parseImageDataUrl("data:image/webp;base64,UklGR")?.mediaType).toBe("image/webp");
  });
  it("rejects non-image and malformed URLs", () => {
    expect(parseImageDataUrl("data:application/pdf;base64,xxxx")).toBeNull();
    expect(parseImageDataUrl("not a data url")).toBeNull();
    expect(parseImageDataUrl("data:image/jpeg;base64,")).toBeNull();
  });
});

describe("parseVisionFields", () => {
  it("parses a clean JSON object", () => {
    const p = parseVisionFields('{"manufacturer":"Square D","catalogNumber":"qo120","amperage":"20A"}');
    expect(p).not.toBeNull();
    expect(p!.fields.manufacturer).toBe("Square D");
    expect(p!.fields.catalogNumber).toBe("QO120"); // uppercased
    expect(p!.fields.amperage).toBe("20A");
  });

  it("tolerates code fences and surrounding prose", () => {
    const p = parseVisionFields('Here is what I see:\n```json\n{"descriptors":"molded case breaker"}\n```');
    expect(p?.descriptors).toBe("molded case breaker");
  });

  it("returns null on non-JSON or empty observation", () => {
    expect(parseVisionFields("I cannot tell")).toBeNull();
    expect(parseVisionFields("{}")).toBeNull(); // no usable field
    expect(parseVisionFields("")).toBeNull();
  });

  it("ignores non-string field values", () => {
    const p = parseVisionFields('{"amperage":20,"manufacturer":"Eaton"}');
    expect(p!.fields.amperage).toBeUndefined();
    expect(p!.fields.manufacturer).toBe("Eaton");
  });
});

describe("visionQuery", () => {
  it("uses the catalog number alone when read", () => {
    const q = visionQuery({ fields: { catalogNumber: "QO120", manufacturer: "Square D" }, descriptors: "breaker" });
    expect(q).toBe("QO120");
  });
  it("falls back to manufacturer + specs + descriptors", () => {
    const q = visionQuery({ fields: { manufacturer: "Square D", amperage: "20A" }, descriptors: "molded case breaker" });
    expect(q).toContain("Square D");
    expect(q).toContain("20A");
    expect(q).toContain("molded case breaker");
  });
  it("uses descriptors alone when no fields", () => {
    expect(visionQuery({ fields: {}, descriptors: "LED high bay fixture" })).toBe("LED high bay fixture");
  });
});
