"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle, Bell, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  Escalation, EscalationStatus, EscalationSeverity,
  DcAsset, DcProject, DcRiskScore,
} from "@/lib/risk/dc-risk";
import { EXCEPTION_LABELS } from "@/lib/risk/dc-risk";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const SEV_VARIANT: Record<EscalationSeverity, BadgeVariant> = {
  critical: "destructive",
  high:     "warning",
  medium:   "secondary",
};

const STATUS_BADGE: Record<EscalationStatus, { variant: BadgeVariant; label: string }> = {
  open:         { variant: "destructive", label: "Open" },
  notified:     { variant: "warning",     label: "Notified" },
  acknowledged: { variant: "default",     label: "Acknowledged" },
  resolved:     { variant: "success",     label: "Resolved" },
};

const STATUS_FLOW: EscalationStatus[] = ["open", "notified", "acknowledged", "resolved"];

// ── EscalationDrawer ───────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  escalation: Escalation | null;
  project: DcProject | null;
  riskScore: DcRiskScore | null;
  onUpdateStatus: (id: string, newStatus: EscalationStatus) => void;
}

export function EscalationDrawer({ open, onClose, escalation, project, riskScore, onUpdateStatus }: Props) {
  const [localNotes, setLocalNotes] = useState("");

  if (!open || !escalation || !project) return null;

  // Find the affected asset
  const asset: DcAsset | undefined = project.assets.find((a) => a.id === escalation.assetId);

  const currentIdx   = STATUS_FLOW.indexOf(escalation.status);
  const nextStatus   = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;
  const isResolved   = escalation.status === "resolved";

  const daysSince = Math.round(
    (Date.now() - new Date(escalation.createdAt).getTime()) / 86_400_000,
  );
  const daysUntilDue = Math.round(
    (new Date(escalation.dueDate).getTime() - Date.now()) / 86_400_000,
  );

  function handleAdvance() {
    if (nextStatus) onUpdateStatus(escalation!.id, nextStatus);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[480px] flex-col border-l bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className={cn(
              "mt-0.5 h-5 w-5 shrink-0",
              escalation.severity === "critical" ? "text-red-500"
              : escalation.severity === "high"   ? "text-[#DB6B30]"
              : "text-[#EAAA00]",
            )} />
            <div>
              <h2 className="text-sm font-semibold">{EXCEPTION_LABELS[escalation.exceptionType]}</h2>
              <p className="text-[10px] text-muted-foreground">{escalation.id} · {project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-0 overflow-y-auto divide-y">
          {/* Status + meta */}
          <div className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={SEV_VARIANT[escalation.severity]} className="capitalize">{escalation.severity}</Badge>
              <Badge variant={STATUS_BADGE[escalation.status].variant}>
                {STATUS_BADGE[escalation.status].label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {daysSince}d open · due {escalation.dueDate}
              </span>
              {daysUntilDue <= 3 && !isResolved && (
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-medium text-red-600 dark:bg-red-900/30">
                  Due in {daysUntilDue}d
                </span>
              )}
            </div>
            <p className="mt-3 text-xs">{escalation.notes}</p>
            <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span>Assigned: <span className="font-medium text-foreground">{escalation.assignee}</span></span>
            </div>
          </div>

          {/* Affected asset */}
          {asset && (
            <div className="px-5 py-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Affected Asset
              </p>
              <div className="rounded-lg border bg-muted/20 px-3 py-2 text-[11px]">
                <p className="font-medium">{asset.itemDesc}</p>
                <p className="text-muted-foreground">PO {asset.poNumber} · {asset.vendor}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                  <span>Stage: <span className="font-medium capitalize">{asset.stage.replace("-", " ")}</span></span>
                  {asset.location && <span>Location: <span className="font-medium">{asset.location}</span></span>}
                  {asset.qaStatus && (
                    <span className={asset.qaStatus === "fail" ? "text-red-500 font-medium" : ""}>
                      QA: {asset.qaStatus}
                    </span>
                  )}
                  {asset.asnStatus && (
                    <span className={asset.asnStatus === "missing" ? "text-red-500 font-medium" : asset.asnStatus === "delayed" ? "text-[#DB6B30] font-medium" : ""}>
                      ASN: {asset.asnStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delivery risk context */}
          {riskScore && (
            <div className="px-5 py-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Project Risk Context
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Milestone Proximity", value: riskScore.milestoneProximityRisk },
                  { label: "Missing QA",          value: riskScore.missingQaRisk },
                  { label: "Delayed ASN",         value: riskScore.delayedAsnRisk },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded border bg-card px-2 py-1.5 text-center">
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                    <p className={cn(
                      "text-sm font-bold",
                      value >= 70 ? "text-red-500" : value >= 50 ? "text-[#DB6B30]" : value >= 30 ? "text-[#EAAA00]" : "text-[#00AA13]",
                    )}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <p className={cn(
                "mt-2 text-[10px] font-semibold",
                riskScore.riskLevel === "critical" ? "text-red-500" :
                riskScore.riskLevel === "high"     ? "text-[#DB6B30]" :
                riskScore.riskLevel === "medium"   ? "text-[#EAAA00]" : "text-[#00AA13]",
              )}>
                Project composite risk: {riskScore.compositeRisk}/100 ({riskScore.riskLevel.toUpperCase()})
              </p>
            </div>
          )}

          {/* Escalation timeline */}
          <div className="px-5 py-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Activity Timeline
            </p>
            <div className="space-y-2">
              {escalation.history.map((event, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4F758B]" />
                  <div>
                    <p>{event.action}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {event.actor} · {new Date(event.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes input */}
            {!isResolved && (
              <div className="mt-3">
                <textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  placeholder="Add a note…"
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action footer */}
        <div className="border-t px-5 py-3">
          {isResolved ? (
            <div className="flex items-center justify-center gap-2 text-sm text-[#00AA13]">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Escalation resolved</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdvance}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#1D252D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D252D]/80 dark:bg-white dark:text-[#1D252D] dark:hover:bg-white/80"
              >
                {nextStatus === "notified"     && <Bell className="h-3.5 w-3.5" />}
                {nextStatus === "acknowledged" && <Clock className="h-3.5 w-3.5" />}
                {nextStatus === "resolved"     && <CheckCircle className="h-3.5 w-3.5" />}
                {nextStatus
                  ? `Mark ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`
                  : "No next action"}
              </button>
            </div>
          )}
          <p className="mt-1.5 text-center text-[9px] text-muted-foreground">
            PROTOTYPE ONLY · Escalation state is local session only
          </p>
        </div>
      </aside>
    </>
  );
}
