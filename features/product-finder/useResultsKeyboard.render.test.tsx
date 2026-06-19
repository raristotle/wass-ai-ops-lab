import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResultsKeyboard } from "@/features/product-finder/useResultsKeyboard";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

/** Dispatch a real keyboard event on window (where the hook listens). Returns the event so callers can assert preventDefault. */
function pressKey(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    window.dispatchEvent(ev);
  });
  return ev;
}

const A = prod("A");
const B = prod("B");
const C = prod("C");

function resetStore() {
  useProductFinder.setState({
    activeResultIndex: -1,
    cart: {},
    compareIds: new Set(),
    detailModalProduct: null,
    keyboardHelpOpen: false,
  });
}

describe("useResultsKeyboard (hook)", () => {
  beforeEach(() => resetStore());
  afterEach(() => {
    // Remove any leftover aria-modal nodes so cross-test guards don't leak.
    document.querySelectorAll('[aria-modal="true"]').forEach((n) => n.remove());
    resetStore();
  });

  it("smoke: mounts without throwing and leaves the highlight cleared for a fresh list", () => {
    const { unmount } = renderHook(() => useResultsKeyboard([A, B, C]));
    // No tracked id yet → reconciliation leaves the index at -1.
    expect(useProductFinder.getState().activeResultIndex).toBe(-1);
    unmount(); // listener cleanup path
  });

  it("j / ArrowDown move the highlight down and clamp at the last row", () => {
    renderHook(() => useResultsKeyboard([A, B, C]));
    pressKey("j"); // -1 → 0
    expect(useProductFinder.getState().activeResultIndex).toBe(0);
    pressKey("ArrowDown"); // 0 → 1
    expect(useProductFinder.getState().activeResultIndex).toBe(1);
    pressKey("j"); // 1 → 2
    pressKey("j"); // clamp at len-1 (2)
    expect(useProductFinder.getState().activeResultIndex).toBe(2);
  });

  it("k / ArrowUp move the highlight up and clamp at the first row", () => {
    useProductFinder.setState({ activeResultIndex: 2 });
    renderHook(() => useResultsKeyboard([A, B, C]));
    // The mount reconciliation clears the highlight (no tracked id), so re-seed via j.
    pressKey("j"); // → 0
    pressKey("j"); // → 1
    pressKey("k"); // 1 → 0
    expect(useProductFinder.getState().activeResultIndex).toBe(0);
    pressKey("ArrowUp"); // clamp at 0
    expect(useProductFinder.getState().activeResultIndex).toBe(0);
  });

  it("j / k are inert (early-return) when the list is empty", () => {
    renderHook(() => useResultsKeyboard([]));
    const down = pressKey("j");
    const up = pressKey("k");
    expect(useProductFinder.getState().activeResultIndex).toBe(-1);
    // Empty-list branch returns before preventDefault.
    expect(down.defaultPrevented).toBe(false);
    expect(up.defaultPrevented).toBe(false);
  });

  it("'a' adds the highlighted product to the cart", () => {
    renderHook(() => useResultsKeyboard([A, B, C]));
    // No highlight yet → 'a' is a no-op.
    pressKey("a");
    expect(Object.keys(useProductFinder.getState().cart)).toHaveLength(0);
    pressKey("j"); // highlight A
    pressKey("a");
    expect(useProductFinder.getState().cart["A"]?.qty).toBe(1);
  });

  it("'c' toggles compare for the highlighted product", () => {
    renderHook(() => useResultsKeyboard([A, B, C]));
    pressKey("j"); // highlight A
    pressKey("c");
    expect(useProductFinder.getState().compareIds.has("A")).toBe(true);
    pressKey("c");
    expect(useProductFinder.getState().compareIds.has("A")).toBe(false);
  });

  it("Enter opens the detail modal for the highlighted product", () => {
    renderHook(() => useResultsKeyboard([A, B, C]));
    pressKey("j"); // highlight A
    pressKey("j"); // highlight B
    pressKey("Enter");
    expect(useProductFinder.getState().detailModalProduct?.id).toBe("B");
  });

  it("'?' opens the keyboard-help overlay regardless of highlight", () => {
    renderHook(() => useResultsKeyboard([A, B, C]));
    const ev = pressKey("?");
    expect(useProductFinder.getState().keyboardHelpOpen).toBe(true);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("ignores modified keypresses (ctrl/meta/alt) so browser shortcuts pass through", () => {
    renderHook(() => useResultsKeyboard([A, B, C]));
    pressKey("j", { ctrlKey: true });
    pressKey("j", { metaKey: true });
    pressKey("j", { altKey: true });
    expect(useProductFinder.getState().activeResultIndex).toBe(-1);
  });

  it("does nothing when the event target is a typing field", () => {
    renderHook(() => useResultsKeyboard([A, B, C]));
    const input = document.createElement("input");
    document.body.appendChild(input);
    const ev = new KeyboardEvent("keydown", { key: "j", bubbles: true, cancelable: true });
    Object.defineProperty(ev, "target", { value: input, configurable: true });
    act(() => window.dispatchEvent(ev));
    expect(useProductFinder.getState().activeResultIndex).toBe(-1);
    input.remove();
  });

  it("is inert while a dialog (aria-modal) is open", () => {
    const modal = document.createElement("div");
    modal.setAttribute("aria-modal", "true");
    document.body.appendChild(modal);
    renderHook(() => useResultsKeyboard([A, B, C]));
    pressKey("j");
    expect(useProductFinder.getState().activeResultIndex).toBe(-1);
    modal.remove();
  });

  it("highlight follows the tracked product by id across a re-sort", () => {
    const { rerender } = renderHook(({ list }) => useResultsKeyboard(list), {
      initialProps: { list: [A, B, C] },
    });
    pressKey("j"); // highlight A (index 0)
    pressKey("j"); // highlight B (index 1)
    expect(useProductFinder.getState().activeResultIndex).toBe(1);
    // Re-sort so B moves to index 0 — the highlight must track B, not stay at 1.
    act(() => rerender({ list: [B, A, C] }));
    expect(useProductFinder.getState().activeResultIndex).toBe(0);
  });

  it("highlight clears when the tracked product drops out of the results", () => {
    const { rerender } = renderHook(({ list }) => useResultsKeyboard(list), {
      initialProps: { list: [A, B, C] },
    });
    pressKey("j"); // highlight A (index 0)
    expect(useProductFinder.getState().activeResultIndex).toBe(0);
    // Remove A from the list — the highlight should clear to -1.
    act(() => rerender({ list: [B, C] }));
    expect(useProductFinder.getState().activeResultIndex).toBe(-1);
  });

  it("scrolls the highlighted row into view (uses [data-result-index] lookup)", () => {
    const row = document.createElement("div");
    row.setAttribute("data-result-index", "0");
    let scrolled = false;
    row.scrollIntoView = () => {
      scrolled = true;
    };
    document.body.appendChild(row);
    renderHook(() => useResultsKeyboard([A, B, C]));
    pressKey("j"); // active → 0, triggers the scroll effect
    expect(scrolled).toBe(true);
    row.remove();
  });
});
