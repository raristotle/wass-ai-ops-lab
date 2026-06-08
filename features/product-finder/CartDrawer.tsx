"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useProductFinder, selectCartCount, selectCartTotal, selectActiveCustomer } from "@/lib/product-finder-store";
import { priceTiers } from "@/lib/product-finder-pricing";
import type { SavedBasket, Order } from "@/lib/product-finder-store";
import { getPricingProvider } from "@/lib/integration/index";
import { quoteNumber, quoteValidityDate, formatDisplayDate } from "@/lib/product-finder-quote";
import { encodeCart } from "@/lib/product-finder-share";
import { basketCsv, downloadCsv } from "@/lib/product-finder-csv";
import { orderEtaDays, addDays, etaLabel } from "@/lib/product-finder-delivery";
import {
  QUOTE_STATUSES, QUOTE_STATUS_LABEL, QUOTE_STATUS_COLOR, type SavedQuote, type QuoteStatus,
} from "@/lib/product-finder-quotes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const cartOpen = useProductFinder((s) => s.cartOpen);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const cart = useProductFinder((s) => s.cart);
  const removeFromCart = useProductFinder((s) => s.removeFromCart);
  const updateCartQty = useProductFinder((s) => s.updateCartQty);
  const clearCart = useProductFinder((s) => s.clearCart);
  const cartCount = useProductFinder(selectCartCount);
  const cartTotal = useProductFinder(selectCartTotal);
  const user = useProductFinder((s) => s.user);

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
  const loadQuoteToCart = useProductFinder((s) => s.loadQuoteToCart);
  const deleteQuote = useProductFinder((s) => s.deleteQuote);

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

  // Whole-order delivery ETA ("ships complete by")
  const orderEta = useMemo(() => {
    if (items.length === 0) return null;
    const days = orderEtaDays(items, user?.branchId);
    return { days, date: addDays(new Date(), days) };
  }, [items, user?.branchId]);

  // ── Quote state ────────────────────────────────────────────────────────────
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [project, setProject] = useState("");

  // ── Share / quote-save state ───────────────────────────────────────────────
  const [shareCopied, setShareCopied] = useState(false);
  const [quoteSaved, setQuoteSaved] = useState(false);

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
  }, []);

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
          "fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-white shadow-2xl transition-transform duration-300 sm:w-96",
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

        {/* Items list — hidden during print */}
        <div className="flex-1 overflow-y-auto print:hidden">
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
                const effectiveUnitPrice = pricing.effectiveUnitPrice;
                const lineTotal = effectiveUnitPrice * qty;
                const hasContract = pricing.contractPrice !== null;
                // Find the qualifying tier break (minQty > 1 means a vol-price discount applies)
                const tiers = priceTiers(product);
                const activeTier = [...tiers].reverse().find((t) => qty >= t.minQty);
                const hasVolBreak = activeTier !== undefined && activeTier.minQty > 1;
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
        <div className="shrink-0 border-t border-[#B7C9D3] bg-[#F8FAFB] px-5 py-4 print:hidden">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
              Saved Quotes
            </p>
            <span className="text-[10px] italic text-[#4F758B] truncate">
              {activeCustomer ? activeCustomer.name : "All"}
            </span>
          </div>

          {quotesForCustomer.length === 0 ? (
            <p className="text-xs text-[#B7C9D3]">No saved quotes yet. Use “Save Quote” below the quote sheet.</p>
          ) : (
            <ul className="max-h-56 space-y-1.5 overflow-y-auto">
              {quotesForCustomer.map((q: SavedQuote) => {
                const c = QUOTE_STATUS_COLOR[q.status];
                return (
                  <li key={q.id} className="rounded border border-[#B7C9D3] bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1D252D]">{q.number}</p>
                        <p className="truncate text-[10px] text-[#4F758B]">
                          {q.customer || "—"}
                          {q.project ? ` · ${q.project}` : ""} ·{" "}
                          <span className="font-semibold">${q.total.toFixed(2)}</span>
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        {QUOTE_STATUS_LABEL[q.status]}
                      </span>
                    </div>
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
                      <button
                        type="button"
                        onClick={() => deleteQuote(q.id)}
                        className="ml-auto shrink-0 text-[#B7C9D3] transition-colors hover:text-red-600"
                        aria-label={`Delete quote ${q.number}`}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Order History section — hidden during print ───────────────────── */}
        <div className="shrink-0 border-t border-[#B7C9D3] bg-[#F8FAFB] px-5 py-4 print:hidden">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
              Order History
            </p>
            <span className="text-[10px] text-[#4F758B] italic truncate">
              {activeCustomer ? activeCustomer.name : "Walk-in"}
            </span>
          </div>

          {visibleOrders.length === 0 ? (
            <p className="text-xs text-[#B7C9D3]">No orders yet.</p>
          ) : (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              {visibleOrders.map((order: Order) => {
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
              onClick={() => setQuoteOpen((v) => !v)}
              disabled={items.length === 0}
            >
              {quoteOpen ? "Hide Quote" : "Generate Quote (PDF)"}
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
                });
                setQuoteSaved(true);
                setTimeout(() => setQuoteSaved(false), 2500);
              }}
            >
              {quoteSaved ? "Quote saved ✓" : "Save Quote"}
            </Button>
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
                  effectiveUnitPrice: provider.getPricing(product, { customer: activeCustomer, qty }).effectiveUnitPrice,
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
                    const unit = pricing.effectiveUnitPrice;
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

            {/* ── Footer note ──────────────────────────────── */}
            <p className="text-[10px] text-[#4F758B] mb-6 print:mb-8">
              Pricing reflects volume tier discounts as of quote date. All prices in USD.
              This quote is valid for 30 days from the date of issue.
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
    </>
  );
}
