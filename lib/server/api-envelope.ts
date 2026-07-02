import { NextResponse } from "next/server";

/**
 * B16 — MCP / punchout API ergonomics.
 *
 * A stable, typed error envelope and opaque cursor pagination so the MCP server and punchout
 * consumers can branch on machine-readable codes and page deterministically. BACKWARD-COMPATIBLE:
 * error bodies keep their human `error` string (existing UI consumers are unaffected) and merely gain
 * a `code`; list responses keep their array and merely gain a `nextCursor` that is simply absent on
 * the last page.
 */

/** Stable machine-branchable error codes. */
export type ApiErrorCode =
  | "invalid_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "payload_too_large"
  | "internal";

export interface ApiErrorBody {
  /** Human-readable message — kept as `error` for backward-compat with existing clients. */
  error: string;
  /** Stable machine code — MCP / punchout clients branch on this. */
  code: ApiErrorCode;
  /** Present on retryable errors (e.g. rate limits) — ms to wait before retrying. */
  retryAfterMs?: number;
}

/** A typed JSON error response. Keeps the `error` string so existing consumers keep working. */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  opts?: { retryAfterMs?: number; headers?: Record<string, string> },
): NextResponse {
  const body: ApiErrorBody = { error: message, code };
  if (opts?.retryAfterMs !== undefined) body.retryAfterMs = opts.retryAfterMs;
  return NextResponse.json(body, { status, headers: opts?.headers });
}

// ── Opaque cursor pagination ─────────────────────────────────────────────────
// A cursor is an opaque base64url token the client only ever echoes back — internally a 1-based page
// number, so it is stateless and any instance can resume. Malformed/absent cursors resolve to page 1.

export function encodeCursor(page: number): string {
  return Buffer.from(String(Math.max(1, Math.floor(page)))).toString("base64url");
}

export function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 1;
  try {
    const n = Number(Buffer.from(cursor, "base64url").toString("utf8"));
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  } catch {
    return 1;
  }
}

/** The cursor for the NEXT page of an offset-paged result — undefined when this is the last page. */
export function nextCursor(page: number, pageSize: number, total: number): string | undefined {
  return pageSize > 0 && page * pageSize < total ? encodeCursor(page + 1) : undefined;
}
