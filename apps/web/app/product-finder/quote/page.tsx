"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProductFinder, hydrateSavedState } from "@/lib/product-finder-store";
import {
  decodeQuoteShare,
  isExpired,
  type QuoteSharePayload,
} from "@/lib/product-finder-quote-share";
import { formatDisplayDate } from "@/lib/product-finder-quote";
import { Button } from "@/components/ui/button";

/** Customer decision recorded in this browser (works even without the rep's quote data). */
type Decision = "accepted" | "declined";

function readDecisions(): Record<string, { status: Decision; at: number }> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem("pf_quote_acceptances");
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

function writeDecision(id: string, status: Decision, at: number) {
  if (typeof localStorage === "undefined") return;
  const all = readDecisions();
  all[id] = { status, at };
  localStorage.setItem("pf_quote_acceptances", JSON.stringify(all));
}

export default function QuoteAcceptancePage() {
  const quotes = useProductFinder((s) => s.quotes);
  const convertQuoteToOrder = useProductFinder((s) => s.convertQuoteToOrder);
  const setQuoteStatus = useProductFinder((s) => s.setQuoteStatus);

  const [payload, setPayload] = useState<QuoteSharePayload | null>(null);
  const [badLink, setBadLink] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateSavedState();
    const q = new URLSearchParams(window.location.search).get("q");
    const decoded = q ? decodeQuoteShare(q) : null;
    if (!decoded) {
      setBadLink(true);
    } else {
      setPayload(decoded);
      const prior = readDecisions()[decoded.id];
      if (prior) setDecision(prior.status);
    }
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (badLink || !payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFB] p-6">
        <div className="max-w-md rounded-xl border border-[#B7C9D3] bg-white p-8 text-center">
          <p className="text-lg font-bold text-[#1D252D]">This quote link isn&apos;t valid</p>
          <p className="mt-2 text-sm text-[#4F758B]">
            The link may be incomplete or out of date. Please ask your Meridian rep to send a fresh link.
          </p>
        </div>
      </main>
    );
  }

  const localQuote = quotes.find((q) => q.id === payload.id) ?? null;
  const expired = isExpired(payload, Date.now());
  const approvalPending =
    localQuote?.approvalStatus === "pending" || (localQuote === null && payload.approvalPending === true);
  const alreadyOrdered = localQuote?.convertedOrderId !== undefined;
  const canAccept = !expired && !approvalPending && decision === null && !alreadyOrdered;

  const handleAccept = () => {
    const now = Date.now();
    if (localQuote) {
      convertQuoteToOrder(payload.id, now);
    }
    writeDecision(payload.id, "accepted", now);
    setDecision("accepted");
  };

  const handleDecline = () => {
    const now = Date.now();
    if (localQuote) {
      setQuoteStatus(payload.id, "lost");
    }
    writeDecision(payload.id, "declined", now);
    setDecision("declined");
  };

  return (
    <main className="min-h-screen bg-[#F8FAFB] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {/* ── Status banners ── */}
        {decision === "accepted" && (
          <div className="mb-4 rounded-xl border border-[#00AA13]/40 bg-[#00AA13]/10 p-4 text-sm text-[#00573F]">
            <p className="font-bold">✓ Quote accepted{localQuote ? " — order placed" : ""}</p>
            <p className="mt-1">
              {localQuote
                ? "Your order has been recorded with Meridian Supply Co. Your rep will follow up with delivery details."
                : "Your acceptance has been recorded in this browser. Your Meridian rep will confirm the order. (Demo note: cross-device sync is simulated.)"}
            </p>
          </div>
        )}
        {decision === "declined" && (
          <div className="mb-4 rounded-xl border border-[#DB6B30]/40 bg-[#DB6B30]/10 p-4 text-sm text-[#1D252D]">
            <p className="font-bold">Quote declined</p>
            <p className="mt-1">Thanks for letting us know — your rep can revise and resend at any time.</p>
          </div>
        )}
        {decision === null && alreadyOrdered && (
          <div className="mb-4 rounded-xl border border-[#00AA13]/40 bg-[#00AA13]/10 p-4 text-sm text-[#00573F]">
            <p className="font-bold">✓ This quote has already been converted to an order.</p>
          </div>
        )}
        {decision === null && expired && (
          <div className="mb-4 rounded-xl border border-[#EAAA00]/50 bg-[#EAAA00]/10 p-4 text-sm text-[#1D252D]">
            <p className="font-bold">This quote has expired</p>
            <p className="mt-1">
              It was valid until {formatDisplayDate(new Date(payload.validUntil))}. Ask your rep for an updated quote.
            </p>
          </div>
        )}
        {decision === null && !expired && approvalPending && (
          <div className="mb-4 rounded-xl border border-[#EAAA00]/50 bg-[#EAAA00]/10 p-4 text-sm text-[#1D252D]">
            <p className="font-bold">Awaiting Meridian approval</p>
            <p className="mt-1">This quote needs internal sign-off before it can be accepted. Please check back shortly.</p>
          </div>
        )}

        {/* ── Quote document ── */}
        <div className="rounded-xl border border-[#B7C9D3] bg-white p-5 shadow-sm sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex items-center justify-center rounded bg-[#00AA13] px-2 py-1 text-xs font-bold tracking-widest text-white">
                  MERIDIAN
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#4F758B]">
                  Supply Co.
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-wide text-[#1D252D]">QUOTE</h1>
            </div>
            <div className="text-sm sm:text-right">
              <p className="font-semibold text-[#1D252D]">{payload.number}</p>
              <p className="text-[#4F758B]">Date: {formatDisplayDate(new Date(payload.createdAt))}</p>
              <p className="text-[#4F758B]">Valid until: {formatDisplayDate(new Date(payload.validUntil))}</p>
            </div>
          </div>

          {/* Customer / project / rep */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">Customer</p>
              <p className="mt-0.5 border-b border-[#B7C9D3] pb-0.5 text-sm text-[#1D252D]">
                {payload.customer || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">Project / PO #</p>
              <p className="mt-0.5 border-b border-[#B7C9D3] pb-0.5 text-sm text-[#1D252D]">
                {payload.project || "—"}
              </p>
            </div>
          </div>
          {(payload.rep || payload.branch) && (
            <p className="mt-4 text-xs text-[#4F758B]">
              Prepared by: <span className="font-semibold text-[#1D252D]">{payload.rep ?? "Meridian Supply Co."}</span>
              {payload.branch ? <span> · {payload.branch}</span> : null}
            </p>
          )}

          {/* Line items */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#1D252D]">
                  <th className="border border-[#4F758B] px-3 py-2 text-left font-semibold text-white">SKU</th>
                  <th className="border border-[#4F758B] px-3 py-2 text-left font-semibold text-white">Product</th>
                  <th className="border border-[#4F758B] px-3 py-2 text-right font-semibold text-white">Qty</th>
                  <th className="border border-[#4F758B] px-3 py-2 text-right font-semibold text-white">Unit Price</th>
                  <th className="border border-[#4F758B] px-3 py-2 text-right font-semibold text-white">Extended</th>
                </tr>
              </thead>
              <tbody>
                {payload.lines.map((line) => (
                  <tr key={line.id} className="border-b border-[#B7C9D3]/60">
                    <td className="border border-[#B7C9D3]/60 px-3 py-2 font-mono text-[#4F758B]">{line.sku}</td>
                    <td className="border border-[#B7C9D3]/60 px-3 py-2 text-[#1D252D]">{line.name}</td>
                    <td className="border border-[#B7C9D3]/60 px-3 py-2 text-right text-[#1D252D]">{line.qty}</td>
                    <td className="border border-[#B7C9D3]/60 px-3 py-2 text-right text-[#1D252D]">
                      ${line.unitPrice.toFixed(2)}
                    </td>
                    <td className="border border-[#B7C9D3]/60 px-3 py-2 text-right font-semibold text-[#1D252D]">
                      ${(line.unitPrice * line.qty).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFB]">
                  <td colSpan={4} className="border border-[#B7C9D3]/60 px-3 py-2 text-right font-semibold text-[#1D252D]">
                    Total
                  </td>
                  <td className="border border-[#B7C9D3]/60 px-3 py-2 text-right font-bold text-[#1D252D]">
                    ${payload.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-4 text-[10px] text-[#4F758B]">
            All prices in USD. This quote is valid for 30 days from the date of issue.
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full bg-[#00AA13] text-white hover:bg-[#009911] sm:w-auto sm:flex-1"
              disabled={!canAccept}
              onClick={handleAccept}
            >
              {decision === "accepted" ? "Accepted ✓" : "Accept Quote"}
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#DB6B30] text-[#DB6B30] hover:bg-[#DB6B30]/10 sm:w-auto sm:flex-1"
              disabled={decision !== null || alreadyOrdered}
              onClick={handleDecline}
            >
              {decision === "declined" ? "Declined" : "Decline"}
            </Button>
          </div>

          <p className="mt-4 text-center text-[10px] italic text-[#4F758B]">
            Demonstration quote — simulated data. Accepting records the decision in this browser
            {localQuote ? " and converts the quote to an order" : ""}.
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-[#4F758B]">
          Powered by{" "}
          <Link href="/product-finder" className="font-semibold text-[#00AA13] hover:underline">
            Meridian AI Product Recommender
          </Link>
        </p>
      </div>
    </main>
  );
}
