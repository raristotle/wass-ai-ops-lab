"use client";

import { useEffect, useRef } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Keyboard-first power layer for the results surface (Superhuman-style). j/k (or
 * arrows) move a highlight, a = add to cart, c = toggle compare, Enter = open,
 * ? = shortcut help. Mounted by ProductGrid with the CURRENTLY-RENDERED list so
 * the highlight index aligns across list/grid/table views.
 *
 * The highlight FOLLOWS THE PRODUCT BY ID across result changes (search / re-sort
 * / load-more): if the highlighted product is still present its index is updated
 * to track it, otherwise the highlight clears — so the index can never drift onto
 * a different product after a re-sort. Inert while typing or any dialog is open.
 */
function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node || !node.tagName) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable === true;
}

export function useResultsKeyboard(products: CatalogProduct[]) {
  const active = useProductFinder((s) => s.activeResultIndex);
  const setActive = useProductFinder((s) => s.setActiveResultIndex);
  const addToCart = useProductFinder((s) => s.addToCart);
  const toggleCompare = useProductFinder((s) => s.toggleCompare);
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);
  const setKeyboardHelpOpen = useProductFinder((s) => s.setKeyboardHelpOpen);

  // Refs so the keydown listener can register ONCE yet always see the latest list
  // and index; activeIdRef tracks WHICH product is highlighted (for reconciliation).
  const productsRef = useRef(products);
  productsRef.current = products;
  const activeRef = useRef(active);
  activeRef.current = active;
  const activeIdRef = useRef<string | null>(null);

  // Reconcile the highlight to follow the tracked product across result changes.
  useEffect(() => {
    const id = activeIdRef.current;
    const idx = id == null ? -1 : products.findIndex((p) => p.id === id);
    activeIdRef.current = idx >= 0 ? id : null;
    setActive(idx);
  }, [products, setActive]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      // Don't hijack keys while any modal/dialog/palette is open.
      if (document.querySelector('[aria-modal="true"]')) return;

      const list = productsRef.current;
      const len = list.length;
      const cur = activeRef.current;
      const moveTo = (n: number) => {
        setActive(n);
        activeIdRef.current = list[n]?.id ?? null;
      };
      switch (e.key) {
        case "j":
        case "ArrowDown":
          if (len === 0) return;
          e.preventDefault();
          moveTo(cur < 0 ? 0 : Math.min(cur + 1, len - 1));
          break;
        case "k":
        case "ArrowUp":
          if (len === 0) return;
          e.preventDefault();
          moveTo(cur <= 0 ? 0 : cur - 1);
          break;
        case "a":
          if (cur >= 0 && cur < len) {
            e.preventDefault();
            addToCart(list[cur]);
          }
          break;
        case "c":
          if (cur >= 0 && cur < len) {
            e.preventDefault();
            toggleCompare(list[cur].id);
          }
          break;
        case "Enter":
          if (cur >= 0 && cur < len) {
            e.preventDefault();
            setDetailModalProduct(list[cur]);
          }
          break;
        case "?":
          e.preventDefault();
          setKeyboardHelpOpen(true);
          break;
        default:
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setActive, addToCart, toggleCompare, setDetailModalProduct, setKeyboardHelpOpen]);

  // Keep the highlighted item in view.
  useEffect(() => {
    if (active < 0) return;
    const el = document.querySelector<HTMLElement>(`[data-result-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);
}
