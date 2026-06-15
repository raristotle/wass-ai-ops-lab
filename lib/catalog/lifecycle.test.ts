import { describe, it, expect } from "vitest";
import {
  LIFECYCLE_STATUSES,
  LIFECYCLE_META,
  lifecycleStatusForId,
  effectiveLifecycle,
  isActiveLifecycle,
  isObsolescent,
} from "@/lib/catalog/lifecycle";

describe("lifecycle metadata", () => {
  it("has metadata for every status, only Active is active", () => {
    for (const s of LIFECYCLE_STATUSES) {
      expect(LIFECYCLE_META[s]).toBeTruthy();
      expect(LIFECYCLE_META[s].short.length).toBeGreaterThan(0);
    }
    expect(LIFECYCLE_META.Active.active).toBe(true);
    expect(LIFECYCLE_META.NRND.active).toBe(false);
    expect(LIFECYCLE_META.Discontinued.active).toBe(false);
  });

  it("orders severity 0..4 ascending from Active to Discontinued", () => {
    expect(LIFECYCLE_META.Active.severity).toBe(0);
    expect(LIFECYCLE_META.Discontinued.severity).toBe(4);
    const sevs = LIFECYCLE_STATUSES.map((s) => LIFECYCLE_META[s].severity);
    expect(sevs).toEqual([...sevs].sort((a, b) => a - b));
  });
});

describe("lifecycleStatusForId", () => {
  it("is deterministic for the same id", () => {
    expect(lifecycleStatusForId("GEN-CB12345")).toBe(lifecycleStatusForId("GEN-CB12345"));
    expect(lifecycleStatusForId("GEN-WR99999")).toBe(lifecycleStatusForId("GEN-WR99999"));
  });

  it("only ever returns a valid status", () => {
    for (let i = 0; i < 500; i++) {
      expect(LIFECYCLE_STATUSES).toContain(lifecycleStatusForId(`GEN-X${i}`));
    }
  });

  it("produces a realistic distribution: mostly Active, all 5 statuses present", () => {
    const counts: Record<string, number> = {};
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const s = lifecycleStatusForId(`GEN-SYNTH-${i}`);
      counts[s] = (counts[s] ?? 0) + 1;
    }
    // Every status appears.
    for (const s of LIFECYCLE_STATUSES) expect(counts[s] ?? 0).toBeGreaterThan(0);
    // Active dominates (target 85%, allow a wide tolerance band).
    const activePct = (counts.Active ?? 0) / N;
    expect(activePct).toBeGreaterThan(0.78);
    expect(activePct).toBeLessThan(0.92);
    // Obsolescent minority is a meaningful slice (so the demo has parts to design out).
    const obsoletePct = 1 - activePct;
    expect(obsoletePct).toBeGreaterThan(0.08);
  });
});

describe("lifecycle helpers", () => {
  it("treats undefined as Active", () => {
    expect(effectiveLifecycle(undefined)).toBe("Active");
    expect(isActiveLifecycle(undefined)).toBe(true);
    expect(isObsolescent(undefined)).toBe(false);
  });

  it("classifies obsolescent statuses", () => {
    expect(isObsolescent("EOL")).toBe(true);
    expect(isObsolescent("Discontinued")).toBe(true);
    expect(isObsolescent("NRND")).toBe(true);
    expect(isActiveLifecycle("Active")).toBe(true);
  });
});
