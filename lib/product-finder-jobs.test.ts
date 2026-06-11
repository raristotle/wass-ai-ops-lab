import { describe, it, expect } from "vitest";
import { JOB_DEFS, jobById } from "@/lib/product-finder-jobs";
import { ALL_SUBCATEGORIES } from "@/lib/catalog/taxonomy";

describe("JOB_DEFS integrity", () => {
  it("has at least 4 job templates with unique ids", () => {
    expect(JOB_DEFS.length).toBeGreaterThanOrEqual(4);
    const ids = JOB_DEFS.map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every job has a title, icon, description, and 3+ steps", () => {
    for (const job of JOB_DEFS) {
      expect(job.title.length, job.id).toBeGreaterThan(0);
      expect(job.icon.length, job.id).toBeGreaterThan(0);
      expect(job.description.length, job.id).toBeGreaterThan(0);
      expect(job.steps.length, job.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("step ids are unique within each job", () => {
    for (const job of JOB_DEFS) {
      const ids = job.steps.map((s) => s.id);
      expect(new Set(ids).size, job.id).toBe(ids.length);
    }
  });

  it("every step subcategory exists in the catalog taxonomy", () => {
    const valid = new Set(ALL_SUBCATEGORIES);
    for (const job of JOB_DEFS) {
      for (const step of job.steps) {
        expect(valid.has(step.subcategory), `${job.id}/${step.id}: "${step.subcategory}"`).toBe(true);
      }
    }
  });

  it("every step has a positive default qty and a non-empty search query", () => {
    for (const job of JOB_DEFS) {
      for (const step of job.steps) {
        expect(step.defaultQty, `${job.id}/${step.id}`).toBeGreaterThanOrEqual(1);
        expect(step.searchQuery.trim().length, `${job.id}/${step.id}`).toBeGreaterThan(0);
        expect(step.label.trim().length, `${job.id}/${step.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("every job has at least one required (non-optional) step", () => {
    for (const job of JOB_DEFS) {
      expect(job.steps.some((s) => !s.optional), job.id).toBe(true);
    }
  });
});

describe("jobById", () => {
  it("resolves known ids and returns null for unknown", () => {
    expect(jobById("ev-charger-install")?.title).toContain("EV charger");
    expect(jobById("nope")).toBeNull();
  });
});
