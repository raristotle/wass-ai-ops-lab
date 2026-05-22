"use client";

import { cn } from "@/lib/utils";
import type { DcAsset, AssetStage, DcProject } from "@/lib/risk/dc-risk";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/risk/dc-risk";

// ── Style maps ─────────────────────────────────────────────────────────────────

const STAGE_ACCENT: Record<AssetStage, string> = {
  "po-placed":  "border-[#B7C9D3] bg-[#B7C9D3]/10",
  "receiving":  "border-[#64CCC9] bg-[#64CCC9]/10",
  "staging":    "border-[#EAAA00] bg-[#EAAA00]/10",
  "qa":         "border-[#004986] bg-[#004986]/10",
  "ready":      "border-[#00AA13] bg-[#00AA13]/10",
  "delivered":  "border-[#00573F] bg-[#00573F]/10",
  "exception":  "border-red-500 bg-red-500/10",
};

const STAGE_HEADER: Record<AssetStage, string> = {
  "po-placed":  "text-[#4F758B]",
  "receiving":  "text-[#3a9f9c]",
  "staging":    "text-[#7a5900]",
  "qa":         "text-[#004986]",
  "ready":      "text-[#00573F]",
  "delivered":  "text-[#00573F]",
  "exception":  "text-red-600",
};

const OFCI_ICON: Record<string, string> = {
  server: "🖥", storage: "💾", networking: "🔌", cooling: "❄",
  power: "⚡", cable: "🔗", other: "📦",
};

// ── AssetChip ──────────────────────────────────────────────────────────────────

function AssetChip({ asset }: { asset: DcAsset }) {
  const hasException = asset.exceptions.length > 0;
  return (
    <div
      className={cn(
        "rounded border px-2 py-1 text-left",
        hasException ? "border-red-300 bg-red-50 dark:bg-red-900/10" : "border-border bg-background",
      )}
    >
      <p className="truncate text-[10px] font-medium leading-tight">
        {OFCI_ICON[asset.ofciCategory]} {asset.itemDesc}
      </p>
      <div className="mt-0.5 flex flex-wrap gap-1">
        <span className="text-[9px] text-muted-foreground">{asset.vendor}</span>
        {asset.ageInStageDays && asset.ageInStageDays > 0 && (
          <span className={cn(
            "text-[9px]",
            asset.ageInStageDays > 14 ? "text-[#DB6B30] font-medium" : "text-muted-foreground",
          )}>
            {asset.ageInStageDays}d in stage
          </span>
        )}
        {hasException && (
          <span className="text-[9px] font-medium text-red-600">
            ⚠ {asset.exceptions.length} exception{asset.exceptions.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// ── WarehouseCards ─────────────────────────────────────────────────────────────

interface Props {
  project: DcProject;
  selectedAssetId?: string | null;
  onAssetClick?: (assetId: string) => void;
}

export function WarehouseCards({ project, onAssetClick }: Props) {
  const assetsByStage = (stage: AssetStage) =>
    project.assets.filter((a) => a.stage === stage);

  const exceptionAssets = project.assets.filter((a) => a.stage === "exception");

  return (
    <div className="flex flex-col gap-3">
      {/* Pipeline stages */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[860px] gap-2">
          {STAGE_ORDER.map((stage) => {
            const stageAssets = assetsByStage(stage);
            return (
              <div
                key={stage}
                className={cn(
                  "flex w-[140px] shrink-0 flex-col gap-2 rounded-lg border p-2",
                  STAGE_ACCENT[stage],
                )}
              >
                {/* Stage header */}
                <div>
                  <p className={cn("text-[10px] font-semibold uppercase tracking-wider", STAGE_HEADER[stage])}>
                    {STAGE_LABELS[stage]}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{stageAssets.length} asset{stageAssets.length !== 1 ? "s" : ""}</p>
                </div>

                {/* Assets */}
                {stageAssets.length === 0 ? (
                  <div className="flex h-10 items-center justify-center rounded border border-dashed text-[9px] text-muted-foreground/60">
                    empty
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {stageAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => onAssetClick?.(asset.id)}
                        className="w-full rounded text-left transition-opacity hover:opacity-80"
                      >
                        <AssetChip asset={asset} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Exception queue */}
      {exceptionAssets.length > 0 && (
        <div className={cn("rounded-lg border p-3", STAGE_ACCENT.exception)}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-red-600">
            ⚠ Exception Hold ({exceptionAssets.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {exceptionAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => onAssetClick?.(asset.id)}
                className="rounded text-left transition-opacity hover:opacity-80"
              >
                <AssetChip asset={asset} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
