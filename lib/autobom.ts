// ── AutoBOM — core types & helpers ────────────────────────────────────────────
// Pure data shapes and utility functions. No UI imports.

export type BomLineStatus =
  | "pending"
  | "accepted"
  | "replaced"
  | "sme-requested"
  | "sent-to-quote"
  | "flagged";

export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export type AvailabilityStatus =
  | "in-stock"
  | "limited"
  | "lead-time"
  | "discontinued"
  | "unknown";

export type BomCategory =
  | "Circuit Breakers"
  | "Panelboards"
  | "Wire & Cable"
  | "Conduit"
  | "Conduit Fittings"
  | "Lighting"
  | "Wiring Devices"
  | "Transformers"
  | "Disconnects & Switches"
  | "Motor Controls"
  | "Power Infrastructure"
  | "Data Center Infrastructure"
  | "Uncategorized";

// ── SKU ────────────────────────────────────────────────────────────────────────

export interface BomSku {
  sku: string;
  description: string;
  manufacturer: string;
  unitPrice: number | null; // null = placeholder / not yet priced
  availability: AvailabilityStatus;
  leadTimeDays?: number;
  unitOfMeasure: string; // "EA", "SPOOL", "FT", "BOX", etc.
}

// ── BOM line ───────────────────────────────────────────────────────────────────

export interface BomLine {
  id: string;
  lineNumber: number;
  rawText: string;            // original spec line exactly as entered
  parsedIntent: string;       // normalised English summary of what we understood
  category: BomCategory;
  quantity: number | null;
  unit: string | null;        // "EA", "LF", "SPOOL", etc.

  suggestedSku: BomSku | null;
  confidence: number;         // 0–100 composite score
  confidenceLevel: ConfidenceLevel;
  confidenceReasons: string[]; // human-readable reasons for this score
  alternates: BomSku[];        // up to 3 ranked alternatives
  missingInfo: string[];       // what info is missing to improve confidence

  status: BomLineStatus;
  smeNote?: string;
  smeAssignee?: string;
  replacedWith?: BomSku;       // set when user picks an alternate or custom SKU
  tags: string[];              // e.g. ["electrical", "css", "high-priority"]
}

// ── Extraction result ──────────────────────────────────────────────────────────

export interface BomExtraction {
  id: string;
  projectName: string;
  sourceText: string;
  lines: BomLine[];
  extractedAt: string;  // ISO timestamp
  parserVersion: string;
}

// ── Stats helper ───────────────────────────────────────────────────────────────

export interface BomStats {
  total: number;
  highConf: number;
  mediumConf: number;
  lowConf: number;
  needsReview: number;
  accepted: number;
  sentToQuote: number;
  estimatedValue: number | null;
}

export function computeBomStats(lines: BomLine[]): BomStats {
  const highConf    = lines.filter((l) => l.confidenceLevel === "high").length;
  const mediumConf  = lines.filter((l) => l.confidenceLevel === "medium").length;
  const lowConf     = lines.filter((l) => l.confidenceLevel === "low" || l.confidenceLevel === "unknown").length;
  const needsReview = lines.filter(
    (l) => l.confidenceLevel !== "high" || l.missingInfo.length > 0,
  ).length;
  const accepted    = lines.filter((l) => l.status === "accepted" || l.status === "replaced").length;
  const sentToQuote = lines.filter((l) => l.status === "sent-to-quote").length;

  const priceable = lines.filter(
    (l) => (l.replacedWith?.unitPrice ?? l.suggestedSku?.unitPrice) !== null &&
            l.quantity !== null,
  );
  const estimatedValue =
    priceable.length > 0
      ? priceable.reduce((s, l) => {
          const price = l.replacedWith?.unitPrice ?? l.suggestedSku?.unitPrice ?? 0;
          return s + price * (l.quantity ?? 0);
        }, 0)
      : null;

  return { total: lines.length, highConf, mediumConf, lowConf, needsReview, accepted, sentToQuote, estimatedValue };
}

// ── Confidence level derivation ────────────────────────────────────────────────

export function toConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  if (score >= 30) return "low";
  return "unknown";
}

// ── Status label helpers ───────────────────────────────────────────────────────

export const STATUS_LABELS: Record<BomLineStatus, string> = {
  pending:        "Pending",
  accepted:       "Accepted",
  replaced:       "Replaced",
  "sme-requested":"SME Requested",
  "sent-to-quote":"Sent to Quote",
  flagged:        "Flagged",
};

export const AVAIL_LABELS: Record<AvailabilityStatus, string> = {
  "in-stock":    "In Stock",
  limited:       "Limited",
  "lead-time":   "Lead Time",
  discontinued:  "Discontinued",
  unknown:       "TBD",
};

export const CATEGORY_COLORS: Record<BomCategory, string> = {
  "Circuit Breakers":           "bg-[#004986]/10 text-[#004986] border-[#004986]/30",
  "Panelboards":                "bg-[#00573F]/10 text-[#00573F] border-[#00573F]/30",
  "Wire & Cable":               "bg-[#DB6B30]/10 text-[#DB6B30] border-[#DB6B30]/30",
  "Conduit":                    "bg-[#4F758B]/10 text-[#4F758B] border-[#4F758B]/30",
  "Conduit Fittings":           "bg-[#B7C9D3]/20 text-[#1D252D] border-[#B7C9D3]/40",
  "Lighting":                   "bg-[#EAAA00]/10 text-[#7a5900] border-[#EAAA00]/40",
  "Wiring Devices":             "bg-[#64CCC9]/15 text-[#1D252D] border-[#64CCC9]/40",
  "Transformers":               "bg-purple-100 text-purple-700 border-purple-200",
  "Disconnects & Switches":     "bg-orange-100 text-orange-700 border-orange-200",
  "Motor Controls":             "bg-rose-100 text-rose-700 border-rose-200",
  "Power Infrastructure":       "bg-[#004986]/10 text-[#004986] border-[#004986]/30",
  "Data Center Infrastructure": "bg-slate-100 text-slate-700 border-slate-200",
  "Uncategorized":              "bg-muted text-muted-foreground border-border",
};
