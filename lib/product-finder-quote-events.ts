/**
 * Quote audit trail — pure event helpers.
 * Events are appended by store actions (with the active user as actor) and
 * rendered as an expandable History on each saved-quote row. Append-only,
 * capped, never required (old quotes simply have no history yet).
 */

export type QuoteEventKind =
  | "created"
  | "status"
  | "approval"
  | "counter"
  | "converted"
  | "link-copied"
  | "revised";

export interface QuoteEvent {
  at: number;
  kind: QuoteEventKind;
  /** Human sentence fragment, e.g. "Status Draft → Sent". */
  detail: string;
  /** Who did it — a rep/manager name, or "Customer" for link-side events. */
  actor?: string;
}

/** Hard cap per quote — the trail is a receipt, not a database. */
export const EVENT_CAP = 50;

export const EVENT_ICON: Record<QuoteEventKind, string> = {
  created: "📝",
  status: "🔄",
  approval: "🛡️",
  counter: "↩️",
  converted: "📦",
  "link-copied": "🔗",
  revised: "🆕",
};

export const EVENT_LABEL: Record<QuoteEventKind, string> = {
  created: "Created",
  status: "Status",
  approval: "Approval",
  counter: "Counter-offer",
  converted: "Converted",
  "link-copied": "Customer link",
  revised: "Revised",
};

/** Build an event (trims detail; drops empty actor). */
export function quoteEvent(
  kind: QuoteEventKind,
  detail: string,
  at: number,
  actor?: string
): QuoteEvent {
  const e: QuoteEvent = { at, kind, detail: detail.trim() };
  if (actor && actor.trim()) e.actor = actor.trim();
  return e;
}

/** Append newest-last, dropping the oldest beyond EVENT_CAP. Input untouched. */
export function appendEvent(
  events: readonly QuoteEvent[] | undefined,
  event: QuoteEvent
): QuoteEvent[] {
  const next = [...(events ?? []), event];
  return next.length > EVENT_CAP ? next.slice(next.length - EVENT_CAP) : next;
}
