import { type ProcurementOrder } from "@/lib/procurement/types";

/**
 * EDI X12 850 (Purchase Order) generator — the transaction set a customer's ERP
 * exchanges over EDI for a PO. Faithful 004010 envelope (ISA/GS/ST … SE/GE/IEA)
 * with BEG header, N1 parties, and one PO1 per line. Pure + deterministic; the
 * timestamp is supplied by the caller.
 *
 * Element separator `*`, segment terminator `~` (the common X12 defaults).
 */

const EL = "*";
const SEG = "~";

/** "2026-06-14T15:04:00Z" → { ymd: "20260614", yymd: "260614", hm: "1504" } */
function parseStamp(iso: string): { ymd: string; yymd: string; hm: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return { ymd: "20000101", yymd: "000101", hm: "0000" };
  const [, y, mo, d, h, mi] = m;
  return { ymd: `${y}${mo}${d}`, yymd: `${y.slice(2)}${mo}${d}`, hm: `${h}${mi}` };
}

const pad = (s: string, n: number) => (s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length));

export function buildEdi850(order: ProcurementOrder, controlNumber = 1): string {
  const { ymd, yymd, hm } = parseStamp(order.timestamp);
  const ctrl = String(controlNumber).padStart(9, "0");
  const grp = String(controlNumber);
  const st = "0001";

  const seg: string[] = [];
  seg.push(
    [
      "ISA", "00", pad("", 10), "00", pad("", 10),
      "ZZ", pad(order.supplierId, 15), "ZZ", pad(order.buyerId, 15),
      yymd, hm, "U", "00401", ctrl, "0", "P", ">",
    ].join(EL)
  );
  seg.push(["GS", "PO", order.supplierId, order.buyerId, ymd, hm, grp, "X", "004010"].join(EL));

  const body: string[] = [];
  body.push(["ST", "850", st].join(EL));
  body.push(["BEG", "00", "NE", order.poNumber, "", ymd].join(EL));
  body.push(["N1", "SU", order.supplierName].join(EL));
  body.push(["N1", "BY", order.buyerName].join(EL));
  order.lines.forEach((l, i) => {
    // PO1 carries repeating product/service ID pairs; append UN (UNSPSC) when known.
    const po1 = ["PO1", String(i + 1), String(l.qty), l.uom, l.unitPrice.toFixed(2), "PE", "VP", l.sku, "MG", l.brand];
    if (l.unspsc) po1.push("UN", l.unspsc);
    body.push(po1.join(EL));
    body.push(["PID", "F", "", "", "", l.name].join(EL));
  });
  body.push(["CTT", String(order.lines.length)].join(EL));
  // SE counts ST … SE inclusive.
  body.push(["SE", String(body.length + 1), st].join(EL));

  seg.push(...body);
  seg.push(["GE", "1", grp].join(EL));
  seg.push(["IEA", "1", ctrl].join(EL));

  return seg.map((s) => s + SEG).join("\n") + "\n";
}
