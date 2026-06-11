import { describe, it, expect } from "vitest";
import {
  isValidEmail, guessRecipient, defaultQuoteSubject, defaultQuoteBody, quoteEmailHtml,
} from "@/lib/product-finder-email";

describe("isValidEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidEmail("purchasing@acme.com")).toBe(true);
    expect(isValidEmail("  a.b@sub.example.co  ")).toBe(true);
  });
  it("rejects malformed addresses", () => {
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a @b.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("guessRecipient", () => {
  it("builds a purchasing@ address from a company name", () => {
    expect(guessRecipient("Gulf Coast Industrial")).toBe("purchasing@gulfcoastindustrial.com");
  });
  it("returns empty for a blank name", () => {
    expect(guessRecipient("   ")).toBe("");
  });
});

describe("defaultQuoteSubject", () => {
  it("includes the quote number", () => {
    expect(defaultQuoteSubject("Q-20260608-0001")).toContain("Q-20260608-0001");
  });
});

describe("defaultQuoteBody", () => {
  it("includes customer, number, total, and rep", () => {
    const body = defaultQuoteBody({ customer: "Acme", quoteNumber: "Q-1", total: 1234.5, rep: "Sarah Chen" });
    expect(body).toContain("Hi Acme,");
    expect(body).toContain("Q-1");
    expect(body).toContain("$1234.50");
    expect(body).toContain("Sarah Chen");
  });
  it("falls back to a generic greeting and signoff", () => {
    const body = defaultQuoteBody({ customer: "", quoteNumber: "Q-1", total: 10, rep: "" });
    expect(body).toContain("Hello,");
    expect(body).toContain("Meridian Supply Co.");
  });
});

describe("quoteEmailHtml", () => {
  const input = {
    customer: "Gulf Coast Industrial",
    quoteNumber: "Q-20260611-0001",
    lines: [
      { sku: "QO115", name: "Square D QO115", qty: 10, unitPrice: 8.45 },
      { sku: "CH115", name: "Eaton <CH115> & Co", qty: 2, unitPrice: 7.5 },
    ],
    total: 99.5,
    rep: "Sarah Chen",
    branch: "Houston Downtown",
    linkUrl: "https://app.raristotle.com/product-finder/quote?q=abc123",
    note: "Crane access required",
    terms: ["Net 30 days.", "Freight allowed over $2,500."],
  };

  it("renders every line with extended totals and the grand total", () => {
    const html = quoteEmailHtml(input);
    expect(html).toContain("QO115");
    expect(html).toContain("$84.50"); // 10 × 8.45
    expect(html).toContain("$99.50");
    expect(html).toContain("Q-20260611-0001");
    expect(html).toContain("Sarah Chen");
  });

  it("escapes HTML in product names, notes, and terms", () => {
    const html = quoteEmailHtml(input);
    expect(html).toContain("Eaton &lt;CH115&gt; &amp; Co");
    expect(html).not.toContain("<CH115>");
  });

  it("includes the acceptance link as the CTA", () => {
    const html = quoteEmailHtml(input);
    expect(html).toContain('href="https://app.raristotle.com/product-finder/quote?q=abc123"');
    expect(html).toContain("Review &amp; Accept Quote");
  });

  it("renders note and terms blocks only when present", () => {
    const html = quoteEmailHtml(input);
    expect(html).toContain("Crane access required");
    expect(html).toContain("Net 30 days.");
    const bare = quoteEmailHtml({ ...input, note: undefined, terms: undefined });
    expect(bare).not.toContain("Note:");
    expect(bare).not.toContain("Terms &amp; Conditions");
  });

  it("greets the customer by name, with a fallback", () => {
    expect(quoteEmailHtml(input)).toContain("Hi Gulf Coast Industrial,");
    expect(quoteEmailHtml({ ...input, customer: "" })).toContain("Hello,");
  });
});
