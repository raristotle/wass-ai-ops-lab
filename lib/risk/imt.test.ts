import { describe, it, expect } from "vitest";
import {
  scoreImtRequest,
  DEFAULT_THRESHOLDS,
  REASON_CODES,
  type ImtInput,
  type ImtThresholds,
} from "./imt";

// ── Fixture builders ──────────────────────────────────────────────────────────

const LOW_RISK: ImtInput = {
  customer: { creditScore: 800, paymentHistoryDays: 0,  disputeRate: 0.01, tier: "Gold",   relationshipYears: 6 },
  vendor:   { reliabilityScore: 93, qualityIssueRate: 0.005, leadTimeVarianceDays: 2,  tier: "Strategic" },
  rep:      { tenureYears: 5,  approvalRate: 0.88, overrideRate: 0.04, priorOutcomeScore: 91 },
  inventory:{ agingDays: 28,  turnoverRatio: 9,   skuConcentration: 0.25, totalValueUsd: 120_000, skuCount: 6 },
  margin:   { grossMarginPct: 0.28, categoryAvgMarginPct: 0.24 },
  delivery: { criticalityScore: 35, alternativeSuppliers: 5, customerLeadTimeRequirementDays: 14 },
};

const HIGH_RISK: ImtInput = {
  customer: { creditScore: 540, paymentHistoryDays: 45, disputeRate: 0.15, tier: "New",    relationshipYears: 0 },
  vendor:   { reliabilityScore: 45, qualityIssueRate: 0.09, leadTimeVarianceDays: 22, tier: "Spot" },
  rep:      { tenureYears: 0.4, approvalRate: 0.38, overrideRate: 0.42, priorOutcomeScore: 42 },
  inventory:{ agingDays: 230, turnoverRatio: 1.1,  skuConcentration: 0.95, totalValueUsd: 280_000, skuCount: 1 },
  margin:   { grossMarginPct: 0.02, categoryAvgMarginPct: 0.22 },
  delivery: { criticalityScore: 92, alternativeSuppliers: 0, customerLeadTimeRequirementDays: 1 },
};

const MID_RISK: ImtInput = {
  customer: { creditScore: 645, paymentHistoryDays: 20, disputeRate: 0.07, tier: "Bronze", relationshipYears: 1 },
  vendor:   { reliabilityScore: 79, qualityIssueRate: 0.025, leadTimeVarianceDays: 9, tier: "Approved" },
  rep:      { tenureYears: 2.5, approvalRate: 0.72, overrideRate: 0.14, priorOutcomeScore: 74 },
  inventory:{ agingDays: 88,  turnoverRatio: 3.5,  skuConcentration: 0.45, totalValueUsd: 95_000, skuCount: 3 },
  margin:   { grossMarginPct: 0.13, categoryAvgMarginPct: 0.20 },
  delivery: { criticalityScore: 55, alternativeSuppliers: 2, customerLeadTimeRequirementDays: 12 },
};

// ── Decision band tests ───────────────────────────────────────────────────────

describe("scoreImtRequest — decision bands", () => {
  it("returns 'approve' for a low-risk input and score below approveBelow", () => {
    const out = scoreImtRequest(LOW_RISK, DEFAULT_THRESHOLDS);
    expect(out.decision).toBe("approve");
    expect(out.riskScore).toBeLessThan(DEFAULT_THRESHOLDS.approveBelow);
  });

  it("returns 'reject' for a high-risk input and score at or above rejectAbove", () => {
    const out = scoreImtRequest(HIGH_RISK, DEFAULT_THRESHOLDS);
    expect(out.decision).toBe("reject");
    expect(out.riskScore).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.rejectAbove);
  });

  it("returns 'review' for a mid-risk input between the two thresholds", () => {
    const out = scoreImtRequest(MID_RISK, DEFAULT_THRESHOLDS);
    expect(out.decision).toBe("review");
    expect(out.riskScore).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.approveBelow);
    expect(out.riskScore).toBeLessThan(DEFAULT_THRESHOLDS.rejectAbove);
  });

  it("riskScore is always in 0-100", () => {
    for (const input of [LOW_RISK, MID_RISK, HIGH_RISK]) {
      const { riskScore } = scoreImtRequest(input);
      expect(riskScore).toBeGreaterThanOrEqual(0);
      expect(riskScore).toBeLessThanOrEqual(100);
    }
  });
});

