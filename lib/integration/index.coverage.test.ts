import { describe, it, expect } from "vitest";
import {
  getCustomerProvider,
  getPricingProvider,
  getInventoryProvider,
  getCatalogProvider,
  getCrossReferenceProvider,
} from "@/lib/integration/index";
import { mockCustomerProvider } from "@/lib/integration/customers";
import { mockPricingProvider } from "@/lib/integration/pricing";
import { mockInventoryProvider } from "@/lib/integration/inventory";
import { mockCatalogProvider } from "@/lib/integration/catalog-source";
import { lookupCrossReference, crossReferencesFor } from "@/lib/integration/cross-reference";

describe("integration registry (index)", () => {
  it("returns each mock provider", () => {
    expect(getCustomerProvider()).toBe(mockCustomerProvider);
    expect(getPricingProvider()).toBe(mockPricingProvider);
    expect(getInventoryProvider()).toBe(mockInventoryProvider);
    expect(getCatalogProvider()).toBe(mockCatalogProvider);
  });

  it("wraps the pure cross-reference functions in a provider object", () => {
    const xref = getCrossReferenceProvider();
    expect(xref.lookup).toBe(lookupCrossReference);
    expect(xref.referencesFor).toBe(crossReferencesFor);
    // The wrapped functions are callable through the provider.
    expect(xref.lookup("definitely-not-a-real-sku")).toBeNull();
  });
});
