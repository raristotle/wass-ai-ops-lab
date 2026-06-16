import { describe, it, expect, afterEach, vi } from "vitest";
import {
  stripeTaxConfigured,
  buildTaxForm,
  calculateTax,
  type TaxQuoteInput,
} from "@/lib/integration/stripe-tax";

const INPUT: TaxQuoteInput = {
  currency: "usd",
  line_items: [
    { amount: 1499, reference: "L1" },
    { amount: 500, reference: "L2" },
  ],
  address: { country: "US", state: "WA", city: "Seattle", postal_code: "98104", line1: "920 5th Ave" },
  address_source: "shipping",
};

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_API_VERSION;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("stripeTaxConfigured", () => {
  it("is false when the key is unset (dormant)", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(stripeTaxConfigured()).toBe(false);
  });
  it("is false for whitespace and true for a real key", () => {
    process.env.STRIPE_SECRET_KEY = "   ";
    expect(stripeTaxConfigured()).toBe(false);
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    expect(stripeTaxConfigured()).toBe(true);
  });
});

describe("buildTaxForm", () => {
  it("form-encodes line items + address with Stripe's bracket syntax", () => {
    const f = buildTaxForm(INPUT);
    expect(f.get("currency")).toBe("usd");
    expect(f.get("line_items[0][amount]")).toBe("1499");
    expect(f.get("line_items[0][reference]")).toBe("L1");
    expect(f.get("line_items[1][amount]")).toBe("500");
    expect(f.get("customer_details[address][country]")).toBe("US");
    expect(f.get("customer_details[address][postal_code]")).toBe("98104");
    expect(f.get("customer_details[address][state]")).toBe("WA");
    expect(f.get("customer_details[address_source]")).toBe("shipping");
  });
  it("omits optional address fields that are absent", () => {
    const f = buildTaxForm({ ...INPUT, address: { country: "US" } });
    expect(f.get("customer_details[address][country]")).toBe("US");
    expect(f.get("customer_details[address][postal_code]")).toBeNull();
    expect(f.get("customer_details[address][state]")).toBeNull();
  });
});

describe("calculateTax", () => {
  it("returns not-configured and makes NO network call when dormant", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await calculateTax(INPUT);
    expect(r).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts form-encoded data with a Bearer header and parses the calculation when configured", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const calc = {
      object: "tax.calculation",
      amount_total: 2153,
      tax_amount_exclusive: 154,
      tax_amount_inclusive: 0,
      currency: "usd",
      tax_breakdown: [
        {
          amount: 154,
          inclusive: false,
          taxable_amount: 1999,
          taxability_reason: "standard_rated",
          tax_rate_details: { country: "US", state: "WA", percentage_decimal: "10.25", tax_type: "sales_tax" },
        },
      ],
    };
    const fetchSpy = vi.fn(async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify(calc), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const r = await calculateTax(INPUT);
    expect(r.enabled).toBe(true);
    if (r.enabled) {
      expect(r.calculation.tax_amount_exclusive).toBe(154);
      expect(r.calculation.amount_total).toBe(2153);
    }
    expect(calls.length).toBe(1);
    const cap = calls[0];
    expect(cap.url).toContain("/v1/tax/calculations");
    expect(new Headers(cap.init?.headers).get("authorization")).toBe("Bearer sk_test_x");
    expect(new Headers(cap.init?.headers).get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(String(cap.init?.body)).toContain("line_items");
  });

  it("returns error (and does not throw) on a Stripe error response", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ error: { type: "invalid_request_error", code: "x", param: "y" } }), {
          status: 400,
        }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const r = await calculateTax(INPUT);
    expect(r).toEqual({ enabled: false, reason: "error" });
  });
});
