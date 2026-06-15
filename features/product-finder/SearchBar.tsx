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
import { lookupCrossReference } from "@/lib/integration/cross-reference";
import { QUICK_PICKS } from "@/lib/product-finder-commands";
import { normalizeTranscript } from "@/lib/product-finder-voice";
import { VoiceSearchButton } from "@/features/product-finder/VoiceSearchButton";
import { SavedSearchesBar } from "@/features/product-finder/SavedSearchesBar";
import type { SuggestItem, ParsedFilter } from "@/features/product-finder/types";

// ─── Cross-reference icon ─────────────────────────────────────────────────────

function CrossRefIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

// ─── Cross-reference modal ────────────────────────────────────────────────────

function CrossReferenceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);
  const [inputValue, setInputValue] = useState("");
  const [missMsg, setMissMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInputValue("");
      setMissMsg(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") handleFind();
  }

  function handleFind() {
    const sku = inputValue.trim();
    if (!sku) return;
    const product = lookupCrossReference(sku);
    if (product) {
      setDetailModalProduct(product);
      onClose();
    } else {
      setMissMsg(`No Meridian equivalent found for '${sku}'.`);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Cross-reference lookup"
      tabIndex={-1}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#1D252D] px-6 py-4 rounded-t-xl">
          <div>
            <h2 className="text-white font-semibold text-base [font-family:var(--font-titillium,'Arial_Bold',sans-serif)]">
              Cross-reference Lookup
            </h2>
            <p className="text-[#B7C9D3] text-xs mt-0.5">
              Paste a competitor or legacy part number
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close cross-reference modal"
          >
            &#x2715;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setMissMsg(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleFind(); }}
              placeholder="e.g. GRN-2B4K0Q or ACE-1X7FZW"
              className={cn(
                "flex-1 h-10 rounded-lg border border-[#B7C9D3] px-3 text-sm text-[#1D252D]",
                "placeholder:text-[#4F758B]/60",
                "focus:outline-none focus:ring-2 focus:ring-[#00AA13] focus:border-[#00AA13]",
              )}
              aria-label="Competitor or legacy part number"
            />
            <Button
              type="button"
              onClick={handleFind}
              disabled={!inputValue.trim()}
              className="h-10 shrink-0 bg-[#00AA13] px-4 text-sm font-medium text-white hover:bg-[#009911] disabled:opacity-50"
            >
              Find
            </Button>
          </div>

          {missMsg && (
            <p className="text-sm text-[#4F758B] bg-[#F8FAFB] rounded-lg px-4 py-3 border border-[#B7C9D3]/60">
              {missMsg}
            </p>
          )}

          <p className="text-[10px] text-[#4F758B] italic">
            cross-reference data — simulated
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── BOM import icon ──────────────────────────────────────────────────────────

function ListImportIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h10M4 14h7M4 18h7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m0 0l-2.5-2.5M17 20l2.5-2.5" />
    </svg>
  );
}

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
  onOpenBom: () => void;
  onOpenCrossRef: () => void;
  onOpenBulkCross: () => void;
  onOpenBulk: () => void;
  onOpenJobWizard: () => void;
  onOpenGuided: () => void;
  onOpenAssistant: () => void;
  onVoiceInterim: (text: string) => void;
  onVoiceFinal: (text: string) => void;
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
  onOpenBom,
  onOpenCrossRef,
  onOpenBulkCross,
  onOpenBulk,
  onOpenJobWizard,
  onOpenGuided,
  onOpenAssistant,
  onVoiceInterim,
  onVoiceFinal,
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
                "h-10 w-full rounded-lg border border-[#B7C9D3] bg-white py-2 pl-9 pr-14 text-sm text-[#1D252D]",
                "placeholder:text-[#4F758B]/60",
                "focus:outline-none focus:ring-2 focus:ring-[#00AA13] focus:border-[#00AA13]",
                "transition-colors"
              )}
              aria-autocomplete="list"
              aria-controls="pf-search-suggestions"
              aria-expanded={showSuggestions}
              aria-haspopup="listbox"
            />
            {/* Voice search (hidden when the browser lacks SpeechRecognition) */}
            <VoiceSearchButton
              className="absolute right-8"
              onInterim={onVoiceInterim}
              onFinal={onVoiceFinal}
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

      {/* Quick-pick chips + BOM import button */}
      <div className="flex flex-wrap items-center gap-2">
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

        {/* Ask Meridian — conversational AI assistant */}
        <button
          type="button"
          onClick={onOpenAssistant}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-full bg-[#00AA13] px-3 py-1 text-xs font-semibold text-white",
            "hover:bg-[#009911]",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00573F]"
          )}
          aria-label="Ask Meridian — AI assistant"
          data-tour="assistant"
        >
          <span aria-hidden="true">💬</span>
          Ask Meridian
          <span className="rounded-full bg-white/25 px-1.5 text-[9px] font-bold uppercase tracking-wide">AI</span>
        </button>

        {/* Ask Meridian — Job Wizard (deterministic guided job builder) */}
        <button
          type="button"
          onClick={onOpenJobWizard}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-[#00AA13]/60 px-3 py-1 text-xs font-semibold text-[#00573F]",
            "hover:border-[#00AA13] hover:bg-[#00AA13]/10",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AA13]"
          )}
          aria-label="Ask Meridian — Job Wizard"
          data-tour="job-wizard"
        >
          <span aria-hidden="true">🧰</span>
          Job Wizard
          <span className="rounded-full bg-[#00AA13] px-1.5 text-[9px] font-bold uppercase tracking-wide text-white">
            AI
          </span>
        </button>

        {/* Guided engineering selectors — NEC conduit/wire/breaker calculators */}
        <button
          type="button"
          onClick={onOpenGuided}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-[#004986]/50 px-3 py-1 text-xs font-medium text-[#004986]",
            "hover:border-[#004986] hover:bg-[#004986]/5",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004986]"
          )}
          aria-label="Guided engineering selectors"
        >
          <span aria-hidden="true">📐</span>
          Selectors
        </button>

        {/* Import List / BOM — secondary action aligned with quick-picks */}
        <button
          type="button"
          onClick={onOpenBom}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-[#4F758B]/50 px-3 py-1 text-xs font-medium text-[#4F758B]",
            "hover:border-[#1D252D] hover:bg-[#1D252D]/5 hover:text-[#1D252D]",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D252D]"
          )}
          aria-label="Import List / BOM"
        >
          <ListImportIcon />
          Import List / BOM
        </button>

        {/* Cross-reference — paste a competitor/legacy part number */}
        <button
          type="button"
          onClick={onOpenCrossRef}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-[#4F758B]/50 px-3 py-1 text-xs font-medium text-[#4F758B]",
            "hover:border-[#1D252D] hover:bg-[#1D252D]/5 hover:text-[#1D252D]",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D252D]"
          )}
          aria-label="Cross-reference lookup"
        >
          <CrossRefIcon />
          Cross-reference
        </button>

        {/* Bulk price & availability — paste many SKUs */}
        <button
          type="button"
          onClick={onOpenBulk}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-[#4F758B]/50 px-3 py-1 text-xs font-medium text-[#4F758B]",
            "hover:border-[#1D252D] hover:bg-[#1D252D]/5 hover:text-[#1D252D]",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D252D]"
          )}
          aria-label="Bulk price and availability"
        >
          <ListImportIcon />
          Bulk Price Check
        </button>

        {/* Bulk cross-reference — paste many competitor part numbers */}
        <button
          type="button"
          onClick={onOpenBulkCross}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-[#00573F]/50 px-3 py-1 text-xs font-medium text-[#00573F]",
            "hover:border-[#00573F] hover:bg-[#00573F]/5",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00573F]"
          )}
          aria-label="Bulk cross-reference"
        >
          <CrossRefIcon />
          Bulk Cross-Ref
        </button>
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
    setBomModalOpen,
    setBulkModalOpen,
    setBulkCrossOpen,
    setJobWizardOpen,
    setGuidedOpen,
    setAssistantOpen,
  } = useProductFinder();

  // Suggestion dropdown state
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestSeq = useRef(0);

  // Cross-reference modal state
  const [crossRefOpen, setCrossRefOpen] = useState(false);

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

  // ── Voice search ────────────────────────────────────────────────────────────
  // Interim transcripts only echo into the input — never trigger the suggest
  // fetch (any pending suggest timer is cancelled and the dropdown closed).
  const handleVoiceInterim = (text: string) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestSeq.current++;
    setQuery(text);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleVoiceFinal = (text: string) => {
    const q = normalizeTranscript(text);
    if (!q) return;
    setQuery(q);
    setSuggestions([]);
    setShowSuggestions(false);
    runNlSearch(q);
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
    <>
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
            onOpenBom={() => setBomModalOpen(true)}
            onOpenCrossRef={() => setCrossRefOpen(true)}
            onOpenBulkCross={() => setBulkCrossOpen(true)}
            onOpenBulk={() => setBulkModalOpen(true)}
            onOpenJobWizard={() => setJobWizardOpen(true)}
            onOpenGuided={() => setGuidedOpen(true)}
            onOpenAssistant={() => setAssistantOpen(true)}
            onVoiceInterim={handleVoiceInterim}
            onVoiceFinal={handleVoiceFinal}
          />
          <SavedSearchesBar />
        </div>
      </div>

      <CrossReferenceModal
        open={crossRefOpen}
        onClose={() => setCrossRefOpen(false)}
      />
    </>
  );
}
