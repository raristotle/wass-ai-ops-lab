"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";

/** Keyboard shortcuts for the results power layer (#13). Opened with `?`. */
const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["j", "↓"], label: "Next result" },
  { keys: ["k", "↑"], label: "Previous result" },
  { keys: ["a"], label: "Add highlighted result to cart" },
  { keys: ["c"], label: "Toggle highlighted result in compare" },
  { keys: ["Enter"], label: "Open highlighted result" },
  { keys: ["Ctrl / ⌘", "K"], label: "Command palette" },
  { keys: ["?"], label: "Show this help" },
  { keys: ["Esc"], label: "Close a dialog" },
];

export function KeyboardHelpModal() {
  const open = useProductFinder((s) => s.keyboardHelpOpen);
  const setOpen = useProductFinder((s) => s.setKeyboardHelpOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <h2 className="text-base font-semibold text-white">Keyboard shortcuts</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close keyboard shortcuts"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>
        <ul className="divide-y divide-[#B7C9D3]/50 px-5 py-2">
          {SHORTCUTS.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-[#1D252D]">{s.label}</span>
              <span className="flex shrink-0 gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-[#B7C9D3] bg-[#F8FAFB] px-1.5 py-0.5 font-mono text-xs text-[#4F758B]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="px-5 pb-4 pt-1 text-[11px] text-[#4F758B]">
          Shortcuts act on the highlighted result and pause while you are typing or a dialog is open.
        </p>
      </div>
    </div>
  );
}
