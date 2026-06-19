import { describe, it, expect, afterEach } from "vitest";
import {
  gleifConfigured,
  parseLeiRecord,
  parseLeiList,
  GLEIF_DEFAULT_BASE,
} from "@/lib/integration/gleif-live";

afterEach(() => {
  delete process.env.GLEIF_API_BASE_URL;
});

describe("gleif dormancy", () => {
  it("is dormant without GLEIF_API_BASE_URL", () => {
    expect(gleifConfigured()).toBe(false);
  });
  it("activates once the base URL is set", () => {
    process.env.GLEIF_API_BASE_URL = GLEIF_DEFAULT_BASE;
    expect(gleifConfigured()).toBe(true);
  });
});

describe("parseLeiRecord", () => {
  const record = {
    id: "HWUPKR0MPOU8FGXBT394",
    attributes: {
      lei: "HWUPKR0MPOU8FGXBT394",
      entity: { legalName: { name: "Eaton Corporation" }, status: "ACTIVE", jurisdiction: "US-OH" },
    },
  };
  it("extracts LEI + legal name + status + jurisdiction", () => {
    expect(parseLeiRecord(record)).toEqual({
      lei: "HWUPKR0MPOU8FGXBT394",
      legalName: "Eaton Corporation",
      status: "ACTIVE",
      jurisdiction: "US-OH",
    });
  });
  it("rejects a non-20-char id", () => {
    expect(parseLeiRecord({ id: "TOOSHORT", attributes: {} })).toBeNull();
  });
  it("returns null for junk", () => {
    expect(parseLeiRecord(null)).toBeNull();
    expect(parseLeiRecord({})).toBeNull();
  });
  it("tolerates missing entity fields", () => {
    expect(parseLeiRecord({ id: "HWUPKR0MPOU8FGXBT394", attributes: {} })).toEqual({
      lei: "HWUPKR0MPOU8FGXBT394",
      legalName: null,
      status: null,
      jurisdiction: null,
    });
  });
});

describe("parseLeiList", () => {
  it("maps a JSON:API data array and honors the limit", () => {
    const json = {
      data: [
        { id: "HWUPKR0MPOU8FGXBT394", attributes: { entity: { legalName: { name: "A" } } } },
        { id: "5493001KJTIIGC8Y1R12", attributes: { entity: { legalName: { name: "B" } } } },
        { id: "BADID", attributes: {} },
      ],
    };
    const out = parseLeiList(json, 1);
    expect(out).toHaveLength(1);
    expect(out[0].legalName).toBe("A");
  });
  it("returns [] when data is missing", () => {
    expect(parseLeiList({}, 5)).toEqual([]);
  });
});
