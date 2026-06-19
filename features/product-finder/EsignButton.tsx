"use client";

import { useEffect, useRef, useState } from "react";
import type { SavedQuote } from "@/lib/product-finder-quotes";

type EsignStatus = "sent" | "viewed" | "signed" | "declined" | "error";

/**
 * Operator "Send for e-signature" action (v4-S2 #3) on an open quote. Renders
 * NOTHING unless the Dropbox Sign seam is configured (GET /api/esign/request →
 * {configured:true}), so it stays invisible in the dormant demo. On submit it
 * asks the server to email the customer a Dropbox Sign signing link (the document
 * is the quote PDF on our own origin) and then polls the signature status. In
 * test mode (the default) the request is non-binding and free.
 */
export function EsignButton({ quote, buildFileUrl }: { quote: SavedQuote; buildFileUrl: () => string }) {
  const [configured, setConfigured] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<EsignStatus | null>(null);
  const esignIdRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/esign/request")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.configured) {
          setConfigured(true);
          setTestMode(d.testMode !== false);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!configured || (quote.status !== "sent" && quote.status !== "draft")) return null;

  async function pollStatus(esignId: string) {
    try {
      const r = await fetch(`/api/esign/request?esignId=${encodeURIComponent(esignId)}`);
      if (!r.ok) return;
      const d = await r.json();
      if (d?.esign?.status) setStatus(d.esign.status);
    } catch {
      /* transient */
    }
  }

  async function send() {
    const signerEmail = email.trim();
    if (!signerEmail) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/esign/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          quoteNumber: quote.number,
          signerName: quote.customer || "Customer",
          signerEmail,
          fileUrl: buildFileUrl(),
        }),
      });
      const d = await res.json();
      if (!res.ok || d?.enabled === false) {
        setError("Could not send. Check the Dropbox Sign / quote-PDF configuration.");
        return;
      }
      esignIdRef.current = d.esignId;
      setStatus(d.status ?? "sent");
      setOpen(false);
    } catch {
      setError("Could not send. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "signed") {
    return (
      <span className="rounded bg-[#00AA13]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00573F]">
        Signed ✓
      </span>
    );
  }

  if (status && status !== "error") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="rounded bg-[#004986]/10 px-2 py-0.5 text-[10px] font-semibold text-[#004986]">
          Sent for signature{testMode ? " (test)" : ""}
        </span>
        {esignIdRef.current && (
          <button
            type="button"
            onClick={() => pollStatus(esignIdRef.current as string)}
            className="text-[10px] text-[#4F758B] underline"
            aria-label="Refresh signature status"
          >
            refresh
          </button>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded border border-[#004986] px-2 py-0.5 text-[10px] font-semibold text-[#004986] transition-colors hover:bg-[#004986]/10"
          title="Email the customer a Dropbox Sign link to sign this quote"
          aria-label={`Send quote ${quote.number} for e-signature`}
        >
          ✍️ Send for signature
        </button>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="signer@customer.com"
            aria-label="Signer email address"
            className="w-44 rounded border border-[#B7C9D3] px-1.5 py-0.5 text-[11px] text-[#1D252D] focus:border-[#004986] focus:outline-none"
          />
          <button
            type="button"
            disabled={busy || email.trim().length === 0}
            onClick={send}
            className="rounded bg-[#004986] px-2 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#003a6d] disabled:opacity-50"
          >
            {busy ? "Sending…" : testMode ? "Send (test)" : "Send"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[10px] text-[#4F758B] underline"
          >
            cancel
          </button>
        </>
      )}
      {error && <span className="text-[10px] text-[#DB6B30]">{error}</span>}
    </span>
  );
}
