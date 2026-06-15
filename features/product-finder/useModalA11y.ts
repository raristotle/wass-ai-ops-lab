import { useEffect, useRef } from "react";

/**
 * Keyboard/focus a11y for a modal dialog (WCAG 2.2 2.1.2 / 2.4.3):
 * - moves focus to the close control once, on open (so focus enters the dialog),
 * - closes on Escape.
 * Mirrors the established ProductDetailModal pattern. Returns a ref to place on
 * the dialog's close button. onClose is read via a ref so the keydown listener
 * stays stable and focus is taken only on the open transition (not every render).
 */
export function useModalA11y(open: boolean, onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return closeRef;
}
