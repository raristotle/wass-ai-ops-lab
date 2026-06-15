/**
 * Order tracking — derive a deterministic shipment status timeline from an
 * order's placed-at time and its delivery ETA (reusing the existing delivery
 * engine for the ETA). Closes the gap the app had after checkout: a status
 * timeline, a promised date, and jobsite-delivery vs will-call framing. Pure +
 * deterministic (now is injected) so it is fully testable; the UI passes the
 * ETA days from lib/product-finder-delivery and the rep's chosen method.
 */

const DAY_MS = 86_400_000;

export type FulfillmentMethod = "delivery" | "willcall";

export interface TrackStage {
  key: string;
  label: string;
  /** Epoch ms this stage is reached. */
  at: number;
  done: boolean;
  current: boolean;
}

export interface OrderTracking {
  method: FulfillmentMethod;
  /** Current stage label. */
  status: string;
  /** Promised completion (delivered / ready-for-pickup) timestamp. */
  etaAt: number;
  delivered: boolean;
  stages: TrackStage[];
}

interface StageDef {
  key: string;
  /** Fraction (0–1) of the order→ETA window at which this stage is reached. */
  frac: number;
  delivery: string;
  willcall: string;
}

const STAGE_DEFS: StageDef[] = [
  { key: "placed", frac: 0, delivery: "Order placed", willcall: "Order placed" },
  { key: "confirmed", frac: 0.08, delivery: "Confirmed", willcall: "Confirmed" },
  { key: "processing", frac: 0.25, delivery: "Processing at branch", willcall: "Processing at branch" },
  { key: "shipped", frac: 0.55, delivery: "Shipped", willcall: "Staged for pickup" },
  { key: "out", frac: 0.85, delivery: "Out for delivery", willcall: "Ready for pickup" },
  { key: "done", frac: 1, delivery: "Delivered", willcall: "Picked up" },
];

/** Build the tracking timeline for an order. */
export function orderTracking(
  input: { placedAt: number; etaDays: number; method: FulfillmentMethod },
  now: number,
): OrderTracking {
  const { placedAt, method } = input;
  const windowMs = Math.max(1, input.etaDays) * DAY_MS;
  const label = (d: StageDef) => (method === "willcall" ? d.willcall : d.delivery);

  const stages: TrackStage[] = STAGE_DEFS.map((d) => ({
    key: d.key,
    label: label(d),
    at: placedAt + d.frac * windowMs,
    done: now >= placedAt + d.frac * windowMs,
    current: false,
  }));

  // Current = the latest done stage.
  let currentIdx = 0;
  for (let i = 0; i < stages.length; i++) if (stages[i].done) currentIdx = i;
  stages[currentIdx].current = true;

  const etaAt = placedAt + windowMs;
  return {
    method,
    status: stages[currentIdx].label,
    etaAt,
    delivered: stages[stages.length - 1].done,
    stages,
  };
}
