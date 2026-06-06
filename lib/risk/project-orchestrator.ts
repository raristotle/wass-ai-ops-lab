// Pure project-orchestrator scoring engine — no UI imports

// ── Types ──────────────────────────────────────────────────────────────────────

export type SBU = "CSS" | "EES" | "UBS";
export type ProjectStatus = "planning" | "active" | "at-risk" | "on-hold" | "complete";
export type MilestoneStatus = "on-track" | "at-risk" | "late" | "complete";
export type RiskSeverity = "critical" | "high" | "medium" | "low";
export type RiskType = "margin" | "delivery" | "owner" | "supplier" | "scope" | "fulfillment";
export type SupplierPkgStatus = "pending" | "submitted" | "confirmed" | "late";
export type CrossSellStatus = "identified" | "proposed" | "quoted";

export interface ProjectMilestone {
  name: string;
  plannedDate: string;
  actualDate?: string;
  status: MilestoneStatus;
}

export interface SupplierPackage {
  vendor: string;
  category: string;
  status: SupplierPkgStatus;
  dueDate: string;
  valueUsd: number;
}

export interface ProjectRisk {
  type: RiskType;
  severity: RiskSeverity;
  description: string;
}

export interface CrossSellOpportunity {
  category: string;
  sbu: SBU;
  estimatedValueUsd: number;
  status: CrossSellStatus;
}

export interface ComplexProject {
  id: string;
  name: string;
  customer: string;
  sbus: SBU[];
  status: ProjectStatus;
  totalValueUsd: number;
  startDate: string;
  endDate: string;
  owners: { sbu: SBU; name: string }[];
  bom: { total: number; approved: number; missing: number; pendingReview: number };
  quotes: { open: number; submitted: number; won: number; totalValueUsd: number; marginPct: number };
  supplierPackages: SupplierPackage[];
  milestones: ProjectMilestone[];
  risks: ProjectRisk[];
  crossSell: CrossSellOpportunity[];
}

// ── Scoring ────────────────────────────────────────────────────────────────────

export interface ProjectScore {
  projectId: string;
  valueScore: number;          // 0-100, relative size in portfolio
  sbuScore: number;            // 0-100, multi-SBU breadth
  lateMilestoneRisk: number;   // 0-100
  marginRisk: number;          // 0-100
  missingOwnerRisk: number;    // 0-100
  fulfillmentRisk: number;     // 0-100
  compositeRisk: number;       // weighted
  riskLevel: RiskSeverity;
}

export const SCORE_WEIGHTS = {
  lateMilestone: 0.30,
  margin:        0.25,
  fulfillment:   0.25,
  missingOwner:  0.20,
} as const;

export function scoreProject(p: ComplexProject, allProjects: ComplexProject[]): ProjectScore {
  // Value score — relative to portfolio
  const maxValue = Math.max(...allProjects.map((x) => x.totalValueUsd), 1);
  const valueScore = Math.round((p.totalValueUsd / maxValue) * 100);

  // SBU coverage (3 possible SBUs)
  const sbuScore = Math.round((p.sbus.length / 3) * 100);

  // Late milestone risk
  const lateCount    = p.milestones.filter((m) => m.status === "late").length;
  const atRiskCount  = p.milestones.filter((m) => m.status === "at-risk").length;
  const totalMs      = Math.max(p.milestones.length, 1);
  const lateMilestoneRisk = Math.min(100, Math.round(
    (lateCount * 100 + atRiskCount * 50) / totalMs,
  ));

  // Margin risk
  const m = p.quotes.marginPct;
  const marginRisk =
    m <= 0    ? 100 :
    m < 0.08  ?  90 :
    m < 0.12  ?  70 :
    m < 0.15  ?  50 :
    m < 0.18  ?  30 : 10;

  // Missing owner risk
  const ownedSbus = new Set(p.owners.map((o) => o.sbu));
  const missing   = p.sbus.filter((s) => !ownedSbus.has(s)).length;
  const missingOwnerRisk = Math.round((missing / Math.max(p.sbus.length, 1)) * 100);

  // Fulfillment risk: late suppliers + missing BOM lines
  const lateSuppliers  = p.supplierPackages.filter((s) => s.status === "late").length;
  const totalSuppliers = Math.max(p.supplierPackages.length, 1);
  const bomMissingPct  = p.bom.missing / Math.max(p.bom.total, 1);
  const fulfillmentRisk = Math.min(100, Math.round(
    (lateSuppliers / totalSuppliers) * 60 + bomMissingPct * 80,
  ));

  // Composite
  const compositeRisk = Math.round(
    lateMilestoneRisk * SCORE_WEIGHTS.lateMilestone +
    marginRisk        * SCORE_WEIGHTS.margin        +
    fulfillmentRisk   * SCORE_WEIGHTS.fulfillment   +
    missingOwnerRisk  * SCORE_WEIGHTS.missingOwner,
  );

  const riskLevel: RiskSeverity =
    compositeRisk >= 70 ? "critical" :
    compositeRisk >= 50 ? "high"     :
    compositeRisk >= 30 ? "medium"   : "low";

  return {
    projectId: p.id,
    valueScore,
    sbuScore,
    lateMilestoneRisk,
    marginRisk,
    missingOwnerRisk,
    fulfillmentRisk,
    compositeRisk,
    riskLevel,
  };
}

