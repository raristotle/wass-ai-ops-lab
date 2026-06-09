# Product Finder — Help & Demo Guide

The **Product Finder** (the "AI Product Recommender") helps a Meridian Supply Co. rep go from a
rough request to a **stocked, priced, and justified** product recommendation — on
one screen. It finds products, suggests smart alternatives **with clear reasons**,
checks stock, compares options, and builds a basket.

> Everything runs on a built-in catalog of **60,000 synthetic products** spanning
> six categories — Electrical (~77%, weighted toward common commercial/residential
> construction products, including **10,000+ wiring devices** — receptacles,
> switches, wall plates & covers, cord plugs, combination devices, and lighting
> accessories), Datacom, OEM Electrical, AV, Security, and Safety.
> Nothing is sent anywhere, so you can click around freely.

---

## 1. Getting started

- **Open:** <https://app.raristotle.com/product-finder>
- **Sign in** with a demo account:

  | Email | Password | Signs in as |
  |---|---|---|
  | `sales@meridiansupply.com` | `meridian2024` | Sarah Chen — Sales, Houston Downtown |
  | `manager@meridiansupply.com` | `meridian2024` | Marcus Rivera — Manager, Dallas North |
  | `admin@meridiansupply.com` | `meridian2024` | Admin User — Corporate |

- Your **name and branch** show top-right. **Sign out** is next to the cart.
- You stay signed in if you come back later.
- **Stuck?** Click the **?** button in the header — an interactive **Help panel**
  with searchable topics and one-click "Try it" example searches.

> The branch you log in as matters: it decides what counts as **"in stock at your
> branch,"** which affects the match scores.

---

## 2. The screen at a glance

- **Top bar:** Meridian Supply Co. logo, app title, your name/branch, the **Cart** button, Sign out.
- **Left sidebar:** Filters.
- **Middle:** the search box and your results.
- **Right side** (appears for an out-of-stock selected product): **external
  sources** with prices and lead times.

---

## 3. Features

### Search
Search runs **server-side over all 60,000 products**.

- Type a **product name, SKU, brand, or spec** (e.g. `15A breaker`, `led troffer`,
  `Cat6`).
- A **suggestions dropdown** appears as you type — click one to search for it.
- **Plain-English search:** type a request like `20A breaker in stock under $50`.
  The app understands:
  - price — `under $50`, `over $20`, `$10-$30`
  - availability — `in stock`
  - `preferred`
  - category — `electrical`, `datacom`, `oem-electrical`, `av`, `security`, `safety`
  - brand names (e.g. `Square D`)
- Each understood condition becomes a **removable filter chip** below the box
  (e.g. `Under $50 ✕`). Click a chip's **✕** to drop just that condition.
- **Quick picks:** one-click buttons for common searches (Circuit Breakers,
  Cat6 Cable, IP Cameras, Safety Glasses, Relays, Displays).
- The **✕ in the search box** clears the search *and* all chips.
- Results are paged — click **Load more** at the bottom of the grid to fetch the
  next page.

### Filters (left sidebar)
Narrow the results by **Category** (all six), **Subcategory** (nearly 80 — from
Receptacles & Outlets, Switches, and Wall Plates & Covers to Load Centers, LED
Troffers, and Fiber Optic Cable), **Spec facets**, **Brand**,
**in stock at your branch**, **in stock at a DC**, **Preferred only**, and a
**Price range**. **Sort** by relevance, preferred, stock, price, or brand, and
switch **list / grid** view. **Clear all filters** resets everything (and clears
search chips).

### Smart recommendations (the "AI" part)
Click **Find Alternatives** on any product card. The grid switches to that
product's **alternatives**, and every card shows **how well it matches**:
- A **match ring** with a percentage and a label — **Excellent** (green),
  **Good** (amber), or **Partial**.
- Two quick **reason chips** (e.g. `✓ All 5 specs`, `✓ In stock · your branch`).
- A **"Why recommended?"** link — click it to see the **full breakdown** and exactly
  what earned each point.

