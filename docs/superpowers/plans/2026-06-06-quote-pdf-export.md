# Quote / Proposal PDF Export (F3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Generate Quote (PDF)" button to CartDrawer that opens an in-drawer printable quote block with customer/project fields, auto-generated quote number, tiered line-item pricing, and Wesco-branded print layout.

**Architecture:** Extract two pure helpers (`quoteNumber`, `quoteValidityDate`) into `lib/product-finder-quote.ts` so they can be unit-tested with injected dates. The CartDrawer gets a `quoteOpen` toggle boolean (local state only — no store change), and when open renders a `<section id="quote-sheet">` below the cart list. Print scoping mirrors ProductDetailModal: the drawer panel gets `print:static print:h-auto print:overflow-visible`, the overlay and cart list/footer get `print:hidden`, and the shell's existing `print:hidden` on chrome is already in place. Customer and Project values are controlled inputs persisted to `localStorage` under `pf_quote_customer`/`pf_quote_project` with `typeof localStorage` guards.

**Tech Stack:** Next.js App Router, React 19 (hooks), Zustand (read-only: `cart`, `user`, `selectCartTotal`), `tierUnitPrice` from `lib/product-finder-pricing.ts`, Tailwind CSS 3 print variants, Vitest for pure helpers.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/product-finder-quote.ts` | **Create** | Two pure functions: `quoteNumber(date, seq?)` and `quoteValidityDate(date)` |
| `lib/product-finder-quote.test.ts` | **Create** | Unit tests for both functions |
| `features/product-finder/CartDrawer.tsx` | **Modify** | Add Generate Quote button + `#quote-sheet` in-drawer block + print classes |

---

## Task 1: Pure helpers — `lib/product-finder-quote.ts`

**Files:**
- Create: `lib/product-finder-quote.ts`

- [ ] **Step 1: Create the file with two pure helpers**

```typescript
// lib/product-finder-quote.ts

/**
 * Formats a quote number: Q-YYYYMMDD-XXXX
 * seq defaults to a 4-digit zero-padded number derived from the date's
 * milliseconds-within-minute (deterministic given an injected date).
 *
 * In the component, call: quoteNumber(new Date())
 */
export function quoteNumber(date: Date, seq?: number): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const datePart = `${yyyy}${mm}${dd}`;
  const seqPart = seq !== undefined
    ? String(seq).padStart(4, "0")
    : String(date.getSeconds() * 1000 + date.getMilliseconds()).padStart(4, "0").slice(0, 4);
  return `Q-${datePart}-${seqPart}`;
}

/**
 * Returns a new Date that is `days` calendar days after `date`.
 * Used to compute the "Valid until" date (30 days from today).
 *
 * In the component, call: quoteValidityDate(new Date())
 */
export function quoteValidityDate(date: Date, days = 30): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Formats a Date as "Month DD, YYYY" (e.g. "June 6, 2026").
 * Pure — safe to unit-test.
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
```

---

## Task 2: Unit tests — `lib/product-finder-quote.test.ts`

**Files:**
- Create: `lib/product-finder-quote.test.ts`
- Test: `lib/product-finder-quote.test.ts`

- [ ] **Step 1: Write the tests**

