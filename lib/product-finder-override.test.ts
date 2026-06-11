import { describe, it, expect, beforeEach } from "vitest";
import {
  OVERRIDE_MIN_MARGIN,
  overrideBounds,
  clampOverride,
  isOutOfBounds,
} from "@/lib/product-finder-override";
import { estimatedUnitCost, marginPct } from "@/lib/product-finder-margin";
import { CATALOG_PRODUCTS } from "@/data/mock/catalog-products";
import type { CatalogProduct } from "@/features/product-finder/types";
import { useProductFinder, selectCartTotal, lineUnitPrice } from "@/lib/product-finder-store";

const product = CATALOG_PRODUCTS[0] as CatalogProduct;

describe("overrideBounds", () => {
  it("max is list price", () => {
    expect(overrideBounds(product).max).toBe(Math.round(product.unitPrice * 100) / 100);
  });

  it("min preserves at least OVERRIDE_MIN_MARGIN over estimated cost", () => {
    const { min } = overrideBounds(product);
    const pct = marginPct(min, estimatedUnitCost(product));
    // round2 can shave a hair off; allow a tiny epsilon below 5%
    expect(pct).toBeGreaterThanOrEqual(OVERRIDE_MIN_MARGIN - 0.001);
  });

  it("min < max for every catalog product (cost ratio is clamped ≤ 0.92)", () => {
    for (const p of CATALOG_PRODUCTS.slice(0, 50)) {
      const { min, max } = overrideBounds(p);
      expect(min).toBeLessThan(max);
    }
  });

  it("is deterministic", () => {
    expect(overrideBounds(product)).toEqual(overrideBounds(product));
  });
});

describe("clampOverride", () => {
  it("passes through an in-band price (rounded to cents)", () => {
    const { min, max } = overrideBounds(product);
    const mid = (min + max) / 2;
    const clamped = clampOverride(product, mid);
    expect(clamped).toBeGreaterThanOrEqual(min);
    expect(clamped).toBeLessThanOrEqual(max);
    expect(clamped).toBeCloseTo(mid, 1);
  });

  it("clamps below-band to min", () => {
    const { min } = overrideBounds(product);
    expect(clampOverride(product, 0.01)).toBe(min);
  });

  it("clamps above-band to max (list price)", () => {
    const { max } = overrideBounds(product);
    expect(clampOverride(product, product.unitPrice * 10)).toBe(max);
  });

  it("treats NaN / zero / negative as band minimum", () => {
    const { min } = overrideBounds(product);
    expect(clampOverride(product, NaN)).toBe(min);
    expect(clampOverride(product, 0)).toBe(min);
    expect(clampOverride(product, -5)).toBe(min);
    // Non-finite input is invalid → clamps to the safe minimum, not max
    expect(clampOverride(product, Infinity)).toBe(min);
  });

  it("rounds to 2 decimals", () => {
    const { min, max } = overrideBounds(product);
    const v = clampOverride(product, (min + max) / 2 + 0.00123);
    expect(v).toBe(Math.round(v * 100) / 100);
  });
});

describe("isOutOfBounds", () => {
  it("flags out-of-band and invalid requests", () => {
    const { min, max } = overrideBounds(product);
    expect(isOutOfBounds(product, min - 0.5)).toBe(true);
    expect(isOutOfBounds(product, max + 0.5)).toBe(true);
    expect(isOutOfBounds(product, NaN)).toBe(true);
    expect(isOutOfBounds(product, 0)).toBe(true);
    expect(isOutOfBounds(product, (min + max) / 2)).toBe(false);
  });
});

// ─── Store integration ────────────────────────────────────────────────────────

describe("store price overrides", () => {
  beforeEach(() => {
    useProductFinder.setState({
      cart: {},
      priceOverrides: {},
      quotes: [],
      orders: [],
      savedBaskets: [],
      activeCustomerId: null,
    });
  });

  it("setPriceOverride clamps into the allowed band", () => {
    const s = useProductFinder.getState();
    s.addToCart(product, 1);
    s.setPriceOverride(product.id, 0.01);
    expect(useProductFinder.getState().priceOverrides[product.id]).toBe(overrideBounds(product).min);
  });

  it("ignores overrides for products not in the cart", () => {
    useProductFinder.getState().setPriceOverride(product.id, 10);
    expect(useProductFinder.getState().priceOverrides[product.id]).toBeUndefined();
  });

  it("null clears the override; removeFromCart and clearCart drop overrides", () => {
    const s = useProductFinder.getState();
    s.addToCart(product, 1);
    s.setPriceOverride(product.id, product.unitPrice);
    s.setPriceOverride(product.id, null);
    expect(useProductFinder.getState().priceOverrides[product.id]).toBeUndefined();

    s.addToCart(product, 1);
    useProductFinder.getState().setPriceOverride(product.id, product.unitPrice);
    useProductFinder.getState().removeFromCart(product.id);
    expect(useProductFinder.getState().priceOverrides[product.id]).toBeUndefined();

    useProductFinder.getState().addToCart(product, 1);
    useProductFinder.getState().setPriceOverride(product.id, product.unitPrice);
    useProductFinder.getState().clearCart();
    expect(useProductFinder.getState().priceOverrides).toEqual({});
  });

  it("selectCartTotal and lineUnitPrice use the override", () => {
    const s = useProductFinder.getState();
    s.addToCart(product, 2);
    const { min } = overrideBounds(product);
    useProductFinder.getState().setPriceOverride(product.id, min);
    const state = useProductFinder.getState();
    expect(lineUnitPrice(state, product, 2)).toBe(min);
    expect(selectCartTotal(state)).toBeCloseTo(min * 2, 2);
  });

  it("saveQuote captures the overridden unitPrice per line and totals from it", () => {
    const s = useProductFinder.getState();
    s.addToCart(product, 3);
    const { min } = overrideBounds(product);
    useProductFinder.getState().setPriceOverride(product.id, min);
    useProductFinder.getState().saveQuote({ number: "Q-TEST-0001", customer: "Acme", project: "", now: 1_700_000_000_000 });
    const quote = useProductFinder.getState().quotes[0];
    expect(quote.lines[0].unitPrice).toBe(min);
    expect(quote.total).toBeCloseTo(min * 3, 2);
    // Min-margin override (5%) is below the 20% approval floor → needs approval
    expect(quote.approvalStatus).toBe("pending");
  });

  it("placeOrder totals use the override", () => {
    const s = useProductFinder.getState();
    s.addToCart(product, 2);
    const { min } = overrideBounds(product);
    useProductFinder.getState().setPriceOverride(product.id, min);
    useProductFinder.getState().placeOrder(1_700_000_000_000);
    const order = useProductFinder.getState().orders[0];
    expect(order.total).toBeCloseTo(min * 2, 2);
    // placing the order empties the cart and its overrides
    expect(useProductFinder.getState().priceOverrides[product.id]).toBeUndefined();
  });
});
