import { describe, it, expect, afterEach } from "vitest";
import {
  energyStarConfigured,
  parseEnergyStarRow,
  buildWhere,
} from "@/lib/integration/energy-star-live";

afterEach(() => {
  delete process.env.ENERGY_STAR_APP_TOKEN;
  delete process.env.ENERGY_STAR_DATASET;
});

describe("energy-star dormancy", () => {
  it("is dormant without the app token", () => {
    expect(energyStarConfigured()).toBe(false);
  });
  it("activates once the token is set", () => {
    process.env.ENERGY_STAR_APP_TOKEN = "t";
    expect(energyStarConfigured()).toBe(true);
  });
});

describe("parseEnergyStarRow", () => {
  it("normalizes brand/model + photometrics and marks certified", () => {
    const r = parseEnergyStarRow({
      brand_name: "Cree",
      model_number: "BR30-100W",
      brightness_lumens: "1100",
      energy_used_watts: "11",
      efficacy_lumens_watt: "100",
      light_appearance_kelvin: "2700",
      color_quality_cri: "90",
    });
    expect(r).toEqual({
      brand: "Cree",
      model: "BR30-100W",
      lumens: 1100,
      watts: 11,
      efficacy: 100,
      cct: 2700,
      cri: 90,
      upc: null,
      certified: true,
    });
  });
  it("yields nulls for missing numeric fields", () => {
    const r = parseEnergyStarRow({ brand_name: "X" });
    expect(r.lumens).toBeNull();
    expect(r.model).toBeNull();
    expect(r.certified).toBe(true);
  });
});

describe("buildWhere", () => {
  it("builds a model-only clause", () => {
    expect(buildWhere(undefined, "ABC")).toBe("model_number='ABC'");
  });
  it("adds a case-insensitive brand clause", () => {
    expect(buildWhere("Cree", "ABC")).toBe("model_number='ABC' AND upper(brand_name)=upper('Cree')");
  });
  it("escapes single quotes to prevent SoQL injection", () => {
    expect(buildWhere(undefined, "O'Brien")).toBe("model_number='O''Brien'");
  });
});
