"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { evaluateCounts, replenishmentItems, countSummary, type CountResult } from "@/lib/product-finder-cycle-count";
import type { VmiPolicy, ReorderLine } from "@/lib/product-finder-vmi";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Scan-to-reorder cycle count (v3-S4 #11 bins + #17 cycle-count session) — a
 * field rep scans/keys a shelf, van, or bin SKU and enters the physical count;
 * each line is diffed against its VMI min/max and everything below min drops into
 * a one-tap replenishment basket. Fuses the shipped VMI engine + BarcodeDetector.
 * Continuous: scanning stays live so a whole shelf can be counted in one pass.
 */

interface DetectedBarcode {
  rawValue?: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}

interface Entry {
  sku: string;
  name: string;
  product: CatalogProduct;
  counted: number;
  policy: VmiPolicy | null;
}

const STATUS_STYLE: Record<string, string> = {
  ok: "bg-[#00AA13]/15 text-[#00573F]",
  reorder: "bg-[#EAAA00]/20 text-[#854F0B]",
  critical: "bg-[#DB6B30]/20 text-[#A32D2D]",
};

export function CycleCountModal() {
  const open = useProductFinder((s) => s.cycleCountOpen);
  const setOpen = useProductFinder((s) => s.setCycleCountOpen);
  const addToCart = useProductFinder((s) => s.addToCart);
  const openCartAt = useProductFinder((s) => s.openCartAt);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const [entries, setEntries] = useState<Entry[]>([]);
  const [policyMap, setPolicyMap] = useState<Map<string, VmiPolicy>>(new Map());
  const [manual, setManual] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const lastScan = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  // Keep the latest entries for the async add path without re-binding the scan loop.
  const entriesRef = useRef<Entry[]>(entries);
  entriesRef.current = entries;

  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  // Add a scanned/keyed SKU to the count session. A repeat SKU increments its
  // count (scan each unit); a new SKU is resolved + appended (count starts at 1).
  const addSku = useCallback(
    async (raw: string) => {
      const sku = raw.trim();
      if (!sku) return;
      const existingIdx = entriesRef.current.findIndex((e) => e.sku.toLowerCase() === sku.toLowerCase());
      if (existingIdx >= 0) {
        setEntries((prev) => prev.map((e, i) => (i === existingIdx ? { ...e, counted: e.counted + 1 } : e)));
        return;
      }
      try {
        const res = await fetch("/api/products/quick-resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skus: [sku] }),
        });
        const data = (await res.json()) as { resolved?: { product: CatalogProduct | null }[] };
        const product = data.resolved?.[0]?.product ?? null;
        if (!product) {
          setNotice(`No match for "${sku}".`);
          return;
        }
        setNotice(null);
        const policy = policyMap.get(product.sku.toUpperCase()) ?? null;
        setEntries((prev) =>
          prev.some((e) => e.sku.toLowerCase() === product.sku.toLowerCase())
            ? prev
            : [...prev, { sku: product.sku, name: product.name, product, counted: 1, policy }],
        );
      } catch {
        setNotice("Could not resolve that SKU — try again.");
      }
    },
    [policyMap],
  );

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (!openRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setError("Could not access the camera. Key the SKU instead.");
    }
  }

  // Continuous scan loop — each fresh code adds to the session (debounced so the
  // same barcode in view isn't counted dozens of times).
  useEffect(() => {
    if (!scanning) return;
    const Ctor = (window as unknown as { BarcodeDetector?: new () => BarcodeDetectorLike }).BarcodeDetector;
    if (!Ctor) return;
    let detector: BarcodeDetectorLike;
    try {
      detector = new Ctor();
    } catch {
      setError("Barcode scanning could not start on this device — key the SKU instead.");
      stopCamera();
      return;
    }
    let active = true;
    let raf = 0;
    const tick = async () => {
      if (!active || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        const hit = codes.find((c) => c.rawValue);
        if (hit?.rawValue) {
          const value = String(hit.rawValue);
          const now = Date.now();
          if (!(value === lastScan.current.value && now - lastScan.current.at < 1500)) {
            lastScan.current = { value, at: now };
            void addSku(value);
          }
        }
      } catch {
        /* transient frame error — keep trying */
      }
      if (active) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [scanning, addSku, stopCamera]);

  // Release the camera on close/unmount.
  useEffect(() => {
    if (!open) stopCamera();
    return () => stopCamera();
  }, [open, stopCamera]);

  // Load VMI policies once on open so counts can be diffed against min/max.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch("/api/vmi")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { lines?: ReorderLine[] } | null) => {
        if (!alive || !d?.lines) return;
        const m = new Map<string, VmiPolicy>();
        for (const l of d.lines) {
          m.set(l.sku.toUpperCase(), {
            id: l.policyId, sku: l.sku, name: l.name, customerId: null, branchId: null, min: l.min, max: l.max, updatedAt: 0,
          });
        }
        setPolicyMap(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open]);

  // Reset the session each time the modal opens.
  useEffect(() => {
    if (open) {
      setEntries([]);
      setManual("");
      setError(null);
      setNotice(null);
    }
  }, [open]);

  if (!open) return null;

  const results: CountResult[] = evaluateCounts(
    entries.map((e) => ({ sku: e.sku, name: e.name, counted: e.counted, policy: e.policy })),
  );
  const summary = countSummary(results);
  const basket = replenishmentItems(results);

  function setCounted(idx: number, value: string) {
    const n = parseInt(value, 10);
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, counted: Number.isFinite(n) && n >= 0 ? n : 0 } : e)));
  }

  function addReplenishmentToBasket() {
    const bySku = new Map(entries.map((e) => [e.sku, e.product]));
    for (const item of basket) {
      const product = bySku.get(item.sku);
      if (product) addToCart(product, item.qty);
    }
    stopCamera();
    setOpen(false);
    openCartAt("basket");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cycle count and bin replenishment"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Cycle count &amp; bins</h2>
            <p className="text-xs text-[#B7C9D3]">Scan or key each SKU, enter the count — below-min lines reorder.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cycle count"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Camera / wedge entry */}
          {supported && (
            <div className="mb-3">
              {scanning ? (
                <div>
                  <video ref={videoRef} className="w-full rounded-lg bg-black" style={{ maxHeight: 240 }} muted playsInline aria-label="Camera preview" />
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="mt-2 w-full rounded border border-[#4F758B] px-3 py-1.5 text-sm font-semibold text-[#4F758B] hover:border-[#1D252D] hover:text-[#1D252D]"
                  >
                    Stop camera
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="w-full rounded bg-[#00AA13] px-3 py-2 text-sm font-semibold text-white hover:bg-[#009911]"
                >
                  Scan with camera (continuous)
                </button>
              )}
            </div>
          )}

          {error && <p role="status" className="mb-2 text-xs text-[#DB6B30]">{error}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void addSku(manual);
              setManual("");
            }}
          >
            <label htmlFor="cc-manual" className="mb-1 block text-xs font-medium text-[#1D252D]">
              SKU (scan with a wedge scanner or type)
            </label>
            <div className="flex gap-2">
              <input
                id="cc-manual"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="e.g. QO115"
                autoComplete="off"
                className="flex-1 rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!manual.trim()}
                className="rounded bg-[#1D252D] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#2d3740] disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </form>
          {notice && <p role="status" className="mt-1 text-xs text-[#DB6B30]">{notice}</p>}

          {/* Count session */}
          {results.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#4F758B]">
                <span>{summary.counted} counted</span>
                <span>{summary.withPolicy} with VMI policy</span>
                <span className="font-semibold text-[#A32D2D]">{summary.underMin} below min</span>
                <span>{summary.reorderUnits} units to reorder</span>
              </div>
              <ul className="max-h-72 space-y-1.5 overflow-y-auto">
                {results.map((r, i) => (
                  <li key={r.sku} className="rounded-lg border border-[#B7C9D3] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#1D252D]">
                        {r.name} <span className="font-normal text-[#4F758B]">· {r.sku}</span>
                      </span>
                      <label className="flex items-center gap-1 text-[10px] text-[#4F758B]">
                        count
                        <input
                          type="number"
                          min="0"
                          value={r.counted}
                          onChange={(e) => setCounted(i, e.target.value)}
                          aria-label={`Counted quantity for ${r.name}`}
                          className="w-14 rounded border border-[#B7C9D3] px-1 py-0.5 text-right text-xs text-[#1D252D] focus:border-[#00AA13] focus:outline-none"
                        />
                      </label>
                    </div>
                    {r.reorder ? (
                      <p className="mt-0.5 text-[10px]">
                        <span className={`rounded px-1.5 py-0.5 font-semibold ${STATUS_STYLE[r.reorder.status]}`}>
                          {r.reorder.status === "ok" ? "OK" : r.reorder.status === "reorder" ? "Reorder" : "Critical"}
                        </span>{" "}
                        <span className="text-[#4F758B]">
                          min {r.reorder.min} / max {r.reorder.max}
                          {r.reorder.reorderQty > 0 ? ` · reorder ${r.reorder.reorderQty}` : ""}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] text-[#4F758B]">No VMI policy for this SKU — counted only.</p>
                    )}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={addReplenishmentToBasket}
                disabled={basket.length === 0}
                className="mt-3 w-full rounded bg-[#00AA13] px-3 py-2 text-sm font-semibold text-white hover:bg-[#009911] disabled:opacity-50"
              >
                {basket.length > 0
                  ? `Add ${basket.length} below-min line${basket.length === 1 ? "" : "s"} (${summary.reorderUnits} units) to basket`
                  : "No below-min lines to reorder"}
              </button>
            </div>
          )}

          <p className="mt-3 text-[10px] leading-snug text-[#4F758B]">
            Counts are diffed against your VMI min/max policies (set one in VMI). A repeat scan increments the
            count. Reorder qty restocks back to max — simulated on-hand; nothing is ordered until you check out.
          </p>
        </div>
      </div>
    </div>
  );
}
