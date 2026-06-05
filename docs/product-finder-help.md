# Product Finder — Help & Demo Guide

The **Product Finder** (the "AI Product Recommender") helps a Wesco rep go from a
rough request to a **stocked, priced, and justified** product recommendation — on
one screen. It finds products, suggests smart alternatives **with clear reasons**,
checks stock, compares options, and builds a basket.

> Everything runs on built-in sample data. Nothing is sent anywhere, so you can
> click around freely.

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
- **Right side** (appears once you pick a product): **"Goes with"** suggestions and,
  if needed, **external sources**.

---

## 3. Features

### Search
There are two search tabs at the top of the search box.

**Single Search**
- Type a **product name, SKU, brand, or spec** (e.g. `15A breaker`, `Cat6`).
- A **suggestions dropdown** appears as you type — click one to jump straight to it.
- **Plain-English search:** type a request like `20A breaker in stock under $50`.
  The app understands:
  - price — `under $50`, `over $20`, `$10-$30`
  - availability — `in stock`
  - `preferred`
  - category — `electrical` / `datacom`
  - brand names (e.g. `Square D`)
- Each understood condition becomes a **removable filter chip** below the box
  (e.g. `Under $50 ✕`). Click a chip's **✕** to drop just that condition.
- **Quick picks:** one-click buttons for common categories (Circuit Breakers,
  Wire & Cable, Conduit, Cat6 Cable, Patch Panels, Network Switches).
- The **✕ in the search box** clears the search *and* all chips.

**BOM / List** (bill of materials)
- **Paste a list** of products, one per line. You can start a line with a quantity,
  e.g. `20x 15A circuit breaker`.
- Or **drag-and-drop / browse** a `.csv` or `.txt` file.
- Click **Parse BOM**. The app matches each line to a Wesco product and shows the
  match, an alternatives count, stock status, and a **matched / unmatched** summary.
- Click any matched row to open that product.

### Filters (left sidebar)
Narrow the results by **Category, Subcategory, Brand**, **in stock at your branch**,
**in stock at a DC**, **Preferred only**, and a **Price range**. **Sort** by
relevance, preferred, stock, price, or brand, and switch **list / grid** view.
**Clear all filters** resets everything (and clears search chips).

### Smart recommendations (the "AI" part)
When you pick a product, every alternative card shows **how well it matches**:
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
- a **★ star** to save it as a favorite.

### Compare
Click **Compare** on up to **4** products, then open the **comparison view** to see
them **side-by-side**, with differences and the **cheapest option** highlighted.

### Goes-with & external sources
- With a product selected, the **right panel** suggests items that **go with it**
  (accessories / upgrades) and bundle hints.
- If a product is **out of stock at Wesco**, the app lists **external distributors**
  (with price, quantity, and lead time) so you still have an answer.

### Basket
Add products (with a quantity) to your **basket**. Click the **Cart** button to open
it: change quantities, remove items, see the **running total**, or clear it. The
cart badge shows your item count.

### Saved & Recently viewed
- **★** any product to favorite it.
- The app remembers the **last 12 products** you viewed.
- Both appear in the **Saved & Recent** panel on the start screen, so you can jump
  back instantly. These are remembered **even after you close the browser**.

---

## 4. A 5-minute demo script

A clean walkthrough that shows off the best parts, in order:

1. **Sign in** as `sales@wesco.com` / `wesco2024`. Point out the **name + branch**
   (Houston Downtown) at the top right.
2. On the **start screen**, note the empty **"Saved & Recent"** area — *"we'll fill
   this in by the end."*
3. In the search box, type **`20A breaker in stock under $50`** and press Enter.
   Point out the **filter chips** that appear (`In stock`, `Under $50`). Remove one
   with its **✕** to show results update instantly.
4. **Click a result** to open it. The grid now shows **alternatives**, each with a
   **match ring** and reason chips.
5. On a strong match, click **"Why recommended?"** and walk through the **point
   breakdown** (specs, stock, preferred, price). *This is the headline moment.*
6. Expand **Specifications** on two products to show the **✓ / ⚠** spec matching
   against your selected product.
7. Click **Compare** on 2–3 products, then open the **comparison** — show the
   side-by-side view with the **cheapest highlighted**.
8. **Add a product to the basket** (set quantity to 5), open the **Cart**, and show
   the **running total**.
9. **★ a couple of products**, then click **"Change Product"** to return to the start
   screen — they now appear under **Favorites / Recently viewed**.
10. *(Optional)* Switch to the **BOM / List** tab and paste:
    ```
    20x 15A circuit breaker
    5x Cat6 cable
    10x 3/4" EMT conduit
    ```
    Click **Parse BOM** to show the matched rows, stock, and the summary.

**Wrap-up line:** *"One screen takes a rep from a rough request to a stocked, priced,
and justified recommendation."*

---

## 5. Quick tips

- All data is **sample data** — click anything; nothing leaves the app.
- **No results?** Use **Clear search & filters** to start over.
- **Try different logins** — each has a different home branch, which changes the
  *"in stock at your branch"* part of the match score.
- **Plain English works** — `preferred datacom under $100`, `in stock Square D`, etc.
