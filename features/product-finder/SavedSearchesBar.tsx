"use client";

import { useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { hasAnyFilter } from "@/lib/product-finder-saved-search";
import { cn } from "@/lib/utils";

/**
 * Saved searches bar — save the current query+filters as a named, re-runnable
 * entry and list the saved ones as chips. Each chip re-runs the search; the bell
 * icon toggles new-match alerts; a "new" badge shows alert matches.
 */
export function SavedSearchesBar() {
  const filters = useProductFinder((s) => s.filters);
  const savedSearches = useProductFinder((s) => s.savedSearches);
  const saveSearch = useProductFinder((s) => s.saveSearch);
  const deleteSavedSearch = useProductFinder((s) => s.deleteSavedSearch);
  const setSavedSearchAlerts = useProductFinder((s) => s.setSavedSearchAlerts);
  const runSavedSearch = useProductFinder((s) => s.runSavedSearch);

  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const canSave = hasAnyFilter(filters);

  function commitSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    saveSearch(trimmed);
    setName("");
    setNaming(false);
  }

  if (savedSearches.length === 0 && !canSave) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1" data-tour="saved-searches">
      {canSave &&
        (naming ? (
          <span className="flex items-center gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSave();
                if (e.key === "Escape") {
                  setNaming(false);
                  setName("");
                }
              }}
              placeholder="Name this search"
              className="h-7 w-44 rounded-full border border-[#00AA13] px-3 text-xs text-[#1D252D] focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
              aria-label="Saved search name"
            />
            <button
              type="button"
              onClick={commitSave}
              disabled={!name.trim()}
              className="rounded-full bg-[#00AA13] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#009911] disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setNaming(false);
                setName("");
              }}
              className="text-[#B7C9D3] hover:text-[#1D252D]"
              aria-label="Cancel saving search"
            >
              ✕
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setNaming(true)}
            className={cn(
              "flex items-center gap-1 rounded-full border border-[#EAAA00]/60 px-3 py-1 text-xs font-medium text-[#8a6400]",
              "hover:border-[#EAAA00] hover:bg-[#EAAA00]/10 transition-colors"
            )}
            aria-label="Save this search"
          >
            <span aria-hidden="true">★</span> Save this search
          </button>
        ))}

      {savedSearches.map((s) => (
        <span
          key={s.id}
          className="group flex items-center gap-1 rounded-full border border-[#B7C9D3] bg-white py-1 pl-3 pr-1 text-xs text-[#1D252D]"
        >
          <button
            type="button"
            onClick={() => void runSavedSearch(s.id)}
            className="flex items-center gap-1.5 hover:text-[#00573F]"
            title={s.summary}
            aria-label={`Run saved search ${s.name}`}
          >
            <span className="font-medium">{s.name}</span>
            {s.alertsOn && s.newMatches > 0 && (
              <span className="rounded-full bg-[#DB6B30] px-1.5 text-[9px] font-bold text-white">
                +{s.newMatches} new
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSavedSearchAlerts(s.id, !s.alertsOn)}
            className={cn("px-1 text-[11px]", s.alertsOn ? "text-[#00AA13]" : "text-[#B7C9D3] hover:text-[#4F758B]")}
            title={s.alertsOn ? "Alerts on — click to mute" : "Alerts off — click to enable"}
            aria-label={s.alertsOn ? `Mute alerts for ${s.name}` : `Enable alerts for ${s.name}`}
          >
            {s.alertsOn ? "🔔" : "🔕"}
          </button>
          <button
            type="button"
            onClick={() => deleteSavedSearch(s.id)}
            className="px-1 text-[#B7C9D3] hover:text-red-600"
            aria-label={`Delete saved search ${s.name}`}
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}
