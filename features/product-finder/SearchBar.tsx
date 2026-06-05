"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type RefObject,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProductFinder } from "@/lib/product-finder-store";
import { searchProducts } from "@/data/mock/wesco-products";
import type { WescoProduct, BomLine, ParsedFilter } from "@/features/product-finder/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_PICKS: readonly string[] = [
  "Circuit Breakers",
  "Wire & Cable",
  "Conduit",
  "Cat6 Cable",
  "Patch Panels",
  "Network Switches",
];

const MAX_SUGGESTIONS = 6;

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
  product: WescoProduct;
  onSelect: (p: WescoProduct) => void;
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
  suggestions: WescoProduct[];
  showSuggestions: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  dropdownRef: RefObject<HTMLDivElement | null>;
  onQueryChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onSearch: () => void;
  onSelectSuggestion: (product: WescoProduct) => void;
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
              placeholder="Search by product name, SKU, brand, or spec (e.g. '15A circuit breaker', 'Cat6 cable')"
              className={cn(
                "h-10 w-full rounded-lg border border-[#B7C9D3] bg-white py-2 pl-9 pr-8 text-sm text-[#1D252D]",
                "placeholder:text-[#4F758B]/60",
                "focus:outline-none focus:ring-2 focus:ring-[#00AA13] focus:border-[#00AA13]",
                "transition-colors"
              )}
              aria-autocomplete="list"
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

// ─── BOM Table Row ────────────────────────────────────────────────────────────

interface BomTableRowProps {
  line: BomLine;
  onLineSelect: (product: WescoProduct) => void;
}

