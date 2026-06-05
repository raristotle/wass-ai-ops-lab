"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type RefObject,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProductFinder } from "@/lib/product-finder-store";
import { apiSuggest } from "@/lib/product-finder-api";
import type { SuggestItem, ParsedFilter } from "@/features/product-finder/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_PICKS: readonly string[] = [
  "Circuit Breakers",
  "Wire & Cable",
  "Conduit",
  "Cat6 Cable",
  "Patch Panels",
  "Network Switches",
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0 text-[#4F758B]", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

// ─── Suggestion row ───────────────────────────────────────────────────────────

function SuggestionRow({
  product,
  onSelect,
}: {
  product: SuggestItem;
  onSelect: (p: SuggestItem) => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-[#B7C9D3]/20 focus-visible:bg-[#B7C9D3]/20 focus-visible:outline-none"
      onClick={() => onSelect(product)}
    >
      <span className="text-xl leading-none" aria-hidden="true">
        {product.imageIcon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#1D252D]">
          {product.name}
        </p>
        <p className="truncate text-xs text-[#4F758B]">
          {product.brand} &middot; SKU: {product.sku}
        </p>
      </div>
    </button>
  );
}

// ─── Single Search Panel ──────────────────────────────────────────────────────

interface SingleSearchPanelProps {
  query: string;
  suggestions: SuggestItem[];
  showSuggestions: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  dropdownRef: RefObject<HTMLDivElement | null>;
  onQueryChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onSearch: () => void;
  onSelectSuggestion: (item: SuggestItem) => void;
  onQuickPick: (chip: string) => void;
  appliedNlFilters: ParsedFilter[];
  onRemoveFilter: (id: string) => void;
}

function SingleSearchPanel({
  query,
  suggestions,
  showSuggestions,
  inputRef,
  dropdownRef,
  onQueryChange,
  onKeyDown,
  onClear,
  onSearch,
  onSelectSuggestion,
  onQuickPick,
  appliedNlFilters,
  onRemoveFilter,
}: SingleSearchPanelProps) {
  return (
    <div className="space-y-3">
      {/* Input row */}
      <div className="flex gap-2">
        {/* Input wrapper with dropdown */}
        <div className="relative flex-1">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 flex items-center">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={onQueryChange}
              onKeyDown={onKeyDown}
              role="combobox"
              placeholder="Search by product name, SKU, brand, or spec (e.g. '15A circuit breaker', 'Cat6 cable')"
              className={cn(
                "h-10 w-full rounded-lg border border-[#B7C9D3] bg-white py-2 pl-9 pr-8 text-sm text-[#1D252D]",
                "placeholder:text-[#4F758B]/60",
                "focus:outline-none focus:ring-2 focus:ring-[#00AA13] focus:border-[#00AA13]",
                "transition-colors"
              )}
              aria-autocomplete="list"
              aria-controls="pf-search-suggestions"
              aria-expanded={showSuggestions}
              aria-haspopup="listbox"
            />
            {/* Clear button */}
            {query.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="absolute right-2 flex items-center text-[#4F758B] hover:text-[#1D252D] focus-visible:outline-none"
                aria-label="Clear search"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div
              ref={dropdownRef}
              id="pf-search-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[#B7C9D3] bg-white py-1 shadow-lg"
            >
              {suggestions.map((product) => (
                <SuggestionRow
                  key={product.id}
                  product={product}
                  onSelect={onSelectSuggestion}
                />
              ))}
            </div>
          )}
        </div>

        {/* Search button */}
        <Button
          type="button"
          onClick={onSearch}
          className="h-10 shrink-0 bg-[#00AA13] px-5 text-sm font-medium text-white hover:bg-[#009911]"
        >
          Search
        </Button>
      </div>

      {/* Quick-pick chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PICKS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onQuickPick(chip)}
            className={cn(
              "rounded-full border border-[#B7C9D3] px-3 py-1 text-xs font-medium text-[#4F758B]",
              "hover:border-[#00AA13] hover:bg-[#00AA13]/10 hover:text-[#00AA13]",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AA13]"
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Applied natural-language filter chips */}
      {appliedNlFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-[#4F758B]">Filters:</span>
          {appliedNlFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onRemoveFilter(f.id)}
              aria-label={`Remove filter ${f.label}`}
              className="inline-flex items-center gap-1 rounded-full border border-[#00AA13]/40 bg-[#00AA13]/10 px-2.5 py-0.5 text-xs font-medium text-[#00573F] hover:bg-[#00AA13]/20"
            >
              {f.label}
              <span aria-hidden="true" className="text-[#4F758B]">✕</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SearchBar() {
  const {
    query,
    setQuery,
    runNlSearch,
    removeNlFilter,
    appliedNlFilters,
  } = useProductFinder();

  // Suggestion dropdown state
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestSeq = useRef(0);

  // ── Suggestion logic ────────────────────────────────────────────────────────
  const updateSuggestions = useCallback((value: string) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (!value.trim()) {
      suggestSeq.current++;
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      const seq = ++suggestSeq.current;
      const items = await apiSuggest(value);
      if (seq !== suggestSeq.current) return;
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
    }, 150);
  }, []);

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    updateSuggestions(value);
  };

  const handleSelectSuggestion = (item: SuggestItem) => {
    setQuery(item.name);
    setSuggestions([]);
    setShowSuggestions(false);
    runNlSearch(item.name);
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    runNlSearch(query);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery("");
    runNlSearch(""); // also clears applied filter chips and resets results
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Quick-picks run through the same NL parser as typed queries, so a pick that
  // contains a brand or price token would surface as a removable filter chip.
  const handleQuickPick = (chip: string) => {
    setQuery(chip);
    setShowSuggestions(false);
    runNlSearch(chip);
  };

  // Cancel any pending suggest timer on unmount
  useEffect(() => {
    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current); };
  }, []);

  // Close dropdown on outside pointer-down
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-xl border border-[#B7C9D3] bg-white shadow-sm">
      {/* Panel body */}
      <div className="p-4">
        <SingleSearchPanel
          query={query}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          inputRef={inputRef}
          dropdownRef={dropdownRef}
          onQueryChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onClear={handleClear}
          onSearch={handleSearch}
          onSelectSuggestion={handleSelectSuggestion}
          onQuickPick={handleQuickPick}
          appliedNlFilters={appliedNlFilters}
          onRemoveFilter={removeNlFilter}
        />
      </div>
    </div>
  );
}
