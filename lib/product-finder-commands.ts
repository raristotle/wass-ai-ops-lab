/**
 * lib/product-finder-commands.ts — command-palette registry and helpers.
 *
 * Pure data + pure functions: the palette UI renders whatever this module
 * returns. Role-gated items (Insights) are filtered by the CommandContext.
 */

import type { AuthUser } from "@/features/product-finder/types";
import { DEMO_ACCOUNTS } from "@/lib/product-finder-store";

/** Quick-pick searches shown under the search bar (single source of truth). */
export const QUICK_PICKS: readonly string[] = [
  "Circuit Breakers", "Cat6 Cable", "IP Cameras", "Safety Glasses", "Relays", "Displays",
];

export type CommandAction =
  | { kind: "navigate"; href: string }
  | { kind: "open"; target: "cart" | "help" | "bom" | "bulk" | "jobwizard" }
  | { kind: "tour" }
  | { kind: "role"; email: string }
  | { kind: "search"; query: string };

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  keywords?: string[];
  action: CommandAction;
}

export interface CommandContext {
  role: AuthUser["role"] | null;
}

function kebabCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build the full command registry for the given role context. */
export function buildCommandRegistry(ctx: CommandContext): CommandItem[] {
  const items: CommandItem[] = [];

  items.push({
    id: "nav-search",
    label: "Go to product search",
    group: "Navigate",
    keywords: ["home", "products", "finder"],
    action: { kind: "navigate", href: "/product-finder" },
  });
  if (ctx.role === "manager" || ctx.role === "admin") {
    items.push({
      id: "nav-insights",
      label: "Go to Insights dashboard",
      group: "Navigate",
      keywords: ["analytics", "dashboard", "kpi", "pipeline"],
      action: { kind: "navigate", href: "/product-finder/dashboard" },
    });
  }
  items.push({
    id: "nav-crosses",
    label: "Open Cross-Reference Explorer",
    group: "Navigate",
    keywords: ["cross", "crosses", "xref", "substitutes", "sources", "registry"],
    action: { kind: "navigate", href: "/product-finder/crosses" },
  });

  items.push(
    {
      id: "open-cart",
      label: "Open cart",
      group: "Open",
      keywords: ["basket", "quote", "orders"],
      action: { kind: "open", target: "cart" },
    },
    {
      id: "open-help",
      label: "Open help",
      group: "Open",
      keywords: ["docs", "guide", "faq"],
      action: { kind: "open", target: "help" },
    },
    {
      id: "open-bom",
      label: "Import list / BOM",
      group: "Open",
      keywords: ["bill of materials", "paste", "upload", "parts list"],
      action: { kind: "open", target: "bom" },
    },
    {
      id: "open-bulk",
      label: "Bulk price check",
      group: "Open",
      keywords: ["rfq", "availability", "price check"],
      action: { kind: "open", target: "bulk" },
    },
    {
      id: "open-jobwizard",
      label: "Start a job — Ask Meridian wizard",
      group: "Open",
      keywords: ["job wizard", "ask meridian", "bill of materials", "guided", "build"],
      action: { kind: "open", target: "jobwizard" },
    },
    {
      id: "tour-restart",
      label: "Restart the product tour",
      group: "Help",
      keywords: ["onboarding", "walkthrough", "welcome"],
      action: { kind: "tour" },
    },
  );

  for (const account of DEMO_ACCOUNTS) {
    items.push({
      id: `role-${account.email}`,
      label: `Switch to ${account.name} (${account.role})`,
      group: "Switch role",
      keywords: ["login", "account", account.role, account.email],
      action: { kind: "role", email: account.email },
    });
  }

  for (const pick of QUICK_PICKS) {
    items.push({
      id: `quickpick-${kebabCase(pick)}`,
      label: `Search: ${pick}`,
      group: "Quick picks",
      keywords: [pick],
      action: { kind: "search", query: pick },
    });
  }

  return items;
}

/** The always-available "search for what you typed" fallback item. */
export function searchFallback(input: string): CommandItem {
  return {
    id: "search-input",
    label: `Search for "${input}"`,
    group: "Search",
    action: { kind: "search", query: input },
  };
}

/** Case-insensitive substring filter over label + keywords. */
export function filterCommands(items: CommandItem[], input: string): CommandItem[] {
  const needle = input.trim().toLowerCase();
  if (!needle) return items;
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(needle) ||
      (item.keywords ?? []).some((k) => k.toLowerCase().includes(needle)),
  );
}

/**
 * What the palette shows for the given input:
 * - empty input → the full registry, no fallback;
 * - otherwise → matches with the search fallback appended last;
 * - no matches → just the fallback.
 */
export function paletteItems(ctx: CommandContext, input: string): CommandItem[] {
  const registry = buildCommandRegistry(ctx);
  if (!input.trim()) return registry;
  const matches = filterCommands(registry, input);
  return [...matches, searchFallback(input)];
}

/** Move the keyboard selection by ±1 with wrap-around; length 0 → 0. */
export function moveSelection(current: number, delta: -1 | 1, length: number): number {
  if (length <= 0) return 0;
  return ((current + delta) % length + length) % length;
}
