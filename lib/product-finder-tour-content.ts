/**
 * lib/product-finder-tour-content.ts — guided-tour step copy and actions.
 *
 * Pure data. The tour UI walks TOUR_STEPS in order; steps with an `action`
 * render a "try it" button. `actionRoles` limits the button to certain roles
 * (the step itself always shows).
 */

import type { AuthUser } from "@/features/product-finder/types";

export type TourAction =
  | { kind: "nlSearch"; label: string; query: string }
  | { kind: "openCart"; label: string }
  | { kind: "openJobWizard"; label: string }
  | { kind: "navigate"; label: string; href: string };

export interface TourStep {
  id: string;
  title: string;
  /** Paragraphs / bullet lines. Lines starting with "• " render as bullets. */
  body: string[];
  action?: TourAction;
  /** Roles allowed to use the action; omitted = everyone. */
  actionRoles?: AuthUser["role"][];
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Meridian Product Finder",
    body: [
      "This is the counter rep's cockpit: rough customer request in, stocked and priced recommendation out — all on one screen.",
      "• 200,000 products across electrical, datacom, OEM, AV, security, and safety.",
      "• Your branch decides what counts as in stock, so match scores follow you.",
      "• Everything here is demo data — click anything, nothing leaves the app.",
      "This tour takes about two minutes. You can close it anytime and restart it from the command palette.",
    ],
  },
  {
    id: "nl-search",
    title: "Search the way customers talk",
    body: [
      "Type a request the way it's said at the counter — the search bar understands plain English.",
      "• Price (“under $50”), availability (“in stock”), brands, and categories become removable filter chips.",
      "• Trade slang works too: “romex”, “gfi”, and “wire nut” resolve to the right catalog terms.",
      "• Misspell something? A “did you mean…?” fix is suggested — or applied automatically when it's a sure thing.",
    ],
    action: { kind: "nlSearch", label: "Try a smart search", query: "20A breaker in stock under $50" },
  },
  {
    id: "filters",
    title: "Narrow down with filters and spec facets",
    body: [
      "The left sidebar filters by category, subcategory, brand, stock location, preferred, and price.",
      "• Inside a category, spec facets appear — checkboxes with live counts and Min/Max ranges for numeric specs like Amperage.",
      "• Filter chips and the sidebar stay in sync; Clear all resets everything at once.",
    ],
    action: { kind: "nlSearch", label: "Browse circuit breakers", query: "circuit breakers" },
  },
  {
    id: "alternatives",
    title: "Find Alternatives — real cross-references",
    body: [
      "Click Find Alternatives on any card to see ranked substitutes.",
      "• ✓ CROSS-REF means a genuine functional equivalent — same subcategory, identical key specs, just a different brand, price, or stock position.",
      "• A match ring and “Why recommended?” explain every ranking, so you can defend the swap to the customer.",
      "• Out-of-stock items automatically offer their best in-stock substitute.",
      "• Real parts carry SOURCE-BACKED crosses: a ⇄ VERIFIED CROSS badge on the card means a manufacturer document maps it to substitutes we stock — open View Details to see each cross with its source linked (try FRN-R-30).",
      "• The Cross-Reference Explorer (Ctrl+K → “Open Cross-Reference Explorer”) lets you browse every documented pair and the sources behind them.",
      "• Verified real parts go further: the detail view pulls LIVE Mouser and Digi-Key pricing, stock, and datasheets (try AF09-30-10-13).",
    ],
    action: { kind: "nlSearch", label: "See a verified cross", query: "FRN-R-30" },
  },
  {
    id: "job-wizard",
    title: "Ask Meridian — the Job Wizard",
    body: [
      "Don't build the basket part by part — describe the job and let the wizard do it.",
      "• Pick a job (200A service upgrade, network drops, LED retrofit, cameras, EV charger).",
      "• Every step resolves to a stocked, priced product from the catalog — swap alternates, adjust quantities, skip steps.",
      "• One click adds the whole bill of materials to the basket.",
      "Deterministic recommendations today; the conversational version is on the roadmap.",
    ],
    action: { kind: "openJobWizard", label: "Open the Job Wizard" },
  },
  {
    id: "basket-quote",
    title: "Basket, quotes, and orders",
    body: [
      "Add products at any quantity, then open the cart drawer.",
      "• Volume tiers and contract pricing apply per line automatically.",
      "• Substitute & save: if a line has a cheaper documented cross we stock, the basket shows the swap and the dollars it saves — one click, fully cited.",
      "• Generate a branded quote PDF — with your note and selectable terms — email it for real, or save it to track Draft → Sent → Won/Lost.",
      "• Need to discount? ✎ price overrides are margin-guarded, and win/loss history coaches the sweet spot.",
      "• Every saved quote has a Customer Link — they accept, decline, or counter from their phone; Revise answers a counter with a linked v2, and History keeps the audit trail.",
    ],
    action: { kind: "openCart", label: "Open the cart" },
  },
  {
    id: "insights",
    title: "Insights for managers",
    body: [
      "Managers and admins get an Insights dashboard:",
      "• KPI cards — orders, total and average value, active customers.",
      "• Contract savings delivered, top categories, orders over time, and customer mix.",
      "• A quote pipeline with open value, win rate, follow-up, approval, and counter-offer alerts.",
      "• Pricing win/loss by margin band — see where quotes actually close.",
      "• Customer health — accounts going quiet vs their usual order cadence.",
      "• A branch demand forecast — what to stock for the next 30 days, from real order history.",
      "Signed in as a sales rep? Switch roles from the command palette to see it.",
    ],
    action: { kind: "navigate", label: "Open Insights", href: "/product-finder/dashboard" },
    actionRoles: ["manager", "admin"],
  },
  {
    id: "more-tools",
    title: "Power tools when you need them",
    body: [
      "A few more ways to move faster:",
      "• Import List / BOM converts competitor bills of materials: lines naming a documented competitor part get a cited “use stocked cross” suggestion — the counter-sale, automated. Bulk Cross-Ref does the same for up to 100 pasted part numbers, with CSV export.",
      "• Saved searches: ★ Save this search keeps a query+filters one click away, and the 🔔 bell flags it when new matches land.",
      "• The 🔔 bell collects approvals, follow-ups, counter-offers, restock and at-risk-customer alerts.",
      "• “For you” on the landing view predicts reorders before you type; the metals index flags copper swings; the seasonal banner surfaces what's about to sell.",
      "• Voice search — tap the mic and say “twenty amp breaker in stock”.",
      "• Command palette — Ctrl/Cmd-K jumps anywhere, switches roles, or runs a search.",
      "• Deep links — every filtered view has a shareable URL that rebuilds it exactly.",
      "• Help — searchable how-tos for every feature, with one-click “try it” queries.",
      "That's the tour — the counter is yours.",
    ],
  },
];
