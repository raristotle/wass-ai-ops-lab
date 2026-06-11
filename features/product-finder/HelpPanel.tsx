"use client";

import { useEffect, useRef, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { HELP_TOPICS, searchHelpTopics } from "@/lib/product-finder-help-content";
import { cn } from "@/lib/utils";

/**
 * Interactive help drawer. Searchable topics rendered as expandable sections;
 * topics with a `tryQuery` offer a one-click "Try it" that runs the query
 * through the natural-language search and closes the panel.
 */
export function HelpPanel() {
  const helpOpen = useProductFinder((s) => s.helpOpen);
  const setHelpOpen = useProductFinder((s) => s.setHelpOpen);
  const runNlSearch = useProductFinder((s) => s.runNlSearch);
  const startTour = useProductFinder((s) => s.startTour);

  const [query, setQuery] = useState("");
  const [openTopicId, setOpenTopicId] = useState<string | null>("getting-started");
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus the search box when the panel opens; close on Escape.
  useEffect(() => {
    if (!helpOpen) return;
    searchRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setHelpOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, setHelpOpen]);

  if (!helpOpen) return null;

  const topics = searchHelpTopics(HELP_TOPICS, query);

  async function handleTry(tryQuery: string) {
    setHelpOpen(false);
    await runNlSearch(tryQuery);
  }

  return (
    <div className="fixed inset-0 z-50 print:hidden" role="dialog" aria-modal="true" aria-label="Help">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close help"
        onClick={() => setHelpOpen(false)}
        className="absolute inset-0 bg-[#1D252D]/50"
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Help &amp; Tips</h2>
            <p className="text-xs text-[#B7C9D3]">
              Everything here runs on sample data — explore freely.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHelpOpen(false)}
            aria-label="Close help panel"
            className="text-2xl font-light leading-none text-white/80 transition-colors hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-[#B7C9D3] px-5 py-3">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help topics… (e.g. quote, substitute, CSV)"
            aria-label="Search help topics"
            className="w-full rounded border border-[#B7C9D3] px-3 py-2 text-sm text-[#1D252D] placeholder-[#4F758B]/60 focus:border-[#4F758B] focus:outline-none"
          />
        </div>

        {/* Topics */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {topics.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#4F758B]">
              No topics match “{query}”.
            </p>
          ) : (
            <ul className="space-y-2">
              {topics.map((topic) => {
                const isOpen = openTopicId === topic.id || query.trim().length > 0;
                return (
                  <li key={topic.id} className="rounded-lg border border-[#B7C9D3]/60">
                    <button
                      type="button"
                      onClick={() => setOpenTopicId(isOpen && !query.trim() ? null : topic.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#1D252D] hover:bg-[#F8FAFB]"
                    >
                      <span>{topic.title}</span>
                      <span
                        className={cn(
                          "text-xs text-[#4F758B] transition-transform duration-150",
                          isOpen ? "rotate-180" : "rotate-0",
                        )}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#B7C9D3]/40 px-3 py-2.5">
                        <div className="space-y-1.5">
                          {topic.body.map((line, i) =>
                            line.startsWith("• ") ? (
                              <p key={i} className="flex gap-1.5 text-xs leading-relaxed text-[#1D252D]">
                                <span className="text-[#00AA13]">•</span>
                                <span>{line.slice(2)}</span>
                              </p>
                            ) : (
                              <p key={i} className="text-xs leading-relaxed text-[#1D252D]">
                                {line}
                              </p>
                            ),
                          )}
                        </div>

                        {topic.tryQuery && (
                          <button
                            type="button"
                            onClick={() => handleTry(topic.tryQuery as string)}
                            className="mt-2.5 rounded bg-[#00AA13] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#009911]"
                          >
                            ▶ Try it: “{topic.tryQuery}”
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#B7C9D3] bg-[#F8FAFB] px-5 py-3">
          <button
            type="button"
            onClick={() => {
              setHelpOpen(false);
              startTour();
            }}
            className="mb-2 rounded bg-[#1D252D] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#2d3a47]"
          >
            Restart the tour
          </button>
          <p className="text-[11px] text-[#4F758B]">
            Demo accounts use password <span className="font-semibold">meridian2024</span>.
            Full guide:{" "}
            <a
              href="https://github.com/raristotle/wass-ai-ops-lab/blob/master/docs/product-finder-help.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#004986] underline hover:text-[#1D252D]"
            >
              user documentation
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
