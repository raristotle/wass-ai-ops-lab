/**
 * Server-side submittal package HTML builder — pure, deterministic.
 *
 * Produces the same document as the client-side SubmittalPackage component but
 * as a self-contained HTML string suitable for Gotenberg's Chromium renderer.
 * When GOTENBERG_URL is unset the POST route returns {configured:false} and
 * the UI falls back to the existing client print-to-PDF path.
 */

export interface SubmittalLine {
  sku: string;
  name: string;
  qty: number;
  uom: string;
  unitPrice: number;
  specs: { name: string; value: string }[];
  specSheetUrl?: string | null;
}

export interface SubmittalInput {
  packageNumber: string;
  dateLabel: string;
  customer: string;
  project: string;
  preparedBy?: string;
  lines: SubmittalLine[];
  brandName?: string;
  brandAccentColor?: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lineHtml(line: SubmittalLine, idx: number): string {
  const specRows = line.specs
    .map(
      (s) =>
        `<tr><td style="padding:3px 8px;color:#4F758B;font-size:11px;border:1px solid #e2e8f0">${esc(s.name)}</td>` +
        `<td style="padding:3px 8px;font-size:11px;border:1px solid #e2e8f0">${esc(s.value)}</td></tr>`,
    )
    .join("");
  const specTable = line.specs.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:6px">${specRows}</table>`
    : `<p style="font-size:11px;color:#4F758B;margin-top:6px">No specifications available.</p>`;
  const sheetLink = line.specSheetUrl
    ? `<p style="margin-top:6px"><a href="${esc(line.specSheetUrl)}" style="font-size:11px;color:#004986">Download spec sheet</a></p>`
    : "";
  return `<div style="page-break-inside:avoid;margin-bottom:24px;border:1px solid #B7C9D3;border-radius:6px;padding:16px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <p style="font-size:10px;color:#4F758B;margin:0 0 2px">Item ${idx + 1} of ${1}</p>
      <p style="font-size:14px;font-weight:600;color:#1D252D;margin:0">${esc(line.name)}</p>
      <p style="font-size:11px;color:#4F758B;margin:2px 0 0">SKU: ${esc(line.sku)}</p>
    </div>
    <div style="text-align:right;flex-shrink:0;margin-left:16px">
      <p style="font-size:13px;font-weight:600;color:#1D252D;margin:0">$${line.unitPrice.toFixed(2)} / ${esc(line.uom)}</p>
      <p style="font-size:11px;color:#4F758B;margin:2px 0 0">Qty: ${line.qty}</p>
    </div>
  </div>
  ${specTable}
  ${sheetLink}
</div>`;
}

/** Build a complete, self-contained HTML document for Gotenberg to render as PDF. */
export function buildSubmittalHtml(input: SubmittalInput): string {
  const { packageNumber, dateLabel, customer, project, preparedBy, lines, brandName = "Meridian", brandAccentColor = "#00AA13" } = input;
  const cover = `
    <div style="border-bottom:2px solid #1D252D;padding-bottom:24px;margin-bottom:32px">
      <div style="display:inline-block;background:${esc(brandAccentColor)};color:#fff;font-weight:700;font-size:10px;letter-spacing:2px;padding:4px 8px;border-radius:4px;margin-bottom:16px">${esc(brandName)}</div>
      <h1 style="font-size:28px;font-weight:700;color:#1D252D;margin:0">SUBMITTAL PACKAGE</h1>
      <p style="font-size:12px;color:#4F758B;margin:4px 0 0">Product data sheets for approval</p>
      <dl style="display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:24px;font-size:12px">
        <div><dt style="color:#4F758B">Package No.</dt><dd style="font-weight:600;color:#1D252D;margin:0">${esc(packageNumber)}</dd></div>
        <div><dt style="color:#4F758B">Date</dt><dd style="font-weight:600;color:#1D252D;margin:0">${esc(dateLabel)}</dd></div>
        <div><dt style="color:#4F758B">Customer</dt><dd style="font-weight:600;color:#1D252D;margin:0">${esc(customer || "—")}</dd></div>
        <div><dt style="color:#4F758B">Project / PO</dt><dd style="font-weight:600;color:#1D252D;margin:0">${esc(project || "—")}</dd></div>
        ${preparedBy ? `<div><dt style="color:#4F758B">Prepared by</dt><dd style="font-weight:600;color:#1D252D;margin:0">${esc(preparedBy)}</dd></div>` : ""}
        <div><dt style="color:#4F758B">Items</dt><dd style="font-weight:600;color:#1D252D;margin:0">${lines.length}</dd></div>
      </dl>
      <div style="margin-top:16px">
        <p style="font-size:11px;font-weight:600;color:#4F758B;text-transform:uppercase;letter-spacing:1px">Index</p>
        <ol style="margin:4px 0 0;padding-left:18px">
          ${lines.map((l, i) => `<li style="font-size:11px;color:#1D252D">${esc(l.name)} (SKU ${esc(l.sku)})</li>`).join("")}
        </ol>
      </div>
    </div>`;
  const itemsHtml = lines
    .map((l, i) => lineHtml(l, i).replace("1 of ${1}", `${i + 1} of ${lines.length}`))
    .join("\n");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Submittal Package ${esc(packageNumber)}</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#1D252D;font-size:12px}
  @page{margin:24mm}
</style>
</head><body>
${cover}
${itemsHtml}
</body></html>`;
}
