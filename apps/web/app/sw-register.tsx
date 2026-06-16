"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker (#20). Production-only (a SW in dev fights
 * HMR), guarded on support, and failure is swallowed — registration must never
 * break the app. The manifest + this registration make the product-finder an
 * installable, offline-capable PWA.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failed — app keeps working online */
      });
    }
  }, []);
  return null;
}
