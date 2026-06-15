/**
 * cXML PunchOut SETUP — the entry handshake (distinct from the cart-return
 * PunchOutOrderMessage in cxml.ts). The buyer's procurement system POSTs a
 * PunchOutSetupRequest; we answer with a PunchOutSetupResponse carrying the
 * StartPage URL their browser opens.
 *
 * **Level 2** punchout = the request can target a SPECIFIC item (a `SelectedItem`
 * with a SupplierPartID), and we deep-link the StartPage straight to that
 * product's detail — vs Level 1, which only lands on the store home. Pure +
 * deterministic; the route wires it to the live store URL.
 */

export type PunchOutOperation = "create" | "edit" | "inspect";

export interface ParsedSetupRequest {
  operation: PunchOutOperation;
  buyerCookie: string;
  /** SelectedItem SupplierPartID — present on a Level-2 (item-level) punchout. */
  selectedItemId: string | null;
  level: 1 | 2;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function extract(re: RegExp, xml: string): string | null {
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

/** Parse a PunchOutSetupRequest, detecting a Level-2 item-level entry. Tolerant
 *  of standards-valid cXML variation: attributes on the tags and either quote
 *  style on the operation attribute. */
export function parsePunchOutSetupRequest(xml: string): ParsedSetupRequest {
  const operation = (extract(/<PunchOutSetupRequest[^>]*\boperation=["']([^"']+)["']/, xml) ?? "create") as PunchOutOperation;
  const buyerCookie = extract(/<BuyerCookie\b[^>]*>([\s\S]*?)<\/BuyerCookie>/, xml) ?? "";
  const selectedItemId = extract(
    /<SelectedItem\b[^>]*>[\s\S]*?<SupplierPartID\b[^>]*>([\s\S]*?)<\/SupplierPartID>[\s\S]*?<\/SelectedItem>/,
    xml,
  );
  const item = selectedItemId?.trim() || null;
  return { operation, buyerCookie, selectedItemId: item, level: item ? 2 : 1 };
}

/** Build the StartPage URL — deep-linked to a SKU for a Level-2 entry, else the store home. */
export function punchoutStartUrl(base: string, sku: string | null): string {
  const b = base.replace(/\/$/, "");
  return sku ? `${b}/product-finder?sku=${encodeURIComponent(sku)}` : `${b}/product-finder`;
}

export interface SetupResponseOptions {
  payloadID: string;
  timestamp: string;
  startUrl: string;
}

/** Build the cXML PunchOutSetupResponse (Status 200 + StartPage URL). */
export function buildPunchOutSetupResponse(opts: SetupResponseOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd">
<cXML payloadID="${esc(opts.payloadID)}@meridiansupply.com" timestamp="${esc(opts.timestamp)}">
  <Response>
    <Status code="200" text="OK"/>
    <PunchOutSetupResponse>
      <StartPage>
        <URL>${esc(opts.startUrl)}</URL>
      </StartPage>
    </PunchOutSetupResponse>
  </Response>
</cXML>
`;
}