It's completely transparent — no black box. A product scores higher when it:
**matches the key specs**, is **in stock at your branch**, is a **Preferred** line,
**costs less** than your reference, and is the **same type** of product.

### Product details
Each product card shows the name, brand, SKU, and description, plus:
- a collapsible **Specifications** list — key specs are marked **✓** when they match
  your selected product and **⚠** when they differ;
- **stock** at your branch and distribution centers;
- the **price**, a **quantity** stepper, and **Add to Basket**;
- **Compare**, **Find Alternatives**, and **View Details** actions;
- a **★ star** to save it as a favorite.

### Product details (View Details)
Click **View Details** on any card to open the full detail view:
- a **product image** and the basic info (name, brand, SKU, price, stock, Preferred);
- **Volume pricing** — quantity-break tiers (1+, 10+, 50+, 100+) with the
  qualifying tier highlighted for your current quantity;
- **Add to Basket** and **Find Alternatives** right inside the view;
- a formal **Spec Sheet** — every specification with **Required** flags on the
  non-negotiable ones — plus **Download Spec Sheet (PDF)** (prints a clean cut
  sheet, no app clutter);
- **Goes well with** — complementary products (breaker → load center, wire →
  connectors, receptacle → wall plate); click one to jump to it;
- **Where to Buy** — working search links to **Grainger, Graybar, Platt, Rexel,
  Zoro, and Home Depot** for the product, opening in a new tab.

### Spec-level facet filters
Once you've narrowed to a category or subcategory, the sidebar shows **spec facets**
specific to those products. Two kinds:
- **Value facets** (checkboxes with live counts) — e.g. Poles, Color, Type. Tick any
  combination (multiple values within one spec broaden; different specs narrow).
- **Range facets** (Min / Max with the unit) — for numeric specs like **Amperage (A),
  Voltage (V), Wattage (W), Lumens (lm), kVA, Ports** — enter a min and/or max to
  filter to a range.

**Clear all filters** resets all facets (and the range inputs).

### Stock alerts & lead time
When a product is **out of stock at Meridian Supply Co.**, the card and detail view
show an estimated **lead time** and a **"Notify when available"** button. Click it to
add the product to your watch list (remembered in your browser); click again to stop
watching. *(Demo: no email is actually sent.)*

### Out-of-stock substitutes
When a product is out of stock **everywhere**, its card automatically offers the
**best in-stock substitute** — picked by the same scoring engine as Find
Alternatives (spec match → stock → price), resolved server-side with the search:
- **Add Substitute** drops it straight into your basket at your chosen quantity.
- **View** opens the substitute's full detail.
*(Try it: search the SKU `CB-EAT-329` — an out-of-stock Eaton breaker with an
in-stock GE substitute.)*

### Export to CSV
Two one-click spreadsheet exports (open directly in Excel / Google Sheets):
- **Results bar → Export CSV** — the visible search results with SKU, name, brand,
  category, list price, branch/DC stock totals, and Preferred flag.
- **Cart → Export CSV** — basket lines with quantities, list vs. **effective
  (contract/volume) unit pricing**, line totals, and a grand total row.

### Volume / tiered pricing
Larger quantities get better pricing — breaks at **1, 10, 50, and 100+**. The
detail view shows the full tier table, and the **cart applies the right tier per
line automatically** (lines that qualify show a "vol. price (NN+)" note), so the
running total always reflects volume discounts.

### Compare
Click **Compare** on up to **4** products, then open the **comparison view** to see
them **side-by-side**, with differences and the **cheapest option** highlighted.
**Download Comparison (PDF)** prints the side-by-side as a clean sheet.