// ── Custom threshold tests ────────────────────────────────────────────────────

describe("scoreImtRequest — custom thresholds", () => {
  it("strict thresholds can turn a 'review' into 'reject'", () => {
    const strict: ImtThresholds = { approveBelow: 15, rejectAbove: 30 };
    const out = scoreImtRequest(MID_RISK, strict);
    expect(out.decision).toBe("reject");
  });

  it("lenient thresholds can turn a 'review' into 'approve'", () => {
    const lenient: ImtThresholds = { approveBelow: 70, rejectAbove: 85 };
    const out = scoreImtRequest(MID_RISK, lenient);
    expect(out.decision).toBe("approve");
  });

  it("decision reflects the thresholds, not the default", () => {
    const base = scoreImtRequest(LOW_RISK, DEFAULT_THRESHOLDS);
    // approveBelow: 0 means "approve if score < 0" (never); rejectAbove: 0 means "reject if score >= 0" (always)
    const strict = scoreImtRequest(LOW_RISK, { approveBelow: 0, rejectAbove: 0 });
    expect(base.riskScore).toBe(strict.riskScore); // same score
    expect(base.decision).toBe("approve");          // loose thresholds → approve
    expect(strict.decision).toBe("reject");         // extreme strict → reject
  });
});

// ── Reason code tests ─────────────────────────────────────────────────────────

