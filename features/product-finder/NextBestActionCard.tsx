"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProductFinder } from "@/lib/product-finder-store";
import { nextBestActions, type NbaKind, type NbaTarget } from "@/lib/product-finder-next-best-actions";
import { subcategoryShareQuery } from "@/lib/product-finder-url";

/**
 * Rep next-best-action / coaching (v4-S2 #8) — a single prioritized "do this
 * next" list over the shipped pipeline/health/rebate/forecast analytics. $0,
 * deterministic. Each action deep-links to where the rep acts. Hidden when the
 * only candidate is the always-on seasonal nudge and nothing else is pending.
 */

const ICON: Record<NbaKind, string> = {
  "answer-counter": "↩️",
  "approve-margin": "🔏",
  "follow-up-stale": "⏰",
  "reach-out-at-risk": "📞",
  "claim-rebate": "💰",
  "stock-up": "📈",
  "run-promo": "🎯",
};

export function NextBestActionCard() {
  const quotes = useProductFinder((s) => s.quotes);
  const orders = useProductFinder((s) => s.orders);
  const customers = useProductFinder((s) => s.customers);
  const openCartAt = useProductFinder((s) => s.openCartAt);
  const setActiveCustomer = useProductFinder((s) => s.setActiveCustomer);
  const router = useRouter();

  const now = useMemo(() => Date.now(), []);
  const result = useMemo(
    () => nextBestActions({ quotes, orders, customers, now }),
    [quotes, orders, customers, now],
  );

  // Don't take up space when the only thing to show is the seasonal nudge.
  const actionable = result.actions.filter((a) => a.kind !== "run-promo");
  if (actionable.length === 0) return null;

  function go(target: NbaTarget) {
    switch (target.kind) {
      case "quotes":
        openCartAt("quotes", target.status ? { quoteStatus: target.status } : undefined);
        break;
      case "orders":
        setActiveCustomer(target.customerId ?? null);
        openCartAt("orders");
        break;
      case "card":
        // Rebates live on won quotes (and the SPA card below).
        openCartAt("quotes", { quoteStatus: "won" });
        break;
      case "search":
        router.push("/product-finder?" + subcategoryShareQuery(target.query));
        break;
    }
  }

  return (
    <section
      aria-label="Next best actions"
      className="rounded-xl border border-[#00AA13]/40 bg-[#00AA13]/5 p-4"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#1D252D]">
          Next Best Actions
          <span className="ml-1 text-xs font-normal text-[#4F758B]">(what to do next, ranked)</span>
        </h2>
        <span className="text-xs text-[#4F758B]">
          {result.total} signal{result.total === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="space-y-2">
        {result.actions.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => go(a.target)}
              className="flex w-full items-start gap-3 rounded-lg border border-[#B7C9D3]/40 bg-white px-3 py-2 text-left transition-colors hover:border-[#00AA13]"
            >
              <span className="mt-0.5 shrink-0 text-base" aria-hidden="true">{ICON[a.kind]}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#1D252D]">{a.title}</span>
                <span className="block truncate text-[11px] text-[#4F758B]">{a.context}</span>
              </span>
              <span className="mt-0.5 shrink-0 text-xs font-semibold text-[#00AA13]" aria-hidden="true">→</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[10px] italic text-[#4F758B]">
        Ranked from your live pipeline, account cadence, unclaimed rebates, and demand trend —
        deterministic over the same data the cards below use.
      </p>
    </section>
  );
}
