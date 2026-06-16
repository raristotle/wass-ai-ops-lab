# Indicative multi-currency quoting (Sprint 1 · #2)

Shows an **indicative** secondary-currency total beside the authoritative USD total on a quote —
for Canadian / Mexican / export accounts. Free, no-key, dormant until enabled.

## How it works

| Piece | Role |
|---|---|
| `lib/integration/fx-live.ts` | env-gated seam (mirrors the FRED / Stripe Tax pattern). Free, **no-key** Frankfurter API (ECB daily reference rates). Pure `frankfurterToRates` transform + daily KV cache. |
| `apps/web/app/api/fx/quote/route.ts` | `GET` → `{configured, base, asOf, rates:[{currency,rate}]}`. Rate-limited, **not** auth-gated (read-only, public ECB rates, no secret/PII) so the customer-facing quote page can consume it. |
| `features/product-finder/IndicativeFxTotal.tsx` | client island on the quote-acceptance page; renders `≈ CA$X` lines, or **nothing** when dormant. |
| `/api/health` | `fx` flag. |

## Safety / cost

- **Display-only.** USD is always authoritative; the secondary line is clearly marked indicative
  and never touches pricing math or the payment path.
- **$0 and dormant by default.** With `FX_QUOTE_CURRENCIES` unset there is no fetch, no secondary
  line, no network. Frankfurter needs no API key — the env var is purely the on/off + currency list.
- Rates are cached once per UTC day in the Neon/Memory KV (`fx-rates` namespace), so request volume
  can't fan out to repeated upstream calls.

## Activate

Set one env var in Vercel and redeploy:

```
FX_QUOTE_CURRENCIES=CAD,MXN     # comma list of ISO-4217 codes (max 5; USD excluded)
```

## Verify

- Dormant: `/api/health` → `fx:false`; `GET /api/fx/quote` → `{configured:false}`; the quote page
  shows only the USD total.
- Active: after setting the env var, `GET /api/fx/quote` → `{configured:true, rates:[…]}`; the quote
  page shows `≈ CA$…` under the total.