describe("scoreImtRequest — reason codes", () => {
  it("emits POOR_CREDIT when credit score < 580", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.POOR_CREDIT);
  });

  it("emits FAIR_CREDIT when credit score is 580-669", () => {
    const input: ImtInput = { ...LOW_RISK, customer: { ...LOW_RISK.customer, creditScore: 620 } };
    const out = scoreImtRequest(input);
    expect(out.reasonCodes).toContain(REASON_CODES.FAIR_CREDIT);
    expect(out.reasonCodes).not.toContain(REASON_CODES.POOR_CREDIT);
  });

  it("does not emit any credit code when score >= 740", () => {
    const out = scoreImtRequest(LOW_RISK);
    expect(out.reasonCodes).not.toContain(REASON_CODES.POOR_CREDIT);
    expect(out.reasonCodes).not.toContain(REASON_CODES.FAIR_CREDIT);
  });

  it("emits LATE_PAYMENTS when payment history > 30 days", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.LATE_PAYMENTS);
  });

  it("emits MODERATE_LATE_PAYMENTS when payment history 16-30 days", () => {
    const input: ImtInput = { ...LOW_RISK, customer: { ...LOW_RISK.customer, paymentHistoryDays: 20 } };
    const out = scoreImtRequest(input);
    expect(out.reasonCodes).toContain(REASON_CODES.MODERATE_LATE_PAYMENTS);
    expect(out.reasonCodes).not.toContain(REASON_CODES.LATE_PAYMENTS);
  });

  it("emits HIGH_DISPUTE_RATE when dispute rate > 10%", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.HIGH_DISPUTE_RATE);
  });

  it("emits NEW_CUSTOMER for New tier", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.NEW_CUSTOMER);
  });

  it("emits UNRELIABLE_VENDOR when reliability < 60", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.UNRELIABLE_VENDOR);
  });

  it("emits SPOT_VENDOR for Spot tier vendors", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.SPOT_VENDOR);
  });

  it("emits HIGH_LEAD_TIME_VARIANCE when variance > 14 days", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.HIGH_LEAD_TIME_VARIANCE);
  });

  it("emits JUNIOR_REP when tenure < 1 year", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.JUNIOR_REP);
  });

  it("emits HIGH_OVERRIDE_RATE when rate > 30%", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.HIGH_OVERRIDE_RATE);
  });

  it("emits POOR_PRIOR_OUTCOMES when outcome score < 50", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.POOR_PRIOR_OUTCOMES);
  });

  it("emits AGED_INVENTORY when aging > 180 days", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.AGED_INVENTORY);
  });

  it("emits MODERATE_AGING when aging 91-180 days", () => {
    const input: ImtInput = { ...LOW_RISK, inventory: { ...LOW_RISK.inventory, agingDays: 120 } };
    const out = scoreImtRequest(input);
    expect(out.reasonCodes).toContain(REASON_CODES.MODERATE_AGING);
    expect(out.reasonCodes).not.toContain(REASON_CODES.AGED_INVENTORY);
  });

  it("emits LOW_INVENTORY_TURNS when turnover < 2", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.LOW_INVENTORY_TURNS);
  });

  it("emits HIGH_SKU_CONCENTRATION when concentration > 80%", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.HIGH_SKU_CONCENTRATION);
  });

  it("emits THIN_MARGIN when gross margin < 5%", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.THIN_MARGIN);
  });

  it("emits NEGATIVE_MARGIN when gross margin < 0", () => {
    const input: ImtInput = { ...LOW_RISK, margin: { grossMarginPct: -0.02, categoryAvgMarginPct: 0.20 } };
    const out = scoreImtRequest(input);
    expect(out.reasonCodes).toContain(REASON_CODES.NEGATIVE_MARGIN);
  });

  it("emits BELOW_CATEGORY_AVERAGE when gap > 5%", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.BELOW_CATEGORY_AVERAGE);
  });

  it("emits CRITICAL_SOLE_SOURCE when criticality > 80 and zero alternatives", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.CRITICAL_SOLE_SOURCE);
  });

  it("emits CRITICAL_FEW_ALTERNATIVES when criticality > 80 and < 2 alternatives", () => {
    const input: ImtInput = {
      ...HIGH_RISK,
      delivery: { ...HIGH_RISK.delivery, alternativeSuppliers: 1 },
    };
    const out = scoreImtRequest(input);
    expect(out.reasonCodes).toContain(REASON_CODES.CRITICAL_FEW_ALTERNATIVES);
    expect(out.reasonCodes).not.toContain(REASON_CODES.CRITICAL_SOLE_SOURCE);
  });

  it("emits TIGHT_LEAD_TIME when requirement < 5 days", () => {
    const out = scoreImtRequest(HIGH_RISK);
    expect(out.reasonCodes).toContain(REASON_CODES.TIGHT_LEAD_TIME);
  });

  it("emits no reason codes for an ideal low-risk request", () => {
    const out = scoreImtRequest(LOW_RISK);
    expect(out.reasonCodes).toHaveLength(0);
  });
});

// ── Factor score structure tests ──────────────────────────────────────────────

describe("scoreImtRequest — output structure", () => {
  it("returns exactly 6 factorScores", () => {
    const out = scoreImtRequest(MID_RISK);
    expect(out.factorScores).toHaveLength(6);
  });

  it("factor weights sum to 1.0", () => {
    const out = scoreImtRequest(LOW_RISK);
    const total = out.factorScores.reduce((s, f) => s + f.weight, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it("all factor rawScores are in 0-100", () => {
    for (const input of [LOW_RISK, MID_RISK, HIGH_RISK]) {
      const out = scoreImtRequest(input);
      for (const f of out.factorScores) {
        expect(f.rawScore).toBeGreaterThanOrEqual(0);
        expect(f.rawScore).toBeLessThanOrEqual(100);
      }
    }
  });

  it("weightedScore equals rawScore * weight for each factor", () => {
    const out = scoreImtRequest(MID_RISK);
    for (const f of out.factorScores) {
      expect(f.weightedScore).toBeCloseTo(f.rawScore * f.weight, 5);
    }
  });

  it("confidence is in 0-100", () => {
    for (const input of [LOW_RISK, MID_RISK, HIGH_RISK]) {
      const { confidence } = scoreImtRequest(input);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    }
  });

  it("marginExposureUsd is non-negative", () => {
    for (const input of [LOW_RISK, MID_RISK, HIGH_RISK]) {
      const { marginExposureUsd } = scoreImtRequest(input);
      expect(marginExposureUsd).toBeGreaterThanOrEqual(0);
    }
  });
});