```typescript
import { describe, it, expect } from "vitest";
import { quoteNumber, quoteValidityDate, formatDisplayDate } from "@/lib/product-finder-quote";

// Fixed date for deterministic tests: 2026-06-06, 14:05:03.042
const FIXED = new Date(2026, 5, 6, 14, 5, 3, 42); // month is 0-indexed

describe("quoteNumber", () => {
  it("produces Q-YYYYMMDD-XXXX format", () => {
    const result = quoteNumber(FIXED, 1);
    expect(result).toMatch(/^Q-\d{8}-\d{4}$/);
  });

  it("encodes the correct date part", () => {
    const result = quoteNumber(FIXED, 1);
    expect(result.startsWith("Q-20260606-")).toBe(true);
  });

  it("zero-pads seq to 4 digits", () => {
    expect(quoteNumber(FIXED, 1)).toBe("Q-20260606-0001");
    expect(quoteNumber(FIXED, 99)).toBe("Q-20260606-0099");
    expect(quoteNumber(FIXED, 1000)).toBe("Q-20260606-1000");
  });

  it("uses provided seq when given", () => {
    expect(quoteNumber(FIXED, 42)).toBe("Q-20260606-0042");
  });

  it("auto-derives seq from seconds+ms when seq is omitted (deterministic given same date)", () => {
    const a = quoteNumber(FIXED);
    const b = quoteNumber(FIXED);
    expect(a).toBe(b); // same date → same result
    expect(a).toMatch(/^Q-20260606-\d{4}$/);
  });

  it("different dates produce different date parts", () => {
    const other = new Date(2025, 0, 1, 0, 0, 0, 0);
    expect(quoteNumber(other, 1).startsWith("Q-20250101-")).toBe(true);
  });

  it("month is zero-padded", () => {
    const jan = new Date(2026, 0, 5); // January
    expect(quoteNumber(jan, 1)).toBe("Q-20260105-0001");
  });

  it("day is zero-padded", () => {
    const early = new Date(2026, 5, 6); // June 6
    expect(quoteNumber(early, 1)).toBe("Q-20260606-0001");
  });
});

describe("quoteValidityDate", () => {
  it("adds 30 days by default", () => {
    const start = new Date(2026, 5, 6); // June 6
    const valid = quoteValidityDate(start);
    expect(valid.getFullYear()).toBe(2026);
    expect(valid.getMonth()).toBe(6); // July (0-indexed)
    expect(valid.getDate()).toBe(6);
  });

  it("does not mutate the input date", () => {
    const start = new Date(2026, 5, 6);
    const startCopy = new Date(start);
    quoteValidityDate(start);
    expect(start.getTime()).toBe(startCopy.getTime());
  });

  it("handles month rollover (Jan 20 + 30 = Feb 19)", () => {
    const jan20 = new Date(2026, 0, 20);
    const result = quoteValidityDate(jan20);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(19);
  });

  it("handles year rollover (Dec 15 + 30 = Jan 14 next year)", () => {
    const dec15 = new Date(2026, 11, 15);
    const result = quoteValidityDate(dec15);
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(14);
  });

  it("accepts a custom days argument", () => {
    const start = new Date(2026, 5, 6);
    const result = quoteValidityDate(start, 7);
    expect(result.getDate()).toBe(13);
    expect(result.getMonth()).toBe(5); // still June
  });
});

describe("formatDisplayDate", () => {
  it("formats a date as 'Month DD, YYYY'", () => {
    const d = new Date(2026, 5, 6); // June 6, 2026
    expect(formatDisplayDate(d)).toBe("June 6, 2026");
  });

  it("formats single-digit day without padding", () => {
    const d = new Date(2026, 0, 1); // January 1, 2026
    expect(formatDisplayDate(d)).toBe("January 1, 2026");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail (lib not yet created — but lib IS created in Task 1, so run now)**

```bash
npx vitest run lib/product-finder-quote.test.ts
```

Expected: All tests PASS (Task 1 was written first).

- [ ] **Step 3: Commit the pure helpers + tests**

```bash
git add lib/product-finder-quote.ts lib/product-finder-quote.test.ts
git commit -m "feat(product-finder): add pure quote-number and validity-date helpers with tests"
```

---

## Task 3: CartDrawer — quote button + in-drawer quote sheet

**Files:**
- Modify: `features/product-finder/CartDrawer.tsx`

This task replaces the entire file. Read the current file first (already done in planning), then apply the full replacement below.

Key changes:
1. Import `quoteNumber`, `quoteValidityDate`, `formatDisplayDate` from `@/lib/product-finder-quote`.
2. Add `user` read from store (`useProductFinder((s) => s.user)`).
3. Add local state: `quoteOpen` (boolean), `customer` (string), `project` (string).
4. `useEffect` on mount: hydrate `customer`/`project` from `localStorage` (guarded on `typeof localStorage`).
5. `useEffect` watching `customer`/`project`: persist to `localStorage`.
6. Inside the drawer panel add a **Generate Quote (PDF)** button in the footer (disabled when cart empty; already in footer area — add before or after the existing CTAs, replacing the no-op "Add to Quote" button).
7. When `quoteOpen`, render `<section id="quote-sheet">` with the full quote layout.
8. Add print classes to the drawer panel: `print:fixed print:inset-0 print:translate-x-0 print:w-full print:h-auto print:shadow-none print:overflow-visible` — ensures the drawer is the printable surface.
9. The overlay div gets `print:hidden`.
10. The cart items list div gets `print:hidden`.
11. The footer gets `print:hidden`.
12. The drawer header gets `print:hidden`.
13. The `#quote-sheet` itself is `hidden` when `!quoteOpen`, or just conditionally rendered and always `print:block`.

