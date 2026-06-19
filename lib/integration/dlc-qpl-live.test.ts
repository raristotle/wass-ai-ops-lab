import { describe, it, expect, afterEach } from "vitest";
import { dlcQplConfigured, parseDlcLookup } from "@/lib/integration/dlc-qpl-live";

afterEach(() => {
  delete process.env.DLC_QPL_API_TOKEN;
});

describe("dlc-qpl dormancy", () => {
  it("is dormant without the paid token", () => {
    expect(dlcQplConfigured()).toBe(false);
  });
  it("activates once the token is set", () => {
    process.env.DLC_QPL_API_TOKEN = "t";
    expect(dlcQplConfigured()).toBe(true);
  });
});

describe("parseDlcLookup", () => {
  it("marks an Approved-Published product as listed", () => {
    const l = parseDlcLookup({
      result: {
        "Product ID": "PRWKL5S5",
        Status: "Approved - Published",
        "Product Name": "WallPack 5000",
        "Brand Name": "Acme",
        Manufacturer: "Acme Lighting",
        QPL: "ssl",
        "Date Qualified": "2024-01-15",
      },
    });
    expect(l).not.toBeNull();
    expect(l!.listed).toBe(true);
    expect(l!.brand).toBe("Acme");
    expect(l!.qpl).toBe("ssl");
  });
  it("marks a Delisted product as not listed", () => {
    const l = parseDlcLookup({ result: { "Product ID": "X", Status: "Delisted" } });
    expect(l!.listed).toBe(false);
  });
  it("returns null for an auth-error envelope with no result fields", () => {
    expect(parseDlcLookup({ error: "Authentication token missing or invalid" })).toBeNull();
    expect(parseDlcLookup(null)).toBeNull();
  });
});