### Bulk price & availability
Click **Bulk Price Check** by the search box for an instant **RFQ response**: paste
or upload a list of SKUs, competitor/legacy part numbers, or descriptions (one per
line, quantities like `12x …` work). Each line resolves by **exact SKU →
cross-reference → search** (tagged so you see how it matched) and the table shows
**effective price, line total, and stock** per row. **Export CSV** or **add all
matched to the basket**.

### Import a list / BOM
Click **Import List / BOM** by the search box to bulk-add products:
- **Paste** a parts list (one per line) or **upload** a `.csv` / `.txt` file;
- quantities are understood — `12x 15A breaker`, `5 led troffer`, `3, transformer`,
  or just a name (defaults to qty 1);
- each line is matched to the best catalog product with a **matched / unmatched**
  summary; click **Add N matched to cart** to add them all at their quantities.

### External sources
- If a product is **out of stock at Meridian Supply Co.**, the app lists **external distributors**
  (with price, quantity, and lead time) so you still have an answer.

### Product images
Each product card and the detail view show a **branded product plate**: a
category-colored band, a **subcategory line-art glyph** (circuit breaker, RJ45
connector, hard hat, …), the **brand**, and the **SKU** — deterministic per
product, with no third-party image dependency. *(Swappable for curated/real
product photography later via the same `ProductImage` seam.)*

### Analytics dashboard (managers & admins only)
Signed in as a **manager** or **admin**, an **Insights** link appears in the header →
an **Analytics Dashboard**: KPI cards (orders, total/avg value, active customers),
**contract savings delivered**, a **Quote Pipeline** (value & count by status, open
vs. won/lost, **win rate**, **conversion rate** for won quotes turned into orders,
and a **follow-up alert** for Sent quotes older than 14 days), **top categories** and
**orders over time** charts, top products, and customer mix. Sales reps don't see it.
*(Demo analytics derived from seeded sample data.)*

### Enterprise integration (simulated)
A set of "system of record" capabilities, built behind clean adapter interfaces so
they can later connect to real ERP / PIM / CRM / pricing systems. **In this demo
they run on synthetic data** (each is labeled "simulated"):
- **Quoting for / customer accounts** — pick the customer you're quoting for from the
  header selector. The choice drives pricing, order history, and the quote.
- **Contract / customer pricing** — for a contract customer, products and the cart
  show **List → Your price → You save N%** (category discounts and negotiated net
  prices, layered with volume tiers). Net prices are treated as a price floor.
- **Live inventory / ATP** — the detail view's **Availability** panel shows branch &
  DC stock, an **Available-to-Promise date** and lead time for out-of-stock items,
  which other branches stock it, and a branch-transfer ETA.
- **Catalog source (PIM)** — a small strip in the sidebar shows the catalog
  provenance (source, product count, last sync).
- **Competitor / legacy cross-reference** — click **Cross-reference** by the search
  box and paste a competitor or legacy part number to find the Meridian equivalent;
  each product's detail lists the parts it **Replaces**.

### Basket, saved baskets & quotes
Add products (with a quantity) to your **basket**. Click the **Cart** button to open
it: change quantities, remove items, see the **running total** (with volume pricing
applied), or clear it.
- **Saved baskets** — save the current basket under a name (e.g. a customer or
  job), then **Load** it back later or **Delete** it. Saved baskets persist across
  sessions.
- **Generate Quote (PDF)** — turn the basket into a branded, printable quote: add a
  **Customer** and **Project / PO #**, and it fills in an auto **quote number**,
  today's date, a **30-day validity**, your name & branch, and a priced line table.
  Print or save as PDF.
- **Share** — copies a link that encodes the basket (and customer/project); anyone
  who opens it (signed in) gets the same basket rebuilt automatically.
- **Complete this job** — when the basket has items, a panel suggests **commonly
  paired products you're missing** (only categories your basket doesn't already
  cover — e.g. conduit → fittings & boxes, receptacle → wall plate). **+ Add** drops
  one into the basket. Cuts down on callbacks for the forgotten piece.
