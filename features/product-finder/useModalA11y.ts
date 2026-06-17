import { useEffect, useRef } from "react";

/**
 * Keyboard/focus a11y for a modal dialog (WCAG 2.2 2.1.2 / 2.4.3 + ARIA APG):
 * - moves focus to the close control once, on open (so focus enters the dialog),
 * - RESTORES focus to the triggering element when the dialog closes (or unmounts),
 * - closes on Escape,
 * - traps Tab/Shift+Tab within the dialog so focus can't escape to the page
 *   behind an `aria-modal` overlay.
 * Mirrors the established ProductDetailModal pattern. Returns a ref to place on
 * the dialog's close button; the dialog container is found via that ref's
 * nearest `[role="dialog"]`. onClose is read via a ref so the listener stays
 * stable and focus is taken only on the open transition (not every render).
 */
export function useModalA11y(open: boolean, onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    // Remember what had focus before the dialog took it, so we can return focus
    // there on close (WCAG 2.4.3). Skip <body> — there's nothing to restore to.
    const active = document.activeElement as HTMLElement | null;
    const trigger = active && active !== document.body ? active : null;
    closeRef.current?.focus();
    // Cleanup runs when `open` flips false OR the modal unmounts → restore focus,
    // covering both always-mounted (returns null) and conditionally-mounted modals.
    return () => {
      if (trigger && document.contains(trigger) && typeof trigger.focus === "function") {
        trigger.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = closeRef.current?.closest('[role="dialog"]') as HTMLElement | null;
      if (!dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (active && !dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return closeRef;
}
