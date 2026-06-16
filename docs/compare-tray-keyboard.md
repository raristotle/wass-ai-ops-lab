# Sticky compare tray + keyboard power layer (Sprint 1 · #3, #13)

Two best-of-breed UX upgrades to the results surface. Free; front-end only; no env vars.

## Sticky compare tray (#3)

`features/product-finder/CompareTray.tsx` — a Digi-Key/Mouser-style persistent bottom bar that
accumulates compare selections **across result pages and views** (mounted in the shell, not the
results page, so it survives pagination and view switches) and opens the existing spec-compare modal.

- Product chips with a remove (×) per item; "Compare N" opens the modal; "Clear" empties the set.
- Each chip flags the **cheapest** (`$ low`) and **most-available** (`in stock`) option, computed from
  data already in hand (`unitPrice`, branch + DC stock).
- Replaces the old in-grid compare bar in `ProductGrid` (CSV export and the rest of the results bar
  stay). The results list gets bottom padding while the tray is shown so it never covers the last row.
- The spec-compare modal already diff-highlights differing rows and flags the cheapest column.

## Keyboard power layer (#13)

`features/product-finder/useResultsKeyboard.ts` — a Superhuman-style keyboard layer mounted by
`ProductGrid` over the currently-rendered results (so the highlight index aligns across list / grid /
table). `features/product-finder/KeyboardHelpModal.tsx` is the `?` cheatsheet.

| Key | Action |
|---|---|
| `j` / `↓` | Next result |
| `k` / `↑` | Previous result |
| `a` | Add highlighted result to cart |
| `c` | Toggle highlighted result in compare |
| `Enter` | Open highlighted result |
| `?` | Show shortcuts |
| `Ctrl/⌘ K` | Command palette (existing) |

- The highlighted item gets a green ring (list/grid) or row outline (table) and scrolls into view.
- Inert while typing in an input/textarea/select or while any dialog is open (guards on
  `aria-modal`), so it never hijacks normal input. A "Press ? for shortcuts" hint sits in the results
  bar (desktop only). State: `activeResultIndex` + `keyboardHelpOpen` in the store.

## Verify

- Compare: check products from different result pages → the tray persists and accumulates (cap 4) →
  "Compare N" opens the spec modal.
- Keyboard: on the results page press `j`/`k` to move the highlight, `a` to add, `c` to compare,
  `?` for help. Confirm it does nothing while the search box is focused or a modal is open.
