// IMT Risk Scorer — deterministic, pure functions, no I/O

export type ImtDecision = "approve" | "review" | "reject";

export interface ImtCustomerInput {
  creditScore: number;           // 300-850 (FICO-like)
  paymentHistoryDays: number;    // avg days overdue (0 = on-time)
  disputeRate: number;           // 0.0–1.0
  tier: "Gold" | "Silver" | "Bronze" | "New";
  relationshipYears: number;
}

export interface ImtVendorInput {
  reliabilityScore: number;      // 0-100
  qualityIssueRate: number;      // 0.0–1.0
  leadTimeVarianceDays: number;  // std dev of lead time
  tier: "Strategic" | "Preferred" | "Approved" | "Spot";
}

export interface ImtRepInput {
  tenureYears: number;
  approvalRate: number;          // 0.0–1.0 (historical)
  overrideRate: number;          // 0.0–1.0 (pushes back on decisions)
  priorOutcomeScore: number;     // 0-100 (quality of past IMT outcomes)
}

export interface ImtInventoryInput {
  agingDays: number;             // avg age of stock
  turnoverRatio: number;         // annual turns
  skuConcentration: number;      // 0.0–1.0 (1 = all value in one SKU)
  totalValueUsd: number;
  skuCount: number;
}

export interface ImtMarginInput {
  grossMarginPct: number;        // 0.0–1.0
  categoryAvgMarginPct: number;  // 0.0–1.0
}

export interface ImtDeliveryInput {
  criticalityScore: number;                  // 0-100
  alternativeSuppliers: number;              // count of viable alternatives
  customerLeadTimeRequirementDays: number;
}

export interface ImtInput {
  customer: ImtCustomerInput;
  vendor: ImtVendorInput;
  rep: ImtRepInput;
  inventory: ImtInventoryInput;
  margin: ImtMarginInput;
  delivery: ImtDeliveryInput;
}

export interface ImtFactorScore {
  factor: string;
  label: string;
  weight: number;         // 0.0–1.0
  rawScore: number;       // 0-100, higher = riskier
  weightedScore: number;  // rawScore × weight
  reasonCodes: string[];
}

export interface ImtOutput {
  riskScore: number;               // 0-100 weighted sum
  confidence: number;              // 0-100
  decision: ImtDecision;
  factorScores: ImtFactorScore[];
  reasonCodes: string[];           // union from all factors
  marginExposureUsd: number;
  workingCapitalExposureUsd: number;
}

export interface ImtThresholds {
  approveBelow: number;   // score < this → approve
  rejectAbove: number;    // score >= this → reject  (must be > approveBelow)
}

export const DEFAULT_THRESHOLDS: ImtThresholds = {
  approveBelow: 30,
  rejectAbove: 65,
};

// ── Reason code constants ─────────────────────────────────────────────────────

export const REASON_CODES = {
  // Customer
  POOR_CREDIT:           "POOR_CREDIT",
  FAIR_CREDIT:           "FAIR_CREDIT",
  LATE_PAYMENTS:         "LATE_PAYMENTS",
  MODERATE_LATE_PAYMENTS:"MODERATE_LATE_PAYMENTS",
  HIGH_DISPUTE_RATE:     "HIGH_DISPUTE_RATE",
  ELEVATED_DISPUTES:     "ELEVATED_DISPUTES",
  NEW_CUSTOMER:          "NEW_CUSTOMER",
  BRONZE_TIER:           "BRONZE_TIER",
  // Vendor
  UNRELIABLE_VENDOR:     "UNRELIABLE_VENDOR",
  UNPROVEN_VENDOR:       "UNPROVEN_VENDOR",
  VENDOR_QUALITY_ISSUES: "VENDOR_QUALITY_ISSUES",
  HIGH_LEAD_TIME_VARIANCE:"HIGH_LEAD_TIME_VARIANCE",
  SPOT_VENDOR:           "SPOT_VENDOR",
  // Rep
  JUNIOR_REP:            "JUNIOR_REP",
  HIGH_OVERRIDE_RATE:    "HIGH_OVERRIDE_RATE",
  POOR_PRIOR_OUTCOMES:   "POOR_PRIOR_OUTCOMES",
  LOW_REP_APPROVAL_RATE: "LOW_REP_APPROVAL_RATE",
  // Inventory
  AGED_INVENTORY:        "AGED_INVENTORY",
  MODERATE_AGING:        "MODERATE_AGING",
  LOW_INVENTORY_TURNS:   "LOW_INVENTORY_TURNS",
  MODERATE_TURNS:        "MODERATE_TURNS",
  HIGH_SKU_CONCENTRATION:"HIGH_SKU_CONCENTRATION",
  // Margin
  NEGATIVE_MARGIN:       "NEGATIVE_MARGIN",
  THIN_MARGIN:           "THIN_MARGIN",
  BELOW_CATEGORY_AVERAGE:"BELOW_CATEGORY_AVERAGE",
  // Delivery
  CRITICAL_SOLE_SOURCE:  "CRITICAL_SOLE_SOURCE",
  CRITICAL_FEW_ALTERNATIVES:"CRITICAL_FEW_ALTERNATIVES",
  TIGHT_LEAD_TIME:       "TIGHT_LEAD_TIME",
} as const;

