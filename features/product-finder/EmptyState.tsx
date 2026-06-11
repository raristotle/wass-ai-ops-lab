"use client";

import { SavedAndRecentPanel } from "@/features/product-finder/SavedAndRecentPanel";

export function LandingState() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#B7C9D3] bg-white p-6 text-center">
        <p className="text-3xl" aria-hidden="true">🔎</p>
        <h2 className="mt-2 text-lg font-bold text-[#1D252D]">Find the right product, fast</h2>
        <p className="mt-1 text-sm text-[#4F758B]">
          Search by name, SKU, spec, or plain English — e.g. &ldquo;20A breaker in stock under $50&rdquo;.
          Pick a product to see scored, explained alternatives.
        </p>
      </div>
      <SavedAndRecentPanel />
    </div>
  );
}

export function NoResultsState({
  onClear,
  suggestion,
  onTrySuggestion,
}: {
  onClear: () => void;
  /** "Did you mean…?" candidate from the last search; null/omitted = none. */
  suggestion?: string | null;
  onTrySuggestion?: (q: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[#B7C9D3] bg-white p-8 text-center">
      <p className="text-3xl" aria-hidden="true">📭</p>
      <h2 className="mt-2 text-base font-bold text-[#1D252D]">No matching products</h2>
      <p className="mt-1 text-sm text-[#4F758B]">Try removing a filter or broadening your search.</p>
      {suggestion && onTrySuggestion && (
        <p className="mt-2 text-sm text-[#1D252D]">
          Did you mean{" "}
          <button
            type="button"
            onClick={() => onTrySuggestion(suggestion)}
            className="font-semibold text-[#00AA13] underline underline-offset-2 hover:text-[#009911]"
          >
            {suggestion}
          </button>
          ?
        </p>
      )}
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-lg bg-[#00AA13] px-4 py-2 text-sm font-semibold text-white hover:bg-[#009911]"
      >
        Clear search & filters
      </button>
    </div>
  );
}
