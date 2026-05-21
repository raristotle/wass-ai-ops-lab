"use client";

import { X, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useOpsStore, type AuditAction } from "@/lib/store";

const ACTION_LABELS: Record<AuditAction, string> = {
  VIEW_RECORD:       "View Record",
  OPEN_SECTION:      "Open Section",
  FILTER_APPLIED:    "Filter Applied",
  EXPORT_ATTEMPTED:  "Export Attempted",
};

const ACTION_VARIANT: Record<AuditAction, Parameters<typeof Badge>[0]["variant"]> = {
  VIEW_RECORD:      "default",
  OPEN_SECTION:     "secondary",
  FILTER_APPLIED:   "secondary",
  EXPORT_ATTEMPTED: "warning",
};

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function AuditLogDrawer() {
  const { auditLog, auditLogOpen, toggleAuditLog } = useOpsStore();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-200",
          auditLogOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={toggleAuditLog}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[400px] max-w-full flex-col bg-background shadow-2xl",
          "transform transition-transform duration-300 ease-in-out",
          auditLogOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="font-semibold text-sm">Audit Log</h2>
              <p className="text-[11px] text-muted-foreground">
                Session activity — {auditLog.length} event{auditLog.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={toggleAuditLog}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {auditLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              <p className="text-xs text-muted-foreground">
                Navigate sections, apply filters, and view records to generate entries.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {auditLog.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={ACTION_VARIANT[entry.action]} className="text-[10px]">
                        {ACTION_LABELS[entry.action]}
                      </Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">{entry.id}</span>
                    </div>
                    {entry.detail && (
                      <p className="mt-0.5 text-xs text-foreground truncate">{entry.detail}</p>
                    )}
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {formatTs(entry.timestamp)} · {entry.section}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t bg-muted/30 px-5 py-3">
          <p className="text-[10px] text-muted-foreground">
            Retained in-session only · Not persisted · Max 100 entries · Prototype governance layer
          </p>
        </div>
      </div>
    </>
  );
}
