"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";

/**
 * Barcode / QR scanner (#20) — camera lookup for rural jobsites. Uses the native
 * BarcodeDetector when available (Android Chrome / Edge) and ALWAYS offers a
 * manual part-number entry as a graceful fallback (iOS Safari has no
 * BarcodeDetector). On a hit it runs the catalog search and closes.
 */

interface DetectedBarcode {
  rawValue?: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}

export function BarcodeScannerModal() {
  const open = useProductFinder((s) => s.barcodeOpen);
  const setOpen = useProductFinder((s) => s.setBarcodeOpen);
  const runNlSearch = useProductFinder((s) => s.runNlSearch);
  const closeRef = useModalA11y(open, () => setOpen(false));
  const router = useRouter();

  const [manual, setManual] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const submit = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) return;
      stopCamera();
      setOpen(false);
      void runNlSearch(v);
      if (typeof window !== "undefined" && window.location.pathname !== "/product-finder") {
        router.push("/product-finder");
      }
    },
    [runNlSearch, router, setOpen, stopCamera],
  );

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (!openRef.current) {
        // Modal closed while the permission prompt was up — don't leak the camera.
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
      setError("Could not access the camera. Type the part number instead.");
    }
  }

  // Scan loop while the camera is live.
  useEffect(() => {
    if (!scanning) return;
    const Ctor = (window as unknown as { BarcodeDetector?: new () => BarcodeDetectorLike }).BarcodeDetector;
    if (!Ctor) return;
    let detector: BarcodeDetectorLike;
    try {
      detector = new Ctor();
    } catch {
      // Some Chromium builds expose BarcodeDetector but can't construct it.
      setError("Barcode scanning could not start on this device — type the part number instead.");
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
          submit(String(hit.rawValue));
          return;
        }
      } catch {
        /* transient frame error — keep trying */
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [scanning, submit, stopCamera]);

  // Always release the camera when the modal closes / unmounts.
  useEffect(() => {
    if (!open) stopCamera();
    return () => stopCamera();
  }, [open, stopCamera]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scan barcode"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Scan barcode</h2>
            <p className="text-xs text-[#B7C9D3]">Scan a part barcode / QR, or type the number to search.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close barcode scanner"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          {supported ? (
            <div className="mb-3">
              {scanning ? (
                <video
                  ref={videoRef}
                  className="w-full rounded-lg bg-black"
                  style={{ maxHeight: 320 }}
                  muted
                  playsInline
                  aria-label="Camera preview"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="w-full rounded bg-[#00AA13] px-3 py-2 text-sm font-semibold text-white hover:bg-[#009911]"
                >
                  Scan with camera
                </button>
              )}
            </div>
          ) : (
            <p className="mb-3 rounded bg-[#004986]/10 px-3 py-1.5 text-xs text-[#004986]">
              Camera scanning is not supported on this browser — type the part number below.
            </p>
          )}

          {error && <p role="status" className="mb-2 text-xs text-[#DB6B30]">{error}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(manual);
            }}
          >
            <label htmlFor="bc-manual" className="mb-1 block text-xs font-medium text-[#1D252D]">
              Part number / SKU
            </label>
            <div className="flex gap-2">
              <input
                id="bc-manual"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="e.g. QO115"
                className="flex-1 rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!manual.trim()}
                className="rounded bg-[#1D252D] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#2d3740] disabled:opacity-50"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
