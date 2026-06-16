# Shipping · CRM · SMS — dormant seams (#16, #18, #19)

Three env-gated dormant seams, each mirroring the FRED commodity seam (pure transform +
thin raw-fetch wrapper + `{enabled}` union, fail-closed, server-only, never `NEXT_PUBLIC_`).
All are $0 and make zero network calls until their env var is set, and report state via
`/api/health` (`shipping`, `hubspot`, `sms`).

## #16 — Shipping rates (Shippo)

- `lib/integration/shipping-live.ts` — `shippingConfigured()`, pure `shippoRatesToQuotes()`,
  `getShippingRates()`. Uses `Authorization: ShippoToken <key>` (not Bearer); rates are
  returned inline by `POST /shipments` with `async:false`.
- `POST /api/shipping/rates {addressFrom, addressTo, parcel}` → cheapest-first rate quotes;
  `GET` → `{configured}`. **Quoting is free** — the seam never buys a label (no spend).
- Activate: `SHIPPO_API_TOKEN` (`shippo_test_` in preview, `shippo_live_` in prod). Free
  Starter plan; rate-shopping never bills.

## #18 — CRM sync (HubSpot)

- `lib/integration/hubspot-live.ts` — `hubspotConfigured()`, pure `contactUpsertBody()` /
  `dealCreateBody()`, `syncWonQuoteToHubspot()` (upsert Contact by email → create Deal with
  an inline deal→contact association). `Authorization: Bearer pat-…`.
- `POST /api/crm/sync {email, firstName?, lastName?, dealName, amount}` → `{contactId, dealId}`;
  `GET` → `{configured}`.
- Activate: `HUBSPOT_PRIVATE_APP_TOKEN` (Settings → Private Apps; scopes
  `crm.objects.contacts.*` + `crm.objects.deals.*`), optional `HUBSPOT_DEAL_PIPELINE` /
  `HUBSPOT_DEAL_WON_STAGE` (internal ids). Free CRM tier. **Note:** deal creation isn't
  idempotent — dedupe by storing the returned `dealId` per quote.

## #19 — SMS notifications (Twilio)

- `lib/integration/sms-live.ts` — `smsConfigured()`, pure `buildSmsForm()`, `sendSms()`.
  HTTP Basic (SID:token), form-encoded `POST …/Messages.json`. Fail-closed: a send failure
  returns `{enabled:true, sent:false}` (SMS is a side-channel, never blocks the response).
- `POST /api/sms/send {to (E.164), body}` → `{sent, sid|errorCode}`; `GET` → `{configured}`.
- Activate: `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + one sender (`TWILIO_FROM_NUMBER` or
  `TWILIO_MESSAGING_SERVICE_SID`). **TCPA:** only send to numbers with prior express opt-in;
  honor STOP (a Messaging Service handles STOP automatically). The recipient/body are never
  logged. Trial: verified recipients only, ~$0.012/segment once paid.

## Verify (all three)

- **Dormant:** `GET` each endpoint → `{"configured":false}`; `/api/health` shows the flag
  `false`; a `POST` returns `{enabled:false, reason:"no-keys"}` with no outbound call.
- **Active:** set the env var(s) → `GET` → `{"configured":true}`; a `POST` returns live data.
