import { describe, it, expect } from "vitest";
import {
  createReturn,
  rmaNumber,
  returnRefund,
  nextReturnStatus,
  RETURN_STATUS_LABEL,
  type ReturnLine,
} from "@/lib/product-finder-returns";

const lines: ReturnLine[] = [
  { productId: "A", name: "Breaker", sku: "QO120", qty: 3, unitPrice: 12.5 },
  { productId: "B", name: "Wire", sku: "W12", qty: 2, unitPrice: 40 },
];

describe("rmaNumber", () => {
  it("formats RMA-YYYYMMDD-XXXX with a supplied sequence", () => {
    expect(rmaNumber(new Date("2026-06-14T12:00:00Z"), 42)).toBe("RMA-20260614-0042");
  });
});

describe("returnRefund", () => {
  it("sums line value, rounded to cents", () => {
    expect(returnRefund(lines)).toBe(117.5); // 3×12.5 + 2×40
  });
});

describe("createReturn", () => {
  it("builds a requested RMA with the computed refund", () => {
    const r = createReturn({ orderId: "order-1", customerId: "CUST-001", lines, reason: "Over-ordered for the job", now: 1_700_000_000_000, seq: 7 });
    expect(r.status).toBe("requested");
    expect(r.orderId).toBe("order-1");
    expect(r.refundAmount).toBe(117.5);
    expect(r.rma).toMatch(/^RMA-\d{8}-0007$/);
    expect(RETURN_STATUS_LABEL[r.status]).toBe("Requested");
  });

  it("drops an empty note", () => {
    const r = createReturn({ orderId: "o", customerId: null, lines, reason: "Defective / DOA", now: 1, note: "   " });
    expect(r.note).toBeUndefined();
  });
});

describe("nextReturnStatus", () => {
  it("walks the happy path and stops at refunded", () => {
    expect(nextReturnStatus("requested")).toBe("approved");
    expect(nextReturnStatus("in-transit")).toBe("received");
    expect(nextReturnStatus("refunded")).toBeNull();
    expect(nextReturnStatus("rejected")).toBeNull();
  });
});
