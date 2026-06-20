import { describe, it, expect } from "vitest";
import {
  contractForCustomer,
  isOnContract,
  contractPrice,
  annotateContract,
  contractCoverage,
  DEMO_CONTRACTS,
} from "@/lib/product-finder-contract";

const gulf = DEMO_CONTRACTS.find((c) => c.customer === "Gulf Coast Industrial")!;

describe("contractForCustomer", () => {
  it("resolves a customer name case-insensitively, else null", () => {
    expect(contractForCustomer("gulf coast industrial")?.id).toBe("C-GULF-2026");
    expect(contractForCustomer("Nobody Inc")).toBeNull();
    expect(contractForCustomer(null)).toBeNull();
  });
});

describe("isOnContract / contractPrice", () => {
  it("matches by family and applies the discount", () => {
    const breaker = { sku: "CB-1", subcategory: "Circuit Breakers" };
    expect(isOnContract(breaker, gulf)).toBe(true);
    expect(contractPrice(100, breaker, gulf)).toBe(92); // 8% off
  });
  it("leaves off-contract families at list", () => {
    const glove = { sku: "GL-1", subcategory: "Gloves" };
    expect(isOnContract(glove, gulf)).toBe(false);
    expect(contractPrice(100, glove, gulf)).toBe(100);
  });
  it("matches an explicitly-listed SKU regardless of family", () => {
    const c = { ...gulf, contractedSkus: ["SPECIAL-1"] };
    expect(isOnContract({ sku: "SPECIAL-1", subcategory: "Gloves" }, c)).toBe(true);
  });
  it("no contract → never on contract, list price", () => {
    expect(isOnContract({ sku: "X", subcategory: "Circuit Breakers" }, null)).toBe(false);
    expect(contractPrice(50, { sku: "X", subcategory: "Circuit Breakers" }, null)).toBe(50);
  });
});

describe("annotateContract", () => {
  it("puts on-contract items first, stable within groups", () => {
    const items = [
      { sku: "G", subcategory: "Gloves" },
      { sku: "B", subcategory: "Circuit Breakers" },
      { sku: "W", subcategory: "Wire & Cable" },
    ];
    const out = annotateContract(items, gulf);
    expect(out.map((a) => a.item.sku)).toEqual(["B", "W", "G"]);
    expect(out[0].onContract).toBe(true);
    expect(out[2].onContract).toBe(false);
  });
});

describe("contractCoverage", () => {
  it("measures on-contract share and savings", () => {
    const lines = [
      { product: { sku: "B", subcategory: "Circuit Breakers", unitPrice: 100 }, qty: 10 },
      { product: { sku: "G", subcategory: "Gloves", unitPrice: 5 }, qty: 1 },
    ];
    const cov = contractCoverage(lines, gulf);
    expect(cov.onContractLines).toBe(1);
    expect(cov.totalLines).toBe(2);
    expect(cov.coveragePct).toBe(50);
    expect(cov.contractSavings).toBe(80); // (100-92)*10
  });
  it("empty cart → zeros", () => {
    expect(contractCoverage([], gulf)).toEqual({ onContractLines: 0, totalLines: 0, coveragePct: 0, contractSavings: 0 });
  });
});
