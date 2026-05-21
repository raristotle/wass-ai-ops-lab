"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Column } from "./ShellTable";

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  row: Record<string, unknown> | null;
  columns: Column[];
  sectionTitle: string;
}

const TABS = ["Details", "Related", "Notes"] as const;
type Tab = (typeof TABS)[number];

function formatValue(val: unknown): React.ReactNode {
  if (val === null || val === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") {
    if (val > 100_000) return new Intl.NumberFormat("en-US").format(val);
    return String(val);
  }
  const str = String(val);
  // ISO date
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    return new Date(str).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  // Status-like strings get badges
  const statusMap: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
    active: "success", Active: "success",
    delivered: "success", Delivered: "success",
    paid: "success", Paid: "success",
    completed: "success", Completed: "success",
    deployed: "success", Deployed: "success",
    pending: "secondary", Pending: "secondary",
    draft: "secondary", Draft: "secondary",
    queued: "secondary", Queued: "secondary",
    ideation: "secondary", Ideation: "secondary",
    planning: "secondary", Planning: "secondary",
    processing: "default", Processing: "default",
    "in transit": "default", "In Transit": "default",
    running: "default", Running: "default",
    pilot: "warning", Pilot: "warning",
    scaling: "warning", Scaling: "warning",
    "on hold": "warning", "On Hold": "warning",
    "under review": "warning", "Under Review": "warning",
    mitigated: "warning", Mitigated: "warning",
    overdue: "destructive", Overdue: "destructive",
    failed: "destructive", Failed: "destructive",
    exception: "destructive", Exception: "destructive",
    critical: "critical", Critical: "critical",
    investigating: "destructive", Investigating: "destructive",
    cancelled: "outline", Cancelled: "outline",
    deprecated: "outline", Deprecated: "outline",
    inactive: "outline", Inactive: "outline",
  };
  if (str in statusMap) return <Badge variant={statusMap[str]}>{str}</Badge>;
  return str;
}

function DetailsTab({ row, columns }: { row: Record<string, unknown>; columns: Column[] }) {
  const displayedKeys = new Set(columns.map((c) => c.key));
  const allKeys = Object.keys(row);
  // Show column keys first, then extras
  const orderedKeys = [
    ...columns.map((c) => c.key).filter((k) => k in row),
    ...allKeys.filter((k) => !displayedKeys.has(k)),
  ];

  return (
    <dl className="space-y-3">
      {orderedKeys.map((key) => (
        <div key={key} className="grid grid-cols-5 gap-2">
          <dt className="col-span-2 text-xs font-medium text-muted-foreground capitalize">
            {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
          </dt>
          <dd className="col-span-3 text-xs break-all">{formatValue(row[key])}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailDrawer({ isOpen, onClose, row, columns, sectionTitle }: DetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Details");

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-200",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[480px] max-w-full flex-col bg-background shadow-2xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{sectionTitle}</p>
            <h2 className="mt-0.5 font-semibold">
              {(row?.name as string) ?? (row?.id as string) ?? "Detail"}
            </h2>
            {!!(row?.id) && !!(row?.name) && (
              <p className="text-xs text-muted-foreground">{row.id as string}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b px-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-xs font-medium border-b-2 transition-colors",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!row ? (
            <p className="text-sm text-muted-foreground">No record selected.</p>
          ) : activeTab === "Details" ? (
            <DetailsTab row={row} columns={columns} />
          ) : activeTab === "Related" ? (
            <div className="space-y-3">
              <Separator />
              <p className="text-xs text-muted-foreground">
                Related records will be linked here in a future iteration.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Separator />
              <textarea
                className="w-full rounded-md border bg-muted/40 p-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                rows={6}
                placeholder="Add notes about this record…"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
