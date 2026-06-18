import {
  type ProcurementOrder,
  type OrderConfirmationInput,
  type ShipNoticeInput,
  orderTotal,
} from "@/lib/procurement/types";

/**
 * cXML PunchOutOrderMessage generator — the payload a punchout buyer's
 * procurement system (Ariba, Coupa, SAP SRM) receives when the rep returns a
 * cart. Standard cXML 1.2.014 shape: Header credentials + a PunchOutOrderMessage
 * with the total and one ItemIn per line. Pure + deterministic.
 */

const CURRENCY = "USD";

function esc(s: string): string {
  return s
    // Drop characters that are illegal in XML 1.0 (NUL + other C0 controls, minus
    // tab/LF/CR) so a stray control char can't yield non-well-formed cXML that the
    // buyer's parser rejects. Attributes are double-quoted, so a single quote is safe.
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPunchOutCxml(order: ProcurementOrder): string {
  const total = orderTotal(order).toFixed(2);
  const items = order.lines
    .map(
      (l) => `    <ItemIn quantity="${l.qty}">
      <ItemID>
        <SupplierPartID>${esc(l.sku)}</SupplierPartID>
      </ItemID>
      <ItemDetail>
        <UnitPrice>
          <Money currency="${CURRENCY}">${l.unitPrice.toFixed(2)}</Money>
        </UnitPrice>
        <Description xml:lang="en">${esc(l.name)}</Description>
        <UnitOfMeasure>${esc(l.uom)}</UnitOfMeasure>
        <Classification domain="UNSPSC">${esc(l.unspsc ?? "39120000")}</Classification>
        <ManufacturerName>${esc(l.brand)}</ManufacturerName>
      </ItemDetail>
    </ItemIn>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd">
<cXML payloadID="${esc(order.poNumber)}@meridiansupply.com" timestamp="${esc(order.timestamp)}">
  <Header>
    <From>
      <Credential domain="DUNS">
        <Identity>${esc(order.supplierId)}</Identity>
      </Credential>
    </From>
    <To>
      <Credential domain="DUNS">
        <Identity>${esc(order.buyerId)}</Identity>
      </Credential>
    </To>
    <Sender>
      <Credential domain="DUNS">
        <Identity>${esc(order.supplierId)}</Identity>
      </Credential>
      <UserAgent>${esc(order.supplierName)} Product Finder</UserAgent>
    </Sender>
  </Header>
  <Message>
    <PunchOutOrderMessage>
      <BuyerCookie>${esc(order.poNumber)}</BuyerCookie>
      <PunchOutOrderMessageHeader operationAllowed="create">
        <Total>
          <Money currency="${CURRENCY}">${total}</Money>
        </Total>
      </PunchOutOrderMessageHeader>
${items}
    </PunchOutOrderMessage>
  </Message>
</cXML>
`;
}

/**
 * cXML Header for a supplier→buyer LIFECYCLE document (OrderConfirmation /
 * ShipNotice). Orientation matches buildPunchOutCxml (From/Sender = supplier,
 * To = buyer). Kept separate so the locked PunchOut output is never touched.
 */
function lifecycleHeader(order: ProcurementOrder): string {
  return `  <Header>
    <From>
      <Credential domain="DUNS">
        <Identity>${esc(order.supplierId)}</Identity>
      </Credential>
    </From>
    <To>
      <Credential domain="DUNS">
        <Identity>${esc(order.buyerId)}</Identity>
      </Credential>
    </To>
    <Sender>
      <Credential domain="DUNS">
        <Identity>${esc(order.supplierId)}</Identity>
      </Credential>
      <UserAgent>${esc(order.supplierName)} Product Finder</UserAgent>
    </Sender>
  </Header>`;
}

/** Reference back to the buyer's original PO (shared by both lifecycle docs). */
function orderReference(order: ProcurementOrder): string {
  return `      <OrderReference orderID="${esc(order.poNumber)}">
        <DocumentReference payloadID="${esc(order.poNumber)}@meridiansupply.com" />
      </OrderReference>`;
}

/**
 * cXML OrderConfirmationRequest — the supplier's response to a received PO:
 * accept the whole order, confirm line-by-line (detail), or reject. cXML
 * 1.2.014 shape; reuses ProcurementOrder + esc(). Pure + deterministic (the
 * notice/ship dates are passed in). Operator-triggered, never scheduled.
 */
export function buildOrderConfirmationCxml(order: ProcurementOrder, input: OrderConfirmationInput): string {
  const total = orderTotal(order).toFixed(2);
  const shipDateAttr = input.estimatedShipDate ? ` shipmentDate="${esc(input.estimatedShipDate)}"` : "";
  // For an "accept" we still emit per-line ConfirmationStatus="accept" so the
  // buyer's system books each line; "reject" marks every line rejected.
  const lineStatus = input.status === "reject" ? "reject" : "accept";
  const items = order.lines
    .map(
      (l, i) => `      <ConfirmationItem quantity="${l.qty}" lineNumber="${i + 1}">
        <UnitOfMeasure>${esc(l.uom)}</UnitOfMeasure>
        <ConfirmationStatus type="${lineStatus}" quantity="${l.qty}"${shipDateAttr}>
          <UnitPrice>
            <Money currency="${CURRENCY}">${l.unitPrice.toFixed(2)}</Money>
          </UnitPrice>
          <ItemID>
            <SupplierPartID>${esc(l.sku)}</SupplierPartID>
          </ItemID>
        </ConfirmationStatus>
      </ConfirmationItem>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd">
<cXML payloadID="${esc(order.poNumber)}-conf@meridiansupply.com" timestamp="${esc(input.noticeDate)}">
${lifecycleHeader(order)}
  <Request>
    <ConfirmationRequest>
      <ConfirmationHeader operation="new" type="${esc(input.status)}" noticeDate="${esc(input.noticeDate)}"${shipDateAttr}>
        <Total>
          <Money currency="${CURRENCY}">${total}</Money>
        </Total>
      </ConfirmationHeader>
${orderReference(order)}
${items}
    </ConfirmationRequest>
  </Request>
</cXML>
`;
}

/**
 * cXML ShipNoticeRequest (Advance Ship Notice / ASN) — what shipped, when, and
 * how, referencing the original PO. Carrier/tracking are optional (the tracking
 * model carries neither, so the ShipControl block is omitted unless supplied —
 * graceful degrade). Will-call shipments are annotated. Pure + deterministic.
 */
export function buildShipNoticeCxml(order: ProcurementOrder, input: ShipNoticeInput): string {
  const deliveryAttr = input.deliveryDate ? ` deliveryDate="${esc(input.deliveryDate)}"` : "";
  const shipControl =
    input.carrier || input.trackingNumber
      ? `      <ShipControl>
${input.carrier ? `        <CarrierIdentifier domain="companyName">${esc(input.carrier)}</CarrierIdentifier>\n` : ""}${
          input.trackingNumber ? `        <ShipmentIdentifier>${esc(input.trackingNumber)}</ShipmentIdentifier>\n` : ""
        }      </ShipControl>\n`
      : "";
  const methodNote =
    input.method === "willcall"
      ? `      <Comments xml:lang="en">Will-call: staged for customer pickup at branch.</Comments>\n`
      : "";
  const items = order.lines
    .map(
      (l, i) => `        <ShipNoticeItem quantity="${l.qty}" lineNumber="${i + 1}">
          <UnitOfMeasure>${esc(l.uom)}</UnitOfMeasure>
          <ItemID>
            <SupplierPartID>${esc(l.sku)}</SupplierPartID>
          </ItemID>
        </ShipNoticeItem>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd">
<cXML payloadID="${esc(input.shipmentId)}@meridiansupply.com" timestamp="${esc(input.noticeDate)}">
${lifecycleHeader(order)}
  <Request>
    <ShipNoticeRequest>
      <ShipNoticeHeader shipmentID="${esc(input.shipmentId)}" noticeDate="${esc(input.noticeDate)}" shipmentDate="${esc(input.shipDate)}"${deliveryAttr} />
${methodNote}${shipControl}      <ShipNoticePortion>
${orderReference(order)}
${items}
      </ShipNoticePortion>
    </ShipNoticeRequest>
  </Request>
</cXML>
`;
}
