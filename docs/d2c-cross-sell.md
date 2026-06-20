# D2C Cross-Sell (v5-S4)

The customer-facing side of the cross-sell engine: companion chips on the quick-order
pad, and a self-service reorder/subscription portal with attach nudges. Both $0 and
deterministic, built on the same engine the rep surfaces use.

| # | Feature | Where |
|---|---|---|
| 15 | Quick-order pad + companion chips | QuickOrderModal (Ctrl/⌘-K) |
| 16 | Reorder / subscription portal + attach nudges | `/product-finder/customer` |

---

## #15 Quick-order companion chips — `QuoteCopilotModal`… no, `QuickOrderModal.tsx`

After the pad resolves pasted SKUs, it gathers the cross-sell companions across the
matched products (up to 3 seeds via `GET /api/products/{id}/companions`), de-dupes
them, drops anything already pasted, and renders an **"Add these too"** chip row
(required green, recommended neutral). Each chip adds the full product to the cart.
$0; the companions come straight from the S1 engine.

## #16 Reorder / subscription portal — `lib/product-finder-subscription.ts` + `CustomerReorderNudge`

The pure scheduling core:

- `CADENCE_DAYS` / `CADENCE_LABEL` — weekly / biweekly / monthly / quarterly.
- `nextDueDate(sub)` / `daysUntilDue(sub, now)` / `dueStatus(sub, now, leadDays)` —
  cadence math with injected "now" (deterministic, testable).
- `dueSubscriptions(subs, now, leadDays)` — active subscriptions annotated with
  due-info, most-urgent first.

UI: `CustomerReorderNudge` on each expanded order in the customer portal —

- **Subscribe to reorder** — a cadence selector that previews the next reorder date
  (`nextDueDate`). Persisted client-side in `localStorage` as a $0 stub (guarded on
  `typeof localStorage`); the durable subscription schedule is the dormant production path.
- **Customers also add** — the order's cross-sell companions (via `POST /api/companions`,
  mode `attach`), each addable to the reorder cart with one tap (resolved to a full
  product via `/api/products/quick-resolve`).

## Client helpers — `lib/product-finder-api.ts`

- `apiCompanionsAttach(skus, branchId?)` — the basket-level attach rail (slim products).

## Cost & honesty

All $0 and deterministic. The subscription schedule is a client stub today; activating
durable, server-side subscriptions reuses the existing persistence store and does not
change cost until an operator opts in. No new dependency, no model call, no network
beyond the app's own $0 endpoints.

## Tests

`lib/product-finder-subscription.test.ts`, the render test
`features/product-finder/CustomerReorderNudge.render.test.tsx`, and the
`quick-order-chips` / `reorder-subscription` help topics.
