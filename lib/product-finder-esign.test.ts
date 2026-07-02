import { describe, it, expect } from "vitest";
import {
  newEsignRecord,
  transitionEsign,
  publicEsign,
  ESIGN_NAMESPACE,
  type EsignRecord,
} from "@/lib/product-finder-esign";

const base = (): EsignRecord =>
  newEsignRecord({
    id: "sig-123",
    quoteId: "Q-1",
    quoteNumber: "Q-20260618-0001",
    tenantId: "acme",
    testMode: true,
    now: 1000,
  });

describe("esign record", () => {
  it("namespace is the fixed global 'esign'", () => {
    expect(ESIGN_NAMESPACE).toBe("esign");
  });

  it("new record starts sent, carries tenant + testMode", () => {
    const r = base();
    expect(r.status).toBe("sent");
    expect(r.tenantId).toBe("acme");
    expect(r.testMode).toBe(true);
    expect(r.createdAt).toBe(1000);
    expect(r.signedAt).toBeUndefined();
  });

  it("transitions sent → viewed → signed, stamping signedAt", () => {
    let r = base();
    r = transitionEsign(r, "viewed", 1100);
    expect(r.status).toBe("viewed");
    r = transitionEsign(r, "signed", 1200);
    expect(r.status).toBe("signed");
    expect(r.signedAt).toBe(1200);
    expect(r.updatedAt).toBe(1200);
  });

  it("signed is terminal — a later event can't downgrade it", () => {
    const r = transitionEsign(base(), "signed", 1200);
    const after = transitionEsign(r, "viewed", 1300);
    expect(after).toBe(r); // unchanged reference
    expect(after.status).toBe("signed");
  });

  it("declined is terminal", () => {
    const r = transitionEsign(base(), "declined", 1200);
    expect(transitionEsign(r, "signed", 1300).status).toBe("declined");
  });

  it("never goes backwards (viewed can't undo signed)", () => {
    const signed = transitionEsign(base(), "signed", 1200);
    expect(transitionEsign(signed, "sent", 1300).status).toBe("signed");
  });

  it("redelivered same-status event is a no-op", () => {
    const r = transitionEsign(base(), "viewed", 1100);
    expect(transitionEsign(r, "viewed", 1200)).toBe(r);
  });

  it("publicEsign hides the tenant id", () => {
    const pub = publicEsign(transitionEsign(base(), "signed", 1200));
    expect(pub).not.toHaveProperty("tenantId");
    expect(pub.quoteId).toBe("Q-1");
    expect(pub.status).toBe("signed");
    expect(pub.signedAt).toBe(1200);
  });
});
