import { describe, it, expect } from "vitest";
import { gradeSourcing, bomSourcing } from "@/lib/catalog/coverage-score";

describe("gradeSourcing", () => {
  it("flags 0–1 sources as high single-source risk", () => {
    expect(gradeSourcing(0).score).toBe(1);
    expect(gradeSourcing(1).score).toBe(1);
    expect(gradeSourcing(1).risk).toBe("high");
    expect(gradeSourcing(1).label).toBe("Single-source");
  });

  it("grades 2 as dual (moderate), 3+ as low risk", () => {
    expect(gradeSourcing(2).score).toBe(2);
    expect(gradeSourcing(2).risk).toBe("moderate");
    expect(gradeSourcing(3).risk).toBe("low");
    expect(gradeSourcing(4).score).toBe(4);
  });

  it("caps the score at 5 for broadly-sourced parts", () => {
    expect(gradeSourcing(5).score).toBe(5);
    expect(gradeSourcing(40).score).toBe(5);
    expect(gradeSourcing(40).label).toBe("Broadly sourced");
  });

  it("clamps negative/fractional input", () => {
    expect(gradeSourcing(-3).score).toBe(1);
    expect(gradeSourcing(2.9).score).toBe(2);
  });
});

describe("bomSourcing", () => {
  it("summarizes an empty BOM safely", () => {
    expect(bomSourcing([])).toEqual({ lines: 0, singleSourced: 0, worst: "low", averageScore: 0 });
  });

  it("counts single-sourced lines and reports the worst risk", () => {
    const grades = [gradeSourcing(1), gradeSourcing(5), gradeSourcing(3)];
    const roll = bomSourcing(grades);
    expect(roll.lines).toBe(3);
    expect(roll.singleSourced).toBe(1);
    expect(roll.worst).toBe("high");
    expect(roll.averageScore).toBe(3); // (1+5+3)/3
  });

  it("reports low when every line is well-sourced", () => {
    expect(bomSourcing([gradeSourcing(4), gradeSourcing(5)]).worst).toBe("low");
  });
});
