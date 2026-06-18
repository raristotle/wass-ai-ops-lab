import { describe, expect, it } from "vitest";
import {
  newDepositRecord,
  transitionDeposit,
  publicDeposit,
  type DepositRecord,
} from "@/lib/product-finder-deposit";

const base = (over: Partial<DepositRecord> = {}): DepositRecord => ({
  ...newDepositRecord({
    id: "dep-1", quoteId: "Q-1", quoteNumber: "Q-20260618-0001", tenantId: "acme-com",
    amountCents: 3000, currency: "usd", sessionId: "cs_1", checkoutUrl: "https://checkout/cs_1", now: 1000,
  }),
  ...over,
});

describe("newDepositRecord", () => {
  it("starts as requested with timestamps and no paidAt", () => {
    const r = base();
    expect(r.status).toBe("requested");
    expect(r.createdAt).toBe(1000);
    expect(r.updatedAt).toBe(1000);
    expect(r.paidAt).toBeUndefined();
    expect(r.tenantId).toBe("acme-com");
    expect(r.checkoutUrl).toBe("https://checkout/cs_1"); // reused on re-request to avoid a 2nd link
  });
});

describe("transitionDeposit", () => {
  it("marks paid with paidAt and updatedAt", () => {
    const r = transitionDeposit(base(), "paid", 2000);
    expect(r.status).toBe("paid");
    expect(r.paidAt).toBe(2000);
    expect(r.updatedAt).toBe(2000);
  });

  it("never downgrades a paid deposit (out-of-order events can't un-pay)", () => {
    const paid = transitionDeposit(base(), "paid", 2000);
    expect(transitionDeposit(paid, "expired", 3000)).toBe(paid); // unchanged ref
    expect(transitionDeposit(paid, "failed", 3000).status).toBe("paid");
  });

  it("is idempotent on a redelivered same-status event", () => {
    const failed = transitionDeposit(base(), "failed", 2000);
    expect(transitionDeposit(failed, "failed", 9999)).toBe(failed); // unchanged ref
  });
});

describe("publicDeposit", () => {
  it("omits the tenantId from the client projection", () => {
    const pub = publicDeposit(transitionDeposit(base(), "paid", 2000));
    expect(pub).not.toHaveProperty("tenantId");
    expect(pub).toMatchObject({ id: "dep-1", quoteId: "Q-1", status: "paid", amountCents: 3000, paidAt: 2000 });
  });
});
