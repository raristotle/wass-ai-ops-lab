// Pure DC Control Tower risk engine — no UI imports

// ── Types ──────────────────────────────────────────────────────────────────────

export type AssetStage =
  | "po-placed" | "receiving" | "staging" | "qa" | "ready" | "delivered" | "exception";

export type ExceptionType =
  | "freight" | "asn-delay" | "location-mismatch" | "qa-fail" | "missing-po" | "damage";

export type QaStatus    = "pass" | "fail" | "pending";
export type AsnStatus   = "confirmed" | "delayed" | "missing";
export type DcStatus    = "active" | "at-risk" | "critical" | "complete";
export type OfciCategory = "server" | "storage" | "networking" | "cooling" | "power" | "cable" | "other";

export interface DcAsset {
  id: string;
  itemDesc: string;
  vendor: string;
  poNumber: string;
  quantity: number;
  stage: AssetStage;
  location?: string;          // warehouse bin / zone
  expectedDate: string;       // expected at site
  receivedDate?: string;
  qaStatus?: QaStatus;
  mechanicalSetDate: string;  // hard project constraint
  weightLbs?: number;
  ofciCategory: OfciCategory;
  exceptions: ExceptionType[];
  asnStatus?: AsnStatus;
  ageInStageDays?: number;    // how long it has been in its current stage
}

export interface DcMilestone {
  name: string;
  date: string;
  status: "pending" | "on-track" | "late" | "complete";
}

export interface DcProject {
  id: string;
  name: string;
  customer: string;
  site: string;
  mechanicalSetDate: string;
  status: DcStatus;
  projectManager: string;
  assets: DcAsset[];
  milestones: DcMilestone[];
}

// ── Escalation workflow ────────────────────────────────────────────────────────

export type EscalationStatus = "open" | "notified" | "acknowledged" | "resolved";
export type EscalationSeverity = "critical" | "high" | "medium";

export interface EscalationEvent {
  timestamp: string;
  action: string;
  actor: string;
}

export interface Escalation {
  id: string;
  assetId: string;
  projectId: string;
  exceptionType: ExceptionType;
  severity: EscalationSeverity;
  status: EscalationStatus;
  assignee: string;
  createdAt: string;
  dueDate: string;
  notes: string;
  history: EscalationEvent[];
}

// ── Delivery risk model ────────────────────────────────────────────────────────

export interface DcRiskScore {
  projectId: string;
  milestoneProximityRisk: number;  // 0-100
  missingQaRisk: number;           // 0-100
  locationMismatchRisk: number;    // 0-100
  delayedAsnRisk: number;          // 0-100
  freightExceptionRisk: number;    // 0-100
  inventoryAgingRisk: number;      // 0-100
  compositeRisk: number;           // weighted
  riskLevel: "critical" | "high" | "medium" | "low";
  criticalAssetIds: string[];
}

export const DC_RISK_WEIGHTS = {
  milestoneProximity: 0.35,
  missingQa:          0.20,
  delayedAsn:         0.20,
  freightException:   0.15,
  locationMismatch:   0.10,
} as const;

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

/** How long has an asset been sitting in its current stage? */
function agingRiskForAsset(asset: DcAsset, today: string): number {
  const age = asset.ageInStageDays ?? 0;
  if (asset.stage === "staging" && age > 14) return Math.min(100, (age - 14) * 5);
  if (asset.stage === "qa"      && age > 7)  return Math.min(100, (age - 7)  * 8);
  if (asset.stage === "ready"   && age > 21) return Math.min(100, (age - 21) * 3);
  return 0;
}

