"use client";

import Link from "next/link";

/**
 * Floating card that appears in the bottom-right of the main dashboard,
 * linking to the AI Product Recommender page.
 */
export function ProductFinderCard() {
  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      role="complementary"
      aria-label="Navigate to AI Product Recommender"
    >
      <Link
        href="/product-finder"
        className="flex items-center gap-3 rounded-xl bg-[#1D252D] px-5 py-3 shadow-xl ring-1 ring-[#4F758B]/40 transition-all hover:bg-[#2d3a44] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AA13]"
      >
        {/* Wesco green AI badge */}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00AA13] text-white text-base font-bold">
          AI
        </span>

        {/* Text */}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white leading-tight">
            AI Product Recommender
          </span>
          <span className="text-xs text-[#B7C9D3]">
            Find alternatives, compare specs, manage BOM
          </span>
        </div>

        {/* Arrow */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 shrink-0 text-[#B7C9D3]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
