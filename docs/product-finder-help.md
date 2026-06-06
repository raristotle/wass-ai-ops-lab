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

- **Open:** <https://web-xi-virid-59.vercel.app/product-finder>
- **Sign in** with a demo account:

  | Email | Password | Signs in as |
  |---|---|---|
  | `sales@meridiansupply.com` | `meridian2024` | Sarah Chen — Sales, Houston Downtown |
  | `manager@meridiansupply.com` | `meridian2024` | Marcus Rivera — Manager, Dallas North |
  | `admin@meridiansupply.com` | `meridian2024` | Admin User — Corporate |

- Your **name and branch** show top-right. **Sign out** is next to the cart.
- You stay signed in if you come back later.

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

> **BOM / List import** was part of an earlier version and is temporarily
> unavailable while it's rebuilt for the larger catalog.

### Filters (left sidebar)
Narrow the results by **Category** (all six), **Subcategory** (nearly 80 — from
Receptacles & Outlets, Switches, and Wall Plates & Covers to Load Centers, LED
Troffers, and Fiber Optic Cable), **Brand**,
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

### Volume / tiered pricing
Larger quantities get better pricing — breaks at **1, 10, 50, and 100+**. The
detail view shows the full tier table, and the **cart applies the right tier per
line automatically** (lines that qualify show a "vol. price (NN+)" note), so the
running total always reflects volume discounts.

### Compare
Click **Compare** on up to **4** products, then open the **comparison view** to see
them **side-by-side**, with differences and the **cheapest option** highlighted.
**Download Comparison (PDF)** prints the side-by-side as a clean sheet.

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

A clean walkthrough that shows off the best parts, in order:

1. **Sign in** as `sales@meridiansupply.com` / `meridian2024`. Point out the **name + branch**
   (Houston Downtown) at the top right, and the grid already browsing
   **all 60,000 products**.
2. Show the **six category chips** in the sidebar — click **⚡ Electrical** to show
   ~46,000 products, the bulk of the catalog. Click it again to clear.
3. In the search box, type **`20A breaker in stock under $50`** and press Enter.
   Point out the **filter chips** that appear (`In stock`, `Under $50`). Remove one
   with its **✕** to show results update instantly.
4. Click **"Find Alternatives"** on a result. The grid now shows that product's
   **alternatives**, each with a **match ring** and reason chips.
5. On a strong match, click **"Why recommended?"** and walk through the **point
   breakdown** (specs, stock, preferred, price). *This is the headline moment.*
6. Expand **Specifications** on two products to show the **✓ / ⚠** spec matching
   against your selected product.
7. Click **View Details** on a product — show the **product image**, the
   **Volume pricing** tiers, the formal **Spec Sheet** with Required flags + the
   **Download Spec Sheet (PDF)** button, the **Goes well with** suggestions, and
   the **Where to Buy** links to real distributor sites. Then **Compare** 2–3
   products, open the **comparison**, and hit **Download Comparison (PDF)**.
8. **Add a product to the basket at quantity 50** — open the **Cart** and point out
   the **volume price** kicking in on that line and the discounted **running total**.
9. In the cart, click **Generate Quote (PDF)** — type a **Customer** and **Project**,
   show the branded quote (auto number, 30-day validity, your name & branch, priced
   lines), then **Save** the basket as a named job and show it can be **Loaded** back.
10. Click **Import List / BOM** and paste:
    ```
    12x gfci receptacle
    5 led troffer
    10x 3/4" EMT conduit
    3, transformer
    ```
    Hit **Match** → matched rows appear → **Add matched to cart** drops them all in
    at their quantities.
11. **★ a couple of products**, then **"Change Product"** and clear the search — your
    starred/viewed products and a **Search history** of chips appear above the grid;
    click a chip to re-run, collapse a section with **▾**, or **Clear** a list.

**Wrap-up line:** *"One screen takes a rep from a rough request to a stocked, priced,
quoted, and justified recommendation — paste a whole BOM and it's a cart in seconds."*

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
