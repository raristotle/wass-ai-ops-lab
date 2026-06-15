"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { parseBomLines, matchBomScored } from "@/lib/product-finder-bom";
import { apiSearch, apiCrossMatch } from "@/lib/product-finder-api";
import { suggestCorrection } from "@/lib/product-finder-suggest-correction";
import {
  matchConfidence,
  confidenceTier,
  CONFIDENCE_TIER_COLOR,
  CONFIDENCE_TIER_LABEL,
} from "@/lib/product-finder-match-confidence";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { ScoredBomLine } from "@/lib/product-finder-bom";
import type { BomCrossSuggestion } from "@/lib/catalog/bom-cross";

/** A scored line plus its verified-cross suggestion, when one is documented. */
type CrossedBomLine = ScoredBomLine & {
  cross?: BomCrossSuggestion | null;
  crossApplied?: boolean;
};

// ─── Real searchFn: calls apiSearch with query as text, top-3 candidates ──────

async function searchTop3(query: string): Promise<CatalogProduct[]> {
  try {
    const res = await apiSearch(
      {
        query,
        categories: new Set(),
        subcategories: new Set(),
        brands: new Set(),
        onlyBranchStock: false,
        onlyDCStock: false,
        onlyPreferred: false,
        onlyActive: false,
        priceMin: null,
        priceMax: null,
        sortKey: "relevance",
        viewMode: "list",
        specFilters: {},
        specRanges: {},
      },
      0,
      3
    );
    return res.items;
  } catch {
    return [];
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 12 0 12 0v4a8 8 0 00-8 8z"
      />
    </svg>
  );
}

// ─── Match result row ─────────────────────────────────────────────────────────

function ConfidenceBadge({ line }: { line: ScoredBomLine }) {
  if (!line.match || line.tier === null) return null;
  const color = CONFIDENCE_TIER_COLOR[line.tier];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
      title={`Match confidence: ${CONFIDENCE_TIER_LABEL[line.tier]} — ${(line.confidence * 100).toFixed(0)}% of your line text is covered by this product`}
    >
      {(line.confidence * 100).toFixed(0)}%
    </span>
  );
}

