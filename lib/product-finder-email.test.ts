import { describe, it, expect } from "vitest";
import {
  isValidEmail, guessRecipient, defaultQuoteSubject, defaultQuoteBody,
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
