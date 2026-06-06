# Product Finder — Help & Demo Guide

The **Product Finder** (the "AI Product Recommender") helps a Wesco rep go from a
rough request to a **stocked, priced, and justified** product recommendation — on
one screen. It finds products, suggests smart alternatives **with clear reasons**,
checks stock, compares options, and builds a basket.

> Everything runs on a built-in catalog of **50,000 synthetic products** spanning
> six categories — Electrical (~72%, weighted toward common commercial/residential
> construction products), Datacom, OEM Electrical, AV, Security, and Safety.
> Nothing is sent anywhere, so you can click around freely.

---

## 1. Getting started

- **Open:** <https://web-xi-virid-59.vercel.app/product-finder>
- **Sign in** with a demo account:

  | Email | Password | Signs in as |
  |---|---|---|
  | `sales@wesco.com` | `wesco2024` | Sarah Chen — Sales, Houston Downtown |
  | `manager@wesco.com` | `wesco2024` | Marcus Rivera — Manager, Dallas North |
  | `admin@wesco.com` | `wesco2024` | Admin User — Corporate |

- Your **name and branch** show top-right. **Sign out** is next to the cart.
- You stay signed in if you come back later.

> The branch you log in as matters: it decides what counts as **"in stock at your
> branch,"** which affects the match scores.

---

## 2. The screen at a glance

- **Top bar:** Wesco logo, app title, your name/branch, the **Cart** button, Sign out.
- **Left sidebar:** Filters.
- **Middle:** the search box and your results.
- **Right side** (appears for an out-of-stock selected product): **external
  sources** with prices and lead times.

---

## 3. Features

### Search
Search runs **server-side over all 50,000 products**.

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
Narrow the results by **Category** (all six), **Subcategory** (40+ — from Load
Centers and Conduit Fittings to LED Troffers and Fiber Optic Cable), **Brand**,
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

### Compare
Click **Compare** on up to **4** products, then open the **comparison view** to see
them **side-by-side**, with differences and the **cheapest option** highlighted.

### External sources
- If a product is **out of stock at Wesco**, the app lists **external distributors**
  (with price, quantity, and lead time) so you still have an answer.

> The **"Goes with"** accessory panel from an earlier version is temporarily
> hidden while it's rebuilt for the larger catalog.

### Basket
Add products (with a quantity) to your **basket**. Click the **Cart** button to open
it: change quantities, remove items, see the **running total**, or clear it. The
cart badge shows your item count.

### Saved & Recently viewed
- **★** any product to favorite it.
- The app remembers the **last 12 products** you viewed via Find Alternatives.
- Both appear in the **Saved & Recent** panel above the grid whenever you're
  browsing without a search or filters. These are remembered **even after you
  close the browser**.

---

## 4. A 5-minute demo script

A clean walkthrough that shows off the best parts, in order:

1. **Sign in** as `sales@wesco.com` / `wesco2024`. Point out the **name + branch**
   (Houston Downtown) at the top right, and the grid already browsing
   **all 50,000 products**.
2. Show the **six category chips** in the sidebar — click **⚡ Electrical** to show
   ~36,000 products, the bulk of the catalog. Click it again to clear.
3. In the search box, type **`20A breaker in stock under $50`** and press Enter.
   Point out the **filter chips** that appear (`In stock`, `Under $50`). Remove one
   with its **✕** to show results update instantly.
4. Click **"Find Alternatives"** on a result. The grid now shows that product's
   **alternatives**, each with a **match ring** and reason chips.
5. On a strong match, click **"Why recommended?"** and walk through the **point
   breakdown** (specs, stock, preferred, price). *This is the headline moment.*
6. Expand **Specifications** on two products to show the **✓ / ⚠** spec matching
   against your selected product.
7. Click **Compare** on 2–3 products, then open the **comparison** — show the
   side-by-side view with the **cheapest highlighted**.
8. **Add a product to the basket** (set quantity to 5), open the **Cart**, and show
   the **running total**.
9. **★ a couple of products**, then click **"Change Product"** and clear the search
   (✕ in the box) — your starred and viewed products now appear under
   **Favorites / Recently viewed** above the grid.
10. *(Optional)* Search something only the new catalog has — **`led troffer`**
    (1,400+ lighting products) or **`transformer`** — to show the breadth.

**Wrap-up line:** *"One screen takes a rep from a rough request to a stocked, priced,
and justified recommendation."*

---

## 5. Quick tips

- All **50,000 products are sample data** — click anything; nothing leaves the app.
- **No results?** Use **Clear search & filters** to start over.
- **Try different logins** — each has a different home branch, which changes the
  *"in stock at your branch"* part of the match score.
- **Plain English works** — `preferred safety under $20`, `in stock Square D`,
  `security cameras under $500`, etc.
- Results load **24 at a time** — use **Load more** or narrow with filters.
