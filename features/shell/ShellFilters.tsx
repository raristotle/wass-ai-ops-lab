"use client";

import { useRef, useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOpsStore } from "@/lib/store";
import { SBU_LIST, FUNCTION_LIST } from "@/data/mock/accounts";
import { Input } from "@/components/ui/input";

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);

  const display =
    selected.length === 0 ? `All ${label}` : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent",
          selected.length > 0 && "border-primary text-primary"
        )}
      >
        <SlidersHorizontal className="h-3 w-3" />
        {display}
        {selected.length > 0 && (
          <span
            role="button"
            className="ml-1 rounded-full hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 min-w-[180px] rounded-md border bg-popover shadow-lg">
          <div className="p-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent",
                  selected.includes(opt) && "font-semibold text-primary"
                )}
              >
                <span
                  className={cn(
                    "h-3 w-3 rounded border flex-shrink-0",
                    selected.includes(opt) ? "bg-primary border-primary" : "border-muted-foreground"
                  )}
                />
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ShellFilters() {
  const {
    selectedSbus, setSelectedSbus,
    selectedFunctions, setSelectedFunctions,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
  } = useOpsStore();

  const hasFilters =
    selectedSbus.length > 0 || selectedFunctions.length > 0;

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
      <MultiSelect
        label="SBUs"
        options={SBU_LIST}
        selected={selectedSbus}
        onChange={setSelectedSbus}
      />
      <MultiSelect
        label="Functions"
        options={FUNCTION_LIST}
        selected={selectedFunctions}
        onChange={setSelectedFunctions}
      />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">From</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 w-36 text-xs"
        />
        <span className="text-xs text-muted-foreground">To</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 w-36 text-xs"
        />
      </div>

      {hasFilters && (
        <button
          onClick={() => { setSelectedSbus([]); setSelectedFunctions([]); }}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear filters
        </button>
      )}
    </header>
  );
}
