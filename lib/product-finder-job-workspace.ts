/**
 * Job (project) workspace model — a durable container that groups the quotes,
 * orders, and inbound RFQs for one jobsite under a single named project.
 *
 * Pure data + rollup helpers (fully testable); the server (`/api/jobs` over the
 * Neon-backed KvStore) owns persistence and `JobsModal` renders it. This is the
 * first server-persisted *entity* the app owns — quotes/orders still live in the
 * client store, so a Job links to them by a denormalized snapshot (kept durable
 * server-side, viewable across instances without the client store).
 *
 * (Distinct from `product-finder-jobs.ts`, which holds the Job *Wizard* BOM
 * templates — different concept, hence the `-job-workspace` filename.)
 */

export const JOB_STATUSES = ["open", "won", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  open: "Open",
  won: "Won",
  closed: "Closed",
};

/** Badge colors per status (Meridian palette; all pass WCAG on their bg). */
export const JOB_STATUS_COLOR: Record<JobStatus, { bg: string; text: string }> = {
  open: { bg: "#004986", text: "#FFFFFF" },
  won: { bg: "#00AA13", text: "#FFFFFF" },
  closed: { bg: "#B7C9D3", text: "#1D252D" },
};

export const JOB_ARTIFACT_KINDS = ["quote", "order", "rfq"] as const;
export type JobArtifactKind = (typeof JOB_ARTIFACT_KINDS)[number];

/**
 * A denormalized snapshot of a linked quote / order / RFQ. We snapshot (rather
 * than reference) so the job's rollup stays correct and durable server-side even
 * though the source quotes/orders live in the client store.
 */
export interface JobArtifact {
  kind: JobArtifactKind;
  /** Stable reference within its kind: quote number, order id, or RFQ quote number. */
  ref: string;
  label: string;
  /** Dollar value (quote/order total; 0 for an RFQ intake). */
  value: number;
  /** Source status at link time, e.g. a quote's "draft"/"sent"/"won". */
  status?: string;
  /** Linked-at epoch ms. */
  at: number;
}

export interface Job {
  id: string;
  /** Jobsite / project name. */
  name: string;
  customer: string;
  customerId: string | null;
  status: JobStatus;
  notes?: string;
  artifacts: JobArtifact[];
  createdAt: number;
  updatedAt: number;
}

export interface JobRollup {
  /** Sum of linked quote totals. */
  quotedValue: number;
  /** Sum of linked order totals (booked). */
  orderedValue: number;
  counts: Record<JobArtifactKind, number>;
  artifactCount: number;
}

/** Aggregate a job's linked artifacts into a value/count rollup. */
export function jobRollup(job: Pick<Job, "artifacts">): JobRollup {
  const counts: Record<JobArtifactKind, number> = { quote: 0, order: 0, rfq: 0 };
  let quotedValue = 0;
  let orderedValue = 0;
  for (const a of job.artifacts) {
    counts[a.kind] += 1;
    if (a.kind === "quote") quotedValue += a.value;
    else if (a.kind === "order") orderedValue += a.value;
  }
  return { quotedValue, orderedValue, counts, artifactCount: job.artifacts.length };
}

/**
 * Link (or re-link) an artifact, de-duplicating by (kind, ref) so re-adding the
 * same quote refreshes its snapshot instead of duplicating it. Returns a new Job.
 */
export function withArtifact(job: Job, artifact: JobArtifact): Job {
  const others = job.artifacts.filter((a) => !(a.kind === artifact.kind && a.ref === artifact.ref));
  // Monotonic: re-linking a stale-timestamped artifact must not move updatedAt backwards.
  return { ...job, artifacts: [...others, artifact], updatedAt: Math.max(job.updatedAt, artifact.at) };
}

/** Unlink an artifact by (kind, ref). Returns a new Job. */
export function removeArtifact(job: Job, kind: JobArtifactKind, ref: string, now: number): Job {
  return {
    ...job,
    artifacts: job.artifacts.filter((a) => !(a.kind === kind && a.ref === ref)),
    updatedAt: now,
  };
}

/** True if a (kind, ref) artifact is already linked to the job. */
export function hasArtifact(job: Pick<Job, "artifacts">, kind: JobArtifactKind, ref: string): boolean {
  return job.artifacts.some((a) => a.kind === kind && a.ref === ref);
}

/** Deterministic, URL-safe id from the name + creation time (no RNG, so it's testable). */
export function jobId(name: string, createdAt: number): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "job";
  return `job-${slug}-${createdAt}`;
}

/** Build a fresh Job (pure; caller supplies `now` so it stays deterministic in tests). */
export function newJob(input: {
  name: string;
  customer?: string;
  customerId?: string | null;
  notes?: string;
  now: number;
}): Job {
  return {
    id: jobId(input.name, input.now),
    name: input.name.trim(),
    customer: input.customer?.trim() || "—",
    customerId: input.customerId ?? null,
    status: "open",
    notes: input.notes?.trim() || undefined,
    artifacts: [],
    createdAt: input.now,
    updatedAt: input.now,
  };
}
