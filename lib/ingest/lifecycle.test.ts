import { describe, it, expect } from "vitest";
import { mapAvailabilityToLifecycle, lifecycleLabel, LIFECYCLE_ATTRIBUTE } from "@/lib/ingest/lifecycle";

describe("mapAvailabilityToLifecycle", () => {
  it("maps Discontinued (URL / prefixed / bare) to a discontinued lifecycle signal", () => {
    expect(mapAvailabilityToLifecycle("https://schema.org/Discontinued")).toBe("discontinued");
    expect(mapAvailabilityToLifecycle("schema:Discontinued")).toBe("discontinued");
    expect(mapAvailabilityToLifecycle("Discontinued")).toBe("discontinued");
    expect(mapAvailabilityToLifecycle("http://schema.org/Discontinued")).toBe("discontinued");
    expect(mapAvailabilityToLifecycle("https://schema.org/Discontinued/")).toBe("discontinued"); // trailing slash
    expect(mapAvailabilityToLifecycle("  Discontinued  ")).toBe("discontinued"); // whitespace
  });

  it("returns null for ordinary stock states (availability, NOT lifecycle)", () => {
    for (const s of ["https://schema.org/InStock", "OutOfStock", "PreOrder", "BackOrder", "SoldOut", ""]) {
      expect(mapAvailabilityToLifecycle(s), s).toBeNull();
    }
    expect(mapAvailabilityToLifecycle(null)).toBeNull();
    expect(mapAvailabilityToLifecycle(undefined)).toBeNull();
  });
});

describe("lifecycleLabel", () => {
  it("labels states for the attribute value", () => {
    expect(lifecycleLabel("discontinued")).toBe("Discontinued");
    expect(lifecycleLabel("active")).toBe("Active");
  });
  it("exposes the canonical attribute name", () => {
    expect(LIFECYCLE_ATTRIBUTE).toBe("Lifecycle status");
  });
});