export type ReasonCode = typeof REASON_CODES[keyof typeof REASON_CODES];

// ── Factor scorers (each returns 0-100 raw score, weight applied externally) ──

function scoreCustomer(c: ImtCustomerInput): ImtFactorScore {
  let s = 0;
  const codes: string[] = [];

  // Credit score — up to 50 pts
  if (c.creditScore < 580)       { s += 50; codes.push(REASON_CODES.POOR_CREDIT); }
  else if (c.creditScore < 670)  { s += 30; codes.push(REASON_CODES.FAIR_CREDIT); }
  else if (c.creditScore < 740)  { s += 15; }

  // Payment history — up to 25 pts
  if (c.paymentHistoryDays > 30)       { s += 25; codes.push(REASON_CODES.LATE_PAYMENTS); }
  else if (c.paymentHistoryDays > 15)  { s += 15; codes.push(REASON_CODES.MODERATE_LATE_PAYMENTS); }
  else if (c.paymentHistoryDays > 5)   { s += 8; }

  // Dispute rate — up to 20 pts
  if (c.disputeRate > 0.10)      { s += 20; codes.push(REASON_CODES.HIGH_DISPUTE_RATE); }
  else if (c.disputeRate > 0.05) { s += 10; codes.push(REASON_CODES.ELEVATED_DISPUTES); }

  // Tier — up to 15 pts
  if (c.tier === "New")          { s += 15; codes.push(REASON_CODES.NEW_CUSTOMER); }
  else if (c.tier === "Bronze")  { s += 8;  codes.push(REASON_CODES.BRONZE_TIER); }

  const rawScore = Math.min(100, s);
  return { factor: "customer", label: "Customer Risk", weight: 0.25, rawScore, weightedScore: rawScore * 0.25, reasonCodes: codes };
}

function scoreVendor(v: ImtVendorInput): ImtFactorScore {
  let s = 0;
  const codes: string[] = [];

  // Reliability — up to 40 pts (inverted)
  if (v.reliabilityScore < 60)       { s += 40; codes.push(REASON_CODES.UNRELIABLE_VENDOR); }
  else if (v.reliabilityScore < 75)  { s += 20; codes.push(REASON_CODES.UNPROVEN_VENDOR); }
  else if (v.reliabilityScore < 85)  { s += 8; }

  // Quality issue rate — up to 25 pts
  if (v.qualityIssueRate > 0.05)     { s += 25; codes.push(REASON_CODES.VENDOR_QUALITY_ISSUES); }
  else if (v.qualityIssueRate > 0.02){ s += 12; }

  // Lead time variance — up to 25 pts
  if (v.leadTimeVarianceDays > 14)   { s += 25; codes.push(REASON_CODES.HIGH_LEAD_TIME_VARIANCE); }
  else if (v.leadTimeVarianceDays > 7){ s += 12; }

  // Tier — up to 15 pts
  if (v.tier === "Spot")             { s += 15; codes.push(REASON_CODES.SPOT_VENDOR); }
  else if (v.tier === "Approved")    { s += 5; }

  const rawScore = Math.min(100, s);
  return { factor: "vendor", label: "Vendor Risk", weight: 0.20, rawScore, weightedScore: rawScore * 0.20, reasonCodes: codes };
}

