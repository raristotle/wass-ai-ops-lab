import { type ProcurementOrder, orderTotal } from "@/lib/procurement/types";

/**
 * cXML PunchOutOrderMessage generator — the payload a punchout buyer's
 * procurement system (Ariba, Coupa, SAP SRM) receives when the rep returns a
 * cart. Standard cXML 1.2.014 shape: Header credentials + a PunchOutOrderMessage
 * with the total and one ItemIn per line. Pure + deterministic.
 */

const CURRENCY = "USD";

function esc(s: string): string {
  return s
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
