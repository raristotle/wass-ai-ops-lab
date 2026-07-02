import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { getStore } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import {
  LINKROT_NS,
  LINKROT_STATUS_KEY,
  LINKROT_CURSOR_KEY,
  datasheetUrls,
  selectSweepBatch,
  mergeStatuses,
  type LinkStatus,
  type LinkStatusMap,
} from "@/lib/product-finder-linkrot";

export const dynamic = "force-dynamic";
// The batch is time-boxed, but give the whole sweep headroom in case a few HEAD checks run slow.
export const maxDuration = 60;

const BATCH = 40; // datasheet URLs checked per invocation (round-robin across the full set over time)
const PER_URL_TIMEOUT_MS = 5000;

/**
 * B14 — Datasheet link-rot sweep. DORMANT until you set CRON_SECRET and register the Vercel cron:
 *
 *   vercel.json →  "crons": [{ "path": "/api/datasheets/sweep", "schedule": "0 6 * * *" }]
 *   Env         →  CRON_SECRET=<random>   (Vercel Cron sends it as `Authorization: Bearer <secret>`)
 *
 * Each run HEAD-checks the next BATCH datasheet URLs (round-robin over the ~9K in the catalog),
 * records ok/dead in the durable KvStore, and advances a cursor — so the whole set is covered over
 * successive runs, each one small and time-boxed. $0 (HEAD requests + the existing store).
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // no secret configured → feature is dormant
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function headStatus(url: string): Promise<LinkStatus> {
  const checkedAtIso = new Date().toISOString();
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(PER_URL_TIMEOUT_MS) });
    // Flag a link dead ONLY on a definitively-gone code (404/410). A 5xx, a 405 "method not allowed",
    // or a timeout could be transient/server quirks — never raise a false "outdated" alarm on those.
    const ok = !(res.status === 404 || res.status === 410);
    return { ok, code: res.status, checkedAtIso };
  } catch {
    return { ok: true, code: 0, checkedAtIso }; // network error/timeout → treated as reachable-unknown
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    // 200 {enabled:false} when dormant (no secret); 401 when a secret exists but the caller lacks it.
    return NextResponse.json({ enabled: false }, { status: process.env.CRON_SECRET ? 401 : 200 });
  }
  try {
    const store = getStore();
    const urls = datasheetUrls(getCatalog().products);
    const cursor = (await store.get<number>(LINKROT_NS, LINKROT_CURSOR_KEY)) ?? 0;
    const { batch, nextCursor } = selectSweepBatch(urls, cursor, BATCH);

    const fresh: LinkStatusMap = {};
    await Promise.all(
      batch.map(async (u) => {
        fresh[u] = await headStatus(u);
      }),
    );
    const prev = await store.get<LinkStatusMap>(LINKROT_NS, LINKROT_STATUS_KEY);
    await store.put(LINKROT_NS, LINKROT_STATUS_KEY, mergeStatuses(prev, fresh));
    await store.put(LINKROT_NS, LINKROT_CURSOR_KEY, nextCursor);

    return NextResponse.json({
      enabled: true,
      totalUrls: urls.length,
      checked: batch.length,
      deadInBatch: Object.values(fresh).filter((s) => !s.ok).length,
      nextCursor,
      durable: store.backend === "postgres",
    });
  } catch (e) {
    logApiError("/api/datasheets/sweep", e);
    return NextResponse.json({ error: "sweep failed" }, { status: 500 });
  }
}
