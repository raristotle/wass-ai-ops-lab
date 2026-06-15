# Accessibility — WCAG 2.2 AA conformance

The Product Finder targets **WCAG 2.2 Level AA** (now ISO/IEC 40500:2025; folds
into EN 301 549 for EU public-sector procurement). Accessibility is a procurement
gate for the public-sector, utility, and enterprise accounts Wesco sells into, so
it is treated as a shippable bar, not an afterthought.

## What's enforced in CI

`features/product-finder/accessibility.test.tsx` runs **axe-core** (via
`vitest-axe`) over the render-critical feature modals on the jsdom render-test
net. A structural WCAG violation fails the test suite — the same gate every other
change passes. Covered surfaces today: Guided selectors, Inbound RFQ, Returns/RMA,
and BOM Intelligence modals; the net extends to new components as they land.

> jsdom has no layout engine, so axe skips the **color-contrast** rule there.
> Contrast is governed instead by the audited Meridian palette in `CLAUDE.md`
> (every text/background pairing is listed with its WCAG pass level), and by the
> white-label brand profiles in `lib/brand.ts`.

## Conformance practices in the codebase

- **Semantics & names:** dialogs use `role="dialog"` + `aria-modal` + an
  `aria-label`; icon-only buttons carry an `aria-label`; decorative emoji/icons
  are `aria-hidden`; every form control has an associated `<label>`.
- **Keyboard:** modals close on `Escape`, focus the close control on open, and
  all actions are reachable controls (`<button>`/`<a>`/`<input>`), not click
  handlers on non-interactive elements.
- **Status & feedback:** live regions and badges pair colour with text (e.g.
  health grades show "A/B/C" letters, not colour alone; lifecycle/compliance use
  a "⚠"/"⚖" glyph + label).
- **Targets & spacing:** interactive controls meet the 24×24 CSS-px minimum
  target size (WCAG 2.2 2.5.8).

## Documented follow-ups

- **Lighthouse CI** in the deploy pipeline for color-contrast + Core Web Vitals /
  INP budgets against the live rendered pages (the layout-dependent checks jsdom
  can't run). The instant-filtering and assistant features make **INP** the
  metric to watch.
- Extend the axe net to the remaining legacy components (search results, cart
  drawer, dashboard charts) so 100% of routes are CI-gated, not just the newest
  modals.