- [ ] **Step 1: Replace `features/product-finder/CartDrawer.tsx` with the full updated version**

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useProductFinder, selectCartCount, selectCartTotal } from "@/lib/product-finder-store";
import { tierUnitPrice, priceTiers } from "@/lib/product-finder-pricing";
import { quoteNumber, quoteValidityDate, formatDisplayDate } from "@/lib/product-finder-quote";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const cartOpen = useProductFinder((s) => s.cartOpen);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const cart = useProductFinder((s) => s.cart);
  const removeFromCart = useProductFinder((s) => s.removeFromCart);
  const updateCartQty = useProductFinder((s) => s.updateCartQty);
  const clearCart = useProductFinder((s) => s.clearCart);
  const cartCount = useProductFinder(selectCartCount);
  const cartTotal = useProductFinder(selectCartTotal);
  const user = useProductFinder((s) => s.user);

  const items = Object.values(cart);

  // ── Quote state ────────────────────────────────────────────────────────────
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [project, setProject] = useState("");

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    setCustomer(localStorage.getItem("pf_quote_customer") ?? "");
    setProject(localStorage.getItem("pf_quote_project") ?? "");
  }, []);

  // Persist customer/project changes
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("pf_quote_customer", customer);
  }, [customer]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("pf_quote_project", project);
  }, [project]);

  // Generate quote metadata once per open (stable for current session)
  const quoteDateRef = useRef<Date | null>(null);
  if (quoteOpen && quoteDateRef.current === null) {
    quoteDateRef.current = new Date();
  }
  if (!quoteOpen) {
    quoteDateRef.current = null;
  }
  const quoteDate = quoteDateRef.current ?? new Date();
  const quoteNum = quoteNumber(quoteDate);
  const validityDate = quoteValidityDate(quoteDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Overlay — hidden during print */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 print:hidden",
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel
          Screen: fixed slide-in panel
          Print: static, full-width, no transform, auto height — becomes printable surface
      */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-white shadow-2xl transition-transform duration-300 sm:w-96",
          "print:static print:translate-x-0 print:w-full print:h-auto print:overflow-visible print:shadow-none print:flex print:flex-col",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping basket"
      >
        {/* Header — hidden during print */}
        <div className="flex shrink-0 items-center justify-between bg-[#1D252D] px-5 py-4 print:hidden">
          <span className="font-semibold text-white">
            Basket ({cartCount} {cartCount === 1 ? "item" : "items"})
          </span>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="text-[#B7C9D3] transition-colors hover:text-white"
            aria-label="Close basket"
          >
            ✕
          </button>
        </div>

        {/* Items list — hidden during print */}
        <div className="flex-1 overflow-y-auto print:hidden">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <span className="text-5xl" role="img" aria-label="Empty cart">
                🛒
              </span>
              <p className="font-semibold text-[#1D252D]">Your basket is empty</p>
              <p className="text-sm text-[#4F758B]">
                Add products from the finder to build your quote or order.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#B7C9D3]">
              {items.map(({ product, qty }) => {
                const effectiveUnitPrice = tierUnitPrice(product, qty);
                const lineTotal = effectiveUnitPrice * qty;
                const tiers = priceTiers(product);
                const activeTier = [...tiers].reverse().find((t) => qty >= t.minQty);
                const hasVolBreak = activeTier !== undefined && activeTier.minQty > 1;
                return (
                  <li key={product.id} className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span
                        className="mt-0.5 text-2xl"
                        role="img"
                        aria-label={product.name}
                      >
                        {product.imageIcon}
                      </span>

                      {/* Name + SKU */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1D252D]">
                          {product.name}
                        </p>
                        <p className="text-xs text-[#4F758B]">SKU: {product.sku}</p>

                        {/* Unit price × qty */}
                        <p className="mt-1 text-xs text-[#4F758B]">
                          ${effectiveUnitPrice.toFixed(2)} × {qty} ={" "}
                          <span className="font-semibold text-[#1D252D]">
                            ${lineTotal.toFixed(2)}
                          </span>
                        </p>

                        {/* Vol. price note */}
                        {hasVolBreak && activeTier && (
                          <p className="mt-0.5 text-[10px] font-semibold text-[#00AA13]">
                            vol. price ({activeTier.minQty}+)
                          </p>
                        )}

                        {/* Qty stepper */}
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateCartQty(product.id, qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#B7C9D3] text-sm font-semibold text-[#1D252D] hover:border-[#4F758B]"
                            aria-label={`Decrease quantity of ${product.name}`}
                          >
                            −
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-semibold text-[#1D252D]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(product.id, qty + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#B7C9D3] text-sm font-semibold text-[#1D252D] hover:border-[#4F758B]"
                            aria-label={`Increase quantity of ${product.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="shrink-0 text-[#B7C9D3] transition-colors hover:text-red-600"
                        aria-label={`Remove ${product.name} from basket`}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer — hidden during print */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-[#B7C9D3] bg-white px-5 py-5 space-y-3 print:hidden">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4F758B]">Subtotal</span>
              <span className="text-xl font-bold text-[#1D252D]">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {/* Generate Quote CTA */}
            <Button
              className="w-full bg-[#1D252D] text-white hover:bg-[#2d3a47]"
              onClick={() => setQuoteOpen((v) => !v)}
              disabled={items.length === 0}
            >
              {quoteOpen ? "Hide Quote" : "Generate Quote (PDF)"}
            </Button>

            <Button
              className="w-full bg-[#00AA13] text-white hover:bg-[#009911]"
              onClick={() => {
                // Add to Quote — no-op in demo
              }}
            >
              Add to Quote
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#1D252D] text-[#1D252D] hover:bg-[#F8FAFB]"
              onClick={() => {
                // Add to Order — no-op in demo
              }}
            >
              Add to Order
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#4F758B] text-[#4F758B] hover:bg-[#EEF4F7]"
              onClick={() => {
                // Export BOM — no-op in demo
              }}
            >
              Export BOM
            </Button>

            {/* Clear cart */}
            <button
              type="button"
              onClick={clearCart}
              className="w-full text-center text-xs text-[#DB6B30] underline underline-offset-2 hover:text-[#c05a22]"
            >
              Clear basket
            </button>
          </div>
        )}

        {/* ── Quote Sheet ──────────────────────────────────────────────────────
            Screen: shown only when quoteOpen; sits below the footer.
            Print:  always rendered (print:block overrides hidden); the drawer
                    panel becomes the print surface via print:static above.
        ── */}
        {quoteOpen && (
          <section
            id="quote-sheet"
            className="border-t border-[#B7C9D3] bg-white px-6 py-6 overflow-y-auto print:border-0 print:px-8 print:py-8 print:overflow-visible"
          >
            {/* ── Quote header ─────────────────────────────── */}
            <div className="flex items-start justify-between mb-6 print:mb-8">
              {/* Wesco brand mark */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center rounded bg-[#00AA13] px-2 py-1 text-xs font-bold tracking-widest text-white">
                    WESCO
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#4F758B]">
                    Distribution
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[#1D252D] tracking-wide mt-1">
                  QUOTE
                </h1>
              </div>

              {/* Quote meta */}
              <div className="text-right text-sm">
                <p className="font-semibold text-[#1D252D]">{quoteNum}</p>
                <p className="text-[#4F758B]">Date: {formatDisplayDate(quoteDate)}</p>
                <p className="text-[#4F758B]">
                  Valid until: {formatDisplayDate(validityDate)}
                </p>
                <p className="text-xs text-[#4F758B] mt-0.5">Valid for 30 days</p>
              </div>
            </div>

            {/* ── Customer + Project inputs ────────────────── */}
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 print:grid-cols-2 print:mb-8">
              {/* Customer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#4F758B] mb-1">
                  Customer
                </label>
                {/* Screen: editable input */}
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Customer name"
                  className="w-full border border-[#B7C9D3] rounded px-2 py-1.5 text-sm text-[#1D252D] focus:outline-none focus:border-[#4F758B] print:hidden"
                />
                {/* Print: value as plain text */}
                <span className="hidden print:block text-sm text-[#1D252D] border-b border-[#B7C9D3] pb-0.5 min-h-[1.5rem]">
                  {customer || "—"}
                </span>
              </div>

              {/* Project */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#4F758B] mb-1">
                  Project / PO #
                </label>
                {/* Screen: editable input */}
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Project or PO number"
                  className="w-full border border-[#B7C9D3] rounded px-2 py-1.5 text-sm text-[#1D252D] focus:outline-none focus:border-[#4F758B] print:hidden"
                />
                {/* Print: value as plain text */}
                <span className="hidden print:block text-sm text-[#1D252D] border-b border-[#B7C9D3] pb-0.5 min-h-[1.5rem]">
                  {project || "—"}
                </span>
              </div>
            </div>

            {/* ── Prepared by ──────────────────────────────── */}
            {user && (
              <p className="text-xs text-[#4F758B] mb-6 print:mb-8">
                Prepared by:{" "}
                <span className="font-semibold text-[#1D252D]">{user.name}</span>
                {" · "}
                <span>{user.branch}</span>
              </p>
            )}

            {/* ── Line-item table ──────────────────────────── */}
            <div className="overflow-x-auto mb-4 print:mb-6">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1D252D]">
                    <th className="text-left px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      SKU
                    </th>
                    <th className="text-left px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      Product
                    </th>
                    <th className="text-right px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      Qty
                    </th>
                    <th className="text-right px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      Unit Price
                    </th>
                    <th className="text-right px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      Extended
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ product, qty }) => {
                    const unit = tierUnitPrice(product, qty);
                    const ext = unit * qty;
                    return (
                      <tr key={product.id} className="border-b border-[#B7C9D3]/60">
                        <td className="px-3 py-2 font-mono text-[#4F758B] border border-[#B7C9D3]/60">
                          {product.sku}
                        </td>
                        <td className="px-3 py-2 text-[#1D252D] border border-[#B7C9D3]/60">
                          {product.name}
                        </td>
                        <td className="px-3 py-2 text-right text-[#1D252D] border border-[#B7C9D3]/60">
                          {qty}
                        </td>
                        <td className="px-3 py-2 text-right text-[#1D252D] border border-[#B7C9D3]/60">
                          ${unit.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-[#1D252D] border border-[#B7C9D3]/60">
                          ${ext.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8FAFB]">
                    <td
                      colSpan={4}
                      className="px-3 py-2 text-right font-semibold text-[#1D252D] border border-[#B7C9D3]/60"
                    >
                      Subtotal / Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-[#1D252D] border border-[#B7C9D3]/60">
                      ${cartTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── Footer note ──────────────────────────────── */}
            <p className="text-[10px] text-[#4F758B] mb-6 print:mb-8">
              Pricing reflects volume tier discounts as of quote date. All prices in USD.
              This quote is valid for 30 days from the date of issue.
            </p>

            {/* ── Print button (screen only) ───────────────── */}
            <Button
              className="w-full bg-[#00AA13] text-white hover:bg-[#009911] print:hidden"
              onClick={handlePrint}
            >
              Print / Save as PDF
            </Button>
          </section>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: Zero errors. If TypeScript complains about `useRef` import, ensure the import line includes it: `import { useEffect, useState, useRef } from "react";`

---

## Task 4: Gate — run all tests and verify build

**Files:** (no new files — verification only)

- [ ] **Step 1: Run the new quote helper tests**

```bash
npx vitest run lib/product-finder-quote.test.ts
```

Expected: All tests PASS.

- [ ] **Step 2: Run the full test suite**

```bash
npm test
```

Expected: All tests PASS (pricing tests, store tests, etc. unchanged).

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: Zero errors.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: Build succeeds with no errors. Ignore any pre-existing warnings.

- [ ] **Step 5: Lint touched files**

```bash
npx eslint features/product-finder/CartDrawer.tsx lib/product-finder-quote.ts lib/product-finder-quote.test.ts --max-warnings 0
```

Expected: No errors (warnings are OK if pre-existing). If you see `react-hooks/exhaustive-deps` warnings on the `useEffect([customer])` / `useEffect([project])` guards, they are correct as-is — each effect has exactly one dep.

---

## Task 5: Commit

- [ ] **Step 1: Stage quote-related files only**

```bash
git add features/product-finder/CartDrawer.tsx lib/product-finder-quote.ts lib/product-finder-quote.test.ts
```

- [ ] **Step 2: Verify staged files**

```bash
git diff --staged --stat
```

Expected: Only the three files above appear.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(product-finder): generate printable quote/proposal PDF from the cart"
```

Expected: Commit succeeds. Note the SHA for the report.

---

## Self-Review Checklist

**Spec coverage (F3):**
- [x] "Generate Quote (PDF)" button in CartDrawer disabled when cart empty — Task 3, button has `disabled={items.length === 0}`
- [x] Reveals in-drawer quote block (`id="quote-sheet"`) — Task 3
- [x] Header: "QUOTE" + Wesco branding — Task 3, quote header section
- [x] Quote # format `Q-YYYYMMDD-XXXX` — `quoteNumber()` in Task 1
- [x] Date/number derived from `new Date()` INSIDE component only — Task 3 uses `quoteDateRef` seeded with `new Date()` inside the component
- [x] Today's date displayed — Task 3, `formatDisplayDate(quoteDate)`
- [x] "Valid for 30 days" line + validity date — Task 3, quote meta block
- [x] Customer + Project editable inputs — Task 3, controlled inputs
- [x] Persist to localStorage `pf_quote_customer` / `pf_quote_project` — Task 3, two `useEffect`s
- [x] Guarded on `typeof localStorage` — Task 3, both effects and the mount effect
- [x] Hydrate on mount via useEffect — Task 3, first `useEffect`
- [x] Prepared-by: `user.name` · `user.branch` — Task 3
- [x] Line table: SKU, Name, Qty, Unit (tierUnitPrice), Extended — Task 3, line-item table
- [x] Subtotal = `selectCartTotal` — Task 3, tfoot row uses `cartTotal`
- [x] Print inputs as values — Task 3, `print:hidden` on inputs + `hidden print:block` spans
- [x] Print button calls `window.print()` — Task 3, `handlePrint`
- [x] Reuse print scoping from ProductDetailModal — Task 3, drawer gets `print:static print:translate-x-0 print:w-full print:h-auto print:overflow-visible`; overlay, header, items list, footer get `print:hidden`
- [x] Shell chrome already `print:hidden` — confirmed in ProductFinderShell.tsx (header has `print:hidden`)
- [x] No new server — confirmed
- [x] No store schema change — confirmed (local state only)
- [x] Pure helpers extracted to `lib/product-finder-quote.ts` — Task 1
- [x] Pure helpers unit-tested — Task 2
- [x] `quoteValidityDate(today)` and `quoteNumber(today, seq?)` pure functions — Task 1
- [x] Component passes `new Date()` — Task 3

**Placeholder scan:** No TBD, TODO, or "implement later" found.

**Type consistency:**
- `quoteNumber(date: Date, seq?: number): string` — used as `quoteNumber(quoteDate)` in Task 3 ✓
- `quoteValidityDate(date: Date, days?: number): Date` — used as `quoteValidityDate(quoteDate)` in Task 3 ✓
- `formatDisplayDate(date: Date): string` — used in Task 3 ✓
- `items` is `{ product: WescoProduct; qty: number }[]` — matches store type ✓
- `user` is `AuthUser | null` with `.name` and `.branch` — confirmed from store ✓
