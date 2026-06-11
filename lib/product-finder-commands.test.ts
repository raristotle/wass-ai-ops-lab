import { describe, it, expect } from "vitest";
import { DEMO_ACCOUNTS } from "@/lib/product-finder-store";
import {
  QUICK_PICKS,
  buildCommandRegistry,
  searchFallback,
  filterCommands,
  paletteItems,
  moveSelection,
} from "@/lib/product-finder-commands";
import type { CommandContext } from "@/lib/product-finder-commands";

const asCtx = (role: CommandContext["role"]): CommandContext => ({ role });

describe("buildCommandRegistry", () => {
  it("sales and signed-out contexts omit nav-insights", () => {
    for (const role of ["sales", null] as const) {
      const ids = buildCommandRegistry(asCtx(role)).map((i) => i.id);
      expect(ids, String(role)).not.toContain("nav-insights");
      expect(ids).toContain("nav-search");
    }
  });

  it("manager and admin contexts include nav-insights", () => {
    for (const role of ["manager", "admin"] as const) {
      const ids = buildCommandRegistry(asCtx(role)).map((i) => i.id);
      expect(ids, role).toContain("nav-insights");
    }
  });

  it("includes the open-* and tour-restart items", () => {
    const ids = buildCommandRegistry(asCtx("sales")).map((i) => i.id);
    for (const id of ["open-cart", "open-help", "open-bom", "open-bulk", "tour-restart"]) {
      expect(ids).toContain(id);
    }
  });

  it("has exactly 3 role-* items matching DEMO_ACCOUNTS emails", () => {
    const roleItems = buildCommandRegistry(asCtx("sales")).filter((i) => i.id.startsWith("role-"));
    expect(roleItems).toHaveLength(3);
    expect(roleItems.map((i) => i.id).sort()).toEqual(
      DEMO_ACCOUNTS.map((a) => `role-${a.email}`).sort(),
    );
    for (const item of roleItems) {
      const action = item.action;
      expect(action.kind).toBe("role");
      if (action.kind === "role") {
        expect(DEMO_ACCOUNTS.some((a) => a.email === action.email)).toBe(true);
      }
    }
  });

  it("has one quickpick-* item per QUICK_PICKS entry, kebab-cased", () => {
    const picks = buildCommandRegistry(asCtx("sales")).filter((i) => i.id.startsWith("quickpick-"));
    expect(picks).toHaveLength(QUICK_PICKS.length);
    expect(picks.map((i) => i.id)).toContain("quickpick-circuit-breakers");
    expect(picks.map((i) => i.id)).toContain("quickpick-cat6-cable");
    for (const item of picks) {
      expect(item.action.kind).toBe("search");
    }
  });

  it("QUICK_PICKS matches the SearchBar's original list verbatim", () => {
    expect(QUICK_PICKS).toEqual([
      "Circuit Breakers", "Cat6 Cable", "IP Cameras", "Safety Glasses", "Relays", "Displays",
    ]);
  });

  it("ids are unique", () => {
    const ids = buildCommandRegistry(asCtx("admin")).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("searchFallback", () => {
  it("embeds the input in the label and the action", () => {
    const item = searchFallback("tamper resistant outlet");
    expect(item.id).toBe("search-input");
    expect(item.label).toBe('Search for "tamper resistant outlet"');
    expect(item.action).toEqual({ kind: "search", query: "tamper resistant outlet" });
  });
});

describe("filterCommands", () => {
  it("matches case-insensitively on label", () => {
    const items = buildCommandRegistry(asCtx("manager"));
    const hits = filterCommands(items, "INSIGHTS");
    expect(hits.some((i) => i.id === "nav-insights")).toBe(true);
  });

  it("matches on keywords", () => {
    const items = buildCommandRegistry(asCtx("sales"));
    const hits = filterCommands(items, "basket");
    expect(hits.some((i) => i.id === "open-cart")).toBe(true);
  });

  it("empty input returns everything", () => {
    const items = buildCommandRegistry(asCtx("sales"));
    expect(filterCommands(items, "")).toHaveLength(items.length);
  });
});

describe("paletteItems", () => {
  it("empty input → full registry, no fallback", () => {
    const items = paletteItems(asCtx("sales"), "");
    expect(items).toHaveLength(buildCommandRegistry(asCtx("sales")).length);
    expect(items.some((i) => i.id === "search-input")).toBe(false);
  });

  it("garbage input → exactly [fallback]", () => {
    const items = paletteItems(asCtx("sales"), "zzzznotathing");
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("search-input");
    expect(items[0].label).toBe('Search for "zzzznotathing"');
  });

  it("matching input → matches with fallback appended last", () => {
    const items = paletteItems(asCtx("sales"), "cart");
    expect(items.length).toBeGreaterThan(1);
    expect(items[items.length - 1].id).toBe("search-input");
    expect(items.some((i) => i.id === "open-cart")).toBe(true);
  });

  it("fallback label embeds the raw input", () => {
    const items = paletteItems(asCtx("sales"), "weird input!");
    expect(items[items.length - 1].label).toBe('Search for "weird input!"');
  });
});

describe("moveSelection", () => {
  it("wraps forward past the end", () => {
    expect(moveSelection(4, 1, 5)).toBe(0);
    expect(moveSelection(0, 1, 5)).toBe(1);
  });

  it("wraps backward past the start", () => {
    expect(moveSelection(0, -1, 5)).toBe(4);
    expect(moveSelection(3, -1, 5)).toBe(2);
  });

  it("length 0 → 0", () => {
    expect(moveSelection(0, 1, 0)).toBe(0);
    expect(moveSelection(5, -1, 0)).toBe(0);
  });

  it("length 1 always lands on 0", () => {
    expect(moveSelection(0, 1, 1)).toBe(0);
    expect(moveSelection(0, -1, 1)).toBe(0);
  });
});
