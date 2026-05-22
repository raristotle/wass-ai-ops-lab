"use client";

import { AlertTriangle, CheckCircle, Clock, Package, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { BomLine, BomSku } from "@/lib/autobom";
import { CATEGORY_COLORS, AVAIL_LABELS, STATUS_LABELS } from "@/lib/autobom";
import { useState } from "react";

// ── ConfidenceBar ──────────────────────────────────────────────────────────────

function ConfidenceBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-[#00AA13]" :
    score >= 60 ? "bg-[#EAAA00]" :
    score >= 30 ? "bg-[#DB6B30]" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn(
        "text-[10px] font-bold tabular-nums",
        score >= 80 ? "text-[#00AA13]" :
        score >= 60 ? "text-[#EAAA00]" :
        score >= 30 ? "text-[#DB6B30]" : "text-red-500",
      )}>
        {score}
      </span>
    </div>
  );
}

// ── AvailabilityChip ───────────────────────────────────────────────────────────

function AvailabilityChip({ avail, leadDays }: { avail: BomSku["availability"]; leadDays?: number }) {
  const colors: Record<BomSku["availability"], string> = {
    "in-stock":   "bg-[#00AA13]/10 text-[#00573F] border-[#00AA13]/30",
    limited:      "bg-[#EAAA00]/10 text-[#7a5900] border-[#EAAA00]/40",
    "lead-time":  "bg-[#DB6B30]/10 text-[#DB6B30] border-[#DB6B30]/30",
    discontinued: "bg-red-100 text-red-600 border-red-200",
    unknown:      "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", colors[avail])}>
      {AVAIL_LABELS[avail]}
      {avail === "lead-time" && leadDays ? ` ~${leadDays}d` : ""}
    </span>
  );
}

// ── SkuBlock ───────────────────────────────────────────────────────────────────

function SkuBlock({ sku, label = "Suggested SKU", dim = false }: { sku: BomSku; label?: string; dim?: boolean }) {
  return (
    <div className={cn("rounded-lg border bg-muted/20 px-3 py-2 text-[11px]", dim && "opacity-60")}>
      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono font-semibold text-[#1D252D] dark:text-foreground">{sku.sku}</p>
      <p className="text-muted-foreground leading-tight">{sku.description}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-medium">{sku.manufacturer}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-medium">{sku.unitPrice !== null ? formatCurrency(sku.unitPrice) : "Price TBD"} / {sku.unitOfMeasure}</span>
        <AvailabilityChip avail={sku.availability} leadDays={sku.leadTimeDays} />
      </div>
    </div>
  );
}

// ── StatusIcon ─────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: BomLine["status"] }) {
  if (status === "accepted" || status === "replaced")     return <CheckCircle className="h-3.5 w-3.5 text-[#00AA13]" />;
  if (status === "sent-to-quote")                         return <CheckCircle className="h-3.5 w-3.5 text-[#004986]" />;
  if (status === "sme-requested")                         return <Clock className="h-3.5 w-3.5 text-[#EAAA00]" />;
  if (status === "flagged")                               return <AlertTriangle className="h-3.5 w-3.5 text-[#DB6B30]" />;
  return <Package className="h-3.5 w-3.5 text-muted-foreground" />;
}

// ── BomLineCard ────────────────────────────────────────────────────────────────

interface Props {
  line: BomLine;
  /** Called by parent to change status */
  onAction: (lineId: string, action: "accept" | "flag" | "sme") => void;
}

