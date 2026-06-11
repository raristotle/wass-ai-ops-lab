"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductFinder, DEMO_PASSWORD } from "@/lib/product-finder-store";
import {
  paletteItems,
  moveSelection,
  type CommandItem,
} from "@/lib/product-finder-commands";
import { buildShareQuery, emptyFilterState } from "@/lib/product-finder-url";
import { cn } from "@/lib/utils";

/**
 * Ctrl/Cmd-K command palette. Overlay follows the CrossReferenceModal pattern
 * (SearchBar.tsx): fixed inset-0 dark backdrop, centered panel, overlay-click
 * and Escape close, input autofocus.
 *
 * The global keyboard shortcut listener lives here — the component is mounted
 * once in ProductFinderShell. The shortcut is ignored while another overlay
 * (cart / help / BOM / bulk / compare / submittal / detail modal) is open.
 */
export function CommandPalette() {
  const paletteOpen = useProductFinder((s) => s.paletteOpen);
  const setPaletteOpen = useProductFinder((s) => s.setPaletteOpen);
  const user = useProductFinder((s) => s.user);
  const login = useProductFinder((s) => s.login);
  const startTour = useProductFinder((s) => s.startTour);
  const runNlSearch = useProductFinder((s) => s.runNlSearch);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const setHelpOpen = useProductFinder((s) => s.setHelpOpen);
  const setBomModalOpen = useProductFinder((s) => s.setBomModalOpen);
  const setBulkModalOpen = useProductFinder((s) => s.setBulkModalOpen);
  const pageSize = useProductFinder((s) => s.pageSize);
  const router = useRouter();

  const [input, setInput] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // ── Global Ctrl/Cmd-K shortcut (registered once; reads live store state) ────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "k" || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const s = useProductFinder.getState();
      if (s.paletteOpen) {
        s.setPaletteOpen(false);
        return;
      }
      // Don't open over another overlay.
      if (
        s.cartOpen ||
        s.helpOpen ||
        s.bomModalOpen ||
        s.bulkModalOpen ||
        s.compareModalOpen ||
        s.submittalOpen ||
        s.detailModalProduct !== null
      ) {
        return;
      }
      s.setPaletteOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset + autofocus on open (CrossReferenceModal pattern).
  useEffect(() => {
    if (paletteOpen) {
      setInput("");
      setSelected(0);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [paletteOpen]);

  // Keep the highlighted row visible while arrowing through the list.
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!paletteOpen) return null;

  const items = paletteItems({ role: user?.role ?? null }, input);
  const selectedIndex = Math.min(selected, Math.max(items.length - 1, 0));

  function execute(item: CommandItem) {
    const action = item.action;
    switch (action.kind) {
      case "navigate":
        setPaletteOpen(false);
        router.push(action.href);
        break;
      case "open":
        setPaletteOpen(false);
        if (action.target === "cart") setCartOpen(true);
        else if (action.target === "help") setHelpOpen(true);
        else if (action.target === "bom") setBomModalOpen(true);
        else setBulkModalOpen(true);
        break;
      case "tour":
        setPaletteOpen(false);
        startTour();
        break;
      case "role":
        // Palette stays open — the list re-filters live for the new role.
        login(action.email, DEMO_PASSWORD);
        break;
      case "search":
        setPaletteOpen(false);
        if (window.location.pathname === "/product-finder") {
          runNlSearch(action.query);
        } else {
          // Deep-link variant — URL hydration runs the search on arrival.
          router.push(
            "/product-finder?" +
              buildShareQuery({ ...emptyFilterState(), query: action.query }, pageSize, ""),
          );
        }
        break;
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setPaletteOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setPaletteOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(moveSelection(selectedIndex, 1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(moveSelection(selectedIndex, -1, items.length));
    } else if (e.key === "Enter") {
      const item = items[selectedIndex];
      if (item) execute(item);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 print:hidden"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      tabIndex={-1}
    >
      <div className="mt-[15vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Input */}
        <div className="border-b border-[#B7C9D3] px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelected(0);
            }}
            placeholder="Type a command or search…"
            className="w-full text-sm text-[#1D252D] placeholder:text-[#4F758B]/60 focus:outline-none"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="pf-command-list"
            aria-expanded={items.length > 0}
            aria-haspopup="listbox"
            aria-label="Command palette input"
          />
        </div>

        {/* Results */}
        <div id="pf-command-list" role="listbox" className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#4F758B]">No commands match.</p>
          ) : (
            items.map((item, i) => (
              <div key={item.id}>
                {(i === 0 || items[i - 1].group !== item.group) && (
                  <p className="px-4 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#4F758B]">
                    {item.group}
                  </p>
                )}
                <button
                  ref={i === selectedIndex ? selectedRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={i === selectedIndex}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => execute(item)}
                  className={cn(
                    "flex w-full items-center border-l-2 px-4 py-2 text-left text-sm",
                    i === selectedIndex
                      ? "border-[#00AA13] bg-[#00AA13]/10 text-[#1D252D]"
                      : "border-transparent text-[#1D252D] hover:bg-[#B7C9D3]/20",
                  )}
                >
                  {item.label}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[#B7C9D3]/60 bg-[#F8FAFB] px-4 py-2">
          <p className="text-[10px] text-[#4F758B]">
            ↑↓ navigate · Enter run · Esc close
          </p>
        </div>
      </div>
    </div>
  );
}
