"use client";

import { useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { apiSearch } from "@/lib/product-finder-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogProduct, FilterState } from "@/features/product-finder/types";
import {
  conduitFill,
  wireSizeForVoltageDrop,
  breakerSize,
  ampacityLookup,
  boxFill,
  AWG_SIZES,
  type SelectorResult,
  type AwgSize,
  type ConduitType,
  type Phase,
  type Conductor,
} from "@/lib/catalog/nec-selectors";

type Calc = "conduit" | "wire" | "breaker" | "ampacity" | "boxfill";

const CALCS: { id: Calc; label: string; blurb: string }[] = [
  { id: "conduit", label: "Conduit fill", blurb: "Smallest conduit for N conductors" },
  { id: "wire", label: "Wire size", blurb: "Ampacity + voltage drop" },
  { id: "breaker", label: "Breaker sizing", blurb: "OCPD per NEC 240.6" },
  { id: "ampacity", label: "Ampacity check", blurb: "Derated capacity for an existing wire" },
  { id: "boxfill", label: "Box fill", blurb: "Min. box volume per NEC 314.16" },
];

/** Resolve a selector answer to the top stocked catalog product. */
async function resolveProduct(query: string, subcategory: string): Promise<CatalogProduct | null> {
  const filters: FilterState = {
    query,
    categories: new Set(),
    subcategories: new Set([subcategory]),
    brands: new Set(),
    onlyBranchStock: false,
    onlyDCStock: false,
    onlyPreferred: false,
    onlyActive: true, // a guided answer should resolve to an active, orderable part
    onlyWithCrosses: false,
    priceMin: null,
    priceMax: null,
    sortKey: "branchStock",
    viewMode: "list",
    specFilters: {},
    specRanges: {},
  };
  try {
    const res = await apiSearch(filters, 0, 1);
    return res.items[0] ?? null;
  } catch {
    return null;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-[#1D252D]">
      {label}
      {children}
    </label>
  );
}

const inputCls =
  "rounded border border-[#B7C9D3] px-2 py-1.5 text-sm text-[#1D252D] focus:border-[#00AA13] focus:outline-none";

export function GuidedSelectorsModal() {
  const open = useProductFinder((s) => s.guidedOpen);
  const setOpen = useProductFinder((s) => s.setGuidedOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));
  const addToCart = useProductFinder((s) => s.addToCart);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);

  const [calc, setCalc] = useState<Calc>("conduit");
  const [result, setResult] = useState<SelectorResult | null>(null);
  const [resolved, setResolved] = useState<CatalogProduct | null>(null);
  const [resolving, setResolving] = useState(false);

  // Conduit inputs
  const [cAwg, setCAwg] = useState<AwgSize>("12");
  const [cCount, setCCount] = useState("3");
  const [cType, setCType] = useState<ConduitType>("EMT");
  // Wire inputs
  const [wAmps, setWAmps] = useState("20");
  const [wLen, setWLen] = useState("100");
  const [wVolts, setWVolts] = useState("240");
  const [wPhase, setWPhase] = useState<Phase>("1ph");
  const [wMat, setWMat] = useState<Conductor>("Cu");
  // Breaker inputs
  const [bAmps, setBAmps] = useState("20");
  const [bCont, setBCont] = useState(true);
  // Ampacity inputs
  const [aAwg, setAAwg] = useState<AwgSize>("12");
  const [aMat, setAMat] = useState<Conductor>("Cu");
  const [aCount, setACount] = useState("3");
  const [aTemp, setATemp] = useState("30");
  // Box fill inputs
  const [bfAwg, setBfAwg] = useState<AwgSize>("12");
  const [bfCount, setBfCount] = useState("3");
  const [bfDevices, setBfDevices] = useState("1");
  const [bfClamp, setBfClamp] = useState(false);
  const [bfGrounds, setBfGrounds] = useState("1");

  if (!open) return null;

  function compute(): SelectorResult {
    if (calc === "conduit") {
      return conduitFill({ conductorAwg: cAwg, count: Number(cCount) || 0, conduitType: cType });
    }
    if (calc === "wire") {
      return wireSizeForVoltageDrop({
        amps: Number(wAmps) || 0,
        lengthFt: Number(wLen) || 0,
        voltage: Number(wVolts) || 0,
        phase: wPhase,
        material: wMat,
      });
    }
    if (calc === "ampacity") {
      return ampacityLookup({
        awg: aAwg,
        material: aMat,
        conductorCount: Number(aCount) || 3,
        ambientC: Number(aTemp) || 30,
      });
    }
    if (calc === "boxfill") {
      return boxFill({
        conductors: [{ awg: bfAwg, count: Number(bfCount) || 0 }],
        devices: Number(bfDevices) || 0,
        hasClamp: bfClamp,
        groundWires: Number(bfGrounds) || 0,
      });
    }
    return breakerSize({ amps: Number(bAmps) || 0, continuous: bCont });
  }

  async function handleCalculate() {
    const r = compute();
    setResult(r);
    setResolved(null);
    if (r.ok) {
      setResolving(true);
      const p = await resolveProduct(r.searchQuery, r.subcategory);
      setResolved(p);
      setResolving(false);
    }
  }

  function reset() {
    setResult(null);
    setResolved(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Guided engineering selectors"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Guided engineering selectors</h2>
            <p className="text-xs text-[#B7C9D3]">NEC-grounded — resolves to a stocked, priced part.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close guided selectors"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Calculator picker */}
          <div className="mb-4 grid grid-cols-5 gap-1.5">
            {CALCS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCalc(c.id);
                  reset();
                }}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center transition-colors",
                  calc === c.id
                    ? "border-[#00AA13] bg-[#00AA13]/5"
                    : "border-[#B7C9D3] hover:border-[#4F758B]",
                )}
              >
                <div className="text-xs font-semibold text-[#1D252D]">{c.label}</div>
                <div className="text-[10px] text-[#4F758B]">{c.blurb}</div>
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            {calc === "conduit" && (
              <>
                <Field label="Conductor (AWG)">
                  <select className={inputCls} value={cAwg} onChange={(e) => setCAwg(e.target.value as AwgSize)}>
                    {AWG_SIZES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Number of conductors">
                  <input className={inputCls} type="number" min="1" value={cCount} onChange={(e) => setCCount(e.target.value)} />
                </Field>
                <Field label="Conduit type">
                  <select className={inputCls} value={cType} onChange={(e) => setCType(e.target.value as ConduitType)}>
                    <option value="EMT">EMT</option>
                    <option value="PVC">PVC Sch 40</option>
                  </select>
                </Field>
              </>
            )}
            {calc === "wire" && (
              <>
                <Field label="Load (amps)">
                  <input className={inputCls} type="number" min="1" value={wAmps} onChange={(e) => setWAmps(e.target.value)} />
                </Field>
                <Field label="One-way length (ft)">
                  <input className={inputCls} type="number" min="1" value={wLen} onChange={(e) => setWLen(e.target.value)} />
                </Field>
                <Field label="System voltage">
                  <input className={inputCls} type="number" min="1" value={wVolts} onChange={(e) => setWVolts(e.target.value)} />
                </Field>
                <Field label="Phase">
                  <select className={inputCls} value={wPhase} onChange={(e) => setWPhase(e.target.value as Phase)}>
                    <option value="1ph">Single-phase</option>
                    <option value="3ph">Three-phase</option>
                  </select>
                </Field>
                <Field label="Conductor">
                  <select className={inputCls} value={wMat} onChange={(e) => setWMat(e.target.value as Conductor)}>
                    <option value="Cu">Copper</option>
                    <option value="Al">Aluminum</option>
                  </select>
                </Field>
              </>
            )}
            {calc === "breaker" && (
              <>
                <Field label="Load (amps)">
                  <input className={inputCls} type="number" min="1" value={bAmps} onChange={(e) => setBAmps(e.target.value)} />
                </Field>
                <Field label="Continuous load? (≥3 hrs)">
                  <select className={inputCls} value={bCont ? "yes" : "no"} onChange={(e) => setBCont(e.target.value === "yes")}>
                    <option value="yes">Yes — size at 125%</option>
                    <option value="no">No</option>
                  </select>
                </Field>
              </>
            )}
            {calc === "ampacity" && (
              <>
                <Field label="Conductor (AWG)">
                  <select className={inputCls} value={aAwg} onChange={(e) => setAAwg(e.target.value as AwgSize)}>
                    {AWG_SIZES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Material">
                  <select className={inputCls} value={aMat} onChange={(e) => setAMat(e.target.value as Conductor)}>
                    <option value="Cu">Copper</option>
                    <option value="Al">Aluminum</option>
                  </select>
                </Field>
                <Field label="Conductors in raceway">
                  <input className={inputCls} type="number" min="1" value={aCount} onChange={(e) => setACount(e.target.value)} />
                </Field>
                <Field label="Ambient temp (°C)">
                  <input className={inputCls} type="number" min="20" max="70" value={aTemp} onChange={(e) => setATemp(e.target.value)} />
                </Field>
              </>
            )}
            {calc === "boxfill" && (
              <>
                <Field label="Largest conductor (AWG)">
                  <select className={inputCls} value={bfAwg} onChange={(e) => setBfAwg(e.target.value as AwgSize)}>
                    {(["14", "12", "10", "8", "6"] as AwgSize[]).map((a) => (
                      <option key={a} value={a}>{a} AWG</option>
                    ))}
                  </select>
                </Field>
                <Field label="Conductor count">
                  <input className={inputCls} type="number" min="0" value={bfCount} onChange={(e) => setBfCount(e.target.value)} />
                </Field>
                <Field label="Devices (switches/outlets)">
                  <input className={inputCls} type="number" min="0" value={bfDevices} onChange={(e) => setBfDevices(e.target.value)} />
                </Field>
                <Field label="Ground wires">
                  <input className={inputCls} type="number" min="0" value={bfGrounds} onChange={(e) => setBfGrounds(e.target.value)} />
                </Field>
                <label className="col-span-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-[#1D252D]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#00AA13]"
                    checked={bfClamp}
                    onChange={(e) => setBfClamp(e.target.checked)}
                  />
                  Internal cable clamp present
                </label>
              </>
            )}
          </div>

          <Button
            className="mt-4 w-full bg-[#00AA13] text-white hover:bg-[#00880F]"
            onClick={handleCalculate}
          >
            Calculate
          </Button>

          {/* Result */}
          {result && (
            <div className="mt-4 rounded-lg border border-[#B7C9D3] bg-[#F1EFE8] px-4 py-3">
              {result.ok ? (
                <>
                  <p className="text-sm font-semibold text-[#1D252D]">
                    Recommended: <span className="text-[#00573F]">{result.answer}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#4F758B]">{result.explanation}</p>
                  <div className="mt-3">
                    {resolving && <p className="text-xs text-[#4F758B]">Finding a stocked match…</p>}
                    {!resolving && resolved && (
                      <div className="flex items-center justify-between gap-3 rounded border border-[#B7C9D3] bg-white px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#1D252D]">{resolved.name}</p>
                          <p className="text-[11px] text-[#4F758B]">
                            {resolved.brand} · SKU {resolved.sku} · ${resolved.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 shrink-0 bg-[#00AA13] text-white hover:bg-[#00880F]"
                          onClick={() => {
                            addToCart(resolved, 1);
                            setOpen(false);
                            setCartOpen(true);
                          }}
                        >
                          Add to cart
                        </Button>
                      </div>
                    )}
                    {!resolving && !resolved && (
                      <p className="text-xs text-[#DB6B30]">
                        No stocked match for “{result.searchQuery}” right now — try a different option or search manually.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#DB6B30]">{result.explanation}</p>
              )}
            </div>
          )}

          <p className="mt-3 text-[10px] leading-snug text-[#4F758B]">
            Guidance only, from a compact NEC subset (copper THHN assumed). Verify against the full code and the AHJ before installation.
          </p>
        </div>
      </div>
    </div>
  );
}