export function BomLineCard({ line, onAction }: Props) {
  const [altOpen, setAltOpen] = useState(false);

  const activeSku = line.replacedWith ?? line.suggestedSku;

  return (
    <div className={cn(
      "rounded-lg border bg-card transition-all",
      line.status === "accepted"    && "border-[#00AA13]/40 bg-[#00AA13]/2",
      line.status === "replaced"    && "border-[#00AA13]/40 bg-[#00AA13]/2",
      line.status === "sent-to-quote" && "border-[#004986]/40 bg-[#004986]/2",
      line.status === "flagged"     && "border-[#DB6B30]/40",
      line.status === "sme-requested" && "border-[#EAAA00]/40",
    )}>
      {/* Line header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground">#{line.lineNumber}</span>
          <StatusIcon status={line.status} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug text-[#1D252D] dark:text-foreground">
            {line.rawText}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={cn(
              "rounded border px-1.5 py-0.5 text-[9px] font-semibold",
              CATEGORY_COLORS[line.category],
            )}>
              {line.category}
            </span>
            {line.quantity !== null && (
              <span className="text-[10px] text-muted-foreground">
                Qty: <span className="font-medium">{line.quantity} {line.unit}</span>
              </span>
            )}
            <span className={cn(
              "rounded border px-1.5 py-0.5 text-[9px] font-medium",
              line.status === "pending"       ? "border-border bg-muted text-muted-foreground" :
              line.status === "accepted"      ? "border-[#00AA13]/30 bg-[#00AA13]/10 text-[#00573F]" :
              line.status === "replaced"      ? "border-[#00AA13]/30 bg-[#00AA13]/10 text-[#00573F]" :
              line.status === "sent-to-quote" ? "border-[#004986]/30 bg-[#004986]/10 text-[#004986]" :
              line.status === "sme-requested" ? "border-[#EAAA00]/30 bg-[#EAAA00]/10 text-[#7a5900]" :
              "border-[#DB6B30]/30 bg-[#DB6B30]/10 text-[#DB6B30]",
            )}>
              {STATUS_LABELS[line.status]}
            </span>
          </div>
        </div>
        {/* Confidence */}
        <div className="shrink-0 text-right">
          <p className="text-[9px] text-muted-foreground">Confidence</p>
          <ConfidenceBar score={line.confidence} />
        </div>
      </div>

      {/* Parsed intent */}
      <div className="border-t px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground">Parsed: </span>
          {line.parsedIntent}
        </p>
      </div>

      {/* Suggested SKU */}
      {activeSku ? (
        <div className="border-t px-4 py-3">
          <SkuBlock
            sku={activeSku}
            label={line.replacedWith ? "Replaced SKU" : "Suggested SKU"}
          />
        </div>
      ) : (
        <div className="border-t px-4 py-3">
          <p className="text-[10px] text-muted-foreground italic">
            No SKU match — manual selection or SME review required
          </p>
        </div>
      )}

      {/* Confidence reasons */}
      {line.confidenceReasons.length > 0 && (
        <div className="border-t px-4 py-2">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Confidence Factors
          </p>
          <ul className="space-y-0.5">
            {line.confidenceReasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[10px]">
                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-[#4F758B]" />
                <span className="text-muted-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing info */}
      {line.missingInfo.length > 0 && (
        <div className="border-t px-4 py-2">
          <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-[#DB6B30]">
            <Info className="h-2.5 w-2.5" />
            Missing Information
          </p>
          <ul className="space-y-0.5">
            {line.missingInfo.map((m, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[10px] text-[#DB6B30]">
                <span className="mt-0.5">·</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternates */}
      {line.alternates.length > 0 && (
        <div className="border-t">
          <button
            onClick={() => setAltOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            <span>{line.alternates.length} alternate{line.alternates.length > 1 ? "s" : ""} available</span>
            {altOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {altOpen && (
            <div className="space-y-2 px-4 pb-3">
              {line.alternates.map((alt) => (
                <SkuBlock key={alt.sku} sku={alt} label="Alternate" dim />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SME note (if set) */}
      {line.smeNote && (
        <div className="border-t px-4 py-2 bg-[#EAAA00]/5">
          <p className="text-[9px] font-semibold text-[#7a5900]">
            SME Note · {line.smeAssignee ?? "Unassigned"}
          </p>
          <p className="text-[10px] text-muted-foreground">{line.smeNote}</p>
        </div>
      )}

      {/* Quick actions */}
      {line.status === "pending" || line.status === "flagged" ? (
        <div className="border-t px-4 py-2 flex items-center gap-2">
          {line.suggestedSku && (
            <button
              onClick={() => onAction(line.id, "accept")}
              className="flex items-center gap-1.5 rounded-md bg-[#00AA13] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#00AA13]/80 transition-colors"
            >
              <CheckCircle className="h-3 w-3" />
              Accept
            </button>
          )}
          <button
            onClick={() => onAction(line.id, "sme")}
            className="flex items-center gap-1.5 rounded-md border border-[#EAAA00] px-3 py-1.5 text-[10px] font-semibold text-[#7a5900] hover:bg-[#EAAA00]/10 transition-colors"
          >
            <Clock className="h-3 w-3" />
            Request SME
          </button>
        </div>
      ) : null}
    </div>
  );
}
