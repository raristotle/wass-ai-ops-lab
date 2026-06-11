import { describe, it, expect } from "vitest";
import {
  quoteEvent,
  appendEvent,
  EVENT_CAP,
  EVENT_ICON,
  EVENT_LABEL,
  type QuoteEventKind,
} from "@/lib/product-finder-quote-events";

const NOW = 1_781_300_000_000;

describe("quoteEvent", () => {
  it("builds a trimmed event with optional actor", () => {
    expect(quoteEvent("status", "  Draft → Sent  ", NOW, " Sarah Chen ")).toEqual({
      at: NOW,
      kind: "status",
      detail: "Draft → Sent",
      actor: "Sarah Chen",
    });
  });

  it("omits empty actors", () => {
    expect(quoteEvent("created", "x", NOW, "  ").actor).toBeUndefined();
    expect(quoteEvent("created", "x", NOW).actor).toBeUndefined();
  });
});

describe("appendEvent", () => {
  it("appends newest-last and tolerates undefined history", () => {
    const first = appendEvent(undefined, quoteEvent("created", "a", NOW));
    const second = appendEvent(first, quoteEvent("status", "b", NOW + 1));
    expect(second.map((e) => e.detail)).toEqual(["a", "b"]);
    // input untouched
    expect(first).toHaveLength(1);
  });

  it(`caps the trail at ${EVENT_CAP}, dropping the oldest`, () => {
    let events = appendEvent(undefined, quoteEvent("created", "e0", NOW));
    for (let i = 1; i <= EVENT_CAP + 5; i++) {
      events = appendEvent(events, quoteEvent("status", `e${i}`, NOW + i));
    }
    expect(events).toHaveLength(EVENT_CAP);
    expect(events[0].detail).toBe(`e${5 + 1}`);
    expect(events[events.length - 1].detail).toBe(`e${EVENT_CAP + 5}`);
  });
});

describe("icon/label maps", () => {
  it("cover every kind", () => {
    const kinds: QuoteEventKind[] = ["created", "status", "approval", "counter", "converted", "link-copied", "revised"];
    for (const k of kinds) {
      expect(EVENT_ICON[k], k).toBeTruthy();
      expect(EVENT_LABEL[k], k).toBeTruthy();
    }
  });
});
