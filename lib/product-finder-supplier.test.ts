import { describe, it, expect } from "vitest";
import {
  responseId,
  responseTotal,
  responseLeadTime,
  rankResponses,
  type SupplierResponse,
  type ResponseLine,
} from "@/lib/product-finder-supplier";

const line = (over: Partial<ResponseLine> = {}): ResponseLine => ({
  description: "Breaker",
  qty: 2,
  unitPrice: 10,
  leadTimeDays: 3,
  inStock: true,
  ...over,
});

const resp = (supplier: string, total: number, leadTimeDays: number): SupplierResponse => ({
  id: responseId("Q-1", supplier),
  rfqRef: "Q-1",
  supplier,
  lines: [],
  total,
  leadTimeDays,
  submittedAt: 1,
});

describe("responseId", () => {
  it("is deterministic per (rfqRef, supplier) so resubmits overwrite", () => {
    expect(responseId("Q-20260615-0042", "Gulf Coast Supply")).toMatch(/^resp-q-20260615-0042-gulf-coast-supply-[0-9a-f]{8}$/);
    expect(responseId("Q-1", "Acme")).toBe(responseId("Q-1", "Acme"));
    expect(responseId("Q-1", "Acme")).not.toBe(responseId("Q-2", "Acme"));
  });
  it("distinct suppliers sharing a long name prefix do NOT collide", () => {
    const a = responseId("Q-1", "Northgate Electrical Distribution Company East");
    const b = responseId("Q-1", "Northgate Electrical Distribution Company West");
    expect(a).not.toBe(b);
  });
});

describe("responseTotal / responseLeadTime", () => {
  it("extends and rounds the total", () => {
    expect(responseTotal([line({ qty: 3, unitPrice: 4.333 }), line({ qty: 1, unitPrice: 2 })])).toBe(15); // 12.999→13 +2
  });
  it("rounds a half-cent total up, not one cent low", () => {
    expect(responseTotal([line({ qty: 1, unitPrice: 1.005 })])).toBe(1.01);
  });
  it("takes the longest line lead time", () => {
    expect(responseLeadTime([line({ leadTimeDays: 2 }), line({ leadTimeDays: 9 }), line({ leadTimeDays: 5 })])).toBe(9);
    expect(responseLeadTime([])).toBe(0);
  });
});

describe("rankResponses", () => {
  it("ranks lowest total first, lead time breaks ties", () => {
    const ranked = rankResponses([
      resp("B", 500, 2),
      resp("A", 500, 5), // same total as B, longer lead → ranks below B
      resp("C", 410, 10), // cheapest → rank 1
    ]);
    expect(ranked.map((r) => `${r.supplier}#${r.rank}`)).toEqual(["C#1", "B#2", "A#3"]);
  });

  it("does not mutate the input", () => {
    const input = [resp("B", 2, 1), resp("A", 1, 1)];
    rankResponses(input);
    expect(input.map((r) => r.supplier)).toEqual(["B", "A"]);
  });
});
