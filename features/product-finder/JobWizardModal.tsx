"use client";

import { useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { JOB_DEFS, jobById, type JobDef, type JobStep } from "@/lib/product-finder-jobs";
import { apiSearch } from "@/lib/product-finder-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogProduct, FilterState } from "@/features/product-finder/types";

// ─── Per-step pick state ──────────────────────────────────────────────────────

interface StepPick {
  loading: boolean;
  product: CatalogProduct | null;
  alternates: CatalogProduct[];
  qty: number;
  included: boolean;
}

/** Resolve a step against the live catalog: query + subcategory, stock-sorted. */
async function resolveStep(step: JobStep): Promise<CatalogProduct[]> {
  const filters: FilterState = {
    query: step.searchQuery,
    categories: new Set(),
    subcategories: new Set([step.subcategory]),
    brands: new Set(),
    onlyBranchStock: false,
    onlyDCStock: false,
    onlyPreferred: false,
    onlyActive: false,
    priceMin: null,
    priceMax: null,
    sortKey: "branchStock",
    viewMode: "list",
    specFilters: {},
    specRanges: {},
  };
  try {
    const res = await apiSearch(filters, 0, 3);
    return res.items;
  } catch {
    return [];
  }
}

function inStockAtBranch(product: CatalogProduct): boolean {
  return product.branchStock.some((b) => b.quantity > 0);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function JobWizardModal() {
  const open = useProductFinder((s) => s.jobWizardOpen);
  const setOpen = useProductFinder((s) => s.setJobWizardOpen);
  const addToCart = useProductFinder((s) => s.addToCart);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);

  const [jobId, setJobId] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, StepPick>>({});
  const [added, setAdded] = useState(false);

  if (!open) return null;

  const job: JobDef | null = jobId ? jobById(jobId) : null;

  function reset() {
    setJobId(null);
    setPicks({});
    setAdded(false);
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  function handlePickJob(def: JobDef) {
    setJobId(def.id);
    setAdded(false);
    const initial: Record<string, StepPick> = {};
    for (const step of def.steps) {
      initial[step.id] = {
        loading: true,
        product: null,
        alternates: [],
        qty: step.defaultQty,
        included: !step.optional,
      };
    }
    setPicks(initial);
    // Resolve all steps concurrently; each updates its own slot on arrival.
    for (const step of def.steps) {
      resolveStep(step).then((items) => {
        setPicks((prev) => {
          const slot = prev[step.id];
          if (!slot) return prev; // wizard was reset/closed mid-flight
          return {
            ...prev,
            [step.id]: {
              ...slot,
              loading: false,
              product: items[0] ?? null,
              alternates: items.slice(1, 3),
            },
          };
        });
      });
    }
  }

  function updatePick(stepId: string, patch: Partial<StepPick>) {
    setPicks((prev) => ({ ...prev, [stepId]: { ...prev[stepId], ...patch } }));
    setAdded(false);
  }

  function handleSwap(stepId: string, alt: CatalogProduct) {
    setPicks((prev) => {
      const slot = prev[stepId];
      if (!slot.product) return prev;
      return {
        ...prev,
        [stepId]: {
          ...slot,
          product: alt,
          alternates: [...slot.alternates.filter((a) => a.id !== alt.id), slot.product],
        },
      };
    });
    setAdded(false);
  }

  const resolvedPicks = job
    ? job.steps
        .map((step) => ({ step, pick: picks[step.id] }))
        .filter((x) => x.pick !== undefined)
    : [];
  const includedPicks = resolvedPicks.filter((x) => x.pick.included && x.pick.product !== null);
  const anyLoading = resolvedPicks.some((x) => x.pick.loading);
  const estimatedTotal = includedPicks.reduce(
    (sum, x) => sum + (x.pick.product?.unitPrice ?? 0) * x.pick.qty,
    0
  );

  function handleAddAll() {
    for (const { pick } of includedPicks) {
      if (pick.product) addToCart(pick.product, pick.qty);
    }
    setAdded(true);
    setTimeout(() => {
      handleClose();
      setCartOpen(true);
    }, 700);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Ask Meridian — Job Wizard"
      tabIndex={-1}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between rounded-t-xl bg-[#1D252D] px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white [font-family:var(--font-titillium,'Arial_Bold',sans-serif)]">
              <span aria-hidden="true">🧰</span> Ask Meridian — Job Wizard
              <span className="inline-flex items-center rounded-full bg-[#00AA13] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                AI
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-[#B7C9D3]">
              Describe the job by picking it — get a stocked, priced bill of materials in one pass.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/70 transition-colors hover:text-white"
            aria-label="Close job wizard"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {!job ? (
            <>
              <p className="text-sm text-[#1D252D]">What are you building today?</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {JOB_DEFS.map((def) => (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => handlePickJob(def)}
                    className="rounded-xl border border-[#B7C9D3] bg-white p-4 text-left transition-colors hover:border-[#00AA13] hover:bg-[#00AA13]/5"
                  >
                    <p className="flex items-center gap-2 text-sm font-bold text-[#1D252D]">
                      <span className="text-xl" aria-hidden="true">{def.icon}</span>
                      {def.title}
                    </p>
                    <p className="mt-1 text-xs text-[#4F758B]">{def.description}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#00573F]">
                      {def.steps.length} steps
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] italic text-[#4F758B]">
                Deterministic recommendations from your catalog — branch stock preferred. The
                conversational version of Ask Meridian is on the roadmap.
              </p>
            </>
          ) : (
            <>
              {/* Selected job header + back */}
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-bold text-[#1D252D]">
                  <span className="text-xl" aria-hidden="true">{job.icon}</span>
                  {job.title}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-[#4F758B] underline underline-offset-2 hover:text-[#1D252D]"
                >
                  ← Pick a different job
                </button>
              </div>

              {/* Steps */}
              <ul className="space-y-2">
                {resolvedPicks.map(({ step, pick }) => (
                  <li
                    key={step.id}
                    className={cn(
                      "rounded-lg border bg-white px-3 py-2.5 transition-opacity",
                      pick.included ? "border-[#B7C9D3]" : "border-[#B7C9D3]/50 opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={pick.included}
                        onChange={(e) => updatePick(step.id, { included: e.target.checked })}
                        className="mt-1 h-4 w-4 accent-[#00AA13]"
                        aria-label={`Include ${step.label}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1D252D]">
                          {step.label}
                          {step.optional && (
                            <span className="ml-1.5 rounded bg-[#B7C9D3]/40 px-1 text-[8px] font-semibold uppercase tracking-wide text-[#4F758B]">
                              optional
                            </span>
                          )}
                        </p>
                        {step.note && (
                          <p className="text-[10px] italic text-[#00573F]">{step.note}</p>
                        )}

                        {pick.loading ? (
                          <p className="mt-1 text-xs text-[#4F758B]">Finding the right product…</p>
                        ) : pick.product ? (
                          <div className="mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg leading-none" aria-hidden="true">
                                {pick.product.imageIcon}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-[#1D252D]">
                                  {pick.product.name}
                                </p>
                                <p className="truncate text-[10px] text-[#4F758B]">
                                  {pick.product.brand} · ${pick.product.unitPrice.toFixed(2)}/{pick.product.uom}
                                  {inStockAtBranch(pick.product) ? (
                                    <span className="ml-1 font-semibold text-[#00AA13]">in stock</span>
                                  ) : (
                                    <span className="ml-1 text-[#EAAA00]">check availability</span>
                                  )}
                                </p>
                              </div>
                              {/* Qty stepper */}
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updatePick(step.id, { qty: Math.max(1, pick.qty - 1) })}
                                  className="flex h-6 w-6 items-center justify-center rounded border border-[#B7C9D3] text-xs font-semibold text-[#1D252D] hover:border-[#4F758B]"
                                  aria-label={`Decrease quantity for ${step.label}`}
                                >
                                  −
                                </button>
                                <span className="min-w-[1.75rem] text-center text-xs font-semibold text-[#1D252D]">
                                  {pick.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updatePick(step.id, { qty: pick.qty + 1 })}
                                  className="flex h-6 w-6 items-center justify-center rounded border border-[#B7C9D3] text-xs font-semibold text-[#1D252D] hover:border-[#4F758B]"
                                  aria-label={`Increase quantity for ${step.label}`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            {pick.alternates.length > 0 && (
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-7">
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-[#4F758B]">
                                  or:
                                </span>
                                {pick.alternates.map((alt) => (
                                  <button
                                    key={alt.id}
                                    type="button"
                                    onClick={() => handleSwap(step.id, alt)}
                                    className="max-w-[16rem] truncate rounded border border-[#B7C9D3] px-1.5 py-0.5 text-[10px] text-[#4F758B] transition-colors hover:border-[#00AA13] hover:text-[#00573F]"
                                    title={`Use ${alt.name}`}
                                  >
                                    {alt.name} · ${alt.unitPrice.toFixed(2)}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-[#DB6B30]">
                            No match in the catalog — search manually for this one.
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {job && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-[#B7C9D3]/60 bg-gray-50 px-6 py-4">
            <p className="text-sm text-[#4F758B]">
              {includedPicks.length} of {resolvedPicks.length} steps included ·{" "}
              <span className="font-bold text-[#1D252D]">est. ${estimatedTotal.toFixed(2)}</span>
              <span className="ml-1 text-[10px]">(list — contract/volume pricing applies in the basket)</span>
            </p>
            <Button
              type="button"
              onClick={handleAddAll}
              disabled={anyLoading || includedPicks.length === 0 || added}
              className={cn(
                "bg-[#00AA13] text-sm text-white hover:bg-[#009911]",
                (anyLoading || includedPicks.length === 0 || added) && "cursor-not-allowed opacity-50"
              )}
            >
              {added ? "✓ Added to basket" : anyLoading ? "Resolving picks…" : `Add ${includedPicks.length} items to basket`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
