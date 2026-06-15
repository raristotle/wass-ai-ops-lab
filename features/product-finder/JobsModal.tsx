"use client";

import { useCallback, useEffect, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import {
  jobRollup,
  withArtifact,
  removeArtifact,
  hasArtifact,
  newJob,
  JOB_STATUSES,
  JOB_STATUS_LABEL,
  JOB_STATUS_COLOR,
  type Job,
  type JobArtifact,
  type JobStatus,
} from "@/lib/product-finder-job-workspace";
import { cn } from "@/lib/utils";

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

/**
 * Job (project) workspace — create a job and link the rep's quotes/orders/RFQs
 * under one named project, with a value rollup. Server-persisted via /api/jobs
 * (Neon when configured); the quotes/orders themselves still come from the
 * client store, snapshotted into the job at link time.
 */
export function JobsModal() {
  const open = useProductFinder((s) => s.jobsOpen);
  const setOpen = useProductFinder((s) => s.setJobsOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));
  const quotes = useProductFinder((s) => s.quotes);
  const orders = useProductFinder((s) => s.orders);
  const customers = useProductFinder((s) => s.customers);
  const activeCustomerId = useProductFinder((s) => s.activeCustomerId);
  const activeCustomerName = customers.find((c) => c.id === activeCustomerId)?.name ?? "";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [backend, setBackend] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = (await res.json()) as { jobs?: Job[]; backend?: string };
      setJobs(data.jobs ?? []);
      setBackend(data.backend ?? "");
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setCustomer(activeCustomerName);
      void refresh();
    }
    // activeCustomerName intentionally read only on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refresh]);

  async function saveJob(job: Job): Promise<void> {
    setBusy(true);
    try {
      await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const job = newJob({
      name: trimmed,
      customer: customer.trim(),
      customerId: activeCustomerId,
      now: Date.now(),
    });
    setName("");
    await saveJob(job);
    setExpandedId(job.id);
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/jobs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function link(job: Job, artifact: JobArtifact) {
    void saveJob(withArtifact(job, artifact));
  }
  function unlink(job: Job, kind: JobArtifact["kind"], ref: string) {
    void saveJob(removeArtifact(job, kind, ref, Date.now()));
  }
  function setStatus(job: Job, status: JobStatus) {
    void saveJob({ ...job, status, updatedAt: Date.now() });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Job workspace"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Job workspace</h2>
            <p className="text-xs text-[#B7C9D3]">
              Group quotes, orders &amp; RFQs under one project.{" "}
              {backend === "postgres" ? (
                <span className="text-[#64CCC9]">Saved to the server.</span>
              ) : backend ? (
                <span className="text-[#EAAA00]">In-memory (per-instance) until a database is configured.</span>
              ) : null}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close job workspace"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Create */}
          <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-[#B7C9D3] bg-[#F8FAFB] p-3">
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[#1D252D]">
              New job / jobsite
              <input
                className="rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreate();
                }}
                placeholder="Acme Warehouse — Phase 2"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[#1D252D]">
              Customer
              <input
                className="rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Gulf Coast Industrial"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={busy || !name.trim()}
              className="rounded bg-[#00AA13] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#009911] disabled:opacity-50"
            >
              Create job
            </button>
          </div>

          {/* Jobs list */}
          {loading ? (
            <p className="py-6 text-center text-sm text-[#4F758B]">Loading jobs…</p>
          ) : jobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#4F758B]">
              No jobs yet — create one above, then link your quotes and orders to it.
            </p>
          ) : (
            <ul className="space-y-2">
              {jobs.map((job) => {
                const roll = jobRollup(job);
                const isOpen = expandedId === job.id;
                const sc = JOB_STATUS_COLOR[job.status];
                return (
                  <li key={job.id} className="rounded-lg border border-[#B7C9D3]/70">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : job.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[#F8FAFB]"
                    >
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: sc.bg, color: sc.text }}
                      >
                        {JOB_STATUS_LABEL[job.status]}
                      </span>
                      <span className="flex-1 truncate text-sm font-semibold text-[#1D252D]">
                        {job.name}
                        <span className="ml-1.5 font-normal text-[#4F758B]">· {job.customer}</span>
                      </span>
                      <span className="text-xs text-[#4F758B]">
                        {usd(roll.quotedValue)} quoted · {usd(roll.orderedValue)} booked
                      </span>
                      <span className="text-xs text-[#4F758B]" aria-hidden="true">
                        {isOpen ? "▾" : "▸"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#B7C9D3]/40 px-3 py-3">
                        {/* Rollup + status */}
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-[#4F758B]">
                          <span>{roll.counts.quote} quote{roll.counts.quote === 1 ? "" : "s"}</span>
                          <span>· {roll.counts.order} order{roll.counts.order === 1 ? "" : "s"}</span>
                          <span>· {roll.counts.rfq} RFQ{roll.counts.rfq === 1 ? "" : "s"}</span>
                          <span className="ml-auto flex items-center gap-1">
                            Status:
                            {JOB_STATUSES.map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setStatus(job, st)}
                                className={cn(
                                  "rounded-full border px-1.5 py-0.5 font-medium",
                                  job.status === st
                                    ? "border-[#1D252D] bg-[#1D252D] text-white"
                                    : "border-[#B7C9D3] text-[#4F758B] hover:border-[#4F758B]",
                                )}
                              >
                                {JOB_STATUS_LABEL[st]}
                              </button>
                            ))}
                          </span>
                        </div>

                        {/* Linked artifacts */}
                        {job.artifacts.length > 0 && (
                          <ul className="mb-3 space-y-1">
                            {job.artifacts.map((a) => (
                              <li
                                key={`${a.kind}:${a.ref}`}
                                className="flex items-center gap-2 rounded border border-[#B7C9D3]/50 px-2 py-1 text-xs"
                              >
                                <span className="rounded bg-[#B7C9D3]/40 px-1 py-0.5 text-[9px] font-bold uppercase text-[#1D252D]">
                                  {a.kind}
                                </span>
                                <span className="flex-1 truncate text-[#1D252D]">{a.label}</span>
                                {a.value > 0 && <span className="text-[#4F758B]">{usd(a.value)}</span>}
                                <button
                                  type="button"
                                  onClick={() => unlink(job, a.kind, a.ref)}
                                  aria-label={`Unlink ${a.label}`}
                                  className="text-[#DB6B30] hover:underline"
                                >
                                  Unlink
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Link picker */}
                        <LinkPicker job={job} quotes={quotes} orders={orders} onLink={link} />

                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDelete(job.id)}
                            className="text-[11px] text-[#DB6B30] hover:underline"
                          >
                            Delete job
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkPicker({
  job,
  quotes,
  orders,
  onLink,
}: {
  job: Job;
  quotes: { number: string; project: string; total: number; status: string }[];
  orders: { id: string; total: number; customerName: string | null; placedAt: number }[];
  onLink: (job: Job, artifact: JobArtifact) => void;
}) {
  const linkableQuotes = quotes.filter((q) => !hasArtifact(job, "quote", q.number));
  const linkableOrders = orders.filter((o) => !hasArtifact(job, "order", o.id));

  if (linkableQuotes.length === 0 && linkableOrders.length === 0) {
    return <p className="text-[11px] italic text-[#4F758B]">All your quotes and orders are linked to this job.</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-[#1D252D]">Link a quote or order</p>
      <div className="flex flex-wrap gap-1.5">
        {linkableQuotes.map((q) => (
          <button
            key={q.number}
            type="button"
            onClick={() =>
              onLink(job, {
                kind: "quote",
                ref: q.number,
                label: `${q.number} · ${q.project}`,
                value: q.total,
                status: q.status,
                at: Date.now(),
              })
            }
            className="rounded-full border border-[#004986]/40 px-2 py-0.5 text-[11px] font-medium text-[#004986] hover:bg-[#004986]/5"
          >
            ＋ {q.number}
          </button>
        ))}
        {linkableOrders.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() =>
              onLink(job, {
                kind: "order",
                ref: o.id,
                label: `Order ${o.id.slice(-6)}${o.customerName ? ` · ${o.customerName}` : ""}`,
                value: o.total,
                status: "placed",
                at: Date.now(),
              })
            }
            className="rounded-full border border-[#00573F]/40 px-2 py-0.5 text-[11px] font-medium text-[#00573F] hover:bg-[#00573F]/5"
          >
            ＋ Order {o.id.slice(-6)}
          </button>
        ))}
      </div>
    </div>
  );
}
