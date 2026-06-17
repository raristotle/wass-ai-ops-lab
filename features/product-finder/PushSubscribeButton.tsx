"use client";

import { useEffect, useState } from "react";

/**
 * Web-push opt-in (#17). Renders nothing unless the server reports VAPID is
 * configured AND the browser supports the Push API — so it's invisible while the
 * integration is dormant. One click asks permission, subscribes via the SW, and
 * registers the subscription (same-origin, so the existing API auth gate covers
 * it). No payloads are ever sent; pushes are generic "tickle" alerts.
 */
type Phase = "hidden" | "idle" | "subscribing" | "on" | "denied" | "error";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  // Back the view with a concrete ArrayBuffer so it satisfies BufferSource.
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushSubscribeButton() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!supported) return;
    (async () => {
      try {
        const res = await fetch("/api/push/subscribe", { method: "GET" });
        if (!res.ok) return;
        const data: { configured?: boolean; publicKey?: string | null } = await res.json();
        if (cancelled || !data.configured || !data.publicKey) return;
        setPublicKey(data.publicKey);
        // Already subscribed in this browser? Reflect that without re-prompting.
        const reg = await navigator.serviceWorker.getRegistration();
        const existing = reg ? await reg.pushManager.getSubscription() : null;
        if (cancelled) return;
        setPhase(existing ? "on" : Notification.permission === "denied" ? "denied" : "idle");
      } catch {
        /* dormant / offline — stay hidden */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "hidden") return null;

  async function enable() {
    if (!publicKey) return;
    setPhase("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPhase("denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setPhase(res.ok ? "on" : "error");
    } catch {
      setPhase("error");
    }
  }

  const label =
    phase === "on"
      ? "Alerts on"
      : phase === "subscribing"
        ? "Enabling…"
        : phase === "denied"
          ? "Alerts blocked"
          : phase === "error"
            ? "Try again"
            : "Enable alerts";

  return (
    <button
      type="button"
      onClick={phase === "on" || phase === "subscribing" || phase === "denied" ? undefined : enable}
      disabled={phase === "on" || phase === "subscribing" || phase === "denied"}
      aria-label="Enable push alerts"
      title={
        phase === "denied"
          ? "Push alerts are blocked in your browser settings"
          : "Get a push when a quote, approval, or order needs you"
      }
      className="hidden h-9 items-center justify-center gap-1 rounded-lg border border-[#4F758B] px-2 text-xs font-bold text-[#B7C9D3] transition-colors hover:border-[#64CCC9] hover:text-[#64CCC9] disabled:cursor-default disabled:opacity-70 sm:flex"
    >
      <span aria-hidden>{phase === "on" ? "🔔" : "🔕"}</span>
      {label}
    </button>
  );
}
