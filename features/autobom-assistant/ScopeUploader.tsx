"use client";

import { useState } from "react";
import { FileText, Play, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_SCOPES, type MockScopeKey } from "@/data/mock/autobom-scopes";
import type { BomExtraction } from "@/lib/autobom";

interface Props {
  onExtract: (extraction: BomExtraction, fromParser?: boolean) => void;
  isLoading: boolean;
}

export function ScopeUploader({ onExtract, isLoading }: Props) {
  const [mode, setMode]           = useState<"sample" | "custom">("sample");
  const [selectedKey, setKey]     = useState<MockScopeKey>("scope-a");
  const [customText, setCustom]   = useState("");
  const [expanded, setExpanded]   = useState(true);

  const selectedScope = MOCK_SCOPES.find((s) => s.key === selectedKey)!;
  const lineCount     = (mode === "custom" ? customText : selectedScope.extraction.sourceText)
    .split("\n")
    .filter((l) => l.trim().length > 0).length;

  function handleExtract() {
    if (mode === "sample") {
      // Return mock pre-parsed result
      onExtract(selectedScope.extraction, false);
    } else {
      // Pass a minimal BomExtraction shell; AutoBomPage runs the live parser
      // via parseScopeText when fromParser=true.
      const shell: import("@/lib/autobom").BomExtraction = {
        id:            "BOM-CUSTOM-001",
        projectName:   "Custom Scope",
        sourceText:    customText,
        lines:         [],
        extractedAt:   new Date().toISOString(),
        parserVersion: "stub-v1",
      };
      onExtract(shell, true);
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header row */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#00AA13]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scope Input
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Mode tabs */}
          <div className="flex rounded-lg border bg-muted p-0.5 w-fit">
            {(["sample", "custom"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors",
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "sample" ? "Sample Scopes" : "Paste Custom"}
              </button>
            ))}
          </div>

          {mode === "sample" ? (
            /* Sample scope selector */
            <div className="grid gap-2 sm:grid-cols-3">
              {MOCK_SCOPES.map((scope) => (
                <button
                  key={scope.key}
                  onClick={() => setKey(scope.key)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left transition-all hover:shadow-sm",
                    selectedKey === scope.key
                      ? "border-[#00AA13] bg-[#00AA13]/5 ring-1 ring-[#00AA13]"
                      : "border-border bg-card hover:bg-muted/20",
                  )}
                >
                  <p className="text-xs font-semibold">{scope.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{scope.subLabel}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {scope.extraction.lines.length} lines · {scope.extraction.projectName.split("—")[0]?.trim()}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            /* Custom text area */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  Paste spec lines — one material / scope item per line
                </p>
                <button
                  onClick={() => setCustom("")}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <textarea
                value={customText}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={
                  `Example:\n(20) 20A single-pole circuit breakers\n3/4" EMT conduit, 200 linear feet\n#12 AWG THHN wire, 4 colors, 500ft each`
                }
                rows={8}
                className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
              />
            </div>
          )}

          {/* Preview strip (sample mode) */}
          {mode === "sample" && (
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Scope Preview
              </p>
              <pre className="whitespace-pre-wrap text-[10px] text-muted-foreground leading-relaxed font-mono line-clamp-5">
                {selectedScope.extraction.sourceText}
              </pre>
            </div>
          )}

          {/* Footer: line count + extract button */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              {lineCount} spec line{lineCount !== 1 ? "s" : ""} detected
            </p>
            <button
              onClick={handleExtract}
              disabled={isLoading || (mode === "custom" && customText.trim().length === 0)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors",
                "bg-[#1D252D] text-white hover:bg-[#1D252D]/80",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "dark:bg-white dark:text-[#1D252D] dark:hover:bg-white/80",
              )}
            >
              <Play className="h-3.5 w-3.5" />
              {isLoading ? "Extracting…" : "Extract BOM"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
