/**
 * CIF 3.0 (Catalog Interchange Format) generator — the static, flat-file catalog
 * a buyer loads into Ariba / SAP so Meridian items appear in their procurement
 * system without a live punchout. Pure + deterministic (timestamp injected).
 *
 * Standard CIF_I_V3.0 layout: a header block, FIELDNAMES, a DATA section of
 * quoted rows, and ENDOFDATA. Pairs with the Level-2 punchout (each row carries
 * the item Supplier URL that deep-links back into the store).
 */

export interface CifRow {
  sku: string;
  manufacturerPartId: string;
  description: string;
  /** 8-digit UNSPSC commodity code. */
  unspsc: string;
  unitPrice: number;
  uom: string;
  leadTimeDays: number;
  manufacturerName: string;
  /** Item-level deep link (Level-2 punchout target). */
  supplierUrl: string;
}

export interface CifOptions {
  supplierId: string; // DUNS
  supplierName: string;
  timestamp: string; // ISO, injected for determinism
  rows: CifRow[];
}

const FIELDNAMES = [
  "Supplier ID",
  "Supplier Part ID",
  "Manufacturer Part ID",
  "Item Description",
  "SPSC Code",
  "Unit Price",
  "Unit of Measure",
  "Lead Time",
  "Manufacturer Name",
  "Supplier URL",
  "Market Price",
  "Currency",
];

/** Quote a CIF field — wrap in double quotes, double any internal quote. */
function q(s: string | number): string {
  return `"${String(s).replace(/"/g, '""')}"`;
}

export function buildCif(opts: CifOptions): string {
  const head = [
    "CIF_I_V3.0",
    "LOADMODE: F",
    "CODEFORMAT: UNSPSC",
    "CURRENCY: USD",
    "SUPPLIERID_DOMAIN: DUNS",
    `ITEMCOUNT: ${opts.rows.length}`,
    `TIMESTAMP: ${opts.timestamp}`,
    `COMMENTS: ${opts.supplierName} catalog export`,
    `FIELDNAMES: ${FIELDNAMES.join(",")}`,
    "DATA",
  ];
  const data = opts.rows.map((r) =>
    [
      q(opts.supplierId),
      q(r.sku),
      q(r.manufacturerPartId),
      q(r.description),
      q(r.unspsc),
      q(r.unitPrice.toFixed(2)),
      q(r.uom),
      q(r.leadTimeDays),
      q(r.manufacturerName),
      q(r.supplierUrl),
      q(r.unitPrice.toFixed(2)),
      q("USD"),
    ].join(","),
  );
  return [...head, ...data, "ENDOFDATA", ""].join("\n");
}
