// eProcurement Risk Scorer — pure functions, no I/O

export const EPROC_PLATFORMS = [
  "Kojo", "Remarcable", "D-Tools", "Portal.io",
  "ConnectWise", "Jetbuilt", "Sedona", "Cableteque", "SimPro",
] as const;

export type EprocPlatform   = (typeof EPROC_PLATFORMS)[number];
export type AdoptionLevel   = "evaluating" | "piloting" | "deployed" | "expanding";
export type IntegrationStatus = "none" | "partial" | "full";
export type RiskLevel       = "low" | "medium" | "high" | "critical";
export type CtaType         = "integrate" | "sales-discovery" | "pricing-setup" | "api-readiness" | "edi-readiness";

// Platforms where EDI is the dominant integration pattern (order-based)
const EDI_PLATFORMS = new Set<EprocPlatform>(["Kojo", "Remarcable", "SimPro", "Cableteque", "Sedona"]);
// Platforms where API / webhooks are the dominant pattern
const API_PLATFORMS = new Set<EprocPlatform>(["ConnectWise", "D-Tools", "Jetbuilt", "Portal.io"]);

export const CTA_LABELS: Record<CtaType, string> = {
  "integrate":       "Complete Integration",
  "sales-discovery": "Sales Discovery Call",
  "pricing-setup":   "Pricing Setup",
  "api-readiness":   "API Readiness Review",
  "edi-readiness":   "EDI Readiness Review",
};

export const PLATFORM_CATEGORY: Record<EprocPlatform, string> = {
  Kojo:         "Electrical / Construction",
  Remarcable:   "Electrical / Contractor",
  "D-Tools":    "AV / Systems Integration",
  "Portal.io":  "B2B Commerce",
  ConnectWise:  "IT Service Management",
  Jetbuilt:     "AV Proposal & Procurement",
  Sedona:       "Security / Fire / Low-Voltage",
  Cableteque:   "Telecom Contractor",
  SimPro:       "Field Service / HVAC",
};

export const REASON_CODES_EPROC = {
  HIGH_REVENUE:          "HIGH_REVENUE",
  CRITICAL_REVENUE:      "CRITICAL_REVENUE",
  DEPLOYED_PLATFORM:     "DEPLOYED_PLATFORM",
  EXPANDING_PLATFORM:    "EXPANDING_PLATFORM",
  MULTI_PLATFORM:        "MULTI_PLATFORM",
  NO_INTEGRATION:        "NO_INTEGRATION",
  PARTIAL_INTEGRATION:   "PARTIAL_INTEGRATION",
  COMPETITOR_PRESENT:    "COMPETITOR_PRESENT",
  MULTI_COMPETITOR:      "MULTI_COMPETITOR",
  SOLE_SOURCE_RISK:      "SOLE_SOURCE_RISK",
} as const;

export interface PlatformRecord {
  platform: EprocPlatform;
  adoptionLevel: AdoptionLevel;
  integrationStatus: IntegrationStatus;
  monthsActive: number;
}

export interface EprocAccount {
  id: string;
  name: string;
  sbu: string;
  owner: string;
  annualRevenueUsd: number;
  platforms: PlatformRecord[];
  competitorPresent: boolean;
  competitorNames: string[];
  nextAction: string;
  lastContactDate: string;
  createdAt: string;
}

export interface EprocScore {
  riskScore: number;          // 0-100 weighted
  riskLevel: RiskLevel;
  revenueExposure: number;    // 0-100 factor score
  platformAdoption: number;   // 0-100 factor score
  integrationGap: number;     // 0-100 factor score (100 = no integration)
  competitorRisk: number;     // 0-100 factor score
  cta: CtaType;
  ctaLabel: string;
  revenueAtRiskUsd: number;   // annualRevenueUsd × riskScore/100
  reasonCodes: string[];
}

// ── Factor scorers ────────────────────────────────────────────────────────────

