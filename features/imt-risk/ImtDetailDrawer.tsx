"use client";

import { X, Ban, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfidenceChip, ReasonCodeList } from "@/features/governance/GovernanceChips";
import type { ImtDecision, ImtFactorScore, ImtOutput } from "@/lib/risk/imt";
import type { ImtRequest } from "@/data/mock/imt-requests";

interface ImtDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: ImtRequest | null;
  output: ImtOutput | null;
}

const DECISION_VARIANT: Record<ImtDecision, Parameters<typeof Badge>[0]["variant"]> = {
  approve: "success",
  review:  "warning",
  reject:  "destructive",
};

const DECISION_COLOR: Record<ImtDecision, string> = {
  approve: "text-green-600",
  review:  "text-amber-600",
  reject:  "text-red-600",
};

function FactorBar({ f }: { f: ImtFactorScore }) {
  const color =
    f.rawScore >= 65 ? "bg-red-500" : f.rawScore >= 35 ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{f.label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium tabular-nums">{f.rawScore}</span>
          <span className="text-[10px] text-muted-foreground">({Math.round(f.weight * 100)}%)</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${f.rawScore}%` }} />
      </div>
      {f.reasonCodes.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {f.reasonCodes.map((rc) => (
            <Badge key={rc} variant="secondary" className="text-[9px] py-0">{rc.replace(/_/g, " ")}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ExposureCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">
        {value > 0
          ? `$${new Intl.NumberFormat("en-US").format(value)}`
          : <span className="text-muted-foreground text-sm">—</span>}
      </p>
    </div>
  );
}

export function ImtDetailDrawer({ isOpen, onClose, request, output }: ImtDetailDrawerProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-200",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[520px] max-w-full flex-col bg-background shadow-2xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">IMT Risk Review</p>
            <h2 className="mt-0.5 font-semibold">{request?.customerName ?? "—"}</h2>
            <p className="text-xs text-muted-foreground">{request?.id} · {request?.vendorName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {!request || !output ? (
            <p className="text-sm text-muted-foreground">No request selected.</p>
          ) : (
            <>
              {/* Decision + score header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Decision</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={DECISION_VARIANT[output.decision]} className="text-xs capitalize px-3 py-1">
                      {output.decision}
                    </Badge>
                    {output.decision !== "approve" && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-700">
                        <UserCheck className="h-3 w-3" />
                        Human review required
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk Score</p>
                  <p className={cn("text-4xl font-bold tabular-nums leading-none mt-1", DECISION_COLOR[output.decision])}>
                    {output.riskScore}
                  </p>
                  <p className="text-[10px] text-muted-foreground">/100</p>
                </div>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Model Confidence</p>
                <ConfidenceChip score={output.confidence} />
              </div>

              <Separator />

              {/* Factor breakdown */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Risk Factor Breakdown
                </p>
                {output.factorScores.map((f) => (
                  <FactorBar key={f.factor} f={f} />
                ))}
              </div>

              <Separator />

              {/* Reason codes */}
              {output.reasonCodes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reason Codes
                  </p>
                  <ReasonCodeList codes={output.reasonCodes} />
                </div>
              )}

              {/* Exposure */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Financial Exposure
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <ExposureCard label="Margin Exposure" value={output.marginExposureUsd} />
                  <ExposureCard label="Working Capital" value={output.workingCapitalExposureUsd} />
                </div>
              </div>

              {/* Request details */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Request Details
                </p>
                <dl className="space-y-2">
                  {[
                    { label: "Rep",       value: request.repName },
                    { label: "SKUs",      value: request.skus.join(", ") },
                    { label: "Inventory", value: `$${new Intl.NumberFormat("en-US").format(request.input.inventory.totalValueUsd)}` },
                    { label: "Submitted", value: new Date(request.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
                    { label: "Note",      value: request.requestNote },
                  ].map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-5 gap-2">
                      <dt className="col-span-2 text-xs text-muted-foreground">{label}</dt>
                      <dd className="col-span-3 text-xs break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}
        </div>

        {/* Footer — ERP guard */}
        <div className="border-t bg-muted/20 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Ban className="h-3 w-3 shrink-0" />
              ERP write-back disabled · prototype mode
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs opacity-50 cursor-not-allowed" aria-disabled>
                Reject
              </Button>
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs opacity-50 cursor-not-allowed" aria-disabled>
                Approve
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
