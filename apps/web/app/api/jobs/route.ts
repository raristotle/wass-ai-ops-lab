import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/server/persistence";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";

export const dynamic = "force-dynamic";

// Server-persisted Job (project) workspace — the first durable entity the app
// owns. Persists to Neon Postgres when configured, per-instance memory otherwise.
// The route stays thin: the Job model + rollup logic live in the pure lib
// (lib/product-finder-job-workspace.ts); here we validate and store.
const NS = "jobs";

const ArtifactSchema = z.object({
  kind: z.enum(["quote", "order", "rfq"]),
  ref: z.string().trim().min(1).max(80),
  label: z.string().trim().max(160),
  value: z.number().nonnegative().max(1_000_000_000),
  status: z.string().trim().max(40).optional(),
  at: z.number().int().positive(),
});

const JobSchema = z.object({
  // Constrained charset so the store key is predictable + renderable (matches the
  // slug discipline of the other entities); jobId() produces ids in this set.
  id: z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._-]+$/),
  name: z.string().trim().min(1).max(120),
  customer: z.string().trim().max(120),
  customerId: z.string().trim().max(120).nullable(),
  status: z.enum(["open", "won", "closed"]),
  notes: z.string().trim().max(2000).optional(),
  artifacts: z.array(ArtifactSchema).max(200),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

type Job = z.infer<typeof JobSchema>;

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const store = getStore();
    const id = new URL(req.url).searchParams.get("id");
    if (id) {
      const job = await store.get<Job>(NS, id);
      return NextResponse.json({ backend: store.backend, job });
    }
    const jobs = await store.list<Job>(NS, { limit: 500 });
    jobs.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return NextResponse.json({ backend: store.backend, count: jobs.length, jobs });
  } catch (e) {
    logApiError("/api/jobs:GET", e);
    return NextResponse.json({ backend: "unknown", count: 0, jobs: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const parsed = JobSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
    const store = getStore();
    await store.put(NS, parsed.data.id, parsed.data);
    return NextResponse.json({ ok: true, id: parsed.data.id, persisted: store.backend });
  } catch (e) {
    logApiError("/api/jobs:POST", e);
    return NextResponse.json({ error: "Could not save the job." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
    const store = getStore();
    await store.delete(NS, id);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    logApiError("/api/jobs:DELETE", e);
    return NextResponse.json({ error: "Could not delete the job." }, { status: 400 });
  }
}