function scoreRep(r: ImtRepInput): ImtFactorScore {
  let s = 0;
  const codes: string[] = [];

  // Tenure — up to 20 pts
  if (r.tenureYears < 1)     { s += 20; codes.push(REASON_CODES.JUNIOR_REP); }
  else if (r.tenureYears < 2){ s += 10; }

  // Override rate — up to 25 pts
  if (r.overrideRate > 0.30)      { s += 25; codes.push(REASON_CODES.HIGH_OVERRIDE_RATE); }
  else if (r.overrideRate > 0.15) { s += 12; }

  // Prior outcome score — up to 35 pts (inverted)
  if (r.priorOutcomeScore < 50)       { s += 35; codes.push(REASON_CODES.POOR_PRIOR_OUTCOMES); }
  else if (r.priorOutcomeScore < 65)  { s += 20; }
  else if (r.priorOutcomeScore < 75)  { s += 8; }

  // Approval rate — up to 20 pts (low approval = batch is riskier)
  if (r.approvalRate < 0.50)      { s += 20; codes.push(REASON_CODES.LOW_REP_APPROVAL_RATE); }
  else if (r.approvalRate < 0.65) { s += 10; }

  const rawScore = Math.min(100, s);
  return { factor: "rep", label: "Rep History", weight: 0.15, rawScore, weightedScore: rawScore * 0.15, reasonCodes: codes };
}

function scoreInventory(inv: ImtInventoryInput): ImtFactorScore {
  let s = 0;
  const codes: string[] = [];

  // Aging — up to 45 pts
  if (inv.agingDays > 180)      { s += 45; codes.push(REASON_CODES.AGED_INVENTORY); }
  else if (inv.agingDays > 90)  { s += 25; codes.push(REASON_CODES.MODERATE_AGING); }
  else if (inv.agingDays > 60)  { s += 12; }

  // Turnover ratio — up to 30 pts (inverted)
  if (inv.turnoverRatio < 2)    { s += 30; codes.push(REASON_CODES.LOW_INVENTORY_TURNS); }
  else if (inv.turnoverRatio < 4){ s += 15; codes.push(REASON_CODES.MODERATE_TURNS); }
  else if (inv.turnoverRatio < 6){ s += 5; }

  // SKU concentration — up to 25 pts
  if (inv.skuConcentration > 0.80)      { s += 25; codes.push(REASON_CODES.HIGH_SKU_CONCENTRATION); }
  else if (inv.skuConcentration > 0.60) { s += 12; }

  const rawScore = Math.min(100, s);
  return { factor: "inventory", label: "Inventory Aging", weight: 0.20, rawScore, weightedScore: rawScore * 0.20, reasonCodes: codes };
}

function scoreMargin(m: ImtMarginInput): ImtFactorScore {
  let s = 0;
  const codes: string[] = [];

  // Absolute margin — up to 60 pts
  if (m.grossMarginPct < 0)         { s += 60; codes.push(REASON_CODES.NEGATIVE_MARGIN); }
  else if (m.grossMarginPct < 0.05) { s += 40; codes.push(REASON_CODES.THIN_MARGIN); }
  else if (m.grossMarginPct < 0.10) { s += 25; codes.push(REASON_CODES.THIN_MARGIN); }
  else if (m.grossMarginPct < 0.15) { s += 12; }

  // Relative to category avg — up to 40 pts
  const gap = m.categoryAvgMarginPct - m.grossMarginPct;
  if (gap > 0.10)      { s += 40; codes.push(REASON_CODES.BELOW_CATEGORY_AVERAGE); }
  else if (gap > 0.05) { s += 20; if (!codes.includes(REASON_CODES.BELOW_CATEGORY_AVERAGE)) codes.push(REASON_CODES.BELOW_CATEGORY_AVERAGE); }

  const rawScore = Math.min(100, s);
  return { factor: "margin", label: "Gross Margin", weight: 0.10, rawScore, weightedScore: rawScore * 0.10, reasonCodes: codes };
}

