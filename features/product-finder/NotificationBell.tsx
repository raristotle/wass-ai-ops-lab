"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import {
  buildNotifications,
  unreadCount,
  type PfNotification,
} from "@/lib/product-finder-notifications";
import { apiGetProduct } from "@/lib/product-finder-api";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<PfNotification["kind"], string> = {
  approval: "🛡️",
  "stale-quote": "⏰",
  counter: "↩️",
  "restock-due": "📦",
  "restock-eta": "👁️",
  "customer-risk": "📉",
  "saved-search": "🔎",
};

export function NotificationBell() {
  const user = useProductFinder((s) => s.user);
  const quotes = useProductFinder((s) => s.quotes);
  const watches = useProductFinder((s) => s.watches);
  const orders = useProductFinder((s) => s.orders);
  const customers = useProductFinder((s) => s.customers);
  const savedSearches = useProductFinder((s) => s.savedSearches);
  const runSavedSearch = useProductFinder((s) => s.runSavedSearch);
  const notifReads = useProductFinder((s) => s.notifReads);
  const markNotificationsRead = useProductFinder((s) => s.markNotificationsRead);
  const openCartAt = useProductFinder((s) => s.openCartAt);
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);
  const setActiveCustomer = useProductFinder((s) => s.setActiveCustomer);

  const [open, setOpen] = useState(false);
  // `now` is set after mount so SSR/first client render stay byte-identical.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  // Refresh the clock whenever the panel opens so "days ago" stays honest.
  useEffect(() => {
    if (open) setNow(Date.now());
  }, [open]);

  const isManager = user?.role === "manager" || user?.role === "admin";

  const notifications = useMemo(
    () =>
      now === null
        ? []
        : buildNotifications(
            {
              quotes,
              watches,
              orders,
              customers,
              isManager,
              savedSearches: savedSearches.map((s) => ({
                id: s.id,
                name: s.name,
                createdAt: s.createdAt,
                alertsOn: s.alertsOn,
                newMatches: s.newMatches,
              })),
            },
            now
          ),
    [quotes, watches, orders, customers, isManager, savedSearches, now]
  );
  const unread = unreadCount(notifications, notifReads);

  const handleClick = async (n: PfNotification) => {
    markNotificationsRead([n.id], Date.now());
    setOpen(false);
    if (n.kind === "approval" || n.kind === "counter") {
      openCartAt("quotes");
    } else if (n.kind === "stale-quote") {
      openCartAt("quotes", { quoteStatus: "sent" });
    } else if (n.kind === "customer-risk" && n.customerId) {
      setActiveCustomer(n.customerId);
      openCartAt("orders");
    } else if (n.kind === "saved-search" && n.savedSearchId) {
      void runSavedSearch(n.savedSearchId);
    } else if (n.productId) {
      try {
        const detail = await apiGetProduct(n.productId);
        setDetailModalProduct(detail.product);
      } catch {
        /* product gone — nothing to open */
      }
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications — ${unread} unread`}
        aria-expanded={open}
        title="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#4F758B] text-sm text-[#B7C9D3] transition-colors hover:border-[#64CCC9] hover:text-[#64CCC9]"
        data-tour="notifications"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DB6B30] px-1 text-[9px] font-bold text-white"
            aria-hidden="true"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-away catcher */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />

          <div
            className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-xl border border-[#B7C9D3] bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
            role="region"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between bg-[#1D252D] px-4 py-2.5">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {notifications.length > 0 && unread > 0 && (
                <button
                  type="button"
                  onClick={() => markNotificationsRead(notifications.map((n) => n.id), Date.now())}
                  className="text-xs text-[#B7C9D3] underline underline-offset-2 hover:text-white"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-[#1D252D]">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-[#4F758B]">
                  Approval requests, quote follow-ups, and restock alerts show up here.
                </p>
              </div>
            ) : (
              <ul className="max-h-96 divide-y divide-[#B7C9D3]/50 overflow-y-auto">
                {notifications.map((n) => {
                  const isUnread = notifReads[n.id] === undefined;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleClick(n)}
                        className={cn(
                          "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#F8FAFB]",
                          isUnread && "bg-[#00AA13]/5"
                        )}
                      >
                        <span className="mt-0.5 text-base" aria-hidden="true">
                          {KIND_ICON[n.kind]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-sm text-[#1D252D]",
                              isUnread ? "font-bold" : "font-medium"
                            )}
                          >
                            {n.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#4F758B]">{n.detail}</span>
                        </span>
                        {isUnread && (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#00AA13]"
                            aria-label="Unread"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
