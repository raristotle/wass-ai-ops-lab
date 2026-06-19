import { describe, it, expect, afterEach } from "vitest";
import { urdbConfigured, parseUrdbItem, parseUrdbResponse } from "@/lib/integration/urdb-live";

afterEach(() => {
  delete process.env.OPENEI_API_KEY;
});

describe("urdb dormancy", () => {
  it("is dormant without OPENEI_API_KEY", () => {
    expect(urdbConfigured()).toBe(false);
  });
  it("activates once a real key is set", () => {
    process.env.OPENEI_API_KEY = "k";
    expect(urdbConfigured()).toBe(true);
  });
});

describe("parseUrdbItem", () => {
  it("normalizes a full-detail rate with demand + energy structures", () => {
    const r = parseUrdbItem({
      label: "abc123",
      utility: "Xcel Energy",
      name: "Secondary General C-1",
      sector: "Commercial",
      fixedchargefirstmeter: "30.5",
      fixedchargeunits: "$/month",
      energyratestructure: [[{ rate: 0.07 }]],
      demandratestructure: [[{ rate: 12.0 }]],
    });
    expect(r.utility).toBe("Xcel Energy");
    expect(r.fixedCharge).toBe(30.5);
    expect(r.hasDemandCharges).toBe(true);
    expect(r.hasEnergyCharges).toBe(true);
  });
  it("flags flat demand structures too, and energy-less tariffs", () => {
    const r = parseUrdbItem({ label: "x", flatdemandstructure: [[{ rate: 5 }]] });
    expect(r.hasDemandCharges).toBe(true);
    expect(r.hasEnergyCharges).toBe(false);
    expect(r.fixedCharge).toBeNull();
  });
});

describe("parseUrdbResponse", () => {
  it("maps items[] and honors the limit", () => {
    const json = { items: [{ label: "a" }, { label: "b" }, { label: "c" }] };
    expect(parseUrdbResponse(json, 2).map((r) => r.label)).toEqual(["a", "b"]);
  });
  it("returns [] when items is missing", () => {
    expect(parseUrdbResponse({})).toEqual([]);
  });
});
