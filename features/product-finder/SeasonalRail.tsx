"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { seasonalEvent } from "@/lib/product-finder-seasonal";

/**
 * Weekly seasonal demand banner on the landing view — one curated event
 * (storm prep, heat, construction season, datacom refresh) with quick-search
 * picks. Deterministic per epoch-week; simulated signal, feed-swappable.
 */
export function SeasonalRail() {
  const runNlSearch = useProductFinder((s) => s.runNlSearch);

  // Clock read after mount keeps SSR and the first client render identical.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const event = useMemo(() => (now === null ? null : seasonalEvent(now)), [now]);
  if (!event) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-[#EAAA00]/50 bg-[#EAAA00]/10 px-3 py-2"
      data-tour="seasonal"
      aria-label="Seasonal demand signal (simulated)"
    >
      <span className="text-base" aria-hidden="true">{event.icon}</span>
      <span className="text-xs font-bold text-[#1D252D]">{event.title}</span>
      <span className="hidden min-w-0 flex-1 truncate text-xs text-[#4F758B] sm:inline">
        {event.blurb}
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {event.picks.map((pick) => (
          <button
            key={pick.label}
            type="button"
            onClick={() => runNlSearch(pick.query)}
            className="rounded-full border border-[#1D252D]/30 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#1D252D] transition-colors hover:border-[#00AA13] hover:text-[#00573F]"
          >
            {pick.label}
          </button>
        ))}
      </span>
      <span className="ml-auto text-[9px] italic text-[#4F758B]">simulated signal</span>
    </div>
  );
}