function scoreDelivery(d: ImtDeliveryInput): ImtFactorScore {
  let s = 0;
  const codes: string[] = [];

  // Criticality + alternative count — up to 60 pts
  if (d.criticalityScore > 80 && d.alternativeSuppliers === 0) {
    s += 60; codes.push(REASON_CODES.CRITICAL_SOLE_SOURCE);
  } else if (d.criticalityScore > 80 && d.alternativeSuppliers < 2) {
    s += 35; codes.push(REASON_CODES.CRITICAL_FEW_ALTERNATIVES);
  } else if (d.criticalityScore > 80) { s += 15; }
  else if (d.criticalityScore > 60)   { s += 8; }

  // Lead time requirement — up to 40 pts
  if (d.customerLeadTimeRequirementDays < 2)       { s += 40; codes.push(REASON_CODES.TIGHT_LEAD_TIME); }
  else if (d.customerLeadTimeRequirementDays < 5)  { s += 20; codes.push(REASON_CODES.TIGHT_LEAD_TIME); }
  else if (d.customerLeadTimeRequirementDays < 10) { s += 8; }

  const rawScore = Math.min(100, s);
  return { factor: "delivery", label: "Delivery Criticality", weight: 0.10, rawScore, weightedScore: rawScore * 0.10, reasonCodes: codes };
}

// ── Confidence scorer ─────────────────────────────────────────────────────────

function computeConfidence(input: ImtInput, factorScores: ImtFactorScore[]): number {
  let c = 82; // base

  // Rep data quality
  if (input.rep.tenureYears >= 3)    c += 5;
  else if (input.rep.tenureYears < 1) c -= 10;

  // Customer data quality
  if (input.customer.relationshipYears >= 3) c += 5;
  else if (input.customer.relationshipYears === 0) c -= 8;

  // Signal convergence: low variance across factor scores → higher confidence
  const scores = factorScores.map((f) => f.rawScore);
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev > 30)      c -= 12;
  else if (stdDev > 20) c -= 6;
  else if (stdDev < 10) c += 5;

  return Math.max(40, Math.min(98, Math.round(c)));
}

// ── Main scorer ───────────────────────────────────────────────────────────────

export function scoreImtRequest(
  input: ImtInput,
  thresholds: ImtThresholds = DEFAULT_THRESHOLDS
): ImtOutput {
  const factorScores = [
    scoreCustomer(input.customer),
    scoreVendor(input.vendor),
    scoreRep(input.rep),
    scoreInventory(input.inventory),
    scoreMargin(input.margin),
    scoreDelivery(input.delivery),
  ];

  const riskScore = Math.round(
    factorScores.reduce((sum, f) => sum + f.weightedScore, 0)
  );

  const decision: ImtDecision =
    riskScore < thresholds.approveBelow
      ? "approve"
      : riskScore >= thresholds.rejectAbove
      ? "reject"
      : "review";

  const reasonCodes = Array.from(
    new Set(factorScores.flatMap((f) => f.reasonCodes))
  );

  const confidence = computeConfidence(input, factorScores);

  // Margin at risk over the aging period
  const marginExposureUsd = Math.round(
    input.inventory.totalValueUsd *
    (1 - input.margin.grossMarginPct) *
    (input.inventory.agingDays / 365)
  );

  // Working capital tied up based on aging vs. a 90-day target
  const wcMultiplier = Math.max(0, (input.inventory.agingDays - 90) / 90);
  const workingCapitalExposureUsd = Math.round(
    input.inventory.totalValueUsd * wcMultiplier * 0.30
  );

  return {
    riskScore,
    confidence,
    decision,
    factorScores,
    reasonCodes,
    marginExposureUsd,
    workingCapitalExposureUsd,
  };
}