- **Rep margin (internal)** — each cart line and the basket total show your **gross
  margin %**, color-coded (red <15%, amber 15–30%, green 30%+), so you know your
  discount room. Marked **internal** — it never appears on the printed quote, shared
  basket, or customer CSV. *(Cost is estimated from list price in this demo.)*
- **Quantity stock warnings** — if a line's quantity exceeds available stock, the
  cart flags it: *"Ordering 50 · 30 in stock · 20 on backorder ~1–2 weeks."*
- **Submittal Package (PDF)** — builds an approval-ready document for the whole
  basket: a cover page (package number, customer, project, date, item index) plus
  **one full spec sheet per item** (specifications with Required flags). Print or
  save as PDF for the customer/GC.
- **Save Quote** — saves the basket as a **quote** (number, customer, project) you
  can track through a status workflow. The **Saved Quotes** list shows each quote
  with a **Draft → Sent → Won / Lost** status dropdown, the captured **margin %**, a
  **Load** button (reopens its lines into the basket), **Convert to Order** (turns
  the quote into a placed order in one click — marks it Won and **✓ ordered**,
  leaving your basket untouched), and delete. Quotes are scoped to the active customer.
  - **Below-margin approval:** if a quote's blended margin is under **20%**, it's
    flagged **Approval pending** and can't be converted until a **manager** clicks
    **Approve** (managers see Approve/Reject; the pipeline lists everything awaiting
    sign-off).
- **Email Quote** — opens an inline form (recipient pre-filled). **Send Quote**
  records the quote with status **Sent** and confirms. *(Demo: no email is actually
  sent — the quote is tracked as Sent for follow-up.)*
