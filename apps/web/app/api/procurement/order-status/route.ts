import { NextResponse } from "next/server";
import { z } from "zod";
import { buildOrderConfirmationCxml, buildShipNoticeCxml } from "@/lib/procurement/cxml";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";

export const dynamic = "force-dynamic";

/**
 * Order-lifecycle cXML emitter (v3-S6 #13): turns a placed order + its status
 * into the supplier→buyer documents a procurement system expects AFTER the PO —
 * an OrderConfirmation (we accept/detail/reject the PO) or a ShipNotice/ASN
 * (what shipped, when, how). Document generation is deterministic/$0; the
 * generators are pure + tested. Transmission is OPERATOR-TRIGGERED only (this
 * POST, fired from the order view / an authenticated agent) — NEVER scheduled,
 * per the project no-cron rule. Like the CIF/PunchOut endpoints, the order +
 * status are supplied in the request body (no tenant data is read), so this is
 * an external B2B surface: rate-limited + body-capped, not session-gated.
 */
const MAX_BODY_BYTES = 256_000;

const LineSchema = z.object({
  sku: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(300),
  brand: z.string().trim().max(120).default(""),
  qty: z.number().int().positive().max(1_000_000),
  unitPrice: z.number().nonnegative().max(10_000_000),
  uom: z.string().trim().min(1).max(20),
  unspsc: z.string().trim().max(20).optional(),
});

const OrderSchema = z.object({
  poNumber: z.string().trim().min(1).max(120),
  timestamp: z.string().trim().min(1).max(40),
  supplierName: z.string().trim().min(1).max(200),
  supplierId: z.string().trim().min(1).max(120),
  buyerName: z.string().trim().min(1).max(200),
  buyerId: z.string().trim().min(1).max(120),
  lines: z.array(LineSchema).min(1).max(500),
});

const ConfirmationSchema = z.object({
  noticeDate: z.string().trim().min(1).max(40),
  status: z.enum(["accept", "detail", "reject"]),
  estimatedShipDate: z.string().trim().max(40).optional(),
});

const ShipmentSchema = z.object({
  shipmentId: z.string().trim().min(1).max(120),
  noticeDate: z.string().trim().min(1).max(40),
  shipDate: z.string().trim().min(1).max(40),
  deliveryDate: z.string().trim().max(40).optional(),
  carrier: z.string().trim().max(120).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
  method: z.enum(["delivery", "willcall"]).optional(),
});

const BodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("confirmation"), order: OrderSchema, confirmation: ConfirmationSchema }),
  z.object({ kind: z.literal("shipnotice"), order: OrderSchema, shipment: ShipmentSchema }),
]);

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return new Response("Payload too large.", { status: 413 });
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return new Response("Payload too large.", { status: 413 });

    const parsed = BodySchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    const xml =
      body.kind === "confirmation"
        ? buildOrderConfirmationCxml(body.order, body.confirmation)
        : buildShipNoticeCxml(body.order, body.shipment);
    const filename = body.kind === "confirmation" ? "order-confirmation.xml" : "ship-notice.xml";

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-cXML-Document": body.kind,
      },
    });
  } catch (e) {
    logApiError("/api/procurement/order-status", e);
    return new Response("Order-status document generation failed.", { status: 400 });
  }
}

export function GET() {
  return NextResponse.json({
    endpoint: "cXML OrderConfirmation / ShipNotice emitter",
    method: "POST",
    kinds: ["confirmation", "shipnotice"],
    note: "POST { kind, order, confirmation|shipment }. Operator-triggered (never cron). Returns a cXML ConfirmationRequest or ShipNoticeRequest for the buyer's procurement system.",
  });
}
