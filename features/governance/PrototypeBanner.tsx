"use client";

import { AlertTriangle, ClipboardList, ShieldCheck } from "lucide-react";
import { useOpsStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export function PrototypeBanner() {
  const { auditLog, toggleAuditLog } = useOpsStore();

  return (
    <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <div className="flex items-center gap-2 text-xs font-medium">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>PROTOTYPE ONLY</strong> — Data is simulated. No ERP writes. Not for operational use.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <DataClassificationBadge />
        <button
          onClick={toggleAuditLog}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium hover:bg-amber-100 dark:hover:bg-amber-900"
          title="View audit log"
        >
          <ClipboardList className="h-3 w-3" />
          Audit Log
          {auditLog.length > 0 && (
            <span className="ml-0.5 rounded-full bg-amber-300 px-1.5 py-px text-[10px] font-bold text-amber-900 dark:bg-amber-700 dark:text-amber-100">
              {auditLog.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export function DataClassificationBadge() {
  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1 text-[10px] uppercase tracking-wider"
    >
      <ShieldCheck className="h-2.5 w-2.5" />
      Internal
    </Badge>
  );
}
