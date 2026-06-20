# Relations + Agentic Cross-Sell (v5-S3)

Five surfaces that extend the cross-sell engine with manufacturer relations, contract
awareness, agentic quoting, CRM push, and a compare-time upgrade flow. All $0 and
deterministic; the Icecat and CRM integrations are env-gated dormant until keyed.

| # | Feature | Where | Cost |
|---|---|---|---|
| 10 | Open Icecat accessory-relations | `GET /api/products/{id}/relations` | $0 dormant (ICECAT_USERNAME) |
| 11 | Contract / entitlement attach | CompanionsPanel badges + pricing | $0 |
| 12 | Quote/CPQ MCP | `draft_quote` MCP tool | $0 |
| 13 | Salesforce/HubSpot CRM bridge | `push_quote_to_crm` MCP + `/api/crm/sync` | $0 dormant |
| 14 | Compare → complete-the-upgrade | SpecCompareModal panel | $0 |

---

## #10 Open Icecat accessory-relations — `lib/integration/icecat-relations.ts`

A fourth, **manufacturer-authoritative** companion signal: the accessories /
compatible parts a brand publishes for a product, via Open Icecat.

- `icecatRelationsToEdges(json)` — pure, defensive transform of Icecat's relation
  arrays (`ProductRelated`/`RelatedProducts`/`Reasons`/`Accessories`) → de-duped
  `IcecatRelationEdge[]` (mpn, brand, title, kind, relation). Manufacturer relations
  are advisory, so every edge maps to `recommended` (never `required`).
- `getIcecatRelations({ gtin | brand+mpn })` — dormant + fail-closed; `{enabled:false}`
  until `ICECAT_USERNAME` is set, never throws.

`GET /api/products/{id}/relations` resolves each related MPN to a stocked SKU we
carry. Dormant in the demo (returns `{enabled:false}`); reuses the `icecat` health flag.

## #11 Contract / entitlement attach — `lib/product-finder-contract.ts`

Keep an account's order on its negotiated contract.

- `contractForCustomer(name)` — resolve the active account to its `Contract` (demo
  contracts stand in for an ERP/CPQ feed).
- `isOnContract(p, c)` / `contractPrice(unitPrice, p, c)` — on-contract by SKU or
  family, at the contracted discount.
- `annotateContract(items, c)` — on-contract first (stable).
- `contractCoverage(lines, c)` — on-contract share + the savings the contract delivers.

UI: the **CompanionsPanel** badges on-contract companions ("On contract") and shows
the contract price struck through list, whenever an account with a contract is selected.

## #12 Quote/CPQ MCP — `draft_quote`

`mcp/meridian-mcp-server.mjs` gained `draft_quote({ items:[{sku,qty}], customer?,
branchId? })` — prices each line server-side, totals it, and attaches the whole
basket's cross-sell companions (via `/api/companions`). Returns a draft (lines,
subtotal, companions, unresolved) — **no order placed**. `place_order` books it.

## #13 Salesforce/HubSpot CRM bridge — `push_quote_to_crm`

- `lib/integration/salesforce-live.ts` — a dormant Salesforce seam mirroring the
  HubSpot one: `contactBody`/`opportunityBody` (pure, tested) + `syncWonQuoteToSalesforce`
  (Contact + Opportunity, fail-closed). Gated on `SALESFORCE_ACCESS_TOKEN` +
  `SALESFORCE_INSTANCE_URL`; health flag `salesforce`.
- `POST /api/crm/sync` now takes `provider: "hubspot" | "salesforce"` (default hubspot)
  and routes accordingly; each provider dormant until its keys are set.
- MCP `push_quote_to_crm({ email, dealName, amount, …, provider })` calls it; a dormant
  CRM returns `{ synced:false, reason:"no-keys" }` with no external call.

## #14 Compare → complete-the-upgrade — `lib/product-finder-upgrade.ts`

- `pickUpgrade(products)` — the SKU a rep would trade up TO (priciest, preferred breaks ties).
- `upgradeDeltaCompanions(upgradeCompanions, comparedSubcats, requiredOnly?)` — the
  upgrade's companions whose family ISN'T already among the compared products (the
  delta the upgrade adds), required-first.

UI: `UpgradeCompletePanel` on the **SpecCompareModal** — "Complete the upgrade" lists
exactly the new companions with one-click add.

---

## Activation (all dormant/$0 until keyed)

| Integration | Env vars |
|---|---|
| Open Icecat relations | `ICECAT_USERNAME` (free), optional `ICECAT_API_TOKEN` |
| HubSpot | `HUBSPOT_PRIVATE_APP_TOKEN` (+ optional pipeline/stage) |
| Salesforce | `SALESFORCE_ACCESS_TOKEN` + `SALESFORCE_INSTANCE_URL` (+ optional `SALESFORCE_API_VERSION`, `SALESFORCE_WON_STAGE`) |

## Tests

`lib/product-finder-contract.test.ts`, `lib/product-finder-upgrade.test.ts`,
`lib/integration/icecat-relations.test.ts`, `lib/integration/salesforce-live.test.ts`,
the render test `features/product-finder/UpgradeCompletePanel.render.test.tsx`, the
frozen-route guardrail (`api/products/[id]/relations`), and the
`contract-attach` / `compare-upgrade` / `icecat-relations` / `cpq-mcp` help topics.