function scoreRevenue(usd: number): number {
  if (usd >= 10_000_000) return 100;
  if (usd >= 5_000_000)  return 90;
  if (usd >= 1_000_000)  return 75;
  if (usd >= 500_000)    return 55;
  if (usd >= 100_000)    return 35;
  return 15;
}

function scoreAdoption(platforms: PlatformRecord[]): number {
  if (platforms.length === 0) return 0;
  const map: Record<AdoptionLevel, number> = { evaluating: 20, piloting: 50, deployed: 80, expanding: 100 };
  const maxScore = Math.max(...platforms.map((p) => map[p.adoptionLevel]));
  const multiBonus = Math.min((platforms.length - 1) * 12, 20);
  return Math.min(100, maxScore + multiBonus);
}

function scoreIntegrationGap(platforms: PlatformRecord[]): number {
  if (platforms.length === 0) return 100; // unknown = worst case
  const map: Record<IntegrationStatus, number> = { none: 100, partial: 45, full: 0 };
  return Math.max(...platforms.map((p) => map[p.integrationStatus]));
}

function scoreCompetitor(present: boolean, count: number): number {
  if (!present) return 0;
  if (count >= 2) return 92;
  return 62;
}

function riskLevel(score: number): RiskLevel {
  if (score >= 76) return "critical";
  if (score >= 51) return "high";
  if (score >= 26) return "medium";
  return "low";
}

// ── CTA selector ──────────────────────────────────────────────────────────────

function selectCta(
  account: EprocAccount,
  adoption: number,
  integrationGap: number,
  competitorRisk: number,
): CtaType {
  const hasActiveDeployment = account.platforms.some(
    (p) => p.adoptionLevel === "deployed" || p.adoptionLevel === "expanding",
  );
  const hasNoIntegration = account.platforms.some((p) => p.integrationStatus === "none");
  const hasEdi = account.platforms.some((p) => EDI_PLATFORMS.has(p.platform));
  const hasApi = account.platforms.some((p) => API_PLATFORMS.has(p.platform));

  // Competitor + large revenue → urgent sales engagement
  if (account.competitorPresent && account.annualRevenueUsd >= 1_000_000) {
    return "sales-discovery";
  }

  // Deployed/expanding platform but no integration → integration readiness
  if (hasNoIntegration && hasActiveDeployment) {
    if (hasEdi && !hasApi) return "edi-readiness";
    if (hasApi && !hasEdi) return "api-readiness";
    return "edi-readiness"; // default to EDI if both or neither
  }

  // Partial integration → push to complete
  if (integrationGap >= 40 && integrationGap < 100) {
    return "integrate";
  }

  // Early-stage adoption → pricing to lock in
  if (adoption <= 50) {
    return "pricing-setup";
  }

  return "sales-discovery";
}

// ── Reason codes ──────────────────────────────────────────────────────────────

function buildReasonCodes(account: EprocAccount, adoption: number, integrationGap: number): string[] {
  const codes: string[] = [];

  if (account.annualRevenueUsd >= 5_000_000)  codes.push(REASON_CODES_EPROC.CRITICAL_REVENUE);
  else if (account.annualRevenueUsd >= 1_000_000) codes.push(REASON_CODES_EPROC.HIGH_REVENUE);

  const hasDeployed  = account.platforms.some((p) => p.adoptionLevel === "deployed");
  const hasExpanding = account.platforms.some((p) => p.adoptionLevel === "expanding");
  if (hasExpanding)     codes.push(REASON_CODES_EPROC.EXPANDING_PLATFORM);
  else if (hasDeployed) codes.push(REASON_CODES_EPROC.DEPLOYED_PLATFORM);

  if (account.platforms.length >= 2) codes.push(REASON_CODES_EPROC.MULTI_PLATFORM);

  if (integrationGap === 100) codes.push(REASON_CODES_EPROC.NO_INTEGRATION);
  else if (integrationGap >= 40) codes.push(REASON_CODES_EPROC.PARTIAL_INTEGRATION);

  if (account.competitorPresent) {
    if (account.competitorNames.length >= 2) codes.push(REASON_CODES_EPROC.MULTI_COMPETITOR);
    else codes.push(REASON_CODES_EPROC.COMPETITOR_PRESENT);
  }

  if (adoption >= 80 && integrationGap === 100 && !account.competitorPresent) {
    codes.push(REASON_CODES_EPROC.SOLE_SOURCE_RISK);
  }

  return codes;
}

