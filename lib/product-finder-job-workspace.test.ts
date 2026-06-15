import { describe, it, expect } from "vitest";
import {
  newJob,
  jobId,
  jobRollup,
  withArtifact,
  removeArtifact,
  hasArtifact,
  type JobArtifact,
} from "@/lib/product-finder-job-workspace";

const quote = (ref: string, value: number, at = 1): JobArtifact => ({
  kind: "quote",
  ref,
  label: ref,
  value,
  status: "draft",
  at,
});

describe("newJob / jobId", () => {
  it("slugs the name into a deterministic id and defaults to open/empty", () => {
    const j = newJob({ name: "Acme Warehouse Fit-out!", now: 1000 });
    expect(j.id).toBe("job-acme-warehouse-fit-out-1000");
    expect(j.status).toBe("open");
    expect(j.artifacts).toEqual([]);
    expect(j.customer).toBe("—");
    expect(j.customerId).toBeNull();
  });

  it("falls back to 'job' for a name with no alphanumerics", () => {
    expect(jobId("###", 5)).toBe("job-job-5");
  });
});

describe("jobRollup", () => {
  it("sums quote vs order value and counts per kind", () => {
    const job = {
      artifacts: [
        quote("Q-1", 100),
        quote("Q-2", 250),
        { kind: "order", ref: "O-1", label: "O-1", value: 500, at: 2 } as JobArtifact,
        { kind: "rfq", ref: "R-1", label: "R-1", value: 0, at: 3 } as JobArtifact,
      ],
    };
    const r = jobRollup(job);
    expect(r.quotedValue).toBe(350);
    expect(r.orderedValue).toBe(500);
    expect(r.counts).toEqual({ quote: 2, order: 1, rfq: 1 });
    expect(r.artifactCount).toBe(4);
  });

  it("is all-zero for an empty job", () => {
    expect(jobRollup({ artifacts: [] })).toEqual({
      quotedValue: 0,
      orderedValue: 0,
      counts: { quote: 0, order: 0, rfq: 0 },
      artifactCount: 0,
    });
  });
});

describe("withArtifact / removeArtifact / hasArtifact", () => {
  it("links an artifact and bumps updatedAt", () => {
    const job = newJob({ name: "Job", now: 1 });
    const next = withArtifact(job, quote("Q-1", 100, 42));
    expect(next.artifacts).toHaveLength(1);
    expect(next.updatedAt).toBe(42);
    expect(hasArtifact(next, "quote", "Q-1")).toBe(true);
  });

  it("de-dupes by (kind, ref) — re-linking refreshes the snapshot, no duplicate", () => {
    let job = newJob({ name: "Job", now: 1 });
    job = withArtifact(job, quote("Q-1", 100, 2));
    job = withArtifact(job, quote("Q-1", 175, 9)); // same ref, new value
    expect(job.artifacts).toHaveLength(1);
    expect(jobRollup(job).quotedValue).toBe(175);
    expect(job.updatedAt).toBe(9);
  });

  it("does not collide across kinds with the same ref", () => {
    let job = newJob({ name: "Job", now: 1 });
    job = withArtifact(job, quote("X", 100, 2));
    job = withArtifact(job, { kind: "order", ref: "X", label: "X", value: 50, at: 3 });
    expect(job.artifacts).toHaveLength(2);
  });

  it("removes only the targeted artifact", () => {
    let job = newJob({ name: "Job", now: 1 });
    job = withArtifact(job, quote("Q-1", 100, 2));
    job = withArtifact(job, quote("Q-2", 200, 3));
    job = removeArtifact(job, "quote", "Q-1", 10);
    expect(job.artifacts.map((a) => a.ref)).toEqual(["Q-2"]);
    expect(hasArtifact(job, "quote", "Q-1")).toBe(false);
    expect(job.updatedAt).toBe(10);
  });
});
