"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useProductFinder, selectCartCount } from "@/lib/product-finder-store";
import { customerHealth, HEALTH_COLOR, HEALTH_LABEL } from "@/lib/product-finder-customer-health";
import { FilterSidebar } from "@/features/product-finder/FilterSidebar";
import { CartDrawer } from "@/features/product-finder/CartDrawer";
import { SpecCompareModal } from "@/features/product-finder/SpecCompareModal";
import { ProductDetailModal } from "@/features/product-finder/ProductDetailModal";
import { BomImportModal } from "@/features/product-finder/BomImportModal";
import { BulkQuoteModal } from "@/features/product-finder/BulkQuoteModal";
import { BulkCrossModal } from "@/features/product-finder/BulkCrossModal";
import { AssistantPanel } from "@/features/product-finder/AssistantPanel";
import { JobWizardModal } from "@/features/product-finder/JobWizardModal";
import { HelpPanel } from "@/features/product-finder/HelpPanel";
import { RoleSwitcher } from "@/features/product-finder/RoleSwitcher";
import { BrandSwitcher } from "@/features/product-finder/BrandSwitcher";
import { NotificationBell } from "@/features/product-finder/NotificationBell";
import { TourOverlay } from "@/features/product-finder/TourOverlay";
import { CommandPalette } from "@/features/product-finder/CommandPalette";
import { getBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface ProductFinderShellProps {
  children: React.ReactNode;
}

export function ProductFinderShell({ children }: ProductFinderShellProps) {
  const user = useProductFinder((s) => s.user);
  const logout = useProductFinder((s) => s.logout);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const setHelpOpen = useProductFinder((s) => s.setHelpOpen);
  const setPaletteOpen = useProductFinder((s) => s.setPaletteOpen);
  const cartCount = useProductFinder(selectCartCount);
  const customers = useProductFinder((s) => s.customers);
  const activeCustomerId = useProductFinder((s) => s.activeCustomerId);
  const setActiveCustomer = useProductFinder((s) => s.setActiveCustomer);
  const orders = useProductFinder((s) => s.orders);
  const brand = getBrand(useProductFinder((s) => s.brandId));

  // Clock read after mount keeps SSR and the first client render identical.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const activeHealth = useMemo(() => {
    if (now === null || activeCustomerId === null) return null;
    const customer = customers.find((c) => c.id === activeCustomerId);
    return customer ? customerHealth(orders, customer, now) : null;
  }, [now, activeCustomerId, customers, orders]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8FAFB] print:block print:h-auto print:overflow-visible">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="z-30 flex shrink-0 items-center justify-between bg-[#1D252D] px-4 py-3 shadow-md sm:px-6 print:hidden">
        {/* Left: Logo + title */}
        <div className="flex items-center gap-3">
          {/* Brand logo box — white-label config (lib/brand) */}
          <div className="flex flex-col items-center">
            <span
              className="inline-flex items-center justify-center rounded px-2 py-1 text-xs font-bold tracking-widest text-white [font-family:var(--font-titillium,'Arial_Bold',sans-serif)] sm:text-sm"
              style={{ backgroundColor: brand.accent }}
            >
              {brand.logoMark}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#B7C9D3]">
              {brand.logoSub}
            </span>
          </div>

          {/* Vertical divider */}
          <div className="hidden h-8 w-px bg-[#4F758B] sm:block" aria-hidden="true" />

          {/* Title */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm font-semibold text-white sm:text-base [font-family:var(--font-titillium,'Arial_Bold',sans-serif)]">
              AI Product Recommender
            </span>
            <span className="inline-flex items-center rounded-full bg-[#00AA13] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              AI
            </span>
          </div>
        </div>

        {/* Right: role switcher + customer selector + user info + cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* White-label brand switcher */}
          <BrandSwitcher />

          {/* Demo role switcher */}
          <RoleSwitcher />

          {/* Customer selector */}
          <div className="hidden flex-col gap-0.5 sm:flex">
            <label
              htmlFor="customer-selector"
              className="text-[9px] font-semibold uppercase tracking-widest text-[#B7C9D3]"
            >
              Quoting for:
            </label>
            <select
              id="customer-selector"
              value={activeCustomerId ?? ""}
              onChange={(e) => setActiveCustomer(e.target.value || null)}
              className="rounded border border-[#4F758B] bg-[#1D252D] px-2 py-0.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
            >
              <option value="">— Select customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {/* Customer health (order cadence) for the active account */}
            {activeHealth && (
              <span
                className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: activeHealth.status === "new" ? "#B7C9D3" : HEALTH_COLOR[activeHealth.status] }}
                title={activeHealth.message}
                data-tour="customer-health"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: HEALTH_COLOR[activeHealth.status] }}
                  aria-hidden="true"
                />
                {HEALTH_LABEL[activeHealth.status]}
                {activeHealth.status !== "healthy" && activeHealth.status !== "new" && activeHealth.daysSinceLast !== null && (
                  <span className="normal-case text-[#B7C9D3]">· {activeHealth.daysSinceLast}d quiet</span>
                )}
              </span>
            )}
          </div>

          {/* Vertical divider */}
          {user && <div className="hidden h-8 w-px bg-[#4F758B] sm:block" aria-hidden="true" />}

          {user && (
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-bold text-white">{user.name}</span>
              <span className="text-xs text-[#B7C9D3]">{user.branch}</span>
            </div>
          )}

          {/* Dashboard link — manager/admin only */}
          {(user?.role === "manager" || user?.role === "admin") && (
            <Link
              href="/product-finder/dashboard"
              className="hidden items-center gap-1 rounded-lg border border-[#4F758B] px-3 py-1.5 text-xs font-semibold text-[#B7C9D3] transition-colors hover:border-[#64CCC9] hover:text-[#64CCC9] sm:flex"
            >
              <span aria-hidden="true">📊</span>
              <span>Insights</span>
            </Link>
          )}

          {/* Command palette — pointless on touch; hidden below sm */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
            title="Command palette (Ctrl+K)"
            className="hidden h-9 items-center justify-center rounded-lg border border-[#4F758B] px-2 text-xs font-bold text-[#B7C9D3] transition-colors hover:border-[#64CCC9] hover:text-[#64CCC9] sm:flex"
          >
            ⌘K
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Help */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="Open help panel"
            title="Help & tips"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#4F758B] text-sm font-bold text-[#B7C9D3] transition-colors hover:border-[#64CCC9] hover:text-[#64CCC9]"
          >
            ?
          </button>

          {/* Cart FAB */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open basket — ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors",
              "bg-[#4F758B] hover:bg-[#3d5d70]"
            )}
          >
            <span aria-hidden="true">🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#00AA13] text-[10px] font-bold text-white"
                aria-hidden="true"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {/* Logout */}
          {user && (
            <button
              type="button"
              onClick={logout}
              className="hidden text-xs text-[#B7C9D3] underline underline-offset-2 hover:text-white sm:block"
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      {/* ── Body: sidebar + main ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 print:hidden">
        {/* Filter sidebar (desktop only — mobile is handled by FilterSidebar's FAB) */}
        <FilterSidebar />

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto print:overflow-visible print:h-auto">
          {children}
        </main>
      </div>

      {/* ── Overlays (always in DOM) ─────────────────────────────────────────── */}
      <CartDrawer />
      <SpecCompareModal />
      <ProductDetailModal />
      <BomImportModal />
      <BulkQuoteModal />
      <BulkCrossModal />
      <AssistantPanel />
      <JobWizardModal />
      <HelpPanel />
      <TourOverlay />
      <CommandPalette />
    </div>
  );
}
