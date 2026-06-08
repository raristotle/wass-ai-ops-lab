# Product Finder — Demonstration Script

A presenter-ready, ~10-minute walkthrough of <https://app.raristotle.com/product-finder>.
Every SKU below is deterministic — it exists with the same data in every environment.
**Bold** = what you do. *Italic* = what you say.

> Prep (30 seconds): open the site in a fresh tab, have this script on a second
> screen. No other setup — the catalog, customers, and orders are built in.

## Act 1 — Sign in & the one-screen pitch (1 min)

1. **Sign in** as `sales@meridiansupply.com` / `meridian2024`.
   *"I'm Sarah Chen, an inside sales rep at the Houston Downtown branch. Everything
   I need to turn a customer request into a priced, stocked order is on this one
   screen — searching 60,000 products."*
2. **Point at the header**: name + branch top-right, the **?** Help button
   (*"interactive help with try-it examples, for new reps"*), and the Cart.
3. **Set "Quoting for:" → Gulf Coast Industrial.**
   *"First thing a rep does — pick the customer. That drives their contract
   pricing, their order history, and the quote."*

## Act 2 — Search like you talk (2 min)

4. **Type `20A breaker in stock under $50`** and press Enter.
   *"Plain English. The app parsed price, availability, and product — each one is
   a chip I can remove."* **Click the ✕ on `Under $50`** to show instant update.
5. **Point at a card's price block**: *"List price, struck through — Gulf Coast's
   contract price, and the savings. Switch the customer to walk-in and it's list
   again."* (Optionally toggle the customer selector to show it.)
6. In the sidebar, **tick a spec facet** (e.g. Amperage → 20A) —
   *"live counts, real spec-level filtering, including numeric ranges."*

## Act 3 — The intelligence (3 min)

7. **Search `QO115`** → the Square D QO115 breaker. **Click Find Alternatives.**
   *"Scored alternatives — not a black box."* **Click "Why recommended?"** on one:
   *"specs matched, in stock at my branch, preferred line, cheaper — every point
   explained."*
8. **Search `CB-EAT-329`.** *"Customer wants this Eaton breaker — it's out of
   stock everywhere. Old answer: 'I'll call you back.' New answer:"* — point at
   the amber panel — *"the system already found the best in-stock substitute, a
   GE breaker, same specs."* **Click Add Substitute.** *"One click, sale saved."*
9. **Click View Details** on any product: volume pricing tiers, the Availability
   panel (*"branch stock, DC stock, promise dates, transfer ETA — simulated ERP
   adapters ready for real systems"*), the printable Spec Sheet, and
   **Goes well with** cross-sell.

## Act 4 — From basket to deliverables (3 min)

10. **Open the Cart.** The GE substitute is there. **Set its quantity to 50** —
    *"volume tier kicks in automatically."*
11. **Click Generate Quote (PDF).** *"Branded quote — auto number, 30-day
    validity, my name and branch, contract-priced lines. Print or save."*
12. **Click Export CSV.** *"The same basket as a spreadsheet — list versus
    effective price per line, totals — for the customer's procurement system."*
    (Also point out **Export CSV** in the results bar for search results.)
13. **Click Share Basket.** *"This link rebuilds the exact basket for a teammate
    or the customer."*
14. **Click Add to Order**, then expand **Order History**: *"every past order for
    Gulf Coast — click one open to see its lines — and Reorder puts the whole
    thing back in the basket. Repeat business in two clicks."* **Click Reorder.**
15. **Click Import List / BOM** and paste:
    ```
    12x gfci receptacle
    5 led troffer
    10x 3/4" EMT conduit
    3, transformer
    ```
    **Match → Add matched to cart.** *"A whole bill of materials in seconds."*

## Act 5 — The manager view (1 min)

16. **Sign out, sign in** as `manager@meridiansupply.com` / `meridian2024`.
    **Click Insights.**
    *"Managers get the rollup — orders, value, contract savings delivered, top
    categories, customer mix. Reps don't see this."*

## Wrap-up

*"One screen takes a rep from a rough request to a customer-priced, quoted,
shareable order — with explainable recommendations, automatic substitutes for
out-of-stock items, live stock, cross-references, CSV/PDF deliverables, and a
whole BOM imported in seconds."*

> **Demo honesty note:** customer accounts, contract pricing, inventory/ATP, PIM
> provenance, and cross-references run on **synthetic data behind swap-in
> adapters** (`lib/integration/`). See the
> [integration guide](wesco-it-integration-guide.md) for connecting real systems.

## If something goes sideways

- **No results** → Clear search & filters (sidebar) and re-type.
- **Substitute panel missing** → make sure you searched `CB-EAT-329` exactly; any
  fully out-of-stock product works.
- **No contract pricing** → check "Quoting for:" still shows Gulf Coast Industrial.
- **Stuck anywhere** → the **?** Help button covers every feature with examples.
