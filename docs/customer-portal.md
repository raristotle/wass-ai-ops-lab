# Customer self-service portal — v4-S4 #13

A logged-in **customer** views their own order history and reorders, at
`/product-finder/customer`. Read-only, $0 — it reuses the shipped SSO/session,
the per-tenant order persistence, and the order-tracking timeline.

## Architecture

- **`GET /api/customer/orders`** — READ-ONLY. `requireApiAuth` → `tenantForRequest`
  → `forTenant(getStore()).list<PlacedOrder>("orders", { limit: 100 })`. The
  session auto-scopes to the customer's tenant (the same hard namespace isolation
  the rep APIs use), so a customer only ever sees their own orders. There is **no
  write surface** on this route — a customer session can only read.
- **`/product-finder/customer/page.tsx`** — `AuthGuard` + `ProductFinderShell`.
  Lists orders (id, date, total, item count, a status from the shipped
  `orderTracking` timeline), expandable to the line detail. Fully localized (en/es).
- **Reorder** — resolves the order's SKUs against the catalog via the shipped
  `/api/products/quick-resolve`, adds the resolved products (at the original
  quantities) to the cart, and opens the cart on the finder for review — so the
  customer confirms before buying.

## Security
- Tenant isolation is enforced server-side by `forTenant` (a customer cannot name
  another tenant's keys). The route is GET-only, auth-gated, and rate-limited.
- Orders are derived from a logged-in session; an unauthenticated request gets 401
  and `AuthGuard` redirects to login.

## Activation
Works with the shipped auth: with SSO sessions on (`SESSION_SECRET` set) each
customer is scoped to their tenant; in the pilot demo (sessions off) it shows the
shared space. No new env var or 3rd-party account is required.
