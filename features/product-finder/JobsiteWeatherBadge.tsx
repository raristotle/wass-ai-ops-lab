"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AssessedPeriod {
  name: string;
  tempF: number | null;
  precipPct: number | null;
  windMph: number | null;
  shortForecast: string | null;
  risk: "ok" | "caution" | "hold";
  flags: string[];
}
interface WeatherResponse {
  enabled: boolean;
  reason?: string;
  source?: string;
  outlook?: { periods: AssessedPeriod[]; worst: "ok" | "caution" | "hold" };
}

const RISK_STYLE: Record<string, { chip: string; label: string }> = {
  ok: { chip: "border-[#00573F]/40 bg-[#00573F]/5 text-[#00573F]", label: "Install window clear" },
  caution: { chip: "border-[#EAAA00]/50 bg-[#EAAA00]/10 text-[#1D252D]", label: "Install caution" },
  hold: { chip: "border-[#DB6B30]/50 bg-[#DB6B30]/10 text-[#DB6B30]", label: "Install hold advised" },
};

/**
 * Jobsite weather risk for delivery/install scheduling (v3-S5 #7), via the NWS
 * lane chained through geocoding. Renders nothing when the lane is dormant
 * (no WEATHER_CONTACT / no geocoding key), the location is outside US NWS
 * coverage, or no forecast is available — so it stays quiet in the demo and
 * lights up only once those env keys are set.
 */
export function JobsiteWeatherBadge({ location }: { location: string }) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    fetch(`/api/weather?address=${encodeURIComponent(location)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [location]);

  if (!data?.enabled || !data.outlook || data.outlook.periods.length === 0) return null;

  const worst = data.outlook.worst;
  const style = RISK_STYLE[worst] ?? RISK_STYLE.ok;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn("rounded border px-2 py-0.5 text-[11px] font-medium", style.chip)}
      >
        ⛅ {style.label} · {location}
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1">
          {data.outlook.periods.map((p, i) => (
            <li key={i} className="text-[11px] text-[#1D252D]">
              <span className="font-semibold">{p.name}:</span>{" "}
              <span className="text-[#4F758B]">
                {p.shortForecast}
                {p.tempF != null ? ` · ${p.tempF}°F` : ""}
                {p.precipPct != null ? ` · ${p.precipPct}% precip` : ""}
                {p.windMph != null ? ` · ${p.windMph} mph` : ""}
              </span>
              {p.flags.length > 0 && (
                <ul className="ml-4 list-disc text-[10px] text-[#DB6B30]">
                  {p.flags.map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-[10px] italic text-[#4F758B]">
        NWS forecast, fetched on demand for the fulfilling branch metro — not stored.
      </p>
    </div>
  );
}
