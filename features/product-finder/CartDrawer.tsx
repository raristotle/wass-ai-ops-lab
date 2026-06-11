"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useProductFinder, selectCartCount, selectCartTotal, selectActiveCustomer } from "@/lib/product-finder-store";
import { priceTiers } from "@/lib/product-finder-pricing";
import { overrideBounds } from "@/lib/product-finder-override";
import type { SavedBasket, Order } from "@/lib/product-finder-store";
import { getPricingProvider } from "@/lib/integration/index";
import { quoteNumber, quoteValidityDate, formatDisplayDate } from "@/lib/product-finder-quote";
import { encodeCart } from "@/lib/product-finder-share";
import { encodeQuoteShare, QUOTE_SHARE_VERSION, type QuoteSharePayload } from "@/lib/product-finder-quote-share";
import { basketCsv, downloadCsv } from "@/lib/product-finder-csv";
import { orderEtaDays, addDays, etaLabel } from "@/lib/product-finder-delivery";
import { isInLocalMonth } from "@/lib/analytics";
import {
  QUOTE_STATUSES, QUOTE_STATUS_LABEL, QUOTE_STATUS_COLOR,
  APPROVAL_LABEL, APPROVAL_COLOR, isSuperseded, type SavedQuote, type QuoteStatus,
} from "@/lib/product-finder-quotes";
import { TERMS_BLOCKS, resolveTerms } from "@/lib/product-finder-terms";
import { EVENT_ICON, EVENT_LABEL } from "@/lib/product-finder-quote-events";
import { SubmittalPackage } from "@/features/product-finder/SubmittalPackage";
import { completeTheJob } from "@/lib/product-finder-complete-job";
import { isValidEmail, guessRecipient } from "@/lib/product-finder-email";
import {
  estimatedUnitCost, marginPct, marginTier, MARGIN_TIER_COLOR, basketMargin,
} from "@/lib/product-finder-margin";
import { marginGuidance } from "@/lib/product-finder-winloss";
import { stockWarning } from "@/lib/product-finder-stock-warning";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const cartOpen = useProductFinder((s) => s.cartOpen);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const cart = useProductFinder((s) => s.cart);
  const removeFromCart = useProductFinder((s) => s.removeFromCart);
  const updateCartQty = useProductFinder((s) => s.updateCartQty);
  const clearCart = useProductFinder((s) => s.clearCart);
  const addToCart = useProductFinder((s) => s.addToCart);
  const cartCount = useProductFinder(selectCartCount);
  const cartTotal = useProductFinder(selectCartTotal);
  const user = useProductFinder((s) => s.user);
  const priceOverrides = useProductFinder((s) => s.priceOverrides);
  const setPriceOverride = useProductFinder((s) => s.setPriceOverride);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");

  const savedBaskets = useProductFinder((s) => s.savedBaskets);
  const saveCurrentBasket = useProductFinder((s) => s.saveCurrentBasket);
  const loadBasket = useProductFinder((s) => s.loadBasket);
  const deleteBasket = useProductFinder((s) => s.deleteBasket);

  const jobTemplates = useProductFinder((s) => s.jobTemplates);
  const saveTemplate = useProductFinder((s) => s.saveTemplate);
  const applyTemplate = useProductFinder((s) => s.applyTemplate);
  const deleteTemplate = useProductFinder((s) => s.deleteTemplate);

  const quotes = useProductFinder((s) => s.quotes);
  const saveQuote = useProductFinder((s) => s.saveQuote);
  const setQuoteStatus = useProductFinder((s) => s.setQuoteStatus);
  const setQuoteApproval = useProductFinder((s) => s.setQuoteApproval);
  const loadQuoteToCart = useProductFinder((s) => s.loadQuoteToCart);
  const deleteQuote = useProductFinder((s) => s.deleteQuote);
  const convertQuoteToOrder = useProductFinder((s) => s.convertQuoteToOrder);
  const logQuoteLink = useProductFinder((s) => s.logQuoteLink);
  const revisingQuoteId = useProductFinder((s) => s.revisingQuoteId);
  const startReviseQuote = useProductFinder((s) => s.startReviseQuote);
  const cancelRevise = useProductFinder((s) => s.cancelRevise);
  const submittalOpen = useProductFinder((s) => s.submittalOpen);
  const setSubmittalOpen = useProductFinder((s) => s.setSubmittalOpen);
  const isManager = user?.role === "manager" || user?.role === "admin";

  const orders = useProductFinder((s) => s.orders);
  const activeCustomerId = useProductFinder((s) => s.activeCustomerId);
  const visibleOrders = useMemo(
    () =>
      activeCustomerId === null
        ? orders.filter((o) => o.customerId === null)
        : orders.filter((o) => o.customerId === activeCustomerId),
    [orders, activeCustomerId]
  );
  const placeOrder = useProductFinder((s) => s.placeOrder);
  const reorder = useProductFinder((s) => s.reorder);
  const deleteOrder = useProductFinder((s) => s.deleteOrder);
  const activeCustomer = useProductFinder(selectActiveCustomer);

  // ── Deep-link anchoring + section filters (null = exactly today's behavior) ─
  const cartSection = useProductFinder((s) => s.cartSection);
  const cartQuoteStatusFilter = useProductFinder((s) => s.cartQuoteStatusFilter);
  const cartOrderMonthFilter = useProductFinder((s) => s.cartOrderMonthFilter);
  const clearCartFilters = useProductFinder((s) => s.clearCartFilters);
  const basketSectionRef = useRef<HTMLDivElement>(null);
  const quotesSectionRef = useRef<HTMLDivElement>(null);
  const ordersSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cartOpen || !cartSection) return;
    const target =
      cartSection === "basket"
        ? basketSectionRef.current
        : cartSection === "quotes"
          ? quotesSectionRef.current
          : ordersSectionRef.current;
    // Slight delay so the slide-in panel has mounted/positioned first.
    const t = setTimeout(() => target?.scrollIntoView({ block: "start" }), 80);
    return () => clearTimeout(t);
  }, [cartOpen, cartSection]);

  const items = Object.values(cart);
  const hasContractCustomer = activeCustomer !== null && activeCustomer.tier === "contract";

  // ── Saved baskets / templates state ────────────────────────────────────────
  const [basketName, setBasketName] = useState("");
  const [templateName, setTemplateName] = useState("");

  // Quotes saved this session start in the "won/lost" workflow; visible filter
  const quotesForCustomer = useMemo(
    () =>
      activeCustomerId === null
        ? quotes
        : quotes.filter((q) => q.customerId === activeCustomerId || q.customerId === null),
    [quotes, activeCustomerId]
  );

  // Deep-link status filter — applied ON TOP of the customer scoping above.
  const visibleQuotes = useMemo(
    () =>
      cartQuoteStatusFilter === null
        ? quotesForCustomer
        : quotesForCustomer.filter((q) => q.status === cartQuoteStatusFilter),
    [quotesForCustomer, cartQuoteStatusFilter]
  );

  // Deep-link month filter — applied ON TOP of the customer-scoped order list.
  const monthFilteredOrders = useMemo(
    () =>
      cartOrderMonthFilter === null
        ? visibleOrders
        : visibleOrders.filter((o) =>
            isInLocalMonth(o.placedAt, cartOrderMonthFilter.year, cartOrderMonthFilter.month)
          ),
    [visibleOrders, cartOrderMonthFilter]
  );
  const orderMonthLabel = cartOrderMonthFilter
    ? new Date(cartOrderMonthFilter.year, cartOrderMonthFilter.month, 1).toLocaleDateString(
        "en-US",
        { month: "short", year: "2-digit" }
      )
    : null;

  // Whole-order delivery ETA ("ships complete by")
  const orderEta = useMemo(() => {
    if (items.length === 0) return null;
    const days = orderEtaDays(items, user?.branchId);
    return { days, date: addDays(new Date(), days) };
  }, [items, user?.branchId]);

  // "Complete this job" — complementary products the basket is missing
  const completions = useMemo(() => (items.length === 0 ? [] : completeTheJob(items, 4)), [items]);

  // Internal margin across the basket (effective price vs estimated cost).
  // Override-aware: a manually re-priced line contributes its custom price.
  const margin = useMemo(() => {
    if (items.length === 0) return null;
    const provider = getPricingProvider();
    const lines = items.map(({ product, qty }) => ({
      product,
      qty,
      effectiveUnitPrice:
        priceOverrides[product.id] ??
        provider.getPricing(product, { customer: activeCustomer, qty }).effectiveUnitPrice,
    }));
    return basketMargin(lines);
  }, [items, activeCustomer, priceOverrides]);

  // ── Email-quote state ──────────────────────────────────────────────────────
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // ── Quote state ────────────────────────────────────────────────────────────
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [project, setProject] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [termsIds, setTermsIds] = useState<string[]>([]);

  // ── Share / quote-save state ───────────────────────────────────────────────
  const [shareCopied, setShareCopied] = useState(false);
  const [quoteSaved, setQuoteSaved] = useState(false);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
  const customers = useProductFinder((s) => s.customers);

  /** Build + copy the customer-facing acceptance link for a saved quote. */
  const handleCustomerLink = (q: SavedQuote) => {
    const provider = getPricingProvider();
    const quoteCustomer = q.customerId ? customers.find((c) => c.id === q.customerId) ?? null : null;
    const payload: QuoteSharePayload = {
      v: QUOTE_SHARE_VERSION,
      id: q.id,
      number: q.number,
      customer: q.customer,
      project: q.project,
      lines: q.lines.map((l) => ({
        id: l.product.id,
        sku: l.product.sku,
        name: l.product.name,
        qty: l.qty,
        // Prefer the price captured at save time (incl. manual overrides)
        unitPrice:
          l.unitPrice ??
          provider.getPricing(l.product, { customer: quoteCustomer, qty: l.qty }).effectiveUnitPrice,
      })),
      total: q.total,
      createdAt: q.createdAt,
      validUntil: quoteValidityDate(new Date(q.createdAt)).getTime(),
      ...(user ? { rep: user.name, branch: user.branch } : {}),
      ...(q.approvalStatus === "pending" ? { approvalPending: true as const } : {}),
      ...(q.note ? { note: q.note } : {}),
      ...(q.termsIds && q.termsIds.length > 0 ? { terms: resolveTerms(q.termsIds) } : {}),
    };
    const url = `${location.origin}/product-finder/quote?q=${encodeQuoteShare(payload)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedQuoteId(q.id);
      setTimeout(() => setCopiedQuoteId(null), 2500);
    });
    logQuoteLink(q.id);
    // Sharing the link with the customer IS sending the quote.
    if (q.status === "draft") setQuoteStatus(q.id, "sent");
  };

  const handleShare = () => {
    const lines = Object.values(cart).map(({ product, qty }) => ({
      id: product.id,
      qty,
    }));
    const encoded = encodeCart(lines, {
      customer: customer || undefined,
      project: project || undefined,
    });
    const url = `${location.origin}/product-finder?cart=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    setCustomer(localStorage.getItem("pf_quote_customer") ?? "");
    setProject(localStorage.getItem("pf_quote_project") ?? "");
    setQuoteNote(localStorage.getItem("pf_quote_note") ?? "");
    try {
      const t = JSON.parse(localStorage.getItem("pf_quote_terms") ?? "[]");
      if (Array.isArray(t)) setTermsIds(t.filter((x): x is string => typeof x === "string"));
    } catch { /* corrupt — start clean */ }
  }, []);

  // Persist note + terms selections
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("pf_quote_note", quoteNote);
  }, [quoteNote]);
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("pf_quote_terms", JSON.stringify(termsIds));
  }, [termsIds]);

  // Starting a revision pre-fills the quote fields from the original
  useEffect(() => {
    if (!revisingQuoteId) return;
    const original = quotes.find((q) => q.id === revisingQuoteId);
    if (!original) return;
    setCustomer(original.customer);
    setProject(original.project);
    setQuoteNote(original.note ?? "");
    setTermsIds(original.termsIds ?? []);
  }, [revisingQuoteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const revisingQuote = revisingQuoteId ? quotes.find((q) => q.id === revisingQuoteId) ?? null : null;

  // Pre-fill quote customer field when an active customer is selected
  useEffect(() => {
    if (activeCustomer && activeCustomer.tier === "contract") {
      setCustomer(activeCustomer.name);
    }
  }, [activeCustomer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist customer changes
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("pf_quote_customer", customer);
  }, [customer]);

  // Persist project changes
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("pf_quote_project", project);
  }, [project]);

  // Seed quote date once per open; reset to null when closed so a fresh date
  // is used the next time the quote panel is opened.
  const quoteDateRef = useRef<Date | null>(null);
  if (quoteOpen && quoteDateRef.current === null) {
    quoteDateRef.current = new Date();
  }
  if (!quoteOpen) {
    quoteDateRef.current = null;
  }
  const quoteDate = quoteDateRef.current ?? new Date();
  const quoteNum = quoteNumber(quoteDate);
  const validityDate = quoteValidityDate(quoteDate);

  const handlePrint = () => {
    window.print();
  };

  const formatSavedAt = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      {/* Overlay — hidden during print */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 print:hidden",
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel
          Screen: fixed slide-in panel from the right
          Print:  static full-width surface — becomes the printable document
      */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[26rem] flex-col bg-white shadow-2xl transition-transform duration-300 sm:w-96",
          "print:static print:translate-x-0 print:w-full print:h-auto print:overflow-visible print:shadow-none print:flex print:flex-col",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping basket"
      >
        {/* Header — hidden during print */}
        <div className="flex shrink-0 items-center justify-between bg-[#1D252D] px-5 py-4 print:hidden">
          <span className="font-semibold text-white">
            Basket ({cartCount} {cartCount === 1 ? "item" : "items"})
          </span>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="text-[#B7C9D3] transition-colors hover:text-white"
            aria-label="Close basket"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable drawer content ────────────────────────────────────────
            The single vertical scroll region of the drawer. Everything between
            the header and the end of the panel scrolls as one column, so the
            deep-link scrollIntoView effect (basket / quotes / orders refs) can
            actually reveal sections that sit below the fold. Print: overflow
            is released so the quote sheet / submittal print in full.
        ── */}
        <div className="flex-1 overflow-y-auto print:overflow-visible">

        {/* Revising banner — Save Quote will create the next version */}
        {revisingQuote && (
          <div className="flex items-center gap-2 border-b border-[#004986]/30 bg-[#004986]/10 px-4 py-2 print:hidden">
            <span aria-hidden="true">🆕</span>
            <p className="min-w-0 flex-1 text-xs text-[#1D252D]">
              Revising <span className="font-semibold">{revisingQuote.number}</span> — Save Quote
              creates <span className="font-semibold">v{(revisingQuote.revision ?? 1) + 1}</span> and
              supersedes the original.
            </p>
            <button
              type="button"
              onClick={cancelRevise}
              className="shrink-0 text-xs text-[#4F758B] underline underline-offset-2 hover:text-[#1D252D]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Items list — hidden during print */}
        <div ref={basketSectionRef} className="print:hidden">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <span className="text-5xl" role="img" aria-label="Empty cart">
                🛒
              </span>
              <p className="font-semibold text-[#1D252D]">Your basket is empty</p>
              <p className="text-sm text-[#4F758B]">
                Add products from the finder to build your quote or order.
              </p>
            </div>
          ) : (
            <>
            {/* Contract pricing note — once per drawer, not per line */}
            {hasContractCustomer && (
              <p className="px-4 pt-3 pb-1 text-[10px] text-[#4F758B] italic">
                contract pricing — simulated
              </p>
            )}
            <ul className="divide-y divide-[#B7C9D3]">
              {items.map(({ product, qty }) => {
                const pricing = getPricingProvider().getPricing(product, { customer: activeCustomer, qty });
                const override = priceOverrides[product.id];
                const isOverridden = override !== undefined;
                const effectiveUnitPrice = override ?? pricing.effectiveUnitPrice;
                const lineTotal = effectiveUnitPrice * qty;
                // Contract / volume chips describe provider pricing — hide them
                // when a manual override replaces that price entirely.
                const hasContract = pricing.contractPrice !== null && !isOverridden;
                // Find the qualifying tier break (minQty > 1 means a vol-price discount applies)
                const tiers = priceTiers(product);
                const activeTier = [...tiers].reverse().find((t) => qty >= t.minQty);
                const hasVolBreak = activeTier !== undefined && activeTier.minQty > 1 && !isOverridden;
                const bounds = overrideBounds(product);
                const isEditingPrice = editingPriceId === product.id;
                return (
                  <li key={product.id} className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span
                        className="mt-0.5 text-2xl"
                        role="img"
                        aria-label={product.name}
                      >
                        {product.imageIcon}
                      </span>

                      {/* Name + SKU */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1D252D]">
                          {product.name}
                        </p>
                        <p className="text-xs text-[#4F758B]">SKU: {product.sku}</p>

                        {/* Unit price × qty */}
                        <div className="mt-1">
                          {hasContract ? (
                            <>
                              <p className="text-xs text-[#4F758B]">
                                <span className="font-semibold text-[#00AA13]">
                                  ${effectiveUnitPrice.toFixed(2)}
                                </span>
                                {" × "}{qty} ={" "}
                                <span className="font-semibold text-[#1D252D]">
                                  ${lineTotal.toFixed(2)}
                                </span>
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-[#4F758B] line-through">
                                  List ${pricing.listPrice.toFixed(2)}
                                </span>
                                {pricing.savingsPct > 0 && (
                                  <span className="text-[10px] font-semibold text-[#00AA13]">
                                    save {pricing.savingsPct}%
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-[#4F758B]">
                              ${effectiveUnitPrice.toFixed(2)} × {qty} ={" "}
                              <span className="font-semibold text-[#1D252D]">
                                ${lineTotal.toFixed(2)}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Vol. price note */}
                        {!hasContract && hasVolBreak && activeTier && (
                          <p className="mt-0.5 text-[10px] font-semibold text-[#00AA13]">
                            vol. price ({activeTier.minQty}+)
                          </p>
                        )}

                        {/* Manual price override (internal, margin-guarded) */}
                        {isEditingPrice ? (
                          <div className="mt-1 rounded border border-[#4F758B]/40 bg-[#F8FAFB] p-1.5">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-[#4F758B]">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min={bounds.min}
                                max={bounds.max}
                                value={priceDraft}
                                onChange={(e) => setPriceDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setPriceOverride(product.id, parseFloat(priceDraft));
                                    setEditingPriceId(null);
                                  }
                                  if (e.key === "Escape") setEditingPriceId(null);
                                }}
                                className="w-20 rounded border border-[#B7C9D3] px-1.5 py-0.5 text-xs text-[#1D252D] focus:border-[#4F758B] focus:outline-none"
                                aria-label={`Override unit price for ${product.name}`}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPriceOverride(product.id, parseFloat(priceDraft));
                                  setEditingPriceId(null);
                                }}
                                className="rounded bg-[#1D252D] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#2d3a47]"
                              >
                                Apply
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPriceId(null)}
                                aria-label="Cancel price override"
                                className="text-[#B7C9D3] hover:text-[#1D252D]"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="mt-1 text-[9px] text-[#4F758B]">
                              Allowed: ${bounds.min.toFixed(2)}–${bounds.max.toFixed(2)} (min 5% margin)
                            </p>
                          </div>
                        ) : (
                          <p className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPriceId(product.id);
                                setPriceDraft(effectiveUnitPrice.toFixed(2));
                              }}
                              className="text-[#4F758B] underline underline-offset-2 hover:text-[#1D252D]"
                              aria-label={`Adjust unit price for ${product.name}`}
                            >
                              ✎ price
                            </button>
                            {isOverridden && (
                              <>
                                <span className="rounded bg-[#004986] px-1 text-[8px] font-semibold uppercase tracking-wide text-white">
                                  custom
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPriceOverride(product.id, null)}
                                  className="text-[#4F758B] underline underline-offset-2 hover:text-[#1D252D]"
                                  aria-label={`Reset unit price for ${product.name}`}
                                >
                                  reset
                                </button>
                              </>
                            )}
                          </p>
                        )}

                        {/* Internal margin (per line) — never shown to customers */}
                        {(() => {
                          const pct = marginPct(effectiveUnitPrice, estimatedUnitCost(product));
                          return (
                            <p className="mt-0.5 flex items-center gap-1 text-[10px]">
                              <span className="text-[#4F758B]">margin</span>
                              <span className="font-semibold" style={{ color: MARGIN_TIER_COLOR[marginTier(pct)] }}>
                                {(pct * 100).toFixed(0)}%
                              </span>
                              <span className="rounded bg-[#B7C9D3]/40 px-1 text-[8px] font-semibold uppercase tracking-wide text-[#4F758B]">
                                internal
                              </span>
                            </p>
                          );
                        })()}

                        {/* Quantity-aware stock warning */}
                        {(() => {
                          const w = stockWarning(product, qty, user?.branchId);
                          if (!w) return null;
                          return (
                            <p className="mt-1 rounded border border-[#EAAA00]/50 bg-[#EAAA00]/10 px-1.5 py-1 text-[10px] text-[#1D252D]">
                              ⚠ Ordering {w.ordered} · {w.available} in stock ·{" "}
                              <span className="font-semibold">{w.shortfall} on backorder</span> ~{w.backorderEtaLabel}
                            </p>
                          );
                        })()}

                        {/* Qty stepper */}
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateCartQty(product.id, qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#B7C9D3] text-sm font-semibold text-[#1D252D] hover:border-[#4F758B]"
                            aria-label={`Decrease quantity of ${product.name}`}
                          >
                            −
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-semibold text-[#1D252D]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(product.id, qty + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#B7C9D3] text-sm font-semibold text-[#1D252D] hover:border-[#4F758B]"
                            aria-label={`Increase quantity of ${product.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="shrink-0 text-[#B7C9D3] transition-colors hover:text-red-600"
                        aria-label={`Remove ${product.name} from basket`}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            </>
          )}
        </div>

        {/* ── Complete this job — basket cross-sell ─────────────────────────── */}
        {completions.length > 0 && (
          <div className="shrink-0 border-t border-[#B7C9D3] bg-[#00573F]/5 px-5 py-4 print:hidden">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#00573F]">
                Complete this job
              </p>
              <span className="text-[10px] italic text-[#4F758B]">commonly added with your items</span>
            </div>
            <ul className="space-y-1.5">
              {completions.map(({ product, reason }) => (
                <li
                  key={product.id}
                  className="flex items-center gap-2 rounded border border-[#00573F]/20 bg-white px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1D252D]">{product.name}</p>
                    <p className="truncate text-[10px] text-[#4F758B]">
                      {product.subcategory} · ${product.unitPrice.toFixed(2)}/{product.uom} · {reason}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="shrink-0 rounded bg-[#00AA13] px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#009911]"
                    aria-label={`Add ${product.name} to basket`}
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Saved Baskets section — hidden during print ───────────────────── */}
        <div className="shrink-0 border-t border-[#B7C9D3] bg-[#F8FAFB] px-5 py-4 print:hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
            Saved Baskets
          </p>

          {/* Save current basket row */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={basketName}
              onChange={(e) => setBasketName(e.target.value)}
              placeholder="Basket name…"
              className="min-w-0 flex-1 rounded border border-[#B7C9D3] px-2 py-1.5 text-sm text-[#1D252D] placeholder-[#B7C9D3] focus:border-[#4F758B] focus:outline-none"
              aria-label="Saved basket name"
            />
            <button
              type="button"
              disabled={items.length === 0 || basketName.trim() === ""}
              onClick={() => {
                const trimmed = basketName.trim();
                if (!trimmed || items.length === 0) return;
                saveCurrentBasket(trimmed, undefined, Date.now());
                setBasketName("");
              }}
              className="rounded bg-[#1D252D] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2d3a47] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </div>

          {/* Saved basket list */}
          {savedBaskets.length === 0 ? (
            <p className="text-xs text-[#B7C9D3]">No saved baskets yet.</p>
          ) : (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              {savedBaskets.map((basket: SavedBasket) => (
                <li
                  key={basket.id}
                  className="flex items-center gap-2 rounded border border-[#B7C9D3] bg-white px-3 py-2"
                >
                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1D252D]">
                      {basket.name}
                    </p>
                    <p className="text-[10px] text-[#4F758B]">
                      {basket.lines.length} {basket.lines.length === 1 ? "item" : "items"} ·{" "}
                      {formatSavedAt(basket.savedAt)}
                    </p>
                  </div>

                  {/* Load button */}
                  <button
                    type="button"
                    onClick={() => loadBasket(basket.id)}
                    className="shrink-0 rounded bg-[#00AA13] px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#009911]"
                    aria-label={`Load basket ${basket.name}`}
                  >
                    Load
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => deleteBasket(basket.id)}
                    className="shrink-0 text-[#B7C9D3] transition-colors hover:text-red-600"
                    aria-label={`Delete basket ${basket.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Job Templates section — hidden during print ───────────────────── */}
        <div className="shrink-0 border-t border-[#B7C9D3] bg-[#F8FAFB] px-5 py-4 print:hidden">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
              Job Templates
            </p>
            <span className="text-[10px] italic text-[#4F758B]">reusable kits — add to basket</span>
          </div>

          {/* Save current basket as a template */}
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name (e.g. Office buildout)…"
              className="min-w-0 flex-1 rounded border border-[#B7C9D3] px-2 py-1.5 text-sm text-[#1D252D] placeholder-[#B7C9D3] focus:border-[#4F758B] focus:outline-none"
              aria-label="Job template name"
            />
            <button
              type="button"
              disabled={items.length === 0 || templateName.trim() === ""}
              onClick={() => {
                const trimmed = templateName.trim();
                if (!trimmed || items.length === 0) return;
                saveTemplate(trimmed, Date.now());
                setTemplateName("");
              }}
              className="rounded bg-[#1D252D] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2d3a47] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </div>

          {jobTemplates.length === 0 ? (
            <p className="text-xs text-[#B7C9D3]">No templates yet. Build a basket, then save it as a reusable kit.</p>
          ) : (
            <ul className="max-h-48 space-y-1.5 overflow-y-auto">
              {jobTemplates.map((tmpl) => (
                <li key={tmpl.id} className="flex items-center gap-2 rounded border border-[#B7C9D3] bg-white px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1D252D]">{tmpl.name}</p>
                    <p className="text-[10px] text-[#4F758B]">
                      {tmpl.lines.length} {tmpl.lines.length === 1 ? "item" : "items"} · {formatSavedAt(tmpl.savedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyTemplate(tmpl.id)}
                    className="shrink-0 rounded bg-[#00AA13] px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#009911]"
                    aria-label={`Add template ${tmpl.name} to basket`}
                  >
                    Add to Basket
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTemplate(tmpl.id)}
                    className="shrink-0 text-[#B7C9D3] transition-colors hover:text-red-600"
                    aria-label={`Delete template ${tmpl.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Saved Quotes section — hidden during print ────────────────────── */}
        <div ref={quotesSectionRef} className="shrink-0 border-t border-[#B7C9D3] bg-[#F8FAFB] px-5 py-4 print:hidden">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
              Saved Quotes
            </p>
            <span className="text-[10px] italic text-[#4F758B] truncate">
              {activeCustomer ? activeCustomer.name : "All"}
            </span>
          </div>

          {/* Deep-link status filter chip */}
          {cartQuoteStatusFilter !== null && (
            <button
              type="button"
              onClick={clearCartFilters}
              aria-label={`Clear quote status filter ${QUOTE_STATUS_LABEL[cartQuoteStatusFilter]}`}
              className="mb-2 inline-flex items-center gap-1 rounded-full border border-[#00AA13]/40 bg-[#00AA13]/10 px-2.5 py-0.5 text-xs font-medium text-[#00573F] hover:bg-[#00AA13]/20"
            >
              Status: {QUOTE_STATUS_LABEL[cartQuoteStatusFilter]}
              <span aria-hidden="true" className="text-[#4F758B]">✕</span>
            </button>
          )}

          {cartQuoteStatusFilter !== null && visibleQuotes.length === 0 ? (
            <p className="text-xs text-[#B7C9D3]">
              No {QUOTE_STATUS_LABEL[cartQuoteStatusFilter]} quotes.
            </p>
          ) : quotesForCustomer.length === 0 ? (
            <p className="text-xs text-[#B7C9D3]">No saved quotes yet. Use “Save Quote” below the quote sheet.</p>
          ) : (
            <ul className="max-h-56 space-y-1.5 overflow-y-auto">
              {visibleQuotes.map((q: SavedQuote) => {
                const c = QUOTE_STATUS_COLOR[q.status];
                return (
                  <li key={q.id} className="rounded border border-[#B7C9D3] bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-[#1D252D]">
                          {q.number}
                          {q.revision !== undefined && (
                            <span className="shrink-0 rounded bg-[#004986] px-1 text-[8px] font-bold uppercase tracking-wide text-white">
                              v{q.revision}
                            </span>
                          )}
                          {isSuperseded(q) && (
                            <span className="shrink-0 rounded bg-[#B7C9D3] px-1 text-[8px] font-bold uppercase tracking-wide text-[#1D252D]">
                              superseded
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[10px] text-[#4F758B]">
                          {q.customer || "—"}
                          {q.project ? ` · ${q.project}` : ""} ·{" "}
                          <span className="font-semibold">${q.total.toFixed(2)}</span>
                          {q.marginPct !== undefined && (
                            <> · margin <span className="font-semibold">{(q.marginPct * 100).toFixed(0)}%</span></>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{ backgroundColor: c.bg, color: c.text }}
                        >
                          {QUOTE_STATUS_LABEL[q.status]}
                        </span>
                        {q.approvalStatus && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
                            style={{ backgroundColor: APPROVAL_COLOR[q.approvalStatus].bg, color: APPROVAL_COLOR[q.approvalStatus].text }}
                          >
                            {APPROVAL_LABEL[q.approvalStatus]}
                          </span>
                        )}
                        {q.convertedOrderId && (
                          <span className="text-[8px] font-semibold uppercase tracking-wide text-[#00573F]">
                            ✓ ordered
                          </span>
                        )}
                        {q.counterOffer && q.status !== "won" && q.status !== "lost" && (
                          <span className="rounded bg-[#EAAA00] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#1D252D]">
                            ↩ countered
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer counter-offer note */}
                    {q.counterOffer && q.status !== "won" && q.status !== "lost" && (
                      <p className="mt-1.5 rounded border border-[#EAAA00]/50 bg-[#EAAA00]/10 px-2 py-1 text-[10px] text-[#1D252D]">
                        <span className="font-semibold">Customer asks:</span> “{q.counterOffer.note}”
                        <span className="ml-1 text-[#4F758B]">— Load the quote, adjust, and resend.</span>
                      </p>
                    )}

                    {/* Manager approval controls for below-margin quotes */}
                    {q.approvalStatus === "pending" && isManager && (
                      <div className="mt-1.5 flex items-center gap-2 rounded bg-[#EAAA00]/10 px-2 py-1">
                        <span className="text-[10px] text-[#1D252D]">Below-margin — sign off?</span>
                        <button
                          type="button"
                          onClick={() => setQuoteApproval(q.id, "approved")}
                          className="ml-auto rounded bg-[#00AA13] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#009911]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuoteApproval(q.id, "rejected")}
                          className="rounded border border-[#DB6B30] px-2 py-0.5 text-[10px] font-semibold text-[#DB6B30] hover:bg-[#DB6B30]/10"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      <label className="sr-only" htmlFor={`status-${q.id}`}>Quote status</label>
                      <select
                        id={`status-${q.id}`}
                        value={q.status}
                        onChange={(e) => setQuoteStatus(q.id, e.target.value as QuoteStatus)}
                        className="rounded border border-[#B7C9D3] bg-white px-1.5 py-0.5 text-[10px] text-[#1D252D] focus:outline-none"
                      >
                        {QUOTE_STATUSES.map((s) => (
                          <option key={s} value={s}>{QUOTE_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => loadQuoteToCart(q.id)}
                        className="rounded border border-[#4F758B] px-2 py-0.5 text-[10px] font-medium text-[#4F758B] transition-colors hover:border-[#1D252D] hover:text-[#1D252D]"
                        aria-label={`Load quote ${q.number} into basket`}
                      >
                        Load
                      </button>
                      {!q.convertedOrderId && (
                        <button
                          type="button"
                          disabled={q.approvalStatus === "pending"}
                          onClick={() => convertQuoteToOrder(q.id, Date.now())}
                          className="rounded bg-[#00573F] px-2 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#00452f] disabled:cursor-not-allowed disabled:opacity-40"
                          title={q.approvalStatus === "pending" ? "Needs manager approval first" : undefined}
                          aria-label={`Convert quote ${q.number} to an order`}
                        >
                          Convert to Order
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCustomerLink(q)}
                        className="rounded bg-[#004986] px-2 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#003a6d]"
                        title="Copy a link your customer can open to review & accept this quote"
                        aria-label={`Copy customer acceptance link for quote ${q.number}`}
                      >
                        {copiedQuoteId === q.id ? "Link copied ✓" : "Customer Link"}
                      </button>
                      {!q.convertedOrderId && !isSuperseded(q) && q.status !== "won" && (
                        <button
                          type="button"
                          onClick={() => startReviseQuote(q.id)}
                          className="rounded border border-[#004986] px-2 py-0.5 text-[10px] font-semibold text-[#004986] transition-colors hover:bg-[#004986]/10"
                          title="Load this quote into the basket — Save Quote creates the next version"
                          aria-label={`Revise quote ${q.number}`}
                        >
                          Revise
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteQuote(q.id)}
                        className="ml-auto shrink-0 text-[#B7C9D3] transition-colors hover:text-red-600"
                        aria-label={`Delete quote ${q.number}`}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Audit trail */}
                    {q.events && q.events.length > 0 && (
                      <details className="group mt-1.5">
                        <summary className="cursor-pointer list-none text-[10px] text-[#4F758B] hover:text-[#1D252D]">
                          History ({q.events.length})
                          <span className="ml-1 inline-block transition-transform group-open:rotate-180">▾</span>
                        </summary>
                        <ul className="mt-1 space-y-0.5 border-l-2 border-[#B7C9D3]/60 pl-2">
                          {[...q.events].reverse().map((e, i) => (
                            <li key={i} className="text-[10px] text-[#4F758B]">
                              <span aria-hidden="true">{EVENT_ICON[e.kind]}</span>{" "}
                              <span className="font-semibold text-[#1D252D]">{EVENT_LABEL[e.kind]}</span>
                              {" — "}{e.detail}
                              {e.actor ? <span> · {e.actor}</span> : null}
                              <span className="text-[#B7C9D3]">
                                {" · "}
                                {new Date(e.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Order History section — hidden during print ───────────────────── */}
        <div ref={ordersSectionRef} className="shrink-0 border-t border-[#B7C9D3] bg-[#F8FAFB] px-5 py-4 print:hidden">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
              Order History
            </p>
            <span className="text-[10px] text-[#4F758B] italic truncate">
              {activeCustomer ? activeCustomer.name : "Walk-in"}
            </span>
          </div>

          {/* Deep-link month filter chip */}
          {orderMonthLabel !== null && (
            <button
              type="button"
              onClick={clearCartFilters}
              aria-label={`Clear order month filter ${orderMonthLabel}`}
              className="mb-2 inline-flex items-center gap-1 rounded-full border border-[#00AA13]/40 bg-[#00AA13]/10 px-2.5 py-0.5 text-xs font-medium text-[#00573F] hover:bg-[#00AA13]/20"
            >
              Month: {orderMonthLabel}
              <span aria-hidden="true" className="text-[#4F758B]">✕</span>
            </button>
          )}

          {orderMonthLabel !== null && monthFilteredOrders.length === 0 ? (
            <p className="text-xs text-[#B7C9D3]">No orders in {orderMonthLabel}.</p>
          ) : visibleOrders.length === 0 ? (
            <p className="text-xs text-[#B7C9D3]">No orders yet.</p>
          ) : (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              {monthFilteredOrders.map((order: Order) => {
                const orderDate = new Date(order.placedAt);
                const dateLabel = orderDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const itemCount = order.lines.reduce((s, l) => s + l.qty, 0);
                return (
                  <li
                    key={order.id}
                    className="flex items-center gap-2 rounded border border-[#B7C9D3] bg-white px-3 py-2"
                  >
                    {/* Date + meta + expandable line detail */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1D252D]">
                        {dateLabel}
                      </p>
                      <details className="group">
                        <summary className="cursor-pointer list-none text-[10px] text-[#4F758B] hover:text-[#1D252D]">
                          {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                          <span className="font-semibold">${order.total.toFixed(2)}</span>
                          <span className="ml-1 inline-block transition-transform group-open:rotate-180">▾</span>
                        </summary>
                        <ul className="mt-1 space-y-0.5">
                          {order.lines.map((line) => (
                            <li key={line.product.id} className="truncate text-[10px] text-[#4F758B]">
                              <span className="font-semibold text-[#1D252D]">{line.qty}×</span>{" "}
                              {line.product.name}{" "}
                              <span className="text-[#B7C9D3]">({line.product.sku})</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>

                    {/* Reorder button */}
                    <button
                      type="button"
                      onClick={() => reorder(order.id)}
                      className="shrink-0 rounded bg-[#00AA13] px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#009911]"
                      aria-label={`Reorder items from ${dateLabel}`}
                    >
                      Reorder
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => deleteOrder(order.id)}
                      className="shrink-0 text-[#B7C9D3] transition-colors hover:text-red-600"
                      aria-label={`Remove order from ${dateLabel}`}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer — hidden during print */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-[#B7C9D3] bg-white px-5 py-5 space-y-3 print:hidden">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4F758B]">Subtotal</span>
              <span className="text-xl font-bold text-[#1D252D]">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {/* Internal basket margin — never shown to customers */}
            {margin && (
              <div className="flex items-center justify-between rounded border border-[#B7C9D3] bg-[#F8FAFB] px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-[#4F758B]">
                  Margin
                  <span className="rounded bg-[#B7C9D3]/50 px-1 text-[8px] font-semibold uppercase tracking-wide text-[#4F758B]">
                    internal
                  </span>
                </span>
                <span className="font-semibold" style={{ color: MARGIN_TIER_COLOR[marginTier(margin.marginPct)] }}>
                  ${margin.marginDollars.toFixed(2)}{" "}
                  <span className="font-normal text-[#4F758B]">({(margin.marginPct * 100).toFixed(0)}%)</span>
                </span>
              </div>
            )}

            {/* Win/loss guidance for the current margin band — internal coaching */}
            {margin && (() => {
              const guidance = marginGuidance(quotes, margin.marginPct);
              if (!guidance) return null;
              return (
                <p className="rounded border border-[#004986]/30 bg-[#004986]/5 px-3 py-1.5 text-[10px] text-[#1D252D]">
                  <span aria-hidden="true">📊</span> {guidance.message}
                  <span className="ml-1 italic text-[#4F758B]">— simulated history</span>
                </p>
              );
            })()}

            {/* Estimated delivery — whole order ships complete by */}
            {orderEta && (
              <div className="flex items-center justify-between rounded border border-[#64CCC9]/50 bg-[#64CCC9]/10 px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-[#1D252D]">
                  <span aria-hidden="true">🚚</span>
                  Ships complete by
                </span>
                <span className="font-semibold text-[#1D252D]">
                  {formatDisplayDate(orderEta.date)}{" "}
                  <span className="font-normal text-[#4F758B]">({etaLabel(orderEta.days)})</span>
                </span>
              </div>
            )}

            {/* Generate Quote CTA */}
            <Button
              className="w-full bg-[#1D252D] text-white hover:bg-[#2d3a47]"
              onClick={() => { setQuoteOpen((v) => !v); setSubmittalOpen(false); }}
              disabled={items.length === 0}
            >
              {quoteOpen ? "Hide Quote" : "Generate Quote (PDF)"}
            </Button>

            {/* Submittal package */}
            <Button
              variant="outline"
              className="w-full border-[#1D252D] text-[#1D252D] hover:bg-[#F8FAFB]"
              onClick={() => { setSubmittalOpen(!submittalOpen); setQuoteOpen(false); }}
              disabled={items.length === 0}
            >
              {submittalOpen ? "Hide Submittal" : "Submittal Package (PDF)"}
            </Button>

            {/* Share basket via URL */}
            <Button
              variant="outline"
              className="w-full border-[#4F758B] text-[#4F758B] hover:bg-[#EEF4F7]"
              onClick={handleShare}
              disabled={items.length === 0}
            >
              {shareCopied ? "Link copied!" : "Share Basket"}
            </Button>

            <Button
              className="w-full bg-[#00AA13] text-white hover:bg-[#009911]"
              onClick={() => {
                saveQuote({
                  number: quoteNumber(new Date()),
                  customer: customer || (activeCustomer?.name ?? ""),
                  project,
                  note: quoteNote,
                  termsIds,
                });
                setQuoteSaved(true);
                setTimeout(() => setQuoteSaved(false), 2500);
              }}
            >
              {quoteSaved
                ? "Quote saved ✓"
                : revisingQuote
                  ? `Save Quote (v${(revisingQuote.revision ?? 1) + 1})`
                  : "Save Quote"}
            </Button>

            {/* Email quote (simulated) */}
            <Button
              variant="outline"
              className="w-full border-[#004986] text-[#004986] hover:bg-[#EEF4F7]"
              onClick={() => {
                setEmailOpen((v) => !v);
                if (!emailTo) setEmailTo(guessRecipient(customer || activeCustomer?.name || ""));
              }}
              disabled={items.length === 0}
            >
              {emailOpen ? "Hide Email" : "Email Quote"}
            </Button>

            {emailOpen && (
              <div className="rounded-lg border border-[#004986]/30 bg-[#004986]/5 p-3 space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#4F758B]">
                  Send quote to
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => { setEmailTo(e.target.value); setEmailSent(false); }}
                  placeholder="customer@company.com"
                  className="w-full rounded border border-[#B7C9D3] px-2 py-1.5 text-sm text-[#1D252D] placeholder-[#B7C9D3] focus:border-[#4F758B] focus:outline-none"
                  aria-label="Recipient email"
                />
                <button
                  type="button"
                  disabled={!isValidEmail(emailTo)}
                  onClick={() => {
                    // Simulated send: save the quote as "sent" and confirm.
                    saveQuote({
                      number: quoteNumber(new Date()),
                      customer: customer || (activeCustomer?.name ?? ""),
                      project,
                      status: "sent",
                      note: quoteNote,
                      termsIds,
                    });
                    setEmailSent(true);
                  }}
                  className="w-full rounded bg-[#004986] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#003a6d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {emailSent ? `Sent to ${emailTo} ✓` : "Send Quote"}
                </button>
                <p className="text-[9px] italic text-[#4F758B]">
                  Simulated — no email is actually sent. The quote is saved with status “Sent.”
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full border-[#1D252D] text-[#1D252D] hover:bg-[#F8FAFB]"
              onClick={() => {
                placeOrder(Date.now());
              }}
            >
              Add to Order
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#4F758B] text-[#4F758B] hover:bg-[#EEF4F7]"
              onClick={() => {
                const provider = getPricingProvider();
                const lines = items.map(({ product, qty }) => ({
                  product,
                  qty,
                  effectiveUnitPrice:
                    priceOverrides[product.id] ??
                    provider.getPricing(product, { customer: activeCustomer, qty }).effectiveUnitPrice,
                }));
                downloadCsv("basket.csv", basketCsv(lines));
              }}
            >
              Export CSV
            </Button>

            {/* Clear cart */}
            <button
              type="button"
              onClick={clearCart}
              className="w-full text-center text-xs text-[#DB6B30] underline underline-offset-2 hover:text-[#c05a22]"
            >
              Clear basket
            </button>
          </div>
        )}

        {/* ── Submittal Package ────────────────────────────────────────────────
            Same print isolation as the quote sheet: panel is the print surface,
            this section fills it, everything else is print:hidden.
        ── */}
        {submittalOpen && items.length > 0 && (
          <section
            id="submittal-package"
            className="border-t border-[#B7C9D3] bg-white px-6 py-6 overflow-y-auto print:border-0 print:px-8 print:py-8 print:overflow-visible"
          >
            <div className="mb-4 flex items-center justify-between gap-2 print:hidden">
              <p className="text-sm font-semibold text-[#1D252D]">Submittal Package preview</p>
              <Button size="sm" onClick={handlePrint} className="bg-[#1D252D] text-white hover:bg-[#2d3a47]">
                Print / Save PDF
              </Button>
            </div>
            <SubmittalPackage
              items={items.map(({ product, qty }) => ({ product, qty }))}
              customer={customer || (activeCustomer?.name ?? "")}
              project={project}
              packageNumber={quoteNum.replace(/^Q-/, "SUB-")}
              dateLabel={formatDisplayDate(quoteDate)}
              preparedBy={user ? `${user.name} · ${user.branch}` : undefined}
            />
          </section>
        )}

        {/* ── Quote Sheet ──────────────────────────────────────────────────────
            Screen: shown only when quoteOpen; sits below the footer.
            Print:  the drawer panel (print:static above) becomes the print
                    surface. The quote sheet fills it; everything else is
                    print:hidden.
        ── */}
        {quoteOpen && (
          <section
            id="quote-sheet"
            className="border-t border-[#B7C9D3] bg-white px-6 py-6 overflow-y-auto print:border-0 print:px-8 print:py-8 print:overflow-visible"
          >
            {/* ── Quote header ─────────────────────────────── */}
            <div className="flex items-start justify-between mb-6 print:mb-8">
              {/* Meridian brand mark */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center rounded bg-[#00AA13] px-2 py-1 text-xs font-bold tracking-widest text-white">
                    MERIDIAN
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#4F758B]">
                    Supply Co.
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[#1D252D] tracking-wide mt-1">
                  QUOTE
                </h1>
              </div>

              {/* Quote meta */}
              <div className="text-right text-sm">
                <p className="font-semibold text-[#1D252D]">{quoteNum}</p>
                <p className="text-[#4F758B]">Date: {formatDisplayDate(quoteDate)}</p>
                <p className="text-[#4F758B]">
                  Valid until: {formatDisplayDate(validityDate)}
                </p>
                <p className="text-xs text-[#4F758B] mt-0.5">Valid for 30 days</p>
              </div>
            </div>

            {/* ── Customer + Project inputs ────────────────── */}
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 print:grid-cols-2 print:mb-8">
              {/* Customer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#4F758B] mb-1">
                  Customer
                </label>
                {/* Screen: editable input */}
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Customer name"
                  className="w-full border border-[#B7C9D3] rounded px-2 py-1.5 text-sm text-[#1D252D] focus:outline-none focus:border-[#4F758B] print:hidden"
                />
                {/* Print: value as plain text */}
                <span className="hidden print:block text-sm text-[#1D252D] border-b border-[#B7C9D3] pb-0.5 min-h-[1.5rem]">
                  {customer || "—"}
                </span>
              </div>

              {/* Project */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#4F758B] mb-1">
                  Project / PO #
                </label>
                {/* Screen: editable input */}
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Project or PO number"
                  className="w-full border border-[#B7C9D3] rounded px-2 py-1.5 text-sm text-[#1D252D] focus:outline-none focus:border-[#4F758B] print:hidden"
                />
                {/* Print: value as plain text */}
                <span className="hidden print:block text-sm text-[#1D252D] border-b border-[#B7C9D3] pb-0.5 min-h-[1.5rem]">
                  {project || "—"}
                </span>
              </div>
            </div>

            {/* ── Prepared by ──────────────────────────────── */}
            {user && (
              <p className="text-xs text-[#4F758B] mb-6 print:mb-8">
                Prepared by:{" "}
                <span className="font-semibold text-[#1D252D]">{user.name}</span>
                {" · "}
                <span>{user.branch}</span>
              </p>
            )}

            {/* ── Line-item table ──────────────────────────── */}
            <div className="overflow-x-auto mb-4 print:mb-6">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1D252D]">
                    <th className="text-left px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      SKU
                    </th>
                    <th className="text-left px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      Product
                    </th>
                    <th className="text-right px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      Qty
                    </th>
                    <th className="text-right px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      Unit Price
                    </th>
                    <th className="text-right px-3 py-2 text-white font-semibold border border-[#4F758B]">
                      Extended
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ product, qty }) => {
                    const pricing = getPricingProvider().getPricing(product, { customer: activeCustomer, qty });
                    const unit = priceOverrides[product.id] ?? pricing.effectiveUnitPrice;
                    const ext = unit * qty;
                    return (
                      <tr key={product.id} className="border-b border-[#B7C9D3]/60">
                        <td className="px-3 py-2 font-mono text-[#4F758B] border border-[#B7C9D3]/60">
                          {product.sku}
                        </td>
                        <td className="px-3 py-2 text-[#1D252D] border border-[#B7C9D3]/60">
                          {product.name}
                        </td>
                        <td className="px-3 py-2 text-right text-[#1D252D] border border-[#B7C9D3]/60">
                          {qty}
                        </td>
                        <td className="px-3 py-2 text-right text-[#1D252D] border border-[#B7C9D3]/60">
                          ${unit.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-[#1D252D] border border-[#B7C9D3]/60">
                          ${ext.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8FAFB]">
                    <td
                      colSpan={4}
                      className="px-3 py-2 text-right font-semibold text-[#1D252D] border border-[#B7C9D3]/60"
                    >
                      Subtotal / Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-[#1D252D] border border-[#B7C9D3]/60">
                      ${cartTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── Note to customer ─────────────────────────── */}
            <div className="mb-4 print:mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#4F758B] mb-1">
                Note
              </label>
              <textarea
                value={quoteNote}
                onChange={(e) => setQuoteNote(e.target.value)}
                rows={2}
                placeholder="Optional note to the customer (site access, scheduling, alternates offered…)"
                className="w-full rounded border border-[#B7C9D3] px-2 py-1.5 text-sm text-[#1D252D] placeholder-[#B7C9D3] focus:border-[#4F758B] focus:outline-none print:hidden"
              />
              <p className="hidden text-sm text-[#1D252D] print:block">{quoteNote || "—"}</p>
            </div>

            {/* ── Terms & conditions blocks ─────────────────── */}
            <div className="mb-4 print:mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4F758B] mb-1">
                Terms &amp; Conditions
              </p>
              {/* Screen: checkboxes */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 print:hidden">
                {TERMS_BLOCKS.map((block) => (
                  <label key={block.id} className="flex items-center gap-1.5 text-xs text-[#1D252D]">
                    <input
                      type="checkbox"
                      checked={termsIds.includes(block.id)}
                      onChange={(e) =>
                        setTermsIds((prev) =>
                          e.target.checked ? [...prev, block.id] : prev.filter((id) => id !== block.id),
                        )
                      }
                      className="h-3.5 w-3.5 accent-[#00AA13]"
                    />
                    {block.label}
                  </label>
                ))}
              </div>
              {/* Both: selected texts (print shows only these) */}
              {termsIds.length > 0 && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                  {resolveTerms(termsIds).map((text, i) => (
                    <li key={i} className="text-[10px] text-[#4F758B]">{text}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Footer note ──────────────────────────────── */}
            <p className="text-[10px] text-[#4F758B] mb-6 print:mb-8">
              Pricing reflects volume tier discounts and the commodity index as of{" "}
              {formatDisplayDate(quoteDate)}. All prices in USD. This quote is valid for
              30 days from the date of issue.
            </p>

            {/* ── Print button (screen only) ───────────────── */}
            <Button
              className="w-full bg-[#00AA13] text-white hover:bg-[#009911] print:hidden"
              onClick={handlePrint}
            >
              Print / Save as PDF
            </Button>
          </section>
        )}
        </div>
        {/* ── /Scrollable drawer content ── */}
      </div>
    </>
  );
}
