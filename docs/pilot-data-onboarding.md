# Pilot Data Onboarding

Two $0 capabilities that turn a pilot kickoff into a working, *theirs*-feeling app by
importing the customer's own data:

1. **Order-history import** — wakes the behavioral cross-sell engines with real
   co-purchase data.
2. **Customer catalog-number crosswalk** — lets a buyer find products by *their* own
   part numbers. *(see [catalog-crosswalk.md](catalog-crosswalk.md))*

Both reuse the app's existing durable store (Neon when configured, in-memory
otherwise); neither adds an external dependency or cost.

---

## Order-history import — activate co-purchase lift

### Why
The cross-sell engine blends three signals: spec-rule (always on), affinity (always
on), and **market-basket lift** (only fires when real baskets exist). With no order
history, the rail is the deterministic backbone only. Importing one historical order
export is the single highest-leverage input in the system — it lights up the
behavioral overlay for the whole rail at once.

### Flow
```
CSV  →  parseOrderHistoryCsv()  →  resolveBySku() per line  →  one Basket per order
     →  mineAssociationRules(subcategory grain)  →  persist {rules, manifest}
     →  the companion rail loads the rules (loadImportedRulesIndex) on every request
```

### Modules
- **`lib/catalog/order-history.ts`** — pure CSV parser. Forgiving about column names
  (`order`/`po`/`invoice`, `sku`/`part`/`item`, `qty`) and delimiter (`,` `\t` `;` `|`),
  quoted fields with embedded commas, and missing order/qty columns. Never invents
  data: a blank-SKU row is dropped and counted.
- **`lib/catalog/order-history-rules.ts`** — the store bridge. `saveOrderHistory`,
  `getOrderHistoryManifest`, `clearOrderHistory`, and `loadImportedRulesIndex` (the
  hot read, cached in-memory ~20s **per scope**, fail-closed to `null`).

**Scope / multi-tenant isolation.** Everything is scoped via
`forTenant(getStore(), tenantForRequest(req))` and cached per scope key:
- Sessions OFF (single-tenant pilot, the default) → `tenantForRequest` is `null` →
  one app-global co-purchase model. Import and rail share it.
- Sessions ON (per-tenant SSO) → the authed operator's import is stored under their
  tenant; an in-app rep's (same-origin, cookie-bearing) companion request reads their
  own tenant's rules; anonymous/cross-origin callers get the global scope (empty
  unless a global import) — so one customer's buying pattern never leaks to another.
The per-product `behavioral` flag on the companion response is derived from the
output (a `market-basket` source actually fired for that product), not merely from
"some import exists", so it never over-claims.

### API
- **`POST /api/order-history/import`** — `{ csv, customer? }`. Auth-gated (operator
  action) + rate-limited (10/min). Parses → resolves → mines → persists. Returns the
  manifest + a headline. Unmatched SKUs are reported (`unresolved`), never guessed.
- **`GET /api/order-history`** — the manifest (counts + top co-purchase pairs) +
  whether persistence is `durable`. Auth-gated.
- **`DELETE /api/order-history`** — clears the imported history (rail reverts to
  deterministic-only). Auth-gated.

The companion endpoints consult the imported rules:
- `GET /api/products/{id}/companions` passes them as `ctx.rulesBySubcat` and returns
  `behavioral: true` once they drive the rail.
- `POST /api/companions` falls back to the imported global rules when a caller doesn't
  supply request baskets.

### UI
`OrderHistoryImportModal` (Ctrl/⌘-K → "Import order history"): paste/upload a CSV,
label the customer, import, and see what was mined (orders, matched lines, rules, top
"X → Y, N× lift" pairs). A status banner shows whether the behavioral signal is active
and lets you clear it.

### Cost & honesty
- **$0.** Reuses the durable store; mining is pure arithmetic done once at import.
- **No invented behavior.** The overlay only reflects rows that actually resolved to
  carried products; lift is computed from real co-occurrence, not seeded from rules.
  This is the honest counterpart to the deliberately-dormant market-basket engine — it
  activates from *real* data, not a synthetic stand-in.

### CSV format
A header row is required. Minimum is a SKU column; an order/PO column groups lines into
baskets (without one, each row is a single-line order). Example:

```csv
order,sku,qty
1001,CB-SQU-28,10
1001,WP-1G,10
1002,CB-SQU-28,5
```

### Tests
`lib/catalog/order-history.test.ts` (parser), `lib/catalog/order-history-rules.test.ts`
(store + cache TTL), `features/product-finder/OrderHistoryImportModal.render.test.tsx`,
and the `order-history-import` help topic.
