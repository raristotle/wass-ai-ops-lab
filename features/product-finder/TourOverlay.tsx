"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProductFinder } from "@/lib/product-finder-store";
import { TOUR_STEPS, type TourAction } from "@/lib/product-finder-tour-content";
import { cn } from "@/lib/utils";

/**
 * Guided-tour card. Non-blocking: fixed bottom-right, no backdrop, never traps
 * focus — the app stays fully usable while the tour is open, so "try it"
 * actions can run searches, open the cart, or navigate without closing it.
 *
 * Auto-opens once per browser for signed-in users (pf_tour_seen flag; written
 * by startTour/closeTour in the store).
 */
export function TourOverlay() {
  const tourOpen = useProductFinder((s) => s.tourOpen);
  const tourStep = useProductFinder((s) => s.tourStep);
  const user = useProductFinder((s) => s.user);
  const startTour = useProductFinder((s) => s.startTour);
  const setTourStep = useProductFinder((s) => s.setTourStep);
  const closeTour = useProductFinder((s) => s.closeTour);
  const runNlSearch = useProductFinder((s) => s.runNlSearch);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const setJobWizardOpen = useProductFinder((s) => s.setJobWizardOpen);
  const router = useRouter();

  // ── Auto-open: first-ever visit (per browser), signed-in users only ────────
  const didAutoOpen = useRef(false);
  useEffect(() => {
    if (didAutoOpen.current) return;
    if (typeof localStorage === "undefined") return;
    if (!user) return;
    didAutoOpen.current = true;
    if (!localStorage.getItem("pf_tour_seen")) startTour();
  }, [user, startTour]);

  // ── Escape closes while open ────────────────────────────────────────────────
  useEffect(() => {
    if (!tourOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeTour();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourOpen, closeTour]);

  if (!tourOpen) return null;

  const stepIndex = Math.min(Math.max(tourStep, 0), TOUR_STEPS.length - 1);
  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const showAction =
    step.action !== undefined &&
    (!step.actionRoles || (user !== null && step.actionRoles.includes(user.role)));

  function runAction(action: TourAction) {
    // The card stays open after every action — it's a side-by-side guide.
    if (action.kind === "nlSearch") {
      runNlSearch(action.query);
    } else if (action.kind === "openCart") {
      setCartOpen(true);
    } else if (action.kind === "openJobWizard") {
      setJobWizardOpen(true);
    } else {
      router.push(action.href);
    }
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-80 overflow-hidden rounded-xl bg-white shadow-2xl print:hidden"
      role="dialog"
      aria-label={`Tour step ${stepIndex + 1} of ${TOUR_STEPS.length}: ${step.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 bg-[#1D252D] px-4 py-3">
        <h2 className="text-sm font-bold text-white [font-family:var(--font-titillium,'Arial_Bold',sans-serif)]">
          {step.title}
        </h2>
        <button
          type="button"
          onClick={closeTour}
          className="flex shrink-0 items-center gap-1 text-xs text-[#B7C9D3] transition-colors hover:text-white"
          aria-label="Skip tour"
        >
          Skip tour <span aria-hidden="true">✕</span>
        </button>
      </div>

      {/* Body */}
      <div className="max-h-64 space-y-1.5 overflow-y-auto px-4 py-3">
        {step.body.map((line, i) =>
          line.startsWith("• ") ? (
            <p key={i} className="flex gap-1.5 text-xs leading-relaxed text-[#1D252D]">
              <span className="text-[#00AA13]" aria-hidden="true">•</span>
              <span>{line.slice(2)}</span>
            </p>
          ) : (
            <p key={i} className="text-xs leading-relaxed text-[#1D252D]">
              {line}
            </p>
          ),
        )}

        {showAction && step.action && (
          <button
            type="button"
            onClick={() => runAction(step.action as TourAction)}
            className="mt-1.5 rounded bg-[#00AA13] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#009911]"
          >
            ▶ {step.action.label}
          </button>
        )}
      </div>

      {/* Footer: step dots + Back / Next */}
      <div className="flex items-center justify-between border-t border-[#B7C9D3]/60 px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                i === stepIndex ? "bg-[#00AA13]" : "bg-[#B7C9D3]",
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTourStep(stepIndex - 1)}
            disabled={stepIndex === 0}
            className="rounded border border-[#B7C9D3] px-2.5 py-1 text-xs font-semibold text-[#4F758B] transition-colors hover:border-[#1D252D] hover:text-[#1D252D] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => (isLast ? closeTour() : setTourStep(stepIndex + 1))}
            className="rounded bg-[#1D252D] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#2d3a47]"
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
