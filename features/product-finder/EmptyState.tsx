"use client";

import { SavedAndRecentPanel } from "@/features/product-finder/SavedAndRecentPanel";

export function LandingState() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#B7C9D3] bg-white p-6 text-center">
        <p className="text-3xl" aria-hidden="true">🔎</p>
        <h2 className="mt-2 text-lg font-bold text-[#1D252D]">Find the right product, fast</h2>
        <p className="mt-1 text-sm text-[#4F758B]">
          Search by name, SKU, spec, or plain English — e.g. "20A breaker in stock under $50".
          Pick a product to see scored, explained alternatives.
        </p>
      </div>
      <SavedAndRecentPanel />
    </div>
  );
}

export function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-[#B7C9D3] bg-white p-8 text-center">
      <p className="text-3xl" aria-hidden="true">📭</p>
      <h2 className="mt-2 text-base font-bold text-[#1D252D]">No matching products</h2>
      <p className="mt-1 text-sm text-[#4F758B]">Try removing a filter or broadening your search.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-lg bg-[#00AA13] px-4 py-2 text-sm font-semibold text-white hover:bg-[#009911]"
      >
        Clear all filters
      </button>
    </div>
  );
}
