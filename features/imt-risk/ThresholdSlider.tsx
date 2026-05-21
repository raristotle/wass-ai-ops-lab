"use client";

import type { ImtThresholds } from "@/lib/risk/imt";

interface ThresholdSliderProps {
  thresholds: ImtThresholds;
  onChange: (t: ImtThresholds) => void;
}

export function ThresholdSlider({ thresholds, onChange }: ThresholdSliderProps) {
  const { approveBelow, rejectAbove } = thresholds;

  const approvePct = approveBelow;
  const reviewPct = rejectAbove - approveBelow;
  const rejectPct = 100 - rejectAbove;

  function setApprove(v: number) {
    if (v >= rejectAbove) return;
    onChange({ ...thresholds, approveBelow: v });
  }

  function setReject(v: number) {
    if (v <= approveBelow) return;
    onChange({ ...thresholds, rejectAbove: v });
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <p className="text-sm font-medium">Decision Thresholds</p>
        <p className="text-[11px] text-muted-foreground">
          Adjust bands — changes re-score the entire queue in real time.
        </p>
      </div>

      {/* Visual band */}
      <div className="relative h-6 w-full overflow-hidden rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-green-500"
          style={{ width: `${approvePct}%` }}
        />
        <div
          className="absolute top-0 h-full bg-amber-400"
          style={{ left: `${approvePct}%`, width: `${reviewPct}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full bg-red-500"
          style={{ width: `${rejectPct}%` }}
        />
        {/* Labels */}
        <span className="absolute left-1 top-0 flex h-full items-center text-[10px] font-bold text-white">
          Approve
        </span>
        {reviewPct > 10 && (
          <span
            className="absolute top-0 flex h-full items-center text-[10px] font-bold text-white"
            style={{ left: `${approvePct + 1}%` }}
          >
            Review
          </span>
        )}
        <span className="absolute right-1 top-0 flex h-full items-center justify-end text-[10px] font-bold text-white">
          Reject
        </span>
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-green-700 dark:text-green-400">Approve below</label>
            <span className="tabular-nums font-mono font-bold text-green-700 dark:text-green-400">{approveBelow}</span>
          </div>
          <input
            type="range"
            min={0}
            max={99}
            step={1}
            value={approveBelow}
            onChange={(e) => setApprove(Number(e.target.value))}
            className="w-full accent-green-600 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-red-700 dark:text-red-400">Reject at or above</label>
            <span className="tabular-nums font-mono font-bold text-red-700 dark:text-red-400">{rejectAbove}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={rejectAbove}
            onChange={(e) => setReject(Number(e.target.value))}
            className="w-full accent-red-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Approve", range: `< ${approveBelow}`, color: "text-green-600" },
          { label: "Review",  range: `${approveBelow}–${rejectAbove - 1}`, color: "text-amber-600" },
          { label: "Reject",  range: `≥ ${rejectAbove}`, color: "text-red-600" },
        ].map(({ label, range, color }) => (
          <div key={label} className="rounded-md bg-muted/50 p-2">
            <p className={`text-[11px] font-bold uppercase ${color}`}>{label}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{range}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
