"use client";

import { Users, Briefcase, BarChart3 } from "lucide-react";
import type { Persona } from "@/lib/risk/nba";
import { PERSONA_LABELS } from "@/lib/risk/nba";
import { cn } from "@/lib/utils";

const PERSONA_ICON: Record<Persona, React.ComponentType<{ className?: string }>> = {
  "inside-sales":  Users,
  "outside-sales": Briefcase,
  "sales-manager": BarChart3,
};

const PERSONA_DESC: Record<Persona, string> = {
  "inside-sales":  "Call, quote follow-up, collections",
  "outside-sales": "Discovery, cross-sell, pricing",
  "sales-manager": "Full view — all action types",
};

interface Props {
  activePersona: Persona | null;
  onSelect: (persona: Persona | null) => void;
}

const ALL_PERSONAS: Persona[] = ["inside-sales", "outside-sales", "sales-manager"];

export function PersonaFilter({ activePersona, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* "All" pill */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          activePersona === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
        )}
      >
        All Personas
      </button>

      {ALL_PERSONAS.map((persona) => {
        const Icon    = PERSONA_ICON[persona];
        const isActive = activePersona === persona;
        return (
          <button
            key={persona}
            onClick={() => onSelect(isActive ? null : persona)}
            title={PERSONA_DESC[persona]}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {PERSONA_LABELS[persona]}
          </button>
        );
      })}
    </div>
  );
}
