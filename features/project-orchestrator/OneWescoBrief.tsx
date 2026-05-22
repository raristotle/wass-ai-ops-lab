"use client";

import { useState } from "react";
import { X, Copy, CheckCheck, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComplexProject, ProjectScore } from "@/lib/risk/project-orchestrator";
import { generateOneWescoBrief } from "@/lib/risk/project-orchestrator";

interface Props {
  open: boolean;
  onClose: () => void;
  project: ComplexProject | null;
  score: ProjectScore | null;
}

export function OneWescoBrief({ open, onClose, project, score }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open || !project || !score) return null;

  const brief = generateOneWescoBrief(project, score);

  function handleCopy() {
    navigator.clipboard.writeText(brief).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[520px] flex-col border-l bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00AA13]" />
            <div>
              <h2 className="text-sm font-semibold">One Wesco Brief</h2>
              <p className="text-[10px] text-muted-foreground">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              {copied ? (
                <><CheckCheck className="h-3.5 w-3.5 text-[#00AA13]" /> Copied</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copy brief</>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Brief content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-mono text-[11px] leading-relaxed text-foreground">
            {brief}
          </pre>
        </div>

        {/* Score strip */}
        <div className="border-t px-5 py-3">
          <div className="mb-2 grid grid-cols-4 gap-2">
            {[
              { label: "Late Milestone", value: score.lateMilestoneRisk },
              { label: "Margin",         value: score.marginRisk },
              { label: "Fulfillment",    value: score.fulfillmentRisk },
              { label: "Owner",          value: score.missingOwnerRisk },
            ].map(({ label, value }) => (
              <div key={label} className="rounded border bg-card px-2 py-1 text-center">
                <p className="text-[9px] text-muted-foreground">{label}</p>
                <p className={cn(
                  "text-sm font-bold tabular-nums",
                  value >= 70 ? "text-red-500"
                  : value >= 50 ? "text-[#DB6B30]"
                  : value >= 30 ? "text-[#EAAA00]"
                  : "text-[#00AA13]",
                )}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            PROTOTYPE ONLY · AI-generated · Human review required before distribution
          </p>
        </div>
      </aside>
    </>
  );
}
