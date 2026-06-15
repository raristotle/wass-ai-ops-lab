import { describe, it, expect } from "vitest";
import {
  evaluateApproval,
  ruleMatches,
  isEscalated,
  DEFAULT_APPROVAL_POLICY,
  type ApprovalRule,
} from "@/lib/product-finder-approval-policy";

const ok = { marginPct: 0.35, orderValue: 5000, discountDepthPct: 0.05, categories: ["electrical"] };

describe("evaluateApproval (default policy)", () => {
  it("requires no approval for a healthy quote", () => {
    const d = evaluateApproval(ok);
    expect(d.required).toBe(false);
  });

  it("fires the margin rule below 20%", () => {
    const d = evaluateApproval({ ...ok, marginPct: 0.18 });
    expect(d.required).toBe(true);
    expect(d.ruleId).toBe("margin-floor");
    expect(d.reason).toMatch(/Below 20% margin/);
  });

  it("fires on a large order even at healthy margin", () => {
    const d = evaluateApproval({ ...ok, orderValue: 30_000 });
    expect(d.required).toBe(true);
    expect(d.reason).toMatch(/\$25,000/);
  });

  it("fires on a deep discount", () => {
    const d = evaluateApproval({ ...ok, discountDepthPct: 0.3 });
    expect(d.required).toBe(true);
    expect(d.reason).toMatch(/Discount deeper/);
  });

  it("joins every triggered rule's label in the reason", () => {
    const d = evaluateApproval({ marginPct: 0.1, orderValue: 40_000, discountDepthPct: 0.4 });
    expect(d.required).toBe(true);
    expect(d.reason).toMatch(/Below 20% margin/);
    expect(d.reason).toMatch(/\$25,000/);
    expect(d.reason).toMatch(/Discount deeper/);
  });
});

describe("approver precedence + escalation", () => {
  const policy: ApprovalRule[] = [
    { id: "mgr", label: "Manager rule", approver: "manager", orderValueAbove: 1000, escalateAfterHours: 24 },
    { id: "adm", label: "Admin rule", approver: "admin", marginBelowPct: 0.1 },
  ];
  it("an admin-level rule outranks a manager-level rule", () => {
    const d = evaluateApproval({ marginPct: 0.05, orderValue: 5000 }, policy);
    expect(d.approver).toBe("admin");
    expect(d.ruleId).toBe("adm");
  });
  it("escalates only after the window elapses", () => {
    const d = evaluateApproval({ marginPct: 0.5, orderValue: 5000 }, policy);
    expect(isEscalated(d, 12)).toBe(false);
    expect(isEscalated(d, 25)).toBe(true);
  });
});

describe("ruleMatches guards", () => {
  it("a rule with no conditions never fires", () => {
    expect(ruleMatches({ id: "x", label: "x", approver: "manager" }, ok)).toBe(false);
  });
  it("AND semantics: every present condition must hold", () => {
    const rule: ApprovalRule = { id: "x", label: "x", approver: "manager", marginBelowPct: 0.2, orderValueAbove: 10_000 };
    expect(ruleMatches(rule, { marginPct: 0.1, orderValue: 5000 })).toBe(false); // margin ok-low but order too small
    expect(ruleMatches(rule, { marginPct: 0.1, orderValue: 20_000 })).toBe(true);
  });
  it("ships a sane default policy", () => {
    expect(DEFAULT_APPROVAL_POLICY.length).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_APPROVAL_POLICY.every((r) => r.approver)).toBe(true);
  });
});