function MatchRow({ line, onUseAlternate, onUseCross }: {
  line: CrossedBomLine;
  onUseAlternate: (alt: CatalogProduct) => void;
  onUseCross: (cross: BomCrossSuggestion) => void;
}) {
  const { match } = line;
  const showAlternates = line.alternates.length > 0 && (match === null || line.tier !== "high");
  // Offer the documented cross when the line names a competitor part we don't
  // stock — if the named part itself is stocked, its detail panel covers it.
  const showCross =
    line.cross != null && !line.cross.originStocked && !line.crossApplied &&
    line.match?.id !== line.cross.product.id;
  return (
    <tr className="border-b border-[#B7C9D3]/30 last:border-0">
      <td className="px-3 py-2 text-sm font-mono text-center text-[#4F758B] align-top w-12">
        {line.qty}
      </td>
      <td className="px-3 py-2 text-sm text-[#1D252D] align-top max-w-[200px]">
        <span className="truncate block" title={line.query}>{line.query}</span>
        {line.correctedQuery && (
          <span className="mt-0.5 block text-[10px] italic text-[#00573F]">
            corrected to &ldquo;{line.correctedQuery}&rdquo;
          </span>
        )}
      </td>
      <td className="px-3 py-2 align-top">
        {showCross && line.cross && (
          <div className="mb-1.5 rounded border border-[#00573F]/40 bg-[#00573F]/5 px-2.5 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#00573F]">
              ✓ Verified cross — we stock the equivalent
            </p>
            <p className="mt-0.5 text-xs text-[#1D252D]">
              {line.cross.fromBrand} {line.cross.fromMpn} →{" "}
              <span className="font-semibold">{line.cross.product.name}</span>
              <span className="text-[#4F758B]"> · ${line.cross.product.unitPrice.toFixed(2)}/{line.cross.product.uom}</span>
            </p>
            <p className="text-[10px] text-[#4F758B]">
              {line.cross.matchReason} ·{" "}
              <a
                href={line.cross.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#004986] underline underline-offset-2"
              >
                source ↗
              </a>
            </p>
            <button
              type="button"
              onClick={() => onUseCross(line.cross as BomCrossSuggestion)}
              className="mt-1 rounded bg-[#00573F] px-2 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#004936]"
              aria-label={`Use stocked cross ${line.cross.product.name} for this line`}
            >
              Use stocked cross — {line.cross.confidence}%
            </button>
          </div>
        )}
        {line.crossApplied && (
          <p className="mb-1 text-[10px] font-semibold text-[#00573F]">
            ✓ crossed from {line.cross?.fromBrand} {line.cross?.fromMpn} (source-backed)
          </p>
        )}
        {match ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none" aria-hidden="true">{match.imageIcon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1D252D] truncate">{match.name}</p>
                <p className="text-xs text-[#4F758B] truncate">
                  {match.brand} &middot; ${match.unitPrice.toFixed(2)}/{match.uom}
                </p>
              </div>
              <ConfidenceBadge line={line} />
            </div>
            {showAlternates && (
              <div className="mt-1.5 space-y-1 border-l-2 border-[#B7C9D3]/60 pl-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#4F758B]">
                  Not quite right? Alternatives:
                </p>
                {line.alternates.map((alt) => (
                  <div key={alt.id} className="flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-xs text-[#1D252D]">
                      {alt.name}{" "}
                      <span className="text-[#4F758B]">· ${alt.unitPrice.toFixed(2)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onUseAlternate(alt)}
                      className="shrink-0 rounded border border-[#4F758B] px-1.5 py-0.5 text-[10px] font-semibold text-[#4F758B] transition-colors hover:border-[#00AA13] hover:text-[#00AA13]"
                      aria-label={`Use ${alt.name} for this line instead`}
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            <span aria-hidden="true">—</span> No match
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── BomImportModal ───────────────────────────────────────────────────────────

export function BomImportModal() {
  const bomModalOpen = useProductFinder((s) => s.bomModalOpen);
  const setBomModalOpen = useProductFinder((s) => s.setBomModalOpen);
  const addToCart = useProductFinder((s) => s.addToCart);

  const [text, setText] = useState("");
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState<CrossedBomLine[] | null>(null);
  const [added, setAdded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!bomModalOpen) return null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleClose() {
    setBomModalOpen(false);
    // reset local state on close so the next open is fresh
    setText("");
    setMatched(null);
    setAdded(false);
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) handleClose();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") handleClose();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") {
        setText(content);
        setMatched(null);
        setAdded(false);
      }
    };
    reader.readAsText(file);
    // reset file input so the same file can be re-selected
    e.target.value = "";
  }

  async function handleMatch() {
    const parsed = parseBomLines(text);
    if (parsed.length === 0) return;
    setMatching(true);
    setMatched(null);
    setAdded(false);
    try {
      const results = await matchBomScored(parsed, searchTop3, suggestCorrection);
      // Verified-cross pass: competitor part numbers documented in the cross
      // dataset get a stocked-equivalent suggestion with its source citation.
      const crosses = await apiCrossMatch(parsed.map((l) => l.query));
      setMatched(results.map((line, i) => ({ ...line, cross: crosses[i] ?? null })));
    } finally {
      setMatching(false);
    }
  }

  /** Swap a line to its documented stocked cross. */
  function handleUseCross(index: number, cross: BomCrossSuggestion) {
    setMatched((prev) => {
      if (!prev) return prev;
      return prev.map((line, i) => {
        if (i !== index) return line;
        return {
          ...line,
          match: cross.product,
          confidence: cross.confidence / 100,
          tier: "high" as const,
          alternates: line.match
            ? [line.match, ...line.alternates.filter((a) => a.id !== cross.product.id)].slice(0, 2)
            : line.alternates.filter((a) => a.id !== cross.product.id),
          crossApplied: true,
        };
      });
    });
    setAdded(false);
  }

  /** Swap a line's match for one of its alternates and rescore. */
  function handleUseAlternate(index: number, alt: CatalogProduct) {
    setMatched((prev) => {
      if (!prev) return prev;
      return prev.map((line, i) => {
        if (i !== index || !line.match) return line;
        const confidence = matchConfidence(line.correctedQuery ?? line.query, alt);
        return {
          ...line,
          match: alt,
          confidence,
          tier: confidenceTier(confidence),
          alternates: [...line.alternates.filter((a) => a.id !== alt.id), line.match],
          crossApplied: false,
        };
      });
    });
    setAdded(false);
  }

  function handleAddMatched() {
    if (!matched) return;
    for (const line of matched) {
      if (line.match) {
        addToCart(line.match, line.qty);
      }
    }
    setAdded(true);
    // Close after a brief moment to let the user see the confirmation
    setTimeout(() => handleClose(), 800);
  }

  // ── Summary counts ──────────────────────────────────────────────────────────

  const matchedCount = matched ? matched.filter((l) => l.match !== null).length : 0;
  const totalCount = matched ? matched.length : 0;
  const reviewCount = matched
    ? matched.filter((l) => l.match !== null && l.tier !== "high").length
    : 0;
  const crossableCount = matched
    ? matched.filter((l) => l.cross != null && !l.cross.originStocked && !l.crossApplied && l.match?.id !== l.cross.product.id).length
    : 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Import List / BOM"
      tabIndex={-1}
    >
      <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between bg-[#1D252D] px-6 py-4 rounded-t-xl">
          <div>
            <h2 className="text-white font-semibold text-lg [font-family:var(--font-titillium,'Arial_Bold',sans-serif)]">
              Import List / BOM
            </h2>
            <p className="text-[#B7C9D3] text-xs mt-0.5">
              Paste a parts list or upload a .csv/.txt file
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Close BOM import modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Textarea */}
          <div>
            <label
              htmlFor="bom-textarea"
              className="block text-sm font-medium text-[#1D252D] mb-1.5"
            >
              Parts list
            </label>
            <textarea
              id="bom-textarea"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setMatched(null);
                setAdded(false);
              }}
              rows={8}
              placeholder={
                "Paste one item per line. Quantity prefix is optional:\n\n12x 15A circuit breaker\n5 Cat6 Cable\n3, Safety Glasses\n2 - LED Troffer\nRelay"
              }
              className={cn(
                "w-full rounded-lg border border-[#B7C9D3] bg-white px-3 py-2 text-sm text-[#1D252D]",
                "placeholder:text-[#4F758B]/50",
                "focus:outline-none focus:ring-2 focus:ring-[#00AA13] focus:border-[#00AA13]",
                "resize-y font-mono"
              )}
              aria-describedby="bom-format-hint"
            />
            <p id="bom-format-hint" className="mt-1 text-xs text-[#4F758B]">
              Formats: <code>12x Item</code>, <code>12 Item</code>, <code>12, Item</code>,{" "}
              <code>12 - Item</code>, or <code>Item</code> (qty defaults to 1). Up to 200 lines.
            </p>
          </div>

          {/* File upload */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="sr-only"
              id="bom-file-input"
              aria-label="Upload .csv or .txt file"
              onChange={handleFileChange}
            />
            <label
              htmlFor="bom-file-input"
              className={cn(
                "cursor-pointer rounded-lg border border-[#B7C9D3] px-3 py-1.5 text-xs font-medium text-[#4F758B]",
                "hover:border-[#00AA13] hover:bg-[#00AA13]/10 hover:text-[#00AA13] transition-colors"
              )}
            >
              Upload .csv / .txt
            </label>
            <span className="text-xs text-[#4F758B]">— or paste directly above</span>
          </div>

          {/* Match button + summary */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={handleMatch}
              disabled={matching || text.trim().length === 0}
              className={cn(
                "flex items-center gap-2 bg-[#00AA13] hover:bg-[#009911] text-white text-sm",
                (matching || text.trim().length === 0) && "opacity-60 cursor-not-allowed"
              )}
            >
              {matching && <SpinnerIcon />}
              {matching ? "Matching…" : "Match"}
            </Button>

            {matched !== null && (
              <span className="text-sm text-[#4F758B]">
                <span className="font-semibold text-[#1D252D]">{matchedCount}</span> of{" "}
                <span className="font-semibold text-[#1D252D]">{totalCount}</span> line
                {totalCount !== 1 ? "s" : ""} matched
                {reviewCount > 0 && (
                  <span className="ml-1.5 font-semibold text-[#EAAA00]">
                    · {reviewCount} to review
                  </span>
                )}
                {crossableCount > 0 && (
                  <span className="ml-1.5 font-semibold text-[#00573F]">
                    · {crossableCount} competitor part{crossableCount !== 1 ? "s" : ""} crossable to stock
                  </span>
                )}
              </span>
            )}

            {added && (
              <span className="text-sm font-semibold text-[#00AA13]">
                ✓ Added to cart
              </span>
            )}
          </div>

          {/* Results table */}
          {matched !== null && matched.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-[#B7C9D3]/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#B7C9D3]/60">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#4F758B] w-12">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#4F758B]">
                      Query
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#4F758B]">
                      Matched product · confidence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matched.map((line, i) => (
                    <MatchRow
                      key={i}
                      line={line}
                      onUseAlternate={(alt) => handleUseAlternate(i, alt)}
                      onUseCross={(cross) => handleUseCross(i, cross)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {matched !== null && matched.length === 0 && (
            <p className="text-sm text-[#4F758B] text-center py-4">
              No valid lines found. Try pasting items above.
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 flex items-center justify-between border-t border-[#B7C9D3]/60 bg-gray-50 px-6 py-4 rounded-b-xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="text-sm border-[#B7C9D3] text-[#4F758B] hover:bg-gray-100"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleAddMatched}
            disabled={!matched || matchedCount === 0 || added}
            className={cn(
              "bg-[#1D252D] hover:bg-[#2d3843] text-white text-sm",
              (!matched || matchedCount === 0 || added) && "opacity-50 cursor-not-allowed"
            )}
          >
            Add {matchedCount > 0 ? `${matchedCount} matched` : "matched"} to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
