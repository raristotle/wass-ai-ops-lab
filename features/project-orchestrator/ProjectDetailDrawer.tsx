"use client";

import { X, FileText, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { ComplexProject, ProjectScore, MilestoneStatus, SupplierPkgStatus } from "@/lib/risk/project-orchestrator";
import { RISK_TYPE_LABELS } from "@/lib/risk/project-orchestrator";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const MS_DOT: Record<MilestoneStatus, string> = {
  complete:  "bg-[#00AA13]",
  "on-track":"bg-[#B7C9D3]",
  "at-risk": "bg-[#EAAA00]",
  late:      "bg-red-500",
};

const SUPP_VARIANT: Record<SupplierPkgStatus, BadgeVariant> = {
  confirmed: "success",
  submitted: "secondary",
  pending:   "outline",
  late:      "destructive",
};

const SEV_COLOR: Record<string, string> = {
  critical: "text-red-500",
  high:     "text-[#DB6B30]",
  medium:   "text-[#EAAA00]",
  low:      "text-[#00AA13]",
};

interface Props {
  open: boolean;
  onClose: () => void;
  project: ComplexProject | null;
  score: ProjectScore | null;
  onOpenBrief: () => void;
}

export function ProjectDetailDrawer({ open, onClose, project, score, onOpenBrief }: Props) {
  if (!open || !project || !score) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[500px] flex-col border-l bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[#1D252D] dark:text-foreground">
              {project.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {project.customer} · {formatCurrency(project.totalValueUsd)}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {project.sbus.map((sbu) => (
                <span
                  key={sbu}
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[9px] font-semibold",
                    sbu === "CSS" ? "border-[#004986]/30 bg-[#004986]/10 text-[#004986]" :
                    sbu === "EES" ? "border-[#00573F]/30 bg-[#00573F]/10 text-[#00573F]" :
                                   "border-[#64CCC9]/40 bg-[#64CCC9]/20 text-[#3a9f9c]",
                  )}
                >
                  {sbu}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBrief}
              className="flex items-center gap-1.5 rounded-md border border-[#00AA13] px-2.5 py-1.5 text-xs font-medium text-[#00573F] transition-colors hover:bg-[#00AA13]/10"
            >
              <FileText className="h-3.5 w-3.5" />
              One Meridian Brief
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex flex-1 flex-col gap-0 overflow-y-auto divide-y">
          {/* Score strip */}
          <div className="grid grid-cols-4 gap-0 divide-x px-0">
            {[
              { label: "Late Ms.", value: score.lateMilestoneRisk },
              { label: "Margin",   value: score.marginRisk },
              { label: "Fulfil.",  value: score.fulfillmentRisk },
              { label: "Owner",    value: score.missingOwnerRisk },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3 text-center">
                <p className="text-[9px] text-muted-foreground">{label}</p>
                <p className={cn(
                  "text-lg font-bold tabular-nums",
                  value >= 70 ? "text-red-500" : value >= 50 ? "text-[#DB6B30]" : value >= 30 ? "text-[#EAAA00]" : "text-[#00AA13]",
                )}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* BOM + Quotes */}
          <div className="grid grid-cols-2 gap-0 divide-x px-0">
            <div className="px-4 py-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">BOM</p>
              <div className="space-y-0.5 text-[11px]">
                <p><span className="font-medium">{project.bom.approved}</span> approved</p>
                <p className={project.bom.missing > 0 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                  {project.bom.missing} missing
                </p>
                <p className="text-muted-foreground">{project.bom.pendingReview} pending review</p>
                <p className="text-muted-foreground">{project.bom.total} total lines</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quotes</p>
              <div className="space-y-0.5 text-[11px]">
                <p><span className="font-medium">{project.quotes.won}</span> won</p>
                <p className="text-muted-foreground">{project.quotes.open} open · {project.quotes.submitted} submitted</p>
                <p className={cn("font-medium", project.quotes.marginPct < 0.15 ? "text-[#DB6B30]" : "text-[#00AA13]")}>
                  Margin {(project.quotes.marginPct * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Milestones
            </p>
            <div className="space-y-1">
              {project.milestones.map((m) => (
                <div key={m.name} className="flex items-center gap-2 text-[11px]">
                  <div className={cn("h-2 w-2 shrink-0 rounded-full", MS_DOT[m.status])} />
                  <span className="flex-1 truncate">{m.name}</span>
                  <span className="shrink-0 text-muted-foreground">{m.plannedDate}</span>
                  <span className={cn(
                    "shrink-0 capitalize text-[9px] font-medium",
                    m.status === "late" ? "text-red-500" :
                    m.status === "at-risk" ? "text-[#EAAA00]" :
                    m.status === "complete" ? "text-[#00AA13]" : "text-muted-foreground",
                  )}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier packages */}
          <div className="px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Supplier Packages
            </p>
            <div className="space-y-1.5">
              {project.supplierPackages.map((s) => (
                <div key={s.vendor + s.category} className="flex items-center gap-2 text-[11px]">
                  <Badge variant={SUPP_VARIANT[s.status]} className="shrink-0 text-[9px] capitalize">{s.status}</Badge>
                  <span className="flex-1 truncate">{s.vendor} / {s.category}</span>
                  <span className="shrink-0 text-muted-foreground">{formatCurrency(s.valueUsd)}</span>
                </div>
              ))}
              {project.supplierPackages.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No supplier packages</p>
              )}
            </div>
          </div>

          {/* Risks */}
          {project.risks.length > 0 && (
            <div className="px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Risks
              </p>
              <div className="space-y-2">
                {project.risks.map((r, i) => (
                  <div key={i} className="rounded border bg-muted/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold uppercase", SEV_COLOR[r.severity])}>
                        {r.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{RISK_TYPE_LABELS[r.type]}</span>
                    </div>
                    <p className="mt-0.5 text-[11px]">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-sell */}
          {project.crossSell.length > 0 && (
            <div className="px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cross-Sell Opportunities
              </p>
              <div className="space-y-1">
                {project.crossSell.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <TrendingUp className="h-3 w-3 shrink-0 text-[#00AA13]" />
                    <span className="flex-1 truncate">{c.sbu} · {c.category}</span>
                    <span className="shrink-0 font-medium text-[#00AA13]">{formatCurrency(c.estimatedValueUsd)}</span>
                    <Badge variant="outline" className="shrink-0 text-[9px] capitalize">{c.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3">
          <p className="text-center text-[10px] text-muted-foreground">
            PROTOTYPE ONLY · Scores are AI-generated · Not for operational use
          </p>
        </div>
      </aside>
    </>
  );
}