// ── Main scorer ───────────────────────────────────────────────────────────────

// Weights: revenue 30%, adoption 30%, integration gap 15%, competitor 25%
export function scoreEprocAccount(account: EprocAccount): EprocScore {
  const rev    = scoreRevenue(account.annualRevenueUsd);
  const adopt  = scoreAdoption(account.platforms);
  const intGap = scoreIntegrationGap(account.platforms);
  const comp   = scoreCompetitor(account.competitorPresent, account.competitorNames.length);

  const riskScore = Math.round(rev * 0.30 + adopt * 0.30 + intGap * 0.15 + comp * 0.25);
  const level     = riskLevel(riskScore);
  const cta       = selectCta(account, adopt, intGap, comp);
  const codes     = buildReasonCodes(account, adopt, intGap);

  return {
    riskScore,
    riskLevel: level,
    revenueExposure:  rev,
    platformAdoption: adopt,
    integrationGap:   intGap,
    competitorRisk:   comp,
    cta,
    ctaLabel: CTA_LABELS[cta],
    revenueAtRiskUsd: Math.round(account.annualRevenueUsd * riskScore / 100),
    reasonCodes: codes,
  };
}

// ── CSV parser (browser, no dependencies) ─────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === "," && !inQuote) { result.push(cur); cur = ""; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

export function parseEprocCSV(text: string): EprocAccount[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const idx = (name: string) => headers.indexOf(name);

  const rows = lines.slice(1).map((l) => parseCSVLine(l).map((v) => v.trim()));
  const accountMap = new Map<string, EprocAccount>();

  for (const row of rows) {
    const name = row[idx("name")] || row[idx("accountname")] || row[idx("account")];
    if (!name) continue;

    const rawPlatform = row[idx("platform")] as EprocPlatform;
    if (!EPROC_PLATFORMS.includes(rawPlatform)) continue;

    if (!accountMap.has(name)) {
      const revenue = Number((row[idx("revenue")] || row[idx("annualrevenue")] || "0").replace(/[$,]/g, ""));
      const compRaw = (row[idx("competitor")] || row[idx("competitorpresent")] || "").toLowerCase();
      accountMap.set(name, {
        id: `CSV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        sbu: row[idx("sbu")] || "Unknown",
        owner: row[idx("owner")] || "",
        annualRevenueUsd: revenue,
        platforms: [],
        competitorPresent: ["yes", "true", "1", "y"].includes(compRaw),
        competitorNames: (row[idx("competitornames")] || "").split(";").map((s) => s.trim()).filter(Boolean),
        nextAction: row[idx("nextaction")] || row[idx("action")] || "",
        lastContactDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      });
    }

    const account = accountMap.get(name)!;
    const adoption = (row[idx("adoption")] || row[idx("adoptionlevel")] || "evaluating") as AdoptionLevel;
    const integration = (row[idx("integration")] || row[idx("integrationstatus")] || "none") as IntegrationStatus;

    account.platforms.push({
      platform: rawPlatform,
      adoptionLevel: (["evaluating", "piloting", "deployed", "expanding"].includes(adoption) ? adoption : "evaluating") as AdoptionLevel,
      integrationStatus: (["none", "partial", "full"].includes(integration) ? integration : "none") as IntegrationStatus,
      monthsActive: Number(row[idx("monthsactive")] || 0),
    });
  }

  return Array.from(accountMap.values());
}
