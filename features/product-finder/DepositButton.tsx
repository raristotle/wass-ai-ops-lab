"use client";

import { useEffect, useRef, useState } from "react";
import type { SavedQuote } from "@/lib/product-finder-quotes";

interface DepositState {
  status: "requested" | "paid" | "failed" | "expired";
  amountCents: number;
}

/**
 * Operator "Request deposit" action (v3-S6 #19) on a sent/won quote. Renders
 * NOTHING unless the Stripe deposit seam is configured (GET /api/payments/deposit
 * → {configured:true}), so it stays invisible in the dormant demo. On click it
 * asks the server to create a Checkout Session (a real charge is created only
 * here, by this explicit click) and opens Stripe's hosted page in a new tab,
 * then polls the deposit status. No card data ever touches the app.
 */
export function DepositButton({ quote }: { quote: SavedQuote }) {
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deposit, setDeposit] = useState<DepositState | null>(null);
  const depositIdRef = useRef<string | null>(null);

  // Dormant check — the button is hidden entirely when the seam is off.
  useEffect(() => {
    let alive = true;
    fetch("/api/payments/deposit")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.configured) setConfigured(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Only meaningful for quotes the customer has been sent / has won.
  if (!configured || (quote.status !== "sent" && quote.status !== "won")) return null;

  async function pollStatus(depositId: string) {
    try {
      const r = await fetch(`/api/payments/deposit?depositId=${encodeURIComponent(depositId)}`);
      if (!r.ok) return;
      const d = await r.json();
      if (d?.deposit) setDeposit({ status: d.deposit.status, amountCents: d.deposit.amountCents });
    } catch {
      /* transient — leave the last known state */
    }
  }

  async function requestDeposit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          quoteNumber: quote.number,
          totalCents: Math.round(quote.total * 100),
          currency: "usd",
        }),
      });
      const d = await res.json();
      if (!res.ok || d?.enabled === false) {
        setError("Could not start a deposit. Check the Stripe configuration.");
        return;
      }
      if (d.alreadyPaid) {
        setDeposit({ status: "paid", amountCents: d.deposit?.amountCents ?? 0 });
        return;
      }
      depositIdRef.current = d.depositId;
      setDeposit({ status: "requested", amountCents: d.amountCents });
      // Open Stripe's hosted checkout in a new tab for the customer to pay.
      window.open(d.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not start a deposit. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (deposit?.status === "paid") {
    return (
      <span className="rounded bg-[#00AA13]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00573F]">
        Deposit paid ✓
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={requestDeposit}
        className="rounded border border-[#00AA13] px-2 py-0.5 text-[10px] font-semibold text-[#00573F] transition-colors hover:bg-[#00AA13]/10 disabled:opacity-50"
        title="Create a Stripe deposit checkout link for the customer"
        aria-label={`Request a deposit for quote ${quote.number}`}
      >
        {busy ? "Starting…" : "Request deposit"}
      </button>
      {deposit?.status === "requested" && depositIdRef.current && (
        <button
          type="button"
          onClick={() => pollStatus(depositIdRef.current as string)}
          className="text-[10px] text-[#4F758B] underline"
          aria-label="Refresh deposit status"
        >
          Awaiting payment — refresh
        </button>
      )}
      {error && <span className="text-[10px] text-[#DB6B30]">{error}</span>}
    </span>
  );
}
