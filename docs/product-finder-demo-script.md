# Product Finder — Demonstration Script

A presenter-ready, ~14-minute walkthrough of <https://app.raristotle.com/product-finder>.
Every SKU below is deterministic — it exists with the same data in every environment.
**Bold** = what you do. *Italic* = what you say.

> Prep (30 seconds): open the site in a fresh tab, have this script on a second
> screen. No other setup — the catalog, customers, and orders are built in.

## Act 1 — Sign in & the one-screen pitch (1.5 min)

1. **Sign in** as `sales@meridiansupply.com` / `meridian2024`.
   *"I'm Sarah Chen, an inside sales rep at the Houston Downtown branch. Everything
   I need to turn a customer request into a priced, stocked order is on this one
   screen — searching 200,000 products."*
1a. **Point at the guided tour card** (bottom-right, on a first visit).
    *"New reps get a 7-step tour — search, filters, alternatives, basket and quote,
    insights — and every step has a one-click 'try it' that runs the real feature.
    It shows once and never blocks the screen."* **Dismiss it** (it's re-launchable
    from the Help panel footer).
2. **Point at the header**: name + branch top-right, the **"Demo role:"** selector
   (*"swap between rep, manager, and admin instantly — no retyping credentials;
   we'll use it later"*), the **⌘K** palette button, the **🔔 notification bell**
   (*"approvals, follow-ups, restock alerts — we'll come back to it"*), the **?**
   Help button (*"interactive help with try-it examples, for new reps"*), and the
   Cart.
2a. **Point at the "For you" rail** at the top of the landing view.
    *"Before I type anything, the app already knows this branch's rhythm —
    'Time to reorder' is ranked from real order history, with a DUE badge when a
    customer's last order is 30+ days old, and the Add button pre-fills the
    quantity they bought last time. Next to it: favorites I haven't basketed, and
    cross-sell that goes with what we order. This is the recommender working
    before the first search."*
3. **Set "Quoting for:" → Gulf Coast Industrial.**
   *"First thing a rep does — pick the customer. That drives their contract
   pricing, their order history, the quote — and the For-you rail re-scopes to
   their history."*

## Act 2 — Search like you talk (3 min)

4. **Type `20A breaker in stock under $50`** and press Enter.
   *"Plain English. The app parsed price, availability, and product — each one is
   a chip I can remove."* **Click the ✕ on `Under $50`** to show instant update.
4a. **Click the mic** in the search box and say *"twenty amp breaker in stock
    under fifty dollars."*
    *"Or just say it. The dictation shows live, then 'twenty amp' is normalized to
    20A and it runs through the same plain-English parser."* (Chrome/Edge — the
    button hides itself where the browser has no speech service.)
4b. **Type `romex`** and press Enter. *"Reps talk in trade terms — romex becomes
    NM-B cable. GFI becomes GFCI, cat 6 becomes Cat6, EMT finds conduit — about
    three dozen of these."* Then **type `breakr`** — *"and typos don't dead-end:
    one confident fix gets applied automatically, with a banner to undo it."*
5. **Point at a card's price block**: *"List price, struck through — Gulf Coast's
   contract price, and the savings. Switch the customer to walk-in and it's list
   again."* (Optionally toggle the customer selector to show it.)
6. In the sidebar, **tick a spec facet** (e.g. Amperage → 20A) —
   *"live counts, real spec-level filtering, including numeric ranges."*

## Act 3 — The intelligence (3 min)

7. **Search `QO115`** → the Square D QO115 breaker. **Click Find Alternatives.**
   *"These aren't just 'similar' — the green ✓ CROSS-REF tags are true functional
   equivalents: same 15A / 120-240V / 1-Pole, interchangeable, just Eaton, GE, ABB
   instead of Square D. That's the cross-reference a customer actually asks for."*
   **Click "Why recommended?"** on one: *"specs matched, in stock at my branch,
   preferred line, cheaper — every point explained."*
8. **Search `CB-EAT-329`.** *"Customer wants this Eaton breaker — it's out of
   stock everywhere. Old answer: 'I'll call you back.' New answer:"* — point at
   the amber panel — *"the system already found the best in-stock substitute, a
   GE breaker, same specs."* **Click Add Substitute.** *"One click, sale saved."*