- **Job Templates** — save the current basket as a reusable **kit** (e.g. "Standard
  office buildout"). **Add to Basket** *merges* a template into your current cart
  (it adds, rather than replacing), so kits combine. Templates persist across sessions.
- **Ships complete by** — the cart shows an estimated **whole-order delivery date**:
  in-stock-at-your-branch lines ship fastest, branch-transfer/DC lines take a few
  days, and out-of-stock lines extend the date to their lead time. The date reflects
  the **slowest line** — the realistic "everything arrives" promise.
- **Export CSV** — downloads the basket as a spreadsheet (see *Export to CSV* above).
- **Add to Order** — records the basket as a placed **order** and clears the cart.
- **Order History** — your past orders (date, item count, total). Click an order's
  item count to **expand its line items** (qty, product, SKU) and verify contents,
  then one-click **Reorder** to load it straight back into the basket.

### Saved, history & recently viewed
Above the grid (when browsing without a search or filters) the panel shows three
collapsible sections — click a section's **▾/▸ header** to hide or show it, and
the choice is remembered:
- **Search history** — the **last 12 search terms** you typed, as clickable
  chips. Click one to **re-run that search**. **Clear** empties the list.
- **Recently viewed** — the last 6 products you opened via Find Alternatives.
  **Clear** resets it.
- **★ Favorites** — products you starred (★ on any card or detail view); un-star
  to remove.

All three persist **even after you close the browser**.

---

## 4. A 5-minute demo script

> A longer, presenter-ready walkthrough with talking points and exact SKUs lives in
> **[product-finder-demo-script.md](product-finder-demo-script.md)**. The condensed
> version:

1. **Sign in** as `sales@meridiansupply.com` / `meridian2024`. Point out the **rep
   name + branch** (Houston Downtown) at the top right and the grid already browsing
   **all 60,000 products**.
2. In the header, set **"Quoting for:" → Gulf Coast Industrial** (a contract
   customer). Explain this is the **customer account** context — it drives pricing,
   order history, and the quote. *(Simulated CRM — real integration noted below.)*
3. Show the **six category chips** — click **⚡ Electrical** (~46,000 products), then
   clear.
4. Type **`circuit breaker`** and press Enter. In the sidebar, tick a **spec facet**
   (e.g. **Amperage → 15A**) and watch the **live counts** narrow results.
5. **Contract pricing moment:** point out that breaker cards now show **List → Your
   price → You save %** because a contract customer is active (category discounts and
   negotiated net prices). Switch "Quoting for" to **Walk-in / Standard** to show list
   pricing return, then back to Gulf Coast.
6. Type plain English — **`20A breaker in stock under $50`** — and show the **filter
   chips** (`In stock`, `Under $50`); remove one with **✕** to update instantly.
   Then search **`CB-EAT-329`** (an out-of-stock breaker) — the card offers an
   **in-stock substitute** with one-click **Add Substitute**.
7. Click **"Find Alternatives"** → **scored alternatives**; click **"Why
   recommended?"** for the **point breakdown** (specs, stock, preferred, price).
   *Headline moment.*
8. Click **View Details** — walk the full record:
   - **product image**, **Availability** panel (branch & DC stock, **ATP date** + lead
     time for out-of-stock, "also stocked at" branches, transfer ETA),
   - **Volume pricing** tiers, **Spec Sheet** + **Download Spec Sheet (PDF)**,
   - **Goes well with** cross-sell, **Cross-references / Replaces** (competitor &
     legacy parts this item replaces), and **Where to Buy** distributor links.
9. **Cross-reference lookup:** click **Cross-reference** by the search box, paste a
   competitor/legacy part number (e.g. one of the "Replaces" SKUs from step 8), and
   **Find** the Meridian equivalent.
10. **Compare** 2–3 products → **Download Comparison (PDF)**.
11. **Add a product at quantity 50** → open the **Cart** → show the **contract/volume
    price** on the line and the discounted **running total**.
12. In the cart, run the rep's deliverables:
    - **Generate Quote (PDF)** — Customer pre-fills from the active account; show the
      branded quote (auto number, 30-day validity, rep & branch, priced lines).
    - **Save** the basket as a named job; show **Order History for Gulf Coast
      Industrial** with seeded past orders + one-click **Reorder**; **Add to Order**.
    - **Share** — copies a link that rebuilds this exact basket for whoever opens it.
    - **Export CSV** — the basket as a spreadsheet with effective pricing; also show
      **Export CSV** in the results bar for search results.
13. Click **Import List / BOM** and paste:
    ```
    12x gfci receptacle
    5 led troffer
    10x 3/4" EMT conduit
    3, transformer
    ```
    Hit **Match** → **Add matched to cart**.
14. **★ a couple of products**, **"Change Product"**, clear the search — starred/viewed
    products and a **Search history** of chips appear above the grid. Note the
    **Catalog source** strip at the bottom of the sidebar (PIM provenance).

**Wrap-up line:** *"One screen takes a rep from a rough request to a customer-priced,
quoted, shareable order — with live stock, cross-references, and a whole BOM imported
in seconds."*

> **Demo honesty note:** customer accounts, contract pricing, live inventory/ATP, the
> PIM catalog source, and competitor cross-references are **simulated on synthetic
> data** in this demo, built behind swap-in adapter interfaces. See
> **[Wesco IT integration guide](wesco-it-integration-guide.md)** for what connecting
> them to Wesco's live systems requires.

---

## 5. Quick tips

- All **60,000 products are sample data** — click anything; nothing leaves the app.
- **No results?** Use **Clear search & filters** to start over.
- **Try different logins** — each has a different home branch, which changes the
  *"in stock at your branch"* part of the match score.
- **Plain English works** — `preferred safety under $20`, `in stock Square D`,
  `security cameras under $500`, etc.
- Results load **24 at a time** — use **Load more** or narrow with filters.
- **Buying in bulk?** Quantities of 10/50/100+ unlock **volume pricing** automatically
  in the cart and on the quote.
- **Repeat customers** — save a basket per job, then **Load** it next time instead of
  rebuilding it.
- **Got a parts list already?** Skip searching — **Import List / BOM** turns a paste or
  CSV into a cart.
