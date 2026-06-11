# Product Finder — Help & Demo Guide

The **Product Finder** (the "AI Product Recommender") helps a Meridian Supply Co. rep go from a
rough request to a **stocked, priced, and justified** product recommendation — on
one screen. It finds products, suggests smart alternatives **with clear reasons**,
checks stock, compares options, and builds a basket.

> Everything runs on a built-in catalog of **200,000 synthetic products** spanning
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
- **Switch roles without retyping:** the header's **"Demo role:"** selector (marked
  with a *demo* pill) swaps you between Sarah, Marcus, and Admin **instantly** — the
  Insights link and quote-approval powers follow the role. Your cart and orders stay
  put across switches (shared demo storage, by design).
- **First visit?** A 7-step **guided tour** card opens bottom-right — welcome →
  plain-English search → filters → alternatives → basket & quote → insights → more
  tools — each step with a one-click **"try it"** that runs the real feature. It's
  non-blocking (keep working while it's open), shows **once per browser**, and can be
  restarted anytime from the **Help panel footer → "Restart the tour"** (or the
  command palette).
- **Stuck?** Click the **?** button in the header — an interactive **Help panel**
  with searchable topics and one-click "Try it" example searches.

> The branch you log in as matters: it decides what counts as **"in stock at your
> branch,"** which affects the match scores.

---

## 2. The screen at a glance

- **Top bar:** Meridian Supply Co. logo, app title, your name/branch, the **"Demo
  role:"** switcher, the **⌘K** palette button, the **?** Help button, the **Cart**
  button, Sign out.
- **Left sidebar:** Filters.
- **Middle:** the search box and your results.
- **Right side** (appears for an out-of-stock selected product): **external
  sources** with prices and lead times.

---

## 3. Features

### Search
Search runs **server-side over all 200,000 products**.

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
  - **trade terms** — `romex` → NM-B, `GFI` → GFCI, `cat 6` → Cat6, `EMT` →
    conduit, `wire nut`, `load center`, `wall pack`, `PoE`, … (~36 in all) —
    rewritten automatically into the right catalog terms
- Each understood condition becomes a **removable filter chip** below the box
  (e.g. `Under $50 ✕`). Click a chip's **✕** to drop just that condition.
- **Misspelled it?** See *"Did you mean…?" typo fixes* below — typos don't dead-end.
- **Prefer to talk?** Click the **microphone** in the search box — see *Voice
  search* below.
- **Quick picks:** one-click buttons for common searches (Circuit Breakers,
  Cat6 Cable, IP Cameras, Safety Glasses, Relays, Displays).
- The **✕ in the search box** clears the search *and* all chips.
- Results are paged — click **Load more** at the bottom of the grid to fetch the
  next page.

### Voice search
Click the **microphone** in the search box and just say the request
(e.g. *"twenty amp breaker in stock under fifty dollars"*):
- your words appear **live in the box** as you speak;
- the final transcript is **normalized** — "twenty amp breaker" becomes
  `20A breaker`, and filler words ("please", "search for", "show me") are stripped;
- the cleaned-up text runs through the **same plain-English parser** as typed
  searches — chips and all.

*(Works in Chrome and Edge; the button hides itself in browsers without speech
recognition. Audio is processed by the browser's speech service.)*

### "Did you mean…?" typo fixes
Misspelled searches don't dead-end:
- When a search comes back **empty** and there's **one clear fix** (`breakr` →
  `breaker`), it's applied **automatically** — with a *"Showing results for X —
  search instead for 'y'"* notice so you can revert in one click.
- When results are sparse or the fix is ambiguous, you get a **one-click
  suggestion** instead — nothing changes until you click it.
- Numbers and specs like `20A` or `12-2` are never "corrected".
*(Try it: search `breakr`.)*

### Shareable deep links & Copy link
The page URL **always reflects your current search** — query, category, brand,
stock/preferred toggles, price range, spec facets, and sort:
- copy the address bar — or click **Copy link** next to **Export CSV** in the
  results bar — and send it to a teammate; they land on the **same results**;
- deep links and **shared basket links** combine — the `cart=` payload rides along
  untouched;
- junk or outdated parameters are ignored safely, so old links never break the page.

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

### The "For you" rail
The landing view (before you search) opens with personalized, one-tap
recommendations built from your own data:
- **Time to reorder** — products from past orders, ranked by how often they're
  bought; a **DUE** badge appears once the last order is 30+ days old, and
  **Add** pre-fills the last ordered quantity.
- **From your favorites** — starred products that aren't in your basket yet.
- **Goes well with your orders** — complementary cross-sell for your top
  reorder candidate.

With a customer selected in "Quoting for," the rail uses **their** history; with
no customer it looks across all orders and each card shows whose order it came
from. *(Demo data: three seeded orders make the rail light up immediately.)*

### Ask Meridian — Job Wizard
Don't build the basket part by part — describe the job. Click the **🧰 Job
Wizard** button by the search bar (or Ctrl/Cmd-K → "Start a job"):
- **Pick a job** — 200A residential service upgrade, office network (12 drops),
  warehouse LED retrofit, 8-camera security install, or a Level-2 EV charger.
- **Every step resolves to a real product** — stocked and priced from the
  catalog, branch stock preferred — with up to two alternates to swap in, a
  quantity stepper, and include/skip checkboxes (optional steps like whole-home
  surge protection start unchecked, with field notes on why they're easy upsells).
- The footer shows a running estimated total; **Add N items to basket** drops
  the whole bill of materials in at once, where contract/volume pricing applies.

The picks are deterministic recommendations from your catalog; the
conversational version of Ask Meridian is on the roadmap.

### Metals index (simulated)
The landing view opens with a slim **metals index strip** — Copper and Aluminum
$/lb with a 30-day trend, simulated deterministically (same values all day,
every browser). When copper trends up, the strip nudges you to **quote wire &
cable now** and lock the 30-day validity window; quotes and the customer
acceptance page cite the index date their pricing reflects.

### Seasonal demand signals
Below the metals index, a **weekly merchandising banner** surfaces what's about
to sell — storm prep (surge, temporary power, PPE), heat advisory, construction
season kickoff, and quarter-end datacom refresh rotate week by week, each with
**one-tap searches** for the trending categories. Simulated and deterministic;
a live weather or market feed is a drop-in upgrade.

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
watching. Watched products feed the **notification bell** (below). *(Demo: no email
is actually sent.)*

### Notifications (🔔)
The bell in the header collects everything that needs your attention, with an
**unread badge**:
- **Approval requests** — below-margin quotes awaiting sign-off *(managers and
  admins only)*.
- **Follow-ups** — quotes sent more than 14 days ago with no decision.
- **Restock alerts** — watched products, each with an **estimated restock date**;
  when the window is reached the alert flips to "check availability."

- **Counter-offers** — a ↩️ alert when a customer requests changes on a quote link.
- **At-risk customers** — 📉 alerts for accounts going quiet vs their usual cadence.

Click any notification to jump straight to the quote section, the product's
detail view, or the customer's orders; **Mark all read** clears the badge. Read
state is remembered in your browser.

### Customer health scores
Every account's **order cadence** is tracked automatically — "usually orders
every 30 days — now 38 days quiet":
- A **status dot** (🟢 Healthy / 🟡 Watch / 🟠 At risk) sits under the "Quoting
  for" selector for the active customer; hover for the cadence message.
- **At-risk accounts** raise a bell alert — one click lands on their order
  history, ready for a win-back call.
- Managers get the full **Customer Health** panel in Insights, most urgent
  first.

Within 1.25× the usual cadence = Healthy; up to 2× = Watch; beyond = At risk.
*(The seeded demo data ships one healthy and one at-risk account so the feature
is visible immediately.)*

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

Every matched line also carries a **confidence score (0–100%)**:
- **Green (80%+)** — the product covers your line text; exact SKUs always score
  100%, and **numbers must match exactly** (a `20A` line never silently matches a
  200A part).
- **Amber / red** — worth a second look; the summary shows an "**n to review**"
  count.
- Lines that aren't a confident match list up to **two alternatives** — click
  **Use** to swap one in (the score updates).
- **Typos are rescued automatically** — `5x circut breakr` matches as *circuit
  breaker* with a "corrected to…" note on the line.

### External sources
- If a product is **out of stock at Meridian Supply Co.**, the app lists **external distributors**
  (with price, quantity, and lead time) so you still have an answer.

### Live distributor pricing (REAL — Mouser & Digi-Key)
For **real, verified products**, the detail view fetches **live** price, stock,
and datasheet data from distributor APIs — actual market data, not simulation:
- Try it: search **`AF09-30-10-13`** (ABB contactor) and open **View Details** —
  Mouser and Digi-Key quotes appear side by side with live stock, price breaks,
  and distributor links. (Also good: `UTPSP5BUY`, `LC1D09G7`, `3RT2026-1AK60`.)
- The price spread between distributors is real multi-source intelligence —
  the same part can differ by 2× across sources.
- **Simulated catalog SKUs are never sent to distributor APIs** — only verified
  part numbers are queried, per-request, and nothing is stored.
- Empty panels are normal for construction commodities (electronics
  distributors don't carry them) — the panel says so rather than faking it.

### Product images
Each product card and the detail view show a **branded product plate**: a
category-colored band, a **subcategory line-art glyph** (circuit breaker, RJ45
connector, hard hat, …), the **brand**, and the **SKU** — deterministic per
product, with no third-party image dependency. **Every one of the 79 subcategories
has its own distinct glyph**, so a receptacle, a switch, and a wall plate each look
like what they are. On the **detail view**, the plate also shows a **key-spec
badge** — the product's single most identifying short spec (e.g. `20A`, `12 AWG`,
`4K UHD`), picked by priority when one fits. *(Swappable for curated/real
product photography later via the same `ProductImage` seam.)*

### Command palette (Ctrl/Cmd-K)
Press **Ctrl-K** (Windows) or **⌘K** (Mac) anywhere — or click the **⌘K** button in
the header — to open the **command palette**:
- **jump** to Search or the Insights dashboard (role-gated — Insights only appears
  for managers/admins);
- **open** the Basket, Help, BOM import, or Bulk price check;
- **restart the tour** or **switch demo roles** without retyping credentials;
- run a **quick-pick search**, or type anything else and hit **Enter** to search it.

Arrow keys move the selection (it wraps); **Enter** runs the highlighted command;
**Esc** closes.

### Analytics dashboard (managers & admins only)
Signed in as a **manager** or **admin**, an **Insights** link appears in the header →
an **Analytics Dashboard**: KPI cards (orders, total/avg value, active customers),
**contract savings delivered**, a **Quote Pipeline** (value & count by status, open
vs. won/lost, **win rate**, **conversion rate** for won quotes turned into orders,
plus **follow-up**, **approval**, and **counter-offer** alerts), **Pricing
Win/Loss** by margin band, **Customer Health** by order cadence, a **Branch
Demand Forecast** (trailing-90-day demand by subcategory with trend arrows and a
30-day stocking projection — rows drill through to the subcategory), **top
categories** and **orders over time** charts, top products, and customer mix.
Sales reps don't see it. *(Demo analytics derived from seeded sample data.)*

**Everything on the dashboard drills through.** Click a KPI card, a **Top
Categories** bar, a top-product row, a customer-mix row, a quote-status tile, or an
**orders-over-time** point to land on the underlying search, product, customer,
quotes, or orders — the cart drawer opens scrolled to the right section, with a
clearable **Status:** / **Month:** chip showing what's filtered.

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
- **Win/loss pricing guidance** — a 📊 line under the basket margin shows how
  quotes in your **current margin band** have historically closed ("Quotes in the
  15–20% band historically win 75%"), so discounting becomes a coached decision.
  Appears once a band has 3+ decided quotes; the full per-band breakdown lives in
  Insights. *(Fresh browsers seed a simulated quote history.)*
- **Line price override (✎ price)** — set a **custom unit price** on any line for
  price-matching or close-the-deal discounts. **Guardrails:** never above list,
  never below a **5% margin** over estimated cost — out-of-band entries snap to
  the nearest bound, and the allowed range is shown while editing. Overridden
  lines get a **CUSTOM** badge and a **reset** link; margins, the quote sheet,
  saved quotes, orders, and CSV all use the overridden price. Deep discounts
  still trip the 20% **approval** floor below.
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
  - **Customer Link:** copies a **no-login link** your customer can open to review
    the branded quote — number, validity, line prices, total — and **Accept**,
    **Decline**, or **Request changes** on the spot. Accepting **converts the
    quote to an order** and marks it **Won**; declining marks it **Lost**. Expired
    or approval-pending quotes can't be accepted (the page explains why), and
    copying a Draft's link auto-advances it to **Sent**. *(Demo: the acceptance
    state lives in the browser where the link is opened.)*
  - **Counter-offers:** when the customer **requests changes**, their note comes
    back as an amber **COUNTERED** badge on the quote with the ask inline ("need
    it under $60/unit"), plus a ↩️ bell notification and an Insights pipeline
    alert. The quote stays open — answer it with **Revise**.
  - **Revisions (v1 → v2):** **Revise** loads an open quote — lines, customer,
    project, note, and terms — into the basket with a "Revising Q-X" banner.
    Adjust anything, then **Save Quote** creates **v2** linked to the original.
    The old version is marked **superseded**: it leaves the pipeline and its
    alerts, and its customer link politely says a newer version exists. Won or
    already-ordered quotes can't be revised. Revisions chain (v3, v4…).
  - **History (audit trail):** expand **History** on any quote row for its full
    receipt — created/status/approval events with names, customer link copies,
    counter-offers, the conversion to an order, and revision links on both
    versions. Append-only, capped at 50 entries.
  - **Note & terms:** the quote sheet has a free-text **Note** field and
    selectable **Terms & Conditions** blocks (freight, returns, payment,
    commodity escalation, lead times). Both print on the PDF and travel inside
    the Customer Link.
- **Email Quote** — opens an inline form (recipient pre-filled). With an email
  key configured, **Send Quote** delivers a **real branded email via Resend** —
  the full line table, your note and terms, and a one-tap **Review & Accept**
  button opening the customer quote link. Without a key it falls back to a
  clearly-labeled simulated send. Either way the quote records as **Sent**, and
  the form tells you which mode is active. *(Resend free-tier note: until a
  sending domain is verified, emails deliver only to the account owner's
  address.)*
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

### On your phone
The finder is built to work one-handed at the counter or on a job site:
- **Filters** live behind the floating **Filters** button (a bottom sheet).
- The **basket** opens as a full-width drawer; quotes, orders, templates, and
  the price override all work on mobile.
- **Customer quote links** are mobile-first — customers usually open them on
  a phone.
- **Voice search** and the **notification bell** sit within thumb reach in the
  header. (The ⌘K palette is desktop-only.)

---

## 4. A 5-minute demo script

> A longer, presenter-ready walkthrough with talking points and exact SKUs lives in
> **[product-finder-demo-script.md](product-finder-demo-script.md)**. The condensed
> version:

1. **Sign in** as `sales@meridiansupply.com` / `meridian2024`. Point out the **rep
   name + branch** (Houston Downtown) at the top right and the grid already browsing
   **all 200,000 products**. (Dismiss — or show off — the **guided tour** card that
   opens bottom-right on a first visit.)
2. In the header, set **"Quoting for:" → Gulf Coast Industrial** (a contract
   customer). Explain this is the **customer account** context — it drives pricing,
   order history, and the quote. *(Simulated CRM — real integration noted below.)*
3. Show the **six category chips** — click **⚡ Electrical** (~154,000 products), then
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

- All **200,000 products are sample data** — click anything; nothing leaves the app.
- **No results?** Use **Clear search & filters** to start over.
- **Ctrl-K / ⌘K** opens the **command palette** — every screen and tool is two
  keystrokes away.
- **Typos are fine** — `breakr` still finds breakers, with a one-click undo.
- **Talk instead of type** — the **mic** in the search box dictates a search
  (Chrome/Edge).
- **Send a search, not a screenshot** — **Copy link** (next to Export CSV)
  reproduces your exact query, filters, and sort for whoever opens it.
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