9. **Click View Details** on any product: volume pricing tiers, the Availability
   panel (*"branch stock, DC stock, promise dates, transfer ETA — simulated ERP
   adapters ready for real systems"*), the printable Spec Sheet, and
   **Goes well with** cross-sell. **Point at the product plate** — *"every one of
   the 79 subcategories has its own line art, and the plate badges the key spec —
   that 20A comes straight off the spec sheet."*

## Act 4 — From basket to deliverables (4 min)

10. **Open the Cart.** The GE substitute is there. **Set its quantity to 50** —
    *"volume tier kicks in automatically."* Point at the **margin** on the line and
    the **basket margin** at the bottom — *"I can see my margin as I discount;
    that's internal, it never prints on the customer's quote."* If the 50 exceeds
    stock, point at the **⚠ backorder warning** — *"and it tells me honestly that
    part of this quantity is on backorder."*
10a. **Click ✎ price on the line and type something absurdly low** (e.g. `1.00`),
    **Apply.** *"Price-matching a competitor? I can override the line price — but
    watch: it snapped to the floor. The guardrails won't let me sell above list or
    below a 5% margin over cost, and the allowed range was right there while I
    typed. The line is badged CUSTOM, my margin recalculated live, and this exact
    price flows into the quote, the saved quote, and the order."* **Click reset**
    (or keep it — a deep discount sets up the approval moment in step 13).
11. **Point at "Complete this job."** *"The basket knows what's missing — I added
    conduit, so it's offering the fittings and boxes I'd forget. One tap each."*
    **Click + Add** on a suggestion.
12. **Point at "Ships complete by."** *"The whole order's realistic delivery date —
    in-stock lines ship in days, the slowest line sets the promise. No more guessing
    on the phone."*
13. **Click Generate Quote (PDF).** *"Branded quote — auto number, 30-day validity,
    my name and branch, contract-priced lines."* Then **Submittal Package (PDF)** —
    *"and one click bundles a full spec sheet for every line into an approval-ready
    submittal package — exactly what a GC needs, with our accurate cross-reference
    specs."* Then **Save Quote** — *"now it's tracked."* In **Saved Quotes**, **set
    the status to Sent.** *"Draft → Sent → Won or Lost. And if I'd discounted below
    our 20% margin floor, this quote would say 'Approval pending' and I couldn't
    convert it until a manager signs off — discount governance built in."*
14. **Click Email Quote**, show the pre-filled recipient, **Send Quote.** *"Off to
    the customer — and it's logged as Sent automatically."* (Simulated send.) Then
    in **Saved Quotes**, **Convert to Order** on a quote — *"customer says yes; one
    click turns the quote into a placed order and marks it ✓ ordered."*
14a. **Click Customer Link on a saved quote**, then **open the copied URL in a new
    tab.** *"Or skip the phone call entirely: this is what the customer gets — no
    login, the branded quote with their prices and the validity date, and two
    buttons."* **Click Accept Quote.** *"Accepted — and back on our side it's
    already marked Won and converted to an order. Decline marks it Lost so the
    pipeline stays honest. If the quote was below the margin floor, this page
    says 'awaiting approval' and won't let them accept until a manager signs
    off."* (Copying the link also auto-advanced a Draft to **Sent**.)
15. **Click Export CSV.** *"Same basket as a spreadsheet — list vs. effective price,
    totals — for procurement."* Then **Share Basket** — *"a link that rebuilds this
    exact basket for a teammate or the customer."*
16. **Save the basket as a Job Template** ("Office buildout"). *"A reusable kit — next
    job, Add to Basket merges it in instead of rebuilding."*
17. **Click Add to Order**, then expand **Order History**: *"every past order for
    Gulf Coast — click one open to see its lines — and Reorder puts it all back.
    Repeat business in two clicks."* **Click Reorder.**
18a. **Click Bulk Price Check** and paste a mix of SKUs and a competitor part
    number (e.g. `QO115`, `CB-EAT-CH115`, `12x 20A breaker`). **Get Prices & Stock** →
    *"an instant RFQ response — every line priced, in stock, and cross-referenced.
    Export CSV back to procurement, or add it all to the basket."*
18. **Click Import List / BOM** and paste:
    ```
    12x gfci receptacle
    5 led troffer
    10x 3/4" EMT conduit
    5x circut breakr 20A
    3, transformer
    ```
    **Match.** *"A whole bill of materials in seconds — and look at the scores.
    Every line gets a match confidence: green means the product covers the line,
    exact SKUs are always 100%, and numbers are strict — a 20A request will never
    silently match a 200A part. The misspelled line? Auto-corrected to 'circuit
    breaker' and flagged. Anything amber gets alternatives —"* **click Use on an
    alternate** — *"one click to swap, and the summary counts what's left to
    review. Customers' messy faxed lists, handled honestly."*
    **Add matched to cart.**

## Act 5 — The manager view (2 min)

19. **Switch the "Demo role:" selector to Marcus Rivera (Manager).**
    *"No sign-out, no retyping — the role changes, and the Insights link appears
    because Marcus is a manager. The basket and orders carry over."*
19a. **Click the 🔔 bell** (it should be badged if a below-margin quote exists —
    save one in step 13 with the step-10a discount kept).
    *"Marcus doesn't go hunting for work — it comes to him. A below-margin quote
    needs his sign-off, any quote sent two weeks ago with no answer asks for a
    follow-up, and products reps are watching show their estimated restock date.
    Click one—"* **click the approval notification** — *"and it lands exactly on
    the quote, ready to approve."* (Reps see follow-ups and restock alerts; only
    managers see approvals.)
    **Click Insights.**
    *"Managers get the rollup — orders, value, contract savings delivered, top
    categories, customer mix. Reps don't see this."*
