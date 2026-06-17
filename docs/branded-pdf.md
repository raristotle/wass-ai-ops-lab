# Branded quote PDF (server-side) — #16

Render a pixel-perfect, **white-label-aware** PDF of a quote server-side via
[Gotenberg](https://gotenberg.dev) — a self-hosted, MIT-licensed HTML→PDF service.
**$0 software**, **dormant** until you point at an instance.

## Why

The client print-to-PDF path is fine for ad-hoc saves, but a server render gives a
consistent, brand-styled document for attaching to emails / POs regardless of the
rep's browser. It reuses the **exact same branded HTML the quote email uses**
(`quoteEmailHtml`), so white-label mode (logo, colors, sender) is honored
automatically.

## How it works

- `lib/integration/pdf-live.ts`
  - `pdfConfigured()` — gate on `GOTENBERG_URL`.
  - `renderPdf(html)` — POSTs multipart `files=index.html` to
    `${GOTENBERG_URL}/forms/chromium/convert/html`; returns
    `{ enabled:true, pdf }` or `{ enabled:false, reason }`. Fail-closed, never
    throws into the request path.
- `POST /api/pdf/quote` — `rateLimit → requireApiAuth → dormant-gate → Zod`. Body
  is `{ token, linkUrl? }` where `token` is a signed quote-share token
  (`decodeQuoteShare`); decodes → `quoteEmailHtml(...)` → `renderPdf` → returns
  `application/pdf` inline. `GET` returns `{ configured }`.

When `GOTENBERG_URL` is unset, `POST` returns `{ configured:false }` **before any
render** and the UI keeps client print-to-PDF.

## Enabling it

1. Run Gotenberg (Docker): `docker run --rm -p 3000:3000 gotenberg/gotenberg:8`.
   Host it on your own network — Meridian only needs to reach it server-side.
2. Set `GOTENBERG_URL` (e.g. `http://gotenberg:3000`) in Vercel → redeploy.
   `/api/health` flips `integrations.pdf` to `true`.

> The Gotenberg endpoint is **server-only** and renders **our own** trusted quote
> HTML built from a signed token — not arbitrary user input — so the headless
> Chromium isn't exposed to untrusted markup or SSRF.
