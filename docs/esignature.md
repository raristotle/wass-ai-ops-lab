# Quote e-signature (Dropbox Sign) — v4-S2 #3

Turn the customer quote-acceptance flow into a **legally-binding close**: a rep
emails the customer a Dropbox Sign link, the customer signs in Dropbox's hosted
UI, and the signature is captured server-side and written to the tamper-evident
[audit log](audit-log.md).

It is an **env-gated dormant seam** — $0 and zero network until
`DROPBOX_SIGN_API_KEY` is set, and even then it **defaults to Dropbox _test
mode_** (non-binding, free, no quota) until you explicitly opt into live,
billable signatures.

## How it behaves

| State | Behavior |
|---|---|
| `DROPBOX_SIGN_API_KEY` unset | "Send for signature" button hidden; `/api/esign/*` report `{configured:false}`; no network |
| Key set, `DROPBOX_SIGN_TEST_MODE` unset/`true` | Button shown; requests sent in **test mode** — free, non-binding, no quota consumed |
| Key set, `DROPBOX_SIGN_TEST_MODE=false` | **Live, legally-binding** signatures — requires a paid Dropbox Sign API plan |

## Architecture

- **`lib/integration/esign-live.ts`** — the seam. `esignConfigured()` gate,
  `createSignatureRequest()` (POST `https://api.hellosign.com/v3/signature_request/send`,
  HTTP Basic with the API key as username), `verifyEsignEventHash()`
  (HMAC-SHA256 over `event_time + event_type` keyed with the API key — the
  documented Dropbox event_hash scheme), `parseEsignEvent` / `esignOutcomeFromEvent`,
  and `isAllowedFileUrl()` (SSRF guard).
- **`lib/product-finder-esign.ts`** — the `EsignRecord` model + monotonic
  `transitionEsign` (signed/declined are terminal) + `publicEsign` (hides tenant).
- **`POST /api/esign/request`** — operator-triggered, `requireApiAuth`-gated,
  rate-limited, dormant-checked, Zod-validated. The signing document URL must be
  same-origin (SSRF allowlist). Persists the record in the fixed global `esign`
  namespace, keyed by the Dropbox `signature_request_id`, carrying the tenant id.
- **`POST /api/esign/webhook`** — Dropbox → us, sessionless. Authenticated by the
  HMAC `event_hash` (not `requireApiAuth`). Reads the multipart `json` field,
  verifies, flips the record via CAS `mutate`, records an audit entry on
  signed/declined, and **always replies `200 Hello API Event Received`** (required
  by Dropbox for every callback, including the verification ping).
- **UI** — `EsignButton` on open quote rows in the cart drawer (hidden when
  dormant). The signing document is the branded quote PDF served by
  `GET /api/pdf/quote?token=…` on our own origin (a token capability, exactly like
  the public acceptance page) — so it needs `GOTENBERG_URL` set too.

The webhook **never logs the payload** (project rule), and `file_urls` only ever
points at our own deployment (SSRF defense).

---

## Step-by-step: activate Dropbox Sign (do this in your browser)

You only need this when you want real e-signatures. Everything stays $0 until you finish.

### 1. Create a Dropbox Sign account + API app
1. Go to **https://www.hellosign.com/** (the product is "Dropbox Sign"; the API
   host is still `hellosign.com`). Sign up / sign in.
2. Open **Settings → API** (or **app.hellosign.com/home/myAccount?current_tab=api**).
3. Under **API Keys**, copy your **API key** (this is also called the *Primary
   Key* — it both authenticates requests **and** signs the webhook `event_hash`).
   Keep it secret.

> Free evaluation: leave **test mode** on (the default in this app). Test-mode
> requests are free, non-binding, and don't consume quota. Sending real binding
> signatures requires a **paid API plan** — only do that when you set
> `DROPBOX_SIGN_TEST_MODE=false`.

### 2. Add the env vars in Vercel
1. In the Vercel dashboard → your project → **Settings → Environment Variables**.
2. Add:
   - `DROPBOX_SIGN_API_KEY` = the API key from step 1 (Production scope).
   - `GOTENBERG_URL` = your Gotenberg instance URL (the signing document is the
     server-rendered quote PDF — see [branded-pdf.md](branded-pdf.md)). Without
     this, Dropbox has no PDF to fetch.
   - *(optional)* leave `DROPBOX_SIGN_TEST_MODE` **unset** to stay in free test
     mode. Set it to `false` only when you're on a paid plan and want binding
     signatures.
3. **Redeploy** (env vars only take effect on a new build).

### 3. Register the webhook in Dropbox Sign
1. Back in **Settings → API**, find **Account Callback** (webhook URL).
2. Set it to: `https://YOUR-DOMAIN/api/esign/webhook`
   (for this project: `https://app.raristotle.com/api/esign/webhook`).
3. Save. Dropbox sends a **test event** (`callback_test`) to verify the endpoint —
   the app replies `Hello API Event Received`, so it should show as verified. If
   it doesn't, confirm the URL is exact and the deploy with the key is live.

### 4. Verify it's live
- `GET https://YOUR-DOMAIN/api/health` → `integrations.esign: true`.
- `GET https://YOUR-DOMAIN/api/esign/request` → `{ "configured": true, "testMode": true }`.
- In the app, open a **sent** quote in the cart drawer → the **✍️ Send for
  signature** button now appears.

### 5. Try a test signature
1. Click **✍️ Send for signature**, enter your own email, click **Send (test)**.
2. You'll get a Dropbox Sign email; sign it in their UI.
3. The quote row flips to **Signed ✓**, and an `esign.signed` entry appears in the
   dashboard **Audit Log** (tamper-evident).

### Going live (binding signatures)
- Upgrade to a paid **Dropbox Sign API plan**.
- Set `DROPBOX_SIGN_TEST_MODE=false` in Vercel and redeploy.
- (If you later want in-page embedded signing instead of email, that needs an
  "API App" `client_id`, a whitelisted domain, and Dropbox app approval — not
  required for the email flow shipped here.)

## Security notes
- The webhook is authenticated by HMAC, not a login — never weaken
  `verifyEsignEventHash`, and keep the API key out of `NEXT_PUBLIC_`.
- `file_urls` is constrained to your own origin so Dropbox can't be pointed at an
  internal/metadata URL (SSRF). Extend with `ESIGN_FILE_URL_HOSTS` only for hosts
  you control.
- Rotating the API key also rotates the webhook secret — update both together.
