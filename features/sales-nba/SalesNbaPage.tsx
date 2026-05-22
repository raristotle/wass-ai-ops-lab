"use client";

import { useState, useMemo } from "react";
import { mockNbaAccounts } from "@/data/mock/nba-accounts";
import { scoreNbaAccount, ACTION_LABELS } from "@/lib/risk/nba";
import type { NbaOutput, ActionType, Persona } from "@/lib/risk/nba";
import { ActionFeed } from "./ActionFeed";
import { ActionDetail } from "./ActionDetail";
import { PersonaFilter } from "./PersonaFilter";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiProps { label: string; value: string; sub: string; accent: "blue"|"red"|"green"|"orange" }

function KpiCard({ label, value, sub, accent }: KpiProps) {
  const c: Record<KpiProps["accent"], string> = {
    blue: "text-blue-500", red: "text-red-500", green: "text-emerald-500", orange: "text-orange-500",
  };
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", c[accent])}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

// ── Action-type filter chips ──────────────────────────────────────────────────

const ALL_ACTION_TYPES = Object.keys(ACTION_LABELS) as ActionType[];

function ActionTypeChips({
  active,
  counts,
  onToggle,
}: {
  active: ActionType[];
  counts: Record<ActionType, number>;
  onToggle: (t: ActionType) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Action type:
      </span>
      {ALL_ACTION_TYPES.map((t) => {
        const isOn = active.length === 0 || active.includes(t);
        return (
          <button
            key={t}
            onClick={() => onToggle(t)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors",
              active.includes(t)
                ? "border-primary bg-primary/10 text-primary"
                : active.length === 0
                  ? "border-transparent bg-muted text-muted-foreground hover:text-foreground"
                  : "border-transparent bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground",
            )}
          >
            {ACTION_LABELS[t]} {counts[t] > 0 ? `(${counts[t]})` : ""}
          </button>
        );
      })}
      {/* "Clear all filters" is handled by the parent — no inline reset button needed */}
    </div>
  );
}

// ── SalesNbaPage ──────────────────────────────────────────────────────────────

export function SalesNbaPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [activeActionTypes, setActiveActionTypes] = useState<ActionType[]>([]);

  // Score all accounts once
  const outputs: NbaOutput[] = useMemo(
    () => mockNbaAccounts.map((a) => scoreNbaAccount(a)),
    [],
  );

  // KPIs
  const totalQuoteValue    = mockNbaAccounts.reduce((s, a) => s + a.quotes.totalValueUsd, 0);
  const totalPastDue       = mockNbaAccounts.reduce((s, a) => s + a.invoices.pastDueAmountUsd, 0);
  const totalCrossSellPot  = mockNbaAccounts.reduce((s, a) => s + a.crossSell.estimatedPotentialUsd, 0);
  const criticalCount      = outputs.filter((o) => o.topAction.urgency === "critical").length;

  // Action-type top-action counts (across all accounts, for the filter chips)
  const topActionCounts = useMemo(() => {
    const counts = {} as Record<ActionType, number>;
    for (const t of ALL_ACTION_TYPES) counts[t] = 0;
    for (const o of outputs) counts[o.topAction.type] = (counts[o.topAction.type] ?? 0) + 1;
    return counts;
  }, [outputs]);

  const selectedOutput = selectedId ? outputs.find((o) => o.accountId === selectedId) ?? null : null;

  function toggleActionType(t: ActionType) {
    setActiveActionTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  function handleSelect(output: NbaOutput) {
    setSelectedId(output.accountId);
    setDrawerOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Sales Next Best Actions</h1>
        <p className="text-sm text-muted-foreground">
          AI-ranked account actions across {outputs.length} accounts ·{" "}
          {criticalCount} critical-urgency
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Open Quote Value"
          value={`$${(totalQuoteValue / 1e6).toFixed(1)}M`}
          sub="pending decision"
          accent="blue"
        />
        <KpiCard
          label="Critical Urgency"
          value={String(criticalCount)}
          sub="accounts need immediate action"
          accent="red"
        />
        <KpiCard
          label="Past Due AR"
          value={formatCurrency(totalPastDue)}
          sub="awaiting collection"
          accent="orange"
        />
        <KpiCard
          label="Cross-Sell Potential"
          value={`$${(totalCrossSellPot / 1e6).toFixed(1)}M`}
          sub="untapped categories"
          accent="green"
        />
      </div>

      {/* Persona filter */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3">
        <PersonaFilter activePersona={activePersona} onSelect={setActivePersona} />
        <ActionTypeChips
          active={activeActionTypes}
          counts={topActionCounts}
          onToggle={toggleActionType}
        />
        {(activePersona !== null || activeActionTypes.length > 0) && (
          <button
            onClick={() => { setActivePersona(null); setActiveActionTypes([]); }}
            className="self-start text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Action feed */}
      <ActionFeed
        outputs={outputs}
        activePersona={activePersona}
        activeActionTypes={activeActionTypes}
        onSelect={handleSelect}
        selectedId={selectedId}
      />

      {/* Detail drawer */}
      <ActionDetail
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedId(null); }}
        output={selectedOutput}
      />

      {/* Footer */}
      <p className="text-center text-[10px] text-muted-foreground">
        PROTOTYPE ONLY — Actions are AI-generated. Human review required before sending. Not for operational use.
      </p>
    </div>
  );
}