export function scoreDcProject(project: DcProject, today: string): DcRiskScore {
  const assets     = project.assets;
  const total      = Math.max(assets.length, 1);
  const daysLeft   = daysBetween(today, project.mechanicalSetDate);

  // 1. Milestone proximity — how many assets are NOT at ready/delivered, weighted by urgency
  const notReady = assets.filter(
    (a) => a.stage !== "ready" && a.stage !== "delivered" && a.stage !== "exception",
  ).length;
  const notReadyPct = notReady / total;
  // Time urgency: 0 days = 1.0 multiplier, 60+ days = ~0.0
  const timeUrgency = daysLeft <= 0 ? 1 : Math.max(0, 1 - daysLeft / 60);
  const milestoneProximityRisk = Math.round(notReadyPct * 100 * Math.max(timeUrgency, notReadyPct * 0.3));

  // 2. Missing QA — assets past staging with no QA pass
  const needsQa   = assets.filter((a) => ["qa", "ready"].includes(a.stage));
  const failedQa  = needsQa.filter((a) => a.qaStatus !== "pass").length;
  const missingQaRisk = Math.round((failedQa / Math.max(needsQa.length, 1)) * 100);

  // 3. Location mismatch — received but location not set
  const received  = assets.filter((a) => !["po-placed"].includes(a.stage));
  const noLoc     = received.filter((a) => !a.location).length;
  const locationMismatchRisk = Math.round((noLoc / Math.max(received.length, 1)) * 100);

  // 4. Delayed ASN — assets awaiting delivery with delayed or missing ASN
  const expectingAsn  = assets.filter((a) => ["po-placed", "receiving"].includes(a.stage));
  const badAsn        = expectingAsn.filter(
    (a) => a.asnStatus === "delayed" || a.asnStatus === "missing",
  ).length;
  const delayedAsnRisk = Math.round((badAsn / Math.max(expectingAsn.length, 1)) * 100);

  // 5. Freight exceptions
  const freightEx  = assets.filter((a) => a.exceptions.includes("freight")).length;
  const freightExceptionRisk = Math.round((freightEx / total) * 100);

  // 6. Inventory aging (max across assets)
  const agingScores = assets.map((a) => agingRiskForAsset(a, today));
  const inventoryAgingRisk = agingScores.length > 0 ? Math.max(...agingScores) : 0;

  // Composite
  const compositeRisk = Math.min(100, Math.round(
    milestoneProximityRisk * DC_RISK_WEIGHTS.milestoneProximity +
    missingQaRisk          * DC_RISK_WEIGHTS.missingQa          +
    delayedAsnRisk         * DC_RISK_WEIGHTS.delayedAsn         +
    freightExceptionRisk   * DC_RISK_WEIGHTS.freightException    +
    locationMismatchRisk   * DC_RISK_WEIGHTS.locationMismatch,
  ));

  const riskLevel =
    compositeRisk >= 70 ? "critical" :
    compositeRisk >= 50 ? "high"     :
    compositeRisk >= 30 ? "medium"   : "low";

  // Critical assets: any asset with exceptions OR failed QA OR in exception stage
  const criticalAssetIds = assets
    .filter((a) => a.exceptions.length > 0 || a.qaStatus === "fail" || a.stage === "exception")
    .map((a) => a.id);

  return {
    projectId: project.id,
    milestoneProximityRisk,
    missingQaRisk,
    locationMismatchRisk,
    delayedAsnRisk,
    freightExceptionRisk,
    inventoryAgingRisk,
    compositeRisk,
    riskLevel,
    criticalAssetIds,
  };
}

// ── Escalation helpers ────────────────────────────────────────────────────────

export const EXCEPTION_LABELS: Record<ExceptionType, string> = {
  "freight":           "Freight Exception",
  "asn-delay":         "ASN Delay",
  "location-mismatch": "Location Mismatch",
  "qa-fail":           "QA Failure",
  "missing-po":        "Missing PO",
  "damage":            "Damage Reported",
};

export const STAGE_LABELS: Record<AssetStage, string> = {
  "po-placed":  "PO Placed",
  "receiving":  "Receiving",
  "staging":    "Staging",
  "qa":         "QA",
  "ready":      "Ready",
  "delivered":  "Delivered",
  "exception":  "Exception",
};

export const STAGE_ORDER: AssetStage[] = [
  "po-placed", "receiving", "staging", "qa", "ready", "delivered",
];

export const OFCI_LABELS: Record<OfciCategory, string> = {
  server:     "Servers",
  storage:    "Storage",
  networking: "Networking",
  cooling:    "Cooling",
  power:      "Power",
  cable:      "Cabling",
  other:      "Other",
};
