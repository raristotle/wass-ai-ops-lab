"use client";

import { useState } from "react";
import { X, Copy, CheckCheck, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NbaOutput, NbaAction, ActionType, Urgency } from "@/lib/risk/nba";
import { ACTION_LABELS, ACTION_PERSONAS, PERSONA_LABELS } from "@/lib/risk/nba";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  Phone, FileText, Globe, Tag, CreditCard, BarChart2,
} from "lucide-react";

// ── Shared style maps ─────────────────────────────────────────────────────────

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const ACTION_ICON: Record<ActionType, React.ComponentType<{ className?: string }>> = {
  "call":               Phone,
  "quote-followup":     FileText,
  "platform-discovery": Globe,
  "cross-sell-intro":   Tag,
  "collections-check":  CreditCard,
  "pricing-review":     BarChart2,
};

const ACTION_RING: Record<ActionType, string> = {
  "call":               "border-slate-500/40 bg-slate-500/10",
  "quote-followup":     "border-blue-500/40 bg-blue-500/10",
  "platform-discovery": "border-purple-500/40 bg-purple-500/10",
  "cross-sell-intro":   "border-emerald-500/40 bg-emerald-500/10",
  "collections-check":  "border-red-500/40 bg-red-500/10",
  "pricing-review":     "border-orange-500/40 bg-orange-500/10",
};

const ACTION_ICON_COLOR: Record<ActionType, string> = {
  "call":               "text-slate-400",
  "quote-followup":     "text-blue-400",
  "platform-discovery": "text-purple-400",
  "cross-sell-intro":   "text-emerald-400",
  "collections-check":  "text-red-400",
  "pricing-review":     "text-orange-400",
};

const URGENCY_VARIANT: Record<Urgency, BadgeVariant> = {
  critical: "destructive",
  high:     "warning",
  medium:   "secondary",
  low:      "outline",
};

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
    >
      {copied ? (
        <><CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> Copied</>
      ) : (
        <><Copy className="h-3.5 w-3.5" /> Copy email</>
      )}
    </button>
  );
}

// ── ActionCard ────────────────────────────────────────────────────────────────

function ActionCard({
  action,
  isActive,
  onClick,
}: {
  action: NbaAction;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = ACTION_ICON[action.type];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
        isActive
          ? cn("ring-1 ring-primary", ACTION_RING[action.type])
          : "hover:bg-muted/40",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", ACTION_ICON_COLOR[action.type])} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{action.label}</p>
        <p className="text-[10px] text-muted-foreground">Score {action.priorityScore}</p>
      </div>
      <Badge variant={URGENCY_VARIANT[action.urgency]} className="shrink-0 text-[9px] capitalize">
        {action.urgency}
      </Badge>
    </button>
  );
}

// ── ActionDetail ──────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  output: NbaOutput | null;
}

export function ActionDetail({ open, onClose, output }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!open || !output) return null;

  const action = output.actions[activeIdx] ?? output.actions[0];
  // non-null: actions always has at least one item (call is always added)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[480px] flex-col border-l bg-background shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{output.accountName}</h2>
            <p className="text-xs text-muted-foreground">
              {output.sbu} · {output.owner} · {formatCurrency(output.annualRevenueUsd)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action selector */}
        <div className="flex flex-col gap-1.5 border-b px-5 py-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {output.actions.length} Recommended Action{output.actions.length !== 1 ? "s" : ""}
          </p>
          {output.actions.map((a, i) => (
            <ActionCard
              key={a.type}
              action={a}
              isActive={i === activeIdx}
              onClick={() => setActiveIdx(i)}
            />
          ))}
        </div>

        {/* Selected action detail */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Reason codes + revenue impact */}
          <div className="border-b px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Why Now
                </p>
                <div className="flex flex-wrap gap-1">
                  {action.reasonCodes.map((rc) => (
                    <span
                      key={rc}
                      className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground"
                    >
                      {rc}
                    </span>
                  ))}
                </div>
              </div>
              {action.revenueImpactUsd > 0 && (
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-muted-foreground">Est. Impact</p>
                  <p className="text-sm font-bold text-emerald-500">
                    {formatCurrency(action.revenueImpactUsd)}
                  </p>
                </div>
              )}
            </div>

            {/* Personas */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Visible to:</span>
              {action.personas.map((p) => (
                <Badge key={p} variant="secondary" className="text-[9px]">
                  {PERSONA_LABELS[p]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Email draft */}
          <div className="flex flex-1 flex-col overflow-hidden px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Mail className="h-3 w-3" />
                Email Draft
              </p>
              <CopyButton text={action.emailDraft} />
            </div>
            <pre className="flex-1 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground">
              {action.emailDraft}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3">
          <p className="text-center text-[10px] text-muted-foreground">
            PROTOTYPE ONLY · AI-generated drafts require human review · Not for direct send
          </p>
        </div>
      </aside>
    </>
  );
}
