"use client";

import { useState } from "react";
import { X, UserCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BomLine } from "@/lib/autobom";
import { CATEGORY_COLORS } from "@/lib/autobom";

const MOCK_ASSIGNEES = [
  "Sarah Chen — Electrical SME",
  "Marcus Williams — DC/OFCI Specialist",
  "Priya Patel — Lighting & Controls",
  "James Rodriguez — Procurement Lead",
  "Unassigned — General Queue",
];

interface Props {
  open: boolean;
  onClose: () => void;
  line: BomLine | null;
  onSubmit: (lineId: string, note: string, assignee: string) => void;
}

export function SmeRequestDrawer({ open, onClose, line, onSubmit }: Props) {
  const [note, setNote]         = useState("");
  const [assignee, setAssignee] = useState(MOCK_ASSIGNEES[4]!);
  const [submitted, setSubmitted] = useState(false);

  if (!open || !line) return null;

  function handleSubmit() {
    if (!line) return;
    onSubmit(line.id, note.trim() || "SME review requested — no additional notes.", assignee);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setNote("");
      setAssignee(MOCK_ASSIGNEES[4]!);
      onClose();
    }, 1200);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[440px] flex-col border-l bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#EAAA00]" />
            <div>
              <h2 className="text-sm font-semibold">Request SME Review</h2>
              <p className="text-[10px] text-muted-foreground">Line #{line.lineNumber} · {line.category}</p>
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
          {/* Spec line */}
          <div className="px-5 py-4">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Spec Line
            </p>
            <p className="text-[11px] font-medium text-[#1D252D] dark:text-foreground leading-snug">
              {line.rawText}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={cn(
                "rounded border px-1.5 py-0.5 text-[9px] font-semibold",
                CATEGORY_COLORS[line.category],
              )}>
                {line.category}
              </span>
              <span className={cn(
                "rounded border px-1.5 py-0.5 text-[9px] font-medium",
                line.confidence >= 80 ? "border-[#00AA13]/30 bg-[#00AA13]/10 text-[#00573F]" :
                line.confidence >= 60 ? "border-[#EAAA00]/30 bg-[#EAAA00]/10 text-[#7a5900]" :
                "border-[#DB6B30]/30 bg-[#DB6B30]/10 text-[#DB6B30]",
              )}>
                Confidence: {line.confidence}
              </span>
            </div>
          </div>

          {/* Missing info context */}
          {line.missingInfo.length > 0 && (
            <div className="px-5 py-4">
              <p className="mb-2 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-[#DB6B30]">
                <AlertTriangle className="h-2.5 w-2.5" />
                Missing Specifications ({line.missingInfo.length})
              </p>
              <ul className="space-y-1">
                {line.missingInfo.map((m, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <span className="mt-0.5 shrink-0 text-[#DB6B30]">·</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Assignee selector */}
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Assign To
            </label>
            <div className="space-y-1">
              {MOCK_ASSIGNEES.map((name) => (
                <button
                  key={name}
                  onClick={() => setAssignee(name)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-[11px] transition-colors",
                    assignee === name
                      ? "border-[#00AA13] bg-[#00AA13]/5 font-medium"
                      : "border-border hover:bg-muted/20",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notes for SME (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe the specific question or clarification needed…"
              rows={4}
              className="w-full rounded-md border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
            />
            <p className="mt-1 text-[9px] text-muted-foreground">
              This note will appear in the escalation activity log.
            </p>
          </div>

          {/* Urgency indicator */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 rounded-lg border border-[#EAAA00]/30 bg-[#EAAA00]/5 px-3 py-2">
              <Clock className="h-4 w-4 shrink-0 text-[#EAAA00]" />
              <div>
                <p className="text-[10px] font-medium text-[#7a5900]">SME SLA: 2 business days</p>
                <p className="text-[9px] text-muted-foreground">
                  Prototype: status update is local session only — no notification emails sent
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3">
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-sm text-[#00AA13]">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">SME request submitted</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-md border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#1D252D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D252D]/80 dark:bg-white dark:text-[#1D252D]"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Submit SME Request
              </button>
            </div>
          )}
          <p className="mt-1.5 text-center text-[9px] text-muted-foreground">
            PROTOTYPE ONLY · Local session state · No external notifications
          </p>
        </div>
      </aside>
    </>
  );
}
