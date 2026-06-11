import { describe, it, expect } from "vitest";
import type { ProductSpec } from "@/features/product-finder/types";
import {
  CALLOUT_SPEC_PRIORITY,
  CALLOUT_MAX_LEN,
  keySpecCallout,
} from "@/lib/product-finder-plate";

const spec = (name: string, value: string): ProductSpec => ({ name, value });

describe("CALLOUT_SPEC_PRIORITY", () => {
  it("starts with Amperage and ends with Voltage", () => {
    expect(CALLOUT_SPEC_PRIORITY[0]).toBe("Amperage");
    expect(CALLOUT_SPEC_PRIORITY[CALLOUT_SPEC_PRIORITY.length - 1]).toBe("Voltage");
  });

  it("CALLOUT_MAX_LEN is 8", () => {
    expect(CALLOUT_MAX_LEN).toBe(8);
  });
});

describe("keySpecCallout", () => {
  it("respects priority order: Amperage beats Voltage", () => {
    const specs = [spec("Voltage", "120V"), spec("Amperage", "20A")];
    expect(keySpecCallout(specs)).toBe("20A");
  });

  it("skips an over-length value and falls through to the next priority", () => {
    const specs = [
      spec("Amperage", "15A/20A/30A"), // 11 chars > 8 → skipped
      spec("Voltage", "120V"),
    ];
    expect(keySpecCallout(specs)).toBe("120V");
  });

  it("skips an empty / whitespace-only value", () => {
    const specs = [spec("Amperage", "   "), spec("Gauge", "12 AWG")];
    expect(keySpecCallout(specs)).toBe("12 AWG");
  });

  it("trims the returned value", () => {
    expect(keySpecCallout([spec("Amperage", "  20A ")])).toBe("20A");
  });

  it("returns null when no spec qualifies", () => {
    const specs = [
      spec("Color", "White"), // not a callout spec
      spec("Voltage", "120/240V plus"), // too long
    ];
    expect(keySpecCallout(specs)).toBeNull();
  });

  it("returns null for empty specs", () => {
    expect(keySpecCallout([])).toBeNull();
  });

  it("a value of exactly CALLOUT_MAX_LEN chars qualifies", () => {
    expect(keySpecCallout([spec("Voltage", "120/240V")])).toBe("120/240V"); // 8 chars
  });

  it("is deterministic", () => {
    const specs = [spec("Lumens", "4400 lm"), spec("Wattage", "40W")];
    expect(keySpecCallout(specs)).toBe(keySpecCallout(specs));
    expect(keySpecCallout(specs)).toBe("40W"); // Wattage outranks Lumens
  });
});
