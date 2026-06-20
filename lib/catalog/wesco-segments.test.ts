import { describe, it, expect } from "vitest";
import {
  segmentForSubcategory,
  templatesForSubcategory,
  solutionCoverage,
  bestSolutionFor,
  SOLUTION_TEMPLATES,
  WESCO_SEGMENTS,
} from "@/lib/catalog/wesco-segments";

describe("segmentForSubcategory", () => {
  it("classifies via the explicit map", () => {
    expect(segmentForSubcategory("Ethernet Cable")).toBe("CSS");
    expect(segmentForSubcategory("Meter Sockets")).toBe("UBS");
    expect(segmentForSubcategory("Switches")).toBe("EES");
  });
  it("falls back to keywords, EES by default", () => {
    expect(segmentForSubcategory("Network Patch Cords")).toBe("CSS"); // 'network'/'patch'
    expect(segmentForSubcategory("Pad-Mount Transformer Pads")).toBe("UBS"); // 'transformer'
    expect(segmentForSubcategory("Something Electrical New")).toBe("EES");
  });
});

describe("SOLUTION_TEMPLATES", () => {
  it("every template's segment exists and families are non-empty", () => {
    for (const t of SOLUTION_TEMPLATES) {
      expect(WESCO_SEGMENTS[t.segment]).toBeDefined();
      expect(t.families.length).toBeGreaterThan(2);
      expect(new Set(t.families).size).toBe(t.families.length); // no dup families
    }
  });
});

describe("solutionCoverage", () => {
  const branch = SOLUTION_TEMPLATES.find((t) => t.id === "ees-branch-wiring")!;

  it("computes covered/gap families and a percentage", () => {
    const cov = solutionCoverage(branch, ["Switches", "Wall Plates & Covers"]);
    expect(cov.coveredCount).toBe(2);
    expect(cov.totalCount).toBe(branch.families.length);
    expect(cov.gaps).toContain("Wire & Cable");
    expect(cov.gaps).not.toContain("Switches");
    expect(cov.coveragePct).toBe(Math.round((2 / branch.families.length) * 100));
  });

  it("full coverage leaves no gaps", () => {
    const cov = solutionCoverage(branch, branch.families);
    expect(cov.gaps).toEqual([]);
    expect(cov.coveragePct).toBe(100);
  });
});

describe("bestSolutionFor", () => {
  it("picks the template the seed belongs to with the most covered families", () => {
    // Switches is in branch-wiring; with plates+boxes already in cart it's the closest.
    const cov = bestSolutionFor("Switches", ["Switches", "Wall Plates & Covers", "Boxes & Covers"]);
    expect(cov).not.toBeNull();
    expect(cov!.template.id).toBe("ees-branch-wiring");
    expect(cov!.coveredCount).toBe(3);
  });

  it("returns null for a seed in no template", () => {
    expect(bestSolutionFor("Hard Hats", ["Hard Hats"])).toBeNull();
  });

  it("a seed maps to its package even from an empty cart", () => {
    const cov = bestSolutionFor("Ethernet Cable", []);
    expect(cov!.template.segment).toBe("CSS");
    expect(cov!.gaps).toContain("Patch Panels");
  });
});

describe("templatesForSubcategory", () => {
  it("Wire & Cable appears in multiple EES packages", () => {
    const ts = templatesForSubcategory("Wire & Cable");
    expect(ts.length).toBeGreaterThan(1);
    expect(ts.every((t) => t.families.includes("Wire & Cable"))).toBe(true);
  });
});
