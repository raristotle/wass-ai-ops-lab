"use client";

import { mockIncidents, type Incident, type Severity, type IncidentStatus } from "@/data/mock/incidents";
import { Badge } from "@/components/ui/badge";
import { formatNumber, relativeTime } from "@/lib/utils";

const severityVariant: Record<Severity, "critical" | "destructive" | "warning" | "secondary"> = {
  critical: "critical",
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

const statusVariant: Record<IncidentStatus, "destructive" | "warning" | "success" | "secondary"> = {
  open: "destructive",
  investigating: "warning",
  mitigated: "warning",
  resolved: "success",
};

function IncidentRow({ inc }: { inc: Incident }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground">{inc.id}</span>
          <Badge variant={severityVariant[inc.severity]}>{inc.severity}</Badge>
          <Badge variant={statusVariant[inc.status]}>{inc.status}</Badge>
        </div>
        <p className="text-sm font-medium truncate">{inc.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{inc.description}</p>
        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
          <span>{inc.affectedModel}</span>
          <span>{relativeTime(inc.startedAt)}</span>
          {inc.errorCount > 0 && <span>{formatNumber(inc.errorCount)} errors</span>}
          {inc.impactedUsers > 0 && <span>{formatNumber(inc.impactedUsers)} users</span>}
        </div>
      </div>
    </div>
  );
}

export function IncidentList() {
  const open = mockIncidents.filter((i) => i.status !== "resolved");
  const resolved = mockIncidents.filter((i) => i.status === "resolved");

  return (
    <div className="space-y-4">
      {open.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Active ({open.length})
          </h3>
          {open.map((inc) => (
            <IncidentRow key={inc.id} inc={inc} />
          ))}
        </div>
      )}
      {resolved.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Resolved ({resolved.length})
          </h3>
          {resolved.map((inc) => (
            <IncidentRow key={inc.id} inc={inc} />
          ))}
        </div>
      )}
    </div>
  );
}
