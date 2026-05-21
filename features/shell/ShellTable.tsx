"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from "lucide-react";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOpsStore } from "@/lib/store";

export interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface ShellTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  selectedId?: string | null;
  pageSize?: number;
}

export function ShellTable({
  columns,
  data,
  onRowClick,
  selectedId,
  pageSize = 10,
}: ShellTableProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { activeSection, logAuditEvent } = useOpsStore();

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  function handleExportAttempt() {
    logAuditEvent({
      action: "EXPORT_ATTEMPTED",
      section: activeSection,
      detail: `${data.length} rows · export disabled in prototype mode`,
    });
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn("text-xs", col.className)}
              >
                {col.sortable !== false ? (
                  <button
                    className="flex items-center gap-1 font-medium hover:text-foreground"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon colKey={col.key} />
                  </button>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">
                No records match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            paged.map((row) => {
              const id = row.id as string;
              return (
                <TableRow
                  key={id}
                  data-state={selectedId === id ? "selected" : undefined}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn("text-xs", col.className)}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination + export */}
      <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2">
        <span className="text-xs text-muted-foreground">
          {sorted.length === 0
            ? "No results"
            : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sorted.length)} of ${sorted.length}`}
        </span>

        <div className="flex items-center gap-2">
          {/* Pagination */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              return (
                <Button
                  key={pg}
                  variant={pg === page ? "default" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(pg)}
                >
                  {pg + 1}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>

          {/* Export — disabled in prototype; click is logged */}
          <div title="Export disabled in prototype mode">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs opacity-50 cursor-not-allowed"
              onClick={handleExportAttempt}
              aria-disabled
            >
              <Download className="h-3 w-3" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
