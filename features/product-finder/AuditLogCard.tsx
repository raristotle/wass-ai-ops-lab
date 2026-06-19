"use client";

import { useEffect, useState } from "react";
import { downloadCsv } from "@/lib/product-finder-csv";
import type { AuditEntry, ChainVerification } from "@/lib/product-finder-audit";

/**
 * Tamper-evident audit log (v4-S2 #5) — SOC2/compliance-readiness card. Shows the
 * most recent hash-chained activity entries, a live integrity-verification badge,
 * and a CSV export of the full chain. The chain itself is built server-side
 * (HMAC-keyed); this card only reads + renders. Hidden when the chain is empty.
 */

interface AuditResponse {
  entries: AuditEntry[];
  verification: ChainVerification;
  signed: boolean;
  total: number;
}

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function AuditLogCard() {
  const [data, setData] = useState<AuditResponse | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/audit")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AuditResponse | null) => {
        if (alive && d && Array.isArray(d.entries)) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!data || data.total === 0) return null;

  async function exportCsv() {
    try {
      const res = await fetch("/api/audit?format=csv");
      if (!res.ok) return;
      downloadCsv("audit-log.csv", await res.text());
    } catch {
      // best-effort
    }
  }

  const intact = data.verification.valid;
  const recent = [...data.entries].reverse(); // newest first for display

  return (
    <section aria-label="Audit log" className="rounded-xl border border-[#004986]/30 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#1D252D]">
          Audit Log
          <span className="ml-1 text-xs font-normal text-[#4F758B]">(tamper-evident activity)</span>
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: intact ? "#00AA13" : "#DB6B30",
              color: "#FFFFFF",
            }}
            title={
              intact
                ? `Hash chain verified across ${data.verification.length} entries`
                : `Integrity check failed at entry #${data.verification.brokenAt}`
            }
          >
            {intact ? "✓ Chain verified" : `✗ Broken @ #${data.verification.brokenAt}`}
          </span>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-md border border-[#4F758B] px-2.5 py-1 text-xs font-semibold text-[#4F758B] transition-colors hover:border-[#1D252D] hover:text-[#1D252D]"
          >
            Export (CSV)
          </button>
        </div>
      </div>

      <p className="mb-2 text-[11px] text-[#4F758B]">
        {data.total} entr{data.total === 1 ? "y" : "ies"} ·{" "}
        {data.signed ? "HMAC-signed (production key)" : "dev signing key — set AUDIT_SECRET for production tamper-evidence"}
      </p>

      <ul className="divide-y divide-[#B7C9D3]/40">
        {recent.slice(0, 12).map((e) => (
          <li key={e.seq} className="flex items-start gap-3 py-1.5 text-xs">
            <span className="w-8 shrink-0 font-mono text-[#B7C9D3]">#{e.seq}</span>
            <span className="min-w-0 flex-1">
              <span className="block">
                <span className="font-semibold text-[#1D252D]">{e.action}</span>
                <span className="text-[#4F758B]"> · {e.target || "—"}</span>
              </span>
              <span className="block truncate text-[10px] text-[#4F758B]">
                {fmtTime(e.at)} · {e.actor}
                {e.detail ? ` · ${e.detail}` : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[10px] italic text-[#4F758B]">
        Each entry chains to the previous via an HMAC hash — any insertion, deletion, or edit
        breaks verification. Export the full chain for compliance review.
      </p>
    </section>
  );
}
