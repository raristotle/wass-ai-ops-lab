/**
 * Pure helpers for the "Email Quote" action. No transport here — composing
 * and validating only. Transport lives in /api/quote-email (Resend when
 * RESEND_API_KEY is configured; the UI falls back to a simulated send when not).
 */

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Best-effort recipient guess from a customer/company name → contact email. */
export function guessRecipient(customerName: string): string {
  const slug = customerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return slug ? `purchasing@${slug}.com` : "";
}

export function defaultQuoteSubject(quoteNumber: string): string {
  return `Your Meridian Supply Co. quote ${quoteNumber}`;
}

export function defaultQuoteBody(opts: {
  customer: string;
  quoteNumber: string;
  total: number;
  rep: string;
}): string {
  const greeting = opts.customer ? `Hi ${opts.customer},` : "Hello,";
  return [
    greeting,
    "",
    `Please find your quote ${opts.quoteNumber} attached, total $${opts.total.toFixed(2)}.`,
    "This quote is valid for 30 days. Let me know if you'd like to adjust quantities or proceed with an order.",
    "",
    "Thank you,",
    opts.rep || "Meridian Supply Co.",
  ].join("\n");
}

// ─── Real-send HTML composition ───────────────────────────────────────────────

export interface QuoteEmailLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface QuoteEmailInput {
  customer: string;
  quoteNumber: string;
  lines: QuoteEmailLine[];
  total: number;
  rep: string;
  branch?: string;
  /** Customer acceptance link — the email's call to action. */
  linkUrl: string;
  note?: string;
  terms?: string[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Branded, table-based HTML for the quote email (email clients want inline
 * styles and simple tables). Pure — fully unit-testable.
 */
export function quoteEmailHtml(input: QuoteEmailInput): string {
  const rows = input.lines
    .map(
      (l) => `<tr>
<td style="padding:6px 10px;border-bottom:1px solid #B7C9D3;font-family:monospace;color:#4F758B;">${escapeHtml(l.sku)}</td>
<td style="padding:6px 10px;border-bottom:1px solid #B7C9D3;color:#1D252D;">${escapeHtml(l.name)}</td>
<td style="padding:6px 10px;border-bottom:1px solid #B7C9D3;text-align:right;color:#1D252D;">${l.qty}</td>
<td style="padding:6px 10px;border-bottom:1px solid #B7C9D3;text-align:right;color:#1D252D;">$${l.unitPrice.toFixed(2)}</td>
<td style="padding:6px 10px;border-bottom:1px solid #B7C9D3;text-align:right;color:#1D252D;font-weight:bold;">$${(l.unitPrice * l.qty).toFixed(2)}</td>
</tr>`
    )
    .join("");

  const noteBlock = input.note
    ? `<p style="margin:16px 0 0;padding:10px;background:#F8FAFB;border:1px solid #B7C9D3;border-radius:6px;color:#1D252D;"><strong>Note:</strong> ${escapeHtml(input.note)}</p>`
    : "";
  const termsBlock =
    input.terms && input.terms.length > 0
      ? `<p style="margin:16px 0 4px;color:#4F758B;font-size:12px;"><strong>Terms &amp; Conditions</strong></p><ul style="margin:0;padding-left:18px;color:#4F758B;font-size:11px;">${input.terms.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`
      : "";

  const greeting = input.customer ? `Hi ${escapeHtml(input.customer)},` : "Hello,";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#F8FAFB;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #B7C9D3;border-radius:10px;padding:24px;">
<p style="margin:0 0 4px;"><span style="background:#00AA13;color:#FFFFFF;font-weight:bold;letter-spacing:2px;padding:4px 8px;border-radius:4px;font-size:13px;">MERIDIAN</span> <span style="color:#4F758B;font-size:11px;letter-spacing:2px;">SUPPLY CO.</span></p>
<h1 style="margin:12px 0 4px;color:#1D252D;font-size:20px;">Quote ${escapeHtml(input.quoteNumber)}</h1>
<p style="margin:0 0 16px;color:#4F758B;font-size:13px;">Prepared by ${escapeHtml(input.rep || "Meridian Supply Co.")}${input.branch ? ` · ${escapeHtml(input.branch)}` : ""}</p>
<p style="margin:0 0 16px;color:#1D252D;">${greeting} your quote is ready — review and accept it online below.</p>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
<tr style="background:#1D252D;color:#FFFFFF;"><th style="padding:6px 10px;text-align:left;">SKU</th><th style="padding:6px 10px;text-align:left;">Product</th><th style="padding:6px 10px;text-align:right;">Qty</th><th style="padding:6px 10px;text-align:right;">Unit</th><th style="padding:6px 10px;text-align:right;">Ext.</th></tr>
${rows}
<tr><td colspan="4" style="padding:8px 10px;text-align:right;font-weight:bold;color:#1D252D;">Total</td><td style="padding:8px 10px;text-align:right;font-weight:bold;color:#1D252D;">$${input.total.toFixed(2)}</td></tr>
</table>
${noteBlock}
${termsBlock}
<p style="margin:24px 0;text-align:center;"><a href="${escapeHtml(input.linkUrl)}" style="background:#00AA13;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:8px;display:inline-block;">Review &amp; Accept Quote</a></p>
<p style="margin:0;color:#4F758B;font-size:11px;">This quote is valid for 30 days. Prices in USD. Demonstration email from the Meridian AI Product Recommender — simulated catalog data.</p>
</div></body></html>`;
}
