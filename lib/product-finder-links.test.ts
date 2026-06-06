import { describe, it, expect } from "vitest";
import { externalSearchLinks } from "@/lib/product-finder-links";
import type { WescoProduct } from "@/features/product-finder/types";

// ─── Minimal product factory ──────────────────────────────────────────────────

function makeProduct(overrides: Partial<WescoProduct> = {}): WescoProduct {
  return {
    id: "TEST-001",
    sku: "TST001",
    name: "Test Breaker",
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "A test breaker",
    unitPrice: 10.00,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
    ...overrides,
  };
}

// ─── Per-distributor URL mapping ──────────────────────────────────────────────

describe("per-distributor URL mapping", () => {
  it("maps Grainger to its search URL with encoded query", () => {
    const product = makeProduct({
      brand: "Square D",
      name: "QO115",
      externalSources: [
        { distributor: "Grainger", url: "https://www.grainger.com", price: 8.99, quantity: 10, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Grainger" && l.price !== undefined);
    expect(row).toBeDefined();
    expect(row!.url).toBe("https://www.grainger.com/search?searchQuery=Square%20D%20QO115");
  });

  it("maps Graybar to its search URL", () => {
    const product = makeProduct({
      brand: "Eaton",
      name: "CH115",
      externalSources: [
        { distributor: "Graybar", url: "https://www.graybar.com", price: 7.50, quantity: 5, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Graybar");
    expect(row).toBeDefined();
    expect(row!.url).toBe("https://www.graybar.com/search/?text=Eaton%20CH115");
  });

  it("maps Platt Electric Supply to its search URL", () => {
    const product = makeProduct({
      brand: "Siemens",
      name: "Q115",
      externalSources: [
        { distributor: "Platt Electric Supply", url: "https://www.platt.com", price: 6.80, quantity: 20, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Platt Electric Supply");
    expect(row).toBeDefined();
    expect(row!.url).toBe("https://www.platt.com/search?text=Siemens%20Q115");
  });

  it("maps Rexel USA to its search URL", () => {
    const product = makeProduct({
      brand: "GE Industrial",
      name: "THQL1115",
      externalSources: [
        { distributor: "Rexel USA", url: "https://www.rexelusa.com", price: 7.80, quantity: 88, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Rexel USA");
    expect(row).toBeDefined();
    expect(row!.url).toBe("https://www.rexelusa.com/s?q=GE%20Industrial%20THQL1115");
  });
});

// ─── Fallback to Google for unknown distributor ───────────────────────────────

describe("unknown distributor fallback", () => {
  it("falls back to Google search URL for an unknown distributor", () => {
    const product = makeProduct({
      brand: "Acme",
      name: "Widget",
      externalSources: [
        { distributor: "Sonepar USA", url: "https://www.sonepar.us", price: 12.00, quantity: 3, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Sonepar USA");
    expect(row).toBeDefined();
    expect(row!.url).toBe("https://www.google.com/search?q=Acme%20Widget+Sonepar%20USA");
  });
});

// ─── Price / quantity / leadTime passthrough ──────────────────────────────────

describe("sourced row display data passthrough", () => {
  it("passes through price and quantity from externalSources", () => {
    const product = makeProduct({
      brand: "Square D",
      name: "QO115",
      externalSources: [
        { distributor: "Grainger", url: "https://www.grainger.com", price: 31.20, quantity: 48, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Grainger" && l.price !== undefined);
    expect(row!.price).toBe(31.20);
    expect(row!.quantity).toBe(48);
  });

  it("passes through leadTime when present", () => {
    const product = makeProduct({
      brand: "Square D",
      name: "QO115",
      externalSources: [
        { distributor: "Graybar", url: "https://www.graybar.com", price: 30.75, quantity: 24, status: "in-stock", leadTime: "2-3 days" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Graybar");
    expect(row!.leadTime).toBe("2-3 days");
  });

  it("omits leadTime when not present in source", () => {
    const product = makeProduct({
      brand: "Eaton",
      name: "CH115",
      externalSources: [
        { distributor: "Graybar", url: "https://www.graybar.com", price: 7.50, quantity: 5, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Graybar");
    expect(row!.leadTime).toBeUndefined();
  });
});

// ─── Generic fallback rows ────────────────────────────────────────────────────

describe("generic fallback rows", () => {
  it("appends Grainger, Zoro, Home Depot when externalSources is empty", () => {
    const product = makeProduct({ brand: "Acme", name: "Widget" });
    const links = externalSearchLinks(product);
    const distributors = links.map((l) => l.distributor);
    expect(distributors).toContain("Grainger");
    expect(distributors).toContain("Zoro");
    expect(distributors).toContain("Home Depot");
  });

  it("empty externalSources yields exactly 3 rows", () => {
    const product = makeProduct({ brand: "Acme", name: "Widget" });
    const links = externalSearchLinks(product);
    expect(links).toHaveLength(3);
  });

  it("generic rows have no price, quantity, or leadTime", () => {
    const product = makeProduct({ brand: "Acme", name: "Widget" });
    const links = externalSearchLinks(product);
    for (const row of links) {
      expect(row.price).toBeUndefined();
      expect(row.quantity).toBeUndefined();
      expect(row.leadTime).toBeUndefined();
    }
  });

  it("Zoro generic row uses correct URL format", () => {
    const product = makeProduct({ brand: "Acme", name: "Widget" });
    const links = externalSearchLinks(product);
    const zoro = links.find((l) => l.distributor === "Zoro");
    expect(zoro!.url).toBe("https://www.zoro.com/search?q=Acme%20Widget");
  });

  it("Home Depot generic row uses correct URL format", () => {
    const product = makeProduct({ brand: "Acme", name: "Widget" });
    const links = externalSearchLinks(product);
    const hd = links.find((l) => l.distributor === "Home Depot");
    expect(hd!.url).toBe("https://www.homedepot.com/s/Acme%20Widget");
  });

  it("generic Grainger row uses correct URL format", () => {
    const product = makeProduct({ brand: "Acme", name: "Widget" });
    const links = externalSearchLinks(product);
    const grainger = links.find((l) => l.distributor === "Grainger");
    expect(grainger!.url).toBe("https://www.grainger.com/search?searchQuery=Acme%20Widget");
  });
});

// ─── Deduplication ────────────────────────────────────────────────────────────

describe("deduplication of generic rows", () => {
  it("does not add generic Grainger row when Grainger is already sourced", () => {
    const product = makeProduct({
      brand: "Square D",
      name: "QO115",
      externalSources: [
        { distributor: "Grainger", url: "https://www.grainger.com", price: 8.50, quantity: 100, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const graingerRows = links.filter((l) => l.distributor === "Grainger");
    expect(graingerRows).toHaveLength(1);
  });

  it("adds generic Zoro and Home Depot when only Grainger is sourced", () => {
    const product = makeProduct({
      brand: "Square D",
      name: "QO115",
      externalSources: [
        { distributor: "Grainger", url: "https://www.grainger.com", price: 8.50, quantity: 100, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const distributors = links.map((l) => l.distributor);
    expect(distributors).toContain("Zoro");
    expect(distributors).toContain("Home Depot");
    // Grainger appears exactly once (sourced row, no generic duplicate)
    expect(links.filter((l) => l.distributor === "Grainger")).toHaveLength(1);
  });
});

// ─── URL encoding edge cases ──────────────────────────────────────────────────

describe("URL encoding edge cases", () => {
  it("encodes spaces correctly", () => {
    const product = makeProduct({
      brand: "Leviton",
      name: "Decora Plus",
      externalSources: [
        { distributor: "Grainger", url: "https://www.grainger.com", price: 5.00, quantity: 10, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Grainger" && l.price !== undefined);
    expect(row!.url).toContain("Leviton%20Decora%20Plus");
  });

  it("encodes ampersand in product name", () => {
    const product = makeProduct({
      brand: "Hubbell",
      name: "Lock & Load Switch",
      externalSources: [
        { distributor: "Graybar", url: "https://www.graybar.com", price: 15.00, quantity: 5, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Graybar");
    expect(row!.url).not.toContain("&");
    expect(row!.url).toContain("%26");
  });

  it('encodes double-quote in product name', () => {
    const product = makeProduct({
      brand: "Southwire",
      name: '12/2 NM-B Wire "Romex Style"',
      externalSources: [
        { distributor: "Grainger", url: "https://www.grainger.com", price: 45.00, quantity: 1, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Grainger" && l.price !== undefined);
    expect(row!.url).not.toMatch(/"/);
    expect(row!.url).toContain("%22");
  });

  it("encodes fraction-style product names (1/2 inch)", () => {
    const product = makeProduct({
      brand: "Rigid",
      name: '1/2" EMT Conduit',
      externalSources: [
        { distributor: "Platt Electric Supply", url: "https://www.platt.com", price: 3.20, quantity: 50, status: "in-stock" },
      ],
    });
    const links = externalSearchLinks(product);
    const row = links.find((l) => l.distributor === "Platt Electric Supply");
    expect(row!.url).toContain("1%2F2");
    expect(row!.url).toContain("%22");
  });

  it("encodes generic fallback row URLs for special characters in brand/name", () => {
    const product = makeProduct({ brand: "A&B Corp", name: 'Widget "Pro"' });
    const links = externalSearchLinks(product);
    for (const row of links) {
      // No raw & or " should survive outside of the base URL structure
      // (the query portion of the URL must be encoded)
      const queryStart = row.url.indexOf("=") !== -1
        ? row.url.indexOf("=") + 1
        : row.url.lastIndexOf("/") + 1;
      const queryPart = row.url.slice(queryStart);
      expect(queryPart).not.toContain('"');
    }
  });
});
