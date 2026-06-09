/**
 * Pure helpers for the (simulated) "Email Quote" action. No transport here —
 * the cart simulates sending; these compose and validate the message.
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