// ── One Meridian Brief ────────────────────────────────────────────────────────

const fmtUsd = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

export function generateOneMeridianBrief(project: ComplexProject, score: ProjectScore): string {
  const lateMs      = project.milestones.filter((m) => m.status === "late");
  const critRisks   = project.risks.filter((r) => r.severity === "critical");
  const openXsell   = project.crossSell.filter((c) => c.status !== "quoted");
  const xsellTotal  = openXsell.reduce((s, c) => s + c.estimatedValueUsd, 0);
  const lateSupp    = project.supplierPackages.filter((s) => s.status === "late");
  const dateStr     = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const line = (label: string, val: string) =>
    `  ${label.padEnd(18)}${val}`;

  return `ONE MERIDIAN PROJECT BRIEF
${"═".repeat(56)}
  Project:           ${project.name}
  Customer:          ${project.customer}
  Generated:         ${dateStr}
  SBUs Engaged:      ${project.sbus.join(", ")}
  Total Value:       ${fmtUsd(project.totalValueUsd)}
  Status:            ${project.status.toUpperCase()}
  Composite Risk:    ${score.compositeRisk}/100 — ${score.riskLevel.toUpperCase()}

── EXECUTION SUMMARY ────────────────────────────────────
${line("BOM:", `${project.bom.approved}/${project.bom.total} approved · ${project.bom.missing} missing · ${project.bom.pendingReview} pending`)}
${line("Quotes:", `${project.quotes.won} won / ${project.quotes.open + project.quotes.submitted} open · Margin ${(project.quotes.marginPct * 100).toFixed(1)}%`)}
${line("Suppliers:", `${project.supplierPackages.filter((s) => s.status === "confirmed").length}/${project.supplierPackages.length} confirmed · ${lateSupp.length} late`)}
${line("Milestones:", `${project.milestones.filter((m) => m.status === "complete").length}/${project.milestones.length} complete`)}

── OWNERS ───────────────────────────────────────────────
${project.owners.length > 0
  ? project.owners.map((o) => `  ${o.sbu}: ${o.name}`).join("\n")
  : "  ⚠  No owners assigned across engaged SBUs"}

── RISKS REQUIRING ACTION ───────────────────────────────
${critRisks.length > 0
  ? critRisks.map((r) => `  [CRITICAL] ${r.type.toUpperCase()}: ${r.description}`).join("\n")
  : "  No critical risks identified"}
${lateMs.length > 0
  ? lateMs.map((m) => `  [LATE]     Milestone: "${m.name}" — planned ${m.plannedDate}`).join("\n")
  : ""}
${lateSupp.length > 0
  ? lateSupp.map((s) => `  [LATE]     Supplier pkg: ${s.vendor} / ${s.category} — due ${s.dueDate}`).join("\n")
  : ""}

── CROSS-SELL PIPELINE ──────────────────────────────────
${openXsell.length > 0
  ? openXsell.map((c) => `  ${c.sbu}  ${c.category.padEnd(28)}${fmtUsd(c.estimatedValueUsd).padStart(12)}  [${c.status}]`).join("\n")
  : "  No open cross-sell opportunities"}
${xsellTotal > 0 ? `  ${"".padEnd(41)}${("TOTAL: " + fmtUsd(xsellTotal)).padStart(18)}` : ""}

── RISK SCORE BREAKDOWN ─────────────────────────────────
  Late Milestone Risk:   ${String(score.lateMilestoneRisk).padStart(3)}/100
  Margin Risk:           ${String(score.marginRisk).padStart(3)}/100
  Fulfillment Risk:      ${String(score.fulfillmentRisk).padStart(3)}/100
  Missing Owner Risk:    ${String(score.missingOwnerRisk).padStart(3)}/100
  ─────────────────────────────────
  Composite Risk:        ${String(score.compositeRisk).padStart(3)}/100  (${score.riskLevel.toUpperCase()})

${"═".repeat(56)}
PROTOTYPE ONLY — AI-generated. Human review required before distribution.`;
}

// ── Labels ─────────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning:   "Planning",
  active:     "Active",
  "at-risk":  "At Risk",
  "on-hold":  "On Hold",
  complete:   "Complete",
};

export const RISK_TYPE_LABELS: Record<RiskType, string> = {
  margin:      "Margin",
  delivery:    "Delivery",
  owner:       "Owner",
  supplier:    "Supplier",
  scope:       "Scope",
  fulfillment: "Fulfillment",
};

export const SBU_LABELS: Record<SBU, string> = {
  CSS: "Comm. & Security",
  EES: "Electrical & Electronics",
  UBS: "Utility & Broadband",
};

export const ALL_STATUSES: ProjectStatus[] = ["planning", "active", "at-risk", "on-hold", "complete"];
export const ALL_RISK_TYPES: RiskType[]    = ["margin", "delivery", "owner", "supplier", "scope", "fulfillment"];
export const ALL_SBUS: SBU[]              = ["CSS", "EES", "UBS"];
