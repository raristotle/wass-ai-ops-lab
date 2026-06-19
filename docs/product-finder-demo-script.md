# Product Finder — Demonstration Script

A presenter-ready, ~18-minute walkthrough of <https://app.raristotle.com/product-finder>.
Every SKU below is deterministic — it exists with the same data in every environment
(the live distributor prices in Act 3 are the one deliberate exception: they're real).
**Bold** = what you do. *Italic* = what you say.

> Prep (30 seconds): open the site in a fresh tab, have this script on a second
> screen. No other setup — the catalog, customers, orders, and a seeded quote
> history are built in.

## Act 1 — Sign in & the one-screen pitch (1.5 min)

1. **Sign in** as `sales@meridiansupply.com` / `meridian2024`.
   *"I'm Sarah Chen, an inside sales rep at the Houston Downtown branch. Everything
   I need to turn a customer request into a priced, stocked order is on this one
   screen — searching 200,000 products."*
   (Enterprise-IT aside: **point at "Sign in with SSO"** under the password form —
   *"and for your org this is single sign-on: Azure AD or Okta, your IdP groups
   mapping straight to rep/manager/admin roles. Click it in demo mode and it signs
   me in as a manager mapped from a 'branch-manager' group claim."*)
1a. **Point at the guided tour card** (bottom-right, on a first visit).
    *"New reps get an 8-step tour — search, filters, alternatives, the Job Wizard,
    basket and quote, insights — and every step has a one-click 'try it' that runs
    the real feature. It shows once and never blocks the screen."* **Dismiss it**
    (it's re-launchable from the Help panel footer).
1c. **(Opener for a Wesco audience.) Use the header "Brand:" switcher → Wesco.**
    *"Before we go further — this is your app. One switch and the whole thing is
    Wesco-branded: the logo, the login screen, the quote PDF, the submittal
    package. Your real logo and palette drop straight in; a per-customer branded
    deployment is a config away."* (Flip it back to Meridian, or leave it on
    Wesco for the rest of the demo.)
2. **Point at the header**: name + branch top-right, the **"Demo role:"** selector
   (*"swap between rep, manager, and admin instantly — no retyping credentials;
   we'll use it later"*), the **⌘K** palette button, the **🔔 notification bell**
   (*"approvals, follow-ups, restock alerts — we'll come back to it"*), the **?**
   Help button (*"interactive help with try-it examples, for new reps"*), and the
   Cart.
2b. **Point at the metals index strip** at the top of the landing view.
    *"Distribution pricing lives on copper. The app tracks a daily metals index —
    when copper trends up, it nudges the rep to quote wire and cable now and lock
    the 30-day validity. Every quote cites the index date its pricing reflects.
    Simulated here — and with a free FRED key set it's REAL: live copper and
    aluminum from the Federal Reserve's data service, in dollars per pound, cited
    by observation date. The strip footer tells you which mode it's in."*
2c. **Point at the seasonal banner** under the metals strip.
    *"And it knows the calendar: storm prep, heat advisories, construction season,
    quarter-end datacom budgets — a weekly demand signal with one-tap searches for
    what's about to sell."* **Click one pick chip**, then clear the search.
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
   their history."* **Point at the health dot under the selector.**
   *"And the app already knows this account's rhythm — green means Gulf Coast is
   ordering on their usual 30-day cadence. Pick Lone Star instead and you'd see a
   Watch flag: 70 days quiet. That's a win-back call, surfaced automatically —
   at-risk accounts go straight to the bell."*

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
6a. **Click ★ Save this search** under the search bar, **name it** ("20A
   breakers in stock"). *"A search a rep runs every day is now one click away —
   and the 🔔 flags it when new matches land."* **Point at the seeded saved-search
   chip with a "+N new" badge, and the matching alert in the 🔔 bell** —
   *"that's the alert firing: new stock matched a saved search, surfaced without
   the rep lifting a finger."*

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
9a. **Search `AF09-30-10-13`** (a real ABB contactor) **and open View Details.
    Scroll to the live distributor panel.**
    *"And here's where the demo stops being a demo: those are LIVE calls to
    Mouser Electronics AND Digi-Key — real stock, real price breaks, real
    datasheets, fetched this second for this real part number. And look at the
    spread: Mouser wants $94 for this contactor, Digi-Key $49 — that's the
    multi-source price intelligence a rep never had at the counter. Our simulated
    SKUs never leave the building; verified parts get live market data."*
    (Also works: `UTPSP5BUY` Panduit patch cord, `LC1D09G7` Schneider contactor,
    `3RT2026-1AK60` Siemens.)
9c. **Search `FRN-R-30`** (a real Bussmann fuse). **Point at the ⇄ VERIFIED
    CROSSES badge on the result card** — *"the card tells you up front that
    documented substitutes exist."* **Open View Details. Point at the VERIFIED
    CROSS-REFERENCES panel.**
    *"This is the other half of real: 174 cross-references where every pair
    cites the official document that states it — this one is Mersen's own
    published cross guide mapping this Bussmann fuse to the Mersen TR30R we
    stock, with the source PDF one click away. Attribute agreement is checked,
    qualifiers come straight from the document, anything under 95% confidence
    never reaches the rep, and when two sources disagree, a documented
    rule — manufacturer beats distributor beats industry chart — picks the
    winner. No black-box AI guesses on substitutions."*
    (Also works: `HBL5266C` Hubbell plug → Leviton & P&S crosses from Hubbell's
    own bin-stock guide; `CSD16126` Hoffman enclosure → Hammond's cross table;
    `LC1D09G7` → ABB's competitor lookup.)
9d. **Click "browse all" in the panel** (or Ctrl+K → "Open Cross-Reference
    Explorer"). *"The whole cross dataset is a first-class surface: every pair,
    filterable, with the stocked sides marked and the source document one click
    away. And the Sources tab is the data-governance story — the 1,000-row
    source workbook we ingested, every source classified: extracted, extractable,
    behind a browser wall, behind an API key, or licensed. Nothing is hidden;
    a data steward can audit every recommendation back to its document."*

9e. **Click the green 💬 Ask Meridian button.** *"And here's the 2026 layer:
    a conversational assistant that answers in plain English — but grounded.
    Watch."* **Type "What do you stock that replaces a Bussmann FRN-R-30?"**
    *"It cross-references to the Mersen TR30R we stock, cites the manufacturer's
    document, and tells me it used the cross-reference tool — auditable, never an
    invented part. Spec questions, availability, search — same grounded answers,
    same tools an agent gets through our MCP server."*
    > **Activation note:** Ask Meridian lights up when an `ANTHROPIC_API_KEY` is
    > set on the deployment (Vercel env). Until then it shows a labeled "preview
    > mode" banner and zero AI cost is incurred — the Job Wizard and Bulk
    > Cross-Ref answer the same questions deterministically today. The MCP server
    > (`npm run mcp`) is live now regardless: connect Claude Desktop and ask it to
    > convert a competitor BOM to our stock.

9f. **Search `circuit breaker` and look for a ⚠ badge** (NRND / EOL / Discontinued)
    on a result card; **tick "Active products only"** in the sidebar (Product
    Lifecycle). *"Every part now carries a manufacturer lifecycle status, so a
    rep never quotes a dead part by accident. One toggle designs out everything
    obsolete."* **Open an obsolescent part's details** — *"and when something IS
    end-of-life, the app names the active equivalent we stock and adds it in one
    click. Underneath, this sourcing chip — Single-source, Dual-source, Broadly
    sourced — is our cross-reference engine reframed as the single-source risk
    view procurement teams ask for: how many stocked, interchangeable options can
    actually fill this line."*

9g. **Click the 📐 Selectors button** by the search bar. **Pick "Wire size",
    enter 40 A, 250 ft, 240 V, single-phase, copper, Calculate.** *"Manufacturers
    publish NEC calculators as lead-gen — but they dead-end at a generic spec.
    Ours doesn't: it sizes the conductor for both ampacity and voltage drop,
    tells you which one governs, and then lands on the actual wire we stock at
    this customer's price — one click into the basket. Conduit fill and breaker
    sizing work the same way. That's engineering intent captured as an order."*

## Act 4 — From basket to deliverables (5 min)

9b. **Click the 🧰 Job Wizard button** by the search bar. **Pick "200A
    residential service upgrade".** *"Here's the headline: don't build the
    basket part by part — describe the job. Seven steps — panel, breakers,
    GFCIs, feeder wire, grounding, lugs — each already resolved to a stocked,
    priced product from our catalog, with alternates one click away and field
    notes on the code requirements. The whole-home surge protector is optional —
    and flagged as the easy upsell it is."* **Click Add 6 items to basket.**
    *"A whole job, basketed in ten seconds. Deterministic and always-on — and
    its conversational sibling (the 💬 Ask Meridian assistant, step 9e) now
    answers the same questions in plain English when a key's configured."*

10. **Open the Cart.** The GE substitute is there. **Set its quantity to 50** —
    *"volume tier kicks in automatically."* Point at the **margin** on the line and
    the **basket margin** at the bottom — *"I can see my margin as I discount;
    that's internal, it never prints on the customer's quote."* If the 50 exceeds
    stock, point at the **⚠ backorder warning** — *"and it tells me honestly that
    part of this quantity is on backorder."*
    **Point at the 📊 line under the basket margin.**
    *"And the margin isn't just a number — it's coached. Quotes in this margin
    band historically win two out of three; push past 30% and the win rate drops
    to a third. That's the branch's own quote history teaching reps where deals
    close."*
10s. **If a line shows a green "✓ Save $X — documented cross" box, point at it.**
    *"Here's margin the rep would never have found by hand: this line has a
    cheaper equivalent we stock, and the system proves it with the manufacturer's
    cross document — the basket even totals the documented savings across the
    whole order. One click swaps it in, cited."* **Click "Swap & save"** on one.
    (Reliable demo line: add `Bussmann FRN-R-30`, then a line whose stocked cross
    is cheaper surfaces the swap.)
10u. **With a few lines in the basket, click 🩺 BOM Health.** *"Here's the BOM
    platform layer procurement teams pay for — Octopart, Arrow, Z2Data. Every
    line graded A/B/C on lifecycle, stock depth, single-source risk, and whether
    a substitute exists, with a worklist: 'these N lines need a look,' and the
    fix for each — swap the end-of-life part to its active successor, qualify a
    second source on the single-sourced line. And the landed-cost optimizer
    scores each line's options — the part, its stocked crosses, the successor —
    by price plus freight plus a lead-time carrying penalty, and tells you the
    cheapest compliant award with the dollars and the reasoning. That's the
    sell-side version of a Coupa bid comparison, pointed at our own inventory."*
    **Point at the Compliance card and the per-line ⚖ flags.** *"And it's
    bid-grade: every line carries UL listing, RoHS and Prop 65, country-of-origin,
    and — the 2026 one everyone's asking about — Section 301 tariff exposure, with
    a rollup of how many lines are flagged or tariff-exposed. That's what a
    government, AHJ, or MRO submittal gates on. Derived data here; a real UL feed
    drops in behind it."*
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
    the status to Sent.** *"Draft → Sent → Won or Lost. And approval routing is now
    a real policy, not one rule: below our 20% margin floor, OR a large order over
    $25k, OR a discount deeper than 25% off list — any of those flags 'Approval
    pending', records exactly why in the quote's history, and blocks conversion
    until a manager signs off. Spend governance, Coupa-style, built in."*
    **Before saving, type a Note** ("Crane access required — call ahead") **and
    tick two Terms blocks** (Freight, Price escalation).
    *"The boring-but-critical fine print rides along: a note to the customer and
    selectable terms — freight, returns, payment, commodity escalation. They print
    on the PDF and show up on the customer's acceptance page, so what the rep
    agreed to is what the customer sees."*
14. **Click Email Quote**, show the pre-filled recipient, **Send Quote.**
    *"With the email key configured this is a real branded email via Resend —
    the line table, the note and terms, and a Review-and-Accept button that opens
    the customer quote page. No key? It says so honestly and simulates. Either
    way the quote is logged as Sent."* (Free tier delivers only to the Resend
    account owner's address until a domain is verified — demo to your own inbox.)
    Then in **Saved Quotes**, **Convert to Order** on a quote — *"customer says
    yes; one click turns the quote into a placed order and marks it ✓ ordered."*
14a. **Click Customer Link on a saved quote**, then **open the copied URL in a new
    tab.** *"Or skip the phone call entirely: this is what the customer gets — no
    login, the branded quote with their prices and the validity date, and two
    buttons."* **Click Accept Quote.** *"Accepted — and back on our side it's
    already marked Won and converted to an order. Decline marks it Lost so the
    pipeline stays honest. If the quote was below the margin floor, this page
    says 'awaiting approval' and won't let them accept until a manager signs
    off."* (Copying the link also auto-advanced a Draft to **Sent**.)
14b. **On a second quote's customer link, click Request changes**, type *"need
    delivery by the 25th"*, **Send change request.** *"Customers don't just take
    or leave it — they push back. That note lands on the rep's quote as a
    COUNTERED badge with the ask inline, rings the bell, and rolls up on the
    manager's pipeline as 'counter-offers awaiting a response.'"*
14c. **Back in Saved Quotes, click Revise on the countered quote.**
    *"And the counter gets a real answer. Revise loads everything — lines,
    customer, note, terms — back into the basket with a banner. Drop the price
    or swap a product…"* **adjust something, click Save Quote (v2).**
    *"…and Save creates version 2, linked to the original. The old quote is
    superseded — it leaves the pipeline, its alerts go quiet, and the old
    customer link says a newer version exists. Now expand History on either
    version:"* **click History.**
    *"Every step — created, link copied, sent, countered, revised, by whom,
    when. When IT asks about auditability, this is the answer."*
15. **Click Export CSV.** *"Same basket as a spreadsheet — list vs. effective price,
    totals — for procurement."* Then **Share Basket** — *"a link that rebuilds this
    exact basket for a teammate or the customer."*
15a. **Point at Procurement export — click cXML PunchOut, then EDI 850 PO.**
    *"And for an enterprise buyer this basket doesn't stop at a PDF: it exports
    the formats their purchasing system actually ingests — a cXML
    PunchOutOrderMessage for an Ariba or Coupa or SAP punchout, and an X12 850
    purchase order for EDI. Real prices, real quantities, valid envelopes — and
    every line now carries its 8-digit UNSPSC commodity code, the classification
    Ariba and Coupa require before a catalog can even go live. That's how a
    Meridian quote becomes a PO inside the customer's own ERP — no rekeying."*
16. **Save the basket as a Job Template** ("Office buildout"). *"A reusable kit — next
    job, Add to Basket merges it in instead of rebuilding."*
17. **Click Add to Order**, then expand **Order History**: *"every past order for
    Gulf Coast — click one open to see its lines — and Reorder puts it all back.
    Repeat business in two clicks."* **Click Reorder.**
17a. **On an order, click Track order.** *"And the app no longer goes dark after
    checkout: a status timeline from placed to delivered, with a promised date
    off the stocking ETA — and one toggle flips it between jobsite delivery and
    will-call pickup, relabeling the whole flow."* **Then click Start a return,
    tick a line, pick a reason, Generate RMA.** *"Wrong item or over-ordered?
    Self-service returns: pick the lines, get an RMA number and the credit
    estimate, and track it from requested to credit-issued — the bell flags open
    RMAs until they're resolved. That's the whole post-purchase loop the demo
    used to be missing."*
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
18b. **Open Import List / BOM again and paste a competitor's BOM** (parts we
    DON'T stock, whose documented equivalents we DO):
    ```
    4x QTP2X32T8/UNV-SC ballast
    2 Hoffman A1212CHFL
    6 AH5362W receptacle
    ```
    **Match.** *"This is the counter-sale, automated: the customer walks in with
    a competitor's bill of materials — none of these three are in our catalog —
    and every line the cross dataset documents gets a green 'Verified cross — we
    stock the equivalent' card: the Osram ballast to the Philips Advance we
    stock per the manufacturer's own cross guide, the Hoffman enclosure to our
    Hammond, the Arrow Hart receptacle to our Hubbell — source one click away.
    Watch the summary: '3 competitor parts crossable to stock.'"*
    **Click "Use stocked cross" on a line** — *"swapped, cited, and ready to
    quote. No catalog-flipping, no guessing — if it's not documented, we don't
    claim it."* **Add matched to cart.**
18c. **Click Bulk Cross-Ref** (the green toolbar button). **Paste a column of
    competitor part numbers:**
    ```
    FRN-R-30
    QTP2X32T8/UNV-SC
    HBL5266C
    A1212CHFL
    GRC58
    ```
    **Find equivalents.** *"This is procurement's tool: a customer hands you a
    competitor's parts list — a hundred lines — and you get back our stocked
    equivalent for each, every one cited. Export the CSV straight back to their
    buyer, or add it all to the basket. That Burndy GRC58 ground clamp? Crosses
    to the Ilsco we stock, per ABB's own EZGround cross table."* **Export CSV**,
    then **Add crossed to basket.**
18d. **Click 📥 RFQ → Quote, type a customer and project, paste a messy takeoff**
    (e.g. `12x 20A 1-pole breaker`, `5 led troffer 2x4`, `10x 3/4" EMT`), **click
    Match BOM.** *"This is the inbound side, automated: a customer emails a takeoff,
    and instead of a rep retyping it line by line, the app drafts the quote — every
    line matched and confidence-scored, competitor parts crossed to what we stock.
    'N of M lines matched, K to review.'"* **Click Create draft quote.** *"One
    click and it's a draft quote with the customer and project, sitting in the
    pipeline for the rep to review and send. The highest-frequency inside-sales
    task, handled."*

## Act 5 — The manager view (2 min)

19. **Switch the "Demo role:" selector to Marcus Rivera (Manager).**
    *"No sign-out, no retyping — the role changes, and the Insights link appears
    because Marcus is a manager. The basket and orders carry over."*
19a. **Click the 🔔 bell** (it should be badged if a below-margin quote exists —
    save one in step 13 with the step-10a discount kept).
    *"Marcus doesn't go hunting for work — it comes to him. A below-margin quote
    needs his sign-off, any quote sent two weeks ago with no answer asks for a
    follow-up, customer counter-offers ring here, products reps are watching show
    their estimated restock date, and accounts going quiet raise an at-risk flag.
    Five signal types, all click-through. Click one—"* **click the approval
    notification** — *"and it lands exactly on the quote, ready to approve."*
    (Reps see follow-ups, counters, and restock alerts; only managers see
    approvals.)
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
20b. **Scroll to Pricing Win/Loss and Customer Health.**
    *"Two panels that turn quoting exhaust into management insight. Win/loss by
    margin band — won deals average 23% margin, lost ones 27%; the sweet spot is
    visible, and the same guidance coaches reps in the basket. And Customer
    Health ranks every account by order cadence — Lone Star's been quiet 70
    days; one click lands on their history, ready for the win-back call."*
20c. **Scroll to Branch Demand Forecast.**
    *"And the same history answers 'what should this branch stock next month?'
    Ninety days of orders and won quotes by subcategory, a trend arrow, and a
    30-day stocking suggestion — click a row and you're browsing that
    subcategory. Simple, explainable math; a real forecasting model plugs into
    the same panel."*
20d. **Scroll to Cross-Reference Coverage.**
    *"And here's the data-governance view a Wesco steward asks for: 200
    source-backed cross pairs, how many are both-sides stocked, the same
    1,000-row source workbook broken down by what's ingested vs behind a browser
    wall or a license, pairs by category, and the brands still missing a modeled
    hierarchy. Every recommendation in this app traces back to one of these
    sources — Open Explorer drills all the way to the document."*

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

*"One screen takes a rep from a rough request — or just the name of the job —
to a customer-priced, quoted, coached, tracked order the customer can accept or
counter from their phone. Reorder predictions and commodity trends before the
first keystroke, seasonal demand signals, explainable recommendations, LIVE
Mouser and Digi-Key pricing on real parts, automatic substitutes, margin-guarded
overrides with win/loss coaching, confidence-scored BOM imports, real branded
quote emails, every quote carrying its own audit trail with revisions instead
of overwrites, customer health and demand forecasts rolling up to a manager
bell and pipeline — and every screen two keystrokes away, desk or job site."*

> **Built-for-production aside (for an IT/enterprise audience):** this is a
> hardened pilot, not just a happy-path demo. Cost- and write-sensitive endpoints
> are rate-limited (the AI assistant at 20/min) and return a polite `429` rather
> than running up load; every response carries security headers (clickjacking,
> MIME-sniffing, referrer, permissions policy, HSTS); a `/api/health` endpoint
> reports integration status as booleans for uptime monitoring; errors log as
> structured JSON and never leak internals to the browser; and the render-critical
> UI is covered by component tests on top of the full unit suite. Full posture and
> the prioritized follow-ups (CSP, shared rate-limit store, SSO token-exchange) are
> in [docs/security.md](security.md).

> **Demo honesty note:** customer accounts, contract pricing, inventory/ATP, PIM
> provenance, and simulated-SKU cross-references run on **synthetic data behind
> swap-in adapters** (`lib/integration/`). The REAL pieces: the live
> Mouser/Digi-Key distributor panel (Act 3, step 9a), the source-backed verified
> cross-references (step 9c), the **MCP server** (`npm run mcp`, live now,
> zero AI cost), and the **procurement export** (real cXML/EDI 850 generated from
> the basket, step 15a). And — when their keys/config are present — the **Resend
> quote email**, the **conversational Ask Meridian assistant** (step 9e; behind
> `ANTHROPIC_API_KEY`), and **enterprise SSO** (step 1; behind `SSO_*`, with a
> built-in demo flow). See the
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
- **No 📊 guidance line in the cart** → the basket's margin band needs 3+
  decided quotes; the seeded history covers the 15–30%+ bands on a fresh browser.
- **No health dot** → select a customer in "Quoting for" first.
- **Metals strip / seasonal banner missing** → they show on the landing view
  only (clear search and filters); the copper nudge appears only when copper
  trends up that day, and the seasonal event rotates weekly — whatever shows,
  the talking point is the same.
- **Job Wizard step says "No match"** → that subcategory search found nothing;
  swap an alternate on another step or search manually — every default template
  query is verified against the catalog.
- **Revise button missing** → won, ordered, and already-superseded quotes can't
  be revised; pick an open (draft/sent) version.
- **Live distributor panel empty** → normal for most parts; use the known-good
  SKUs in step 9a. Construction commodities often aren't carried by electronics
  distributors — the panel says so rather than faking it.
- **Offer Ladder shows only "Meridian"** → expected in the demo. The authorized
  (ECIA TrustedParts), aggregator (OEMsecrets), and live Mouser/Digi-Key lanes
  are env-gated and dormant until their keys are set — the ladder still shows the
  internal volume price curve. Talking point: "one ranked seller/stock/lead/price
  view; the external lanes stack in the moment a key is added, $0 until then."
- **No weather chip on a tracked order** → the NWS jobsite-weather lane is dormant
  until a weather contact + geocoding key are set, so it stays quiet in the demo;
  it only appears on jobsite-delivery orders for the fulfilling branch metro.
- **No "Request deposit" button on a quote** → expected in the demo. Stripe deposit
  collection is dormant until `STRIPE_SECRET_KEY` is set; it's the only money-moving
  feature, so it stays hidden and $0 until keyed. Talking point: "a deposit Checkout
  link is created only by an explicit rep click — card or ACH, on Stripe's hosted page."
- **No "✍️ Send for signature" button on a quote** → expected in the demo. Quote
  e-signature (Dropbox Sign) is dormant until `DROPBOX_SIGN_API_KEY` is set, and even
  then defaults to free test mode. Talking point: "one click emails the customer a
  binding e-signature link; the signature is captured server-side and written to the
  tamper-evident audit trail — $0 until keyed, free in test mode." Setup: docs/esignature.md.
- **Next Best Actions (manager dashboard)** → the top card is a single ranked “do this
  next” list — counter-offers, approvals, stale quotes, at-risk accounts, unclaimed
  rebates, demand to stock — each deep-linking to where you act. Deterministic over the
  same data the cards below show: $0, no AI.
- **Utility rebate estimate** → open any LED fixture/lamp (try "LED troffer") to see an
  estimated per-fixture utility rebate + the total for the quantity, a DLC-eligible
  badge, and a controls-uplift band. Talking point: "the incentive that closes a
  retrofit — an honest estimate the local utility confirms; there's no free national
  feed of exact rebate dollars." Non-lighting products show no panel.
- **Audit Log card empty** → expected on a fresh demo; it populates as events occur (a
  signature, an order). It's hash-chained with a live “✓ Chain verified” badge, and
  Export (CSV) hands an auditor the full chain. Set `AUDIT_SECRET` for production-grade
  signing (docs/audit-log.md).
- **cXML confirmation / ship notice** → on a placed order, open Track order → the
  Procurement cXML row downloads the OrderConfirmation / ShipNotice for the buyer's
  Ariba / Coupa / SAP system. Deterministic and $0; generated only on click.
- **Real email fails with a domain message** → Resend free tier delivers only
  to the account owner's inbox until a domain is verified; send to that address
  or verify a domain.
- **Stuck anywhere** → the **?** Help button covers every feature with examples,
  or **Ctrl-K / ⌘K** jumps anywhere.