20. **Scroll to Quote Pipeline.** *"And now the quotes the reps are saving and
    emailing roll up here — open value in Draft and Sent, Won vs. Lost, win rate,
    how many won quotes actually **converted to orders**, and a flag on any quote
    sent over two weeks ago that needs a follow-up. The rep's quoting activity
    becomes the manager's pipeline, automatically."*
20a. **Click a Top Categories bar, then back; then the Sent quote-status tile.**
    *"Every number on this dashboard answers 'which ones?' — a category bar lands
    on that category's search, a top product opens its detail, a customer row opens
    their orders, and the Sent tile opens the cart at Saved Quotes with a Status:
    Sent chip I can clear. An orders-over-time point does the same for its month.
    No dead-end KPIs."*

## Act 6 — Two keystrokes to anywhere (1 min)

21. **Press Ctrl-K** (⌘K on Mac). *"The command palette — search, Insights, the
    basket, help, BOM import, bulk pricing, restarting the tour, even switching
    roles. Or type anything and Enter searches it."* **Type `cat6`, press Enter** →
    results.
22. **Click Copy link** (next to Export CSV in the results bar). *"And the URL
    **is** the search — query, filters, sort. Paste this link and anyone lands on
    these exact results. It even coexists with the shared-basket links from
    earlier."*

## Wrap-up

*"One screen takes a rep from a rough request to a customer-priced, quoted,
emailed, tracked order — and now the order can close itself: the customer taps a
link on their phone and accepts. Searchable by voice or in trade slang, reorder
predictions before the first keystroke, explainable recommendations, automatic
substitutes for out-of-stock items, margin-guarded price overrides, basket-level
'what's missing' cross-sell, delivery dates, live stock, cross-references,
confidence-scored BOM imports, CSV/PDF deliverables, reusable kits, a
notification bell and click-through pipeline for managers, and every screen two
keystrokes away — desk or job site."*

> **Demo honesty note:** customer accounts, contract pricing, inventory/ATP, PIM
> provenance, and cross-references run on **synthetic data behind swap-in
> adapters** (`lib/integration/`). See the
> [integration guide](wesco-it-integration-guide.md) for connecting real systems.

## If something goes sideways

- **No results** → Clear search & filters (sidebar) and re-type.
- **Substitute panel missing** → make sure you searched `CB-EAT-329` exactly; any
  fully out-of-stock product works.
- **No contract pricing** → check "Quoting for:" still shows Gulf Coast Industrial.
- **No mic button** → the browser has no speech service (use Chrome or Edge);
  voice is optional — type the same query.
- **Tour card didn't appear** → it shows once per browser; relaunch it from the
  **Help panel footer → "Restart the tour"** (or the command palette).
- **No Insights link** → check the "Demo role:" selector shows Marcus Rivera
  (Manager) or Admin User.
- **For-you rail missing** → it shows on the landing view (no search/filters
  active) once orders or favorites exist; the three seeded demo orders make it
  appear on a fresh browser. Clear the search to get back to it.
- **Bell shows no approval item** → approvals only appear for manager/admin, and
  only while a quote is "Approval pending" — save a quote with a deep ✎ price
  discount first.
- **Customer link says "awaiting approval"** → that's the guardrail working;
  approve the quote (manager) and copy a fresh link.
- **Stuck anywhere** → the **?** Help button covers every feature with examples,
  or **Ctrl-K / ⌘K** jumps anywhere.