function BomTableRow({ line, onLineSelect }: BomTableRowProps) {
  const resolved: WescoProduct | null = line.resolved;

  const branchQty =
    resolved !== null
      ? resolved.branchStock.reduce((s, b) => s + b.quantity, 0)
      : 0;
  const dcQty =
    resolved !== null
      ? resolved.dcStock.reduce((s, d) => s + d.quantity, 0)
      : 0;
  const inStock = branchQty > 0 || dcQty > 0;

  const handleClick = () => {
    if (resolved !== null) onLineSelect(resolved);
  };

  return (
    <div
      role={resolved !== null ? "button" : undefined}
      tabIndex={resolved !== null ? 0 : undefined}
      aria-label={
        resolved !== null
          ? `Select ${resolved.name} for ${line.description}`
          : undefined
      }
      onClick={handleClick}
      onKeyDown={(e) => {
        if (resolved !== null && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "grid grid-cols-1 gap-2 rounded-lg border border-[#B7C9D3] bg-white px-4 py-3 text-sm",
        "sm:grid-cols-[3rem_1fr_1fr_5rem_6rem] sm:items-center sm:gap-3",
        resolved !== null && "cursor-pointer transition-colors hover:bg-[#B7C9D3]/10"
      )}
    >
      {/* Qty */}
      <Badge className="w-fit border-0 bg-[#00AA13] text-xs text-white">
        &times;{line.quantity}
      </Badge>

      {/* Description */}
      <span className="truncate text-[#1D252D]">{line.description}</span>

      {/* Wesco Match */}
      {resolved !== null ? (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#1D252D]">
            {resolved.imageIcon} {resolved.name}
          </p>
          <p className="truncate text-xs text-[#4F758B]">
            SKU: {resolved.sku}
          </p>
        </div>
      ) : (
        <span className="text-xs font-medium text-[#DB6B30]">
          No match found
        </span>
      )}

      {/* Alternatives count */}
      <div className="text-center">
        {resolved !== null && line.alternatives.length > 0 ? (
          <span className="rounded-full border border-[#B7C9D3] px-2 py-0.5 text-xs text-[#4F758B]">
            {line.alternatives.length}
          </span>
        ) : (
          <span className="text-xs text-[#B7C9D3]">—</span>
        )}
      </div>

      {/* Status badge */}
      <div>
        {resolved !== null ? (
          inStock ? (
            <Badge className="border-0 bg-[#00AA13] text-xs text-white">
              In Stock
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )
        ) : (
          <span className="text-xs text-[#B7C9D3]">—</span>
        )}
      </div>
    </div>
  );
}

// ─── BOM Results Table ────────────────────────────────────────────────────────

interface BomResultsTableProps {
  bomLines: BomLine[];
  onLineSelect: (product: WescoProduct) => void;
}

function BomResultsTable({ bomLines, onLineSelect }: BomResultsTableProps) {
  return (
    <div className="space-y-2">
      {/* Column headers — visible only on sm+ */}
      <div className="hidden grid-cols-[3rem_1fr_1fr_5rem_6rem] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#4F758B] sm:grid">
        <span>Qty</span>
        <span>Description</span>
        <span>Wesco Match</span>
        <span className="text-center">Alts</span>
        <span>Status</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {bomLines.map((line) => (
          <BomTableRow key={line.id} line={line} onLineSelect={onLineSelect} />
        ))}
      </div>

      {/* Summary */}
      <div className="flex gap-4 pt-2 text-xs text-[#4F758B]">
        <span>
          <span className="font-semibold text-[#00AA13]">
            {bomLines.filter((l) => l.resolved !== null).length}
          </span>{" "}
          matched
        </span>
        <span>
          <span className="font-semibold text-[#DB6B30]">
            {bomLines.filter((l) => l.resolved === null).length}
          </span>{" "}
          unmatched
        </span>
        <span>
          <span className="font-semibold text-[#1D252D]">
            {bomLines.length}
          </span>{" "}
          total
        </span>
      </div>
    </div>
  );
}

// ─── BOM Panel ────────────────────────────────────────────────────────────────

interface BomPanelProps {
  bomText: string;
  bomLines: BomLine[];
  isDragging: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  onBomTextChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onParseBom: () => void;
  onLineSelect: (product: WescoProduct) => void;
}

function BomPanel({
  bomText,
  bomLines,
  isDragging,
  fileInputRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileInput,
  onBomTextChange,
  onParseBom,
  onLineSelect,
}: BomPanelProps) {
  return (
    <div className="space-y-4">
      {/* Instructions */}
      <p className="text-sm text-[#4F758B]">
        Upload a BOM or paste a list. Supported: CSV, plain text. One item per
        line. Optionally start with quantity (e.g.&nbsp;
        <span className="font-medium text-[#1D252D]">
          &ldquo;20x 15A circuit breaker&rdquo;
        </span>
        ).
      </p>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop zone: drop a CSV or text file here, or press Enter to browse"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
          isDragging
            ? "border-[#00AA13] bg-[#00AA13]/5"
            : "border-[#B7C9D3] hover:border-[#4F758B] hover:bg-[#B7C9D3]/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AA13]"
        )}
      >
        <svg
          className="mb-2 h-8 w-8 text-[#4F758B]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm font-medium text-[#1D252D]">
          Drop CSV or text file here, or{" "}
          <span className="text-[#00AA13] underline">click to browse</span>
        </p>
        <p className="mt-1 text-xs text-[#4F758B]">Accepts .csv, .txt</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="sr-only"
        onChange={onFileInput}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Paste textarea */}
      <textarea
        rows={8}
        value={bomText}
        onChange={onBomTextChange}
        placeholder={`Paste your BOM here, one item per line:\n20x 15A circuit breaker\n5x Cat6 cable 1000ft\n10x EMT conduit 3/4"`}
        className={cn(
          "w-full resize-y rounded-lg border border-[#B7C9D3] bg-white px-3 py-2 text-sm text-[#1D252D]",
          "placeholder:text-[#4F758B]/60",
          "focus:outline-none focus:ring-2 focus:ring-[#00AA13] focus:border-[#00AA13]",
          "transition-colors"
        )}
      />

      {/* Parse button */}
      <Button
        type="button"
        onClick={onParseBom}
        className="h-10 bg-[#1D252D] px-6 text-sm font-medium text-white hover:bg-[#1D252D]/90"
      >
        Parse BOM
      </Button>

      {/* Results */}
      {bomLines.length > 0 && (
        <BomResultsTable bomLines={bomLines} onLineSelect={onLineSelect} />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SearchBar() {
  const {
    query,
    setQuery,
    bomMode,
    bomText,
    bomLines,
    setBomMode,
    setBomText,
    parseBom,
    setActiveProduct,
    runNlSearch,
    removeNlFilter,
    appliedNlFilters,
  } = useProductFinder();

  const activeTab: "single" | "bom" = bomMode ? "bom" : "single";

  // Suggestion dropdown state
  const [suggestions, setSuggestions] = useState<WescoProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // BOM drag state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Suggestion logic ────────────────────────────────────────────────────────
  const updateSuggestions = useCallback((value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const results = searchProducts(value).slice(0, MAX_SUGGESTIONS);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }, []);

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    updateSuggestions(value);
  };

  const handleSelectSuggestion = (product: WescoProduct) => {
    setQuery(product.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveProduct(product);
    // setActiveProduct calls runSearch internally
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
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleQuickPick = (chip: string) => {
    setQuery(chip);
    setShowSuggestions(false);
    runNlSearch(chip);
  };

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

  // ── BOM helpers ─────────────────────────────────────────────────────────────
  const readFileText = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setBomText(text);
        parseBom();
      }
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFileText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFileText(file);
    e.target.value = ""; // allow re-selecting same file
  };

  const handleBomTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBomText(e.target.value);
  };

  const handleBomLineSelect = (product: WescoProduct) => {
    setActiveProduct(product);
  };

  const switchTab = (tab: "single" | "bom") => {
    setBomMode(tab === "bom");
    setShowSuggestions(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-xl border border-[#B7C9D3] bg-white shadow-sm">
      {/* Tabs */}
      <div className="flex overflow-hidden rounded-t-xl border-b border-[#B7C9D3]">
        <button
          type="button"
          onClick={() => switchTab("single")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00AA13]",
            activeTab === "single"
              ? "bg-[#1D252D] text-white"
              : "bg-white text-[#1D252D] hover:bg-[#1D252D] hover:text-white"
          )}
        >
          Single Search
        </button>
        <button
          type="button"
          onClick={() => switchTab("bom")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00AA13]",
            activeTab === "bom"
              ? "bg-[#1D252D] text-white"
              : "bg-white text-[#1D252D] hover:bg-[#1D252D] hover:text-white"
          )}
        >
          BOM / List
        </button>
      </div>

      {/* Panel body */}
      <div className="p-4">
        {activeTab === "single" ? (
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
        ) : (
          <BomPanel
            bomText={bomText}
            bomLines={bomLines}
            isDragging={isDragging}
            fileInputRef={fileInputRef}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onFileInput={handleFileInput}
            onBomTextChange={handleBomTextChange}
            onParseBom={parseBom}
            onLineSelect={handleBomLineSelect}
          />
        )}
      </div>
    </div>
  );
}
