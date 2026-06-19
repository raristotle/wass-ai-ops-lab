import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { toCsv } from "@/lib/product-finder-csv";
import {
  AUDIT_CSV_HEADER,
  auditCsvRows,
  verifyAuditChain,
  type AuditEntry,
} from "@/lib/product-finder-audit";
import { recordAuditEvent, readAuditChain, auditSecret, auditSigned } from "@/lib/server/audit-log";

export const dynamic = "force-dynamic";

/**
 * Tamper-evident audit log (v4-S2 #5). Auth-gated + tenant-scoped (each tenant
 * has its own hash-chained log). $0, always-on (in-memory when POSTGRES_URL is
 * unset, durable when set).
 *
 *   POST  → append one event { actor, action, target, detail }
 *   GET   → { entries, verification, signed } (entries capped for display)
 *   GET ?verify=1   → { verification } only
 *   GET ?format=csv → full chain as a compliance CSV download
 */

const DISPLAY_LIMIT = 200;

const InputSchema = z.object({
  actor: z.string().trim().min(1).max(120),
  action: z.string().trim().min(1).max(60),
  target: z.string().trim().max(200).default(""),
  detail: z.string().trim().max(500).default(""),
});

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  const tenantId = tenantForRequest(req);
  const url = new URL(req.url);

  try {
    // Read the FULL chain (verification must run over the whole chain).
    const full = await readAuditChain(tenantId);
    const verification = verifyAuditChain(full, auditSecret());

    if (url.searchParams.get("verify") === "1") {
      return NextResponse.json({ verification, signed: auditSigned() });
    }

    if (url.searchParams.get("format") === "csv") {
      const csv = toCsv([AUDIT_CSV_HEADER, ...auditCsvRows(full)]);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="audit-log.csv"',
        },
      });
    }

    // Default: most-recent entries for display + whole-chain verification.
    const entries = full.length > DISPLAY_LIMIT ? full.slice(full.length - DISPLAY_LIMIT) : full;
    return NextResponse.json({ entries, verification, signed: auditSigned(), total: full.length });
  } catch (e) {
    logApiError("/api/audit GET", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  let input: z.infer<typeof InputSchema>;
  try {
    input = InputSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const entry: AuditEntry | null = await recordAuditEvent(tenantForRequest(req), { ...input, at: Date.now() });
    if (!entry) return NextResponse.json({ error: "Append failed" }, { status: 500 });
    return NextResponse.json({ ok: true, seq: entry.seq, hash: entry.hash });
  } catch (e) {
    logApiError("/api/audit POST", e);
    return NextResponse.json({ error: "Append failed" }, { status: 500 });
  }
}
