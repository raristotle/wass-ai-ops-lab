/**
 * lib/product-finder-help-content.ts — In-app help topics for the Product Finder.
 *
 * Pure data + a search filter. The HelpPanel renders these as expandable
 * sections; topics with `tryQuery` get a "Try it" button that runs the query
 * through the natural-language search.
 */

export interface HelpTopic {
  id: string;
  title: string;
  /** Paragraphs / bullet lines. Lines starting with "• " render as bullets. */
  body: string[];
  /** Optional natural-language search the user can run with one click. */
  tryQuery?: string;
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting started",
    body: [
      "The Product Finder takes you from a rough request to a stocked, priced, justified recommendation on one screen.",
      "• Sign in with a demo account — password for all is meridian2024.",
      "• sales@meridiansupply.com — Sarah Chen, Sales Rep (Houston Downtown)",
      "• manager@meridiansupply.com — Marcus Rivera, Manager (Dallas North)",
      "• admin@meridiansupply.com — Admin User (Corporate)",
      "Your branch matters: it decides what counts as “in stock at your branch,” which feeds match scores.",
      "Everything runs on 200,000 synthetic products — click around freely; nothing leaves the app.",
    ],
  },
  {
    id: "search",
    title: "Search & plain-English queries",
    body: [
      "Search runs server-side over all 200,000 products. Type a product name, SKU, brand, or spec.",
      "Plain English works: price (“under $50”), availability (“in stock”), “preferred,” categories, and brand names all become removable filter chips.",
      "• Suggestions drop down as you type — click one to jump to it.",
      "• Quick-pick chips run common searches in one click.",
      "• The ✕ in the search box clears the search and all chips.",
    ],
    tryQuery: "20A breaker in stock under $50",
  },
  {
    id: "filters",
    title: "Filters & spec facets",
    body: [
      "Narrow by category, subcategory (~80), brand, stock location, preferred, and price range in the left sidebar.",
      "Once you're inside a category, spec facets appear:",
      "• Value facets — checkboxes with live counts (Poles, Color, Type…).",
      "• Range facets — Min/Max inputs for numeric specs (Amperage, Voltage, Wattage, Lumens…).",
      "Clear all filters resets everything, including search chips.",
    ],
    tryQuery: "circuit breakers",
  },
  {
    id: "recommendations",
    title: "Find Alternatives — scored cross-references",
    body: [
      "Click Find Alternatives on any card to see ranked alternatives — true cross-references first:",
      "• ✓ CROSS-REF (green) = a genuine functional equivalent: same subcategory and identical key specs (amperage, voltage, poles, gauge…) — interchangeable, just a different brand/price/stock.",
      "• SIMILAR = a close match shown only to round out the list when few exact equivalents exist.",
      "• A match ring (Excellent / Good / Partial), reason chips, and “Why recommended?” explain the ranking.",
      "The #1 alternative is always a true interchangeable part when one exists.",
    ],
  },
  {
    id: "substitutes",
    title: "Out-of-stock substitutes",
    body: [
      "When a product is out of stock everywhere, its card automatically offers the best in-stock substitute — matched on specs, stock, and price.",
      "• Add Substitute drops it straight into your basket at your chosen quantity.",
      "• View opens the substitute's full detail.",
      "You'll still see lead time and a “Notify when available” watch button for the original.",
    ],
    tryQuery: "CB-EAT-329",
  },
  {
    id: "details",
    title: "Product details & spec sheets",
    body: [
      "View Details opens the full record:",
      "• Volume pricing tiers (1/10/50/100+) with your qualifying tier highlighted.",
      "• Availability — branch & DC stock, ATP date, other stocking branches, transfer ETA.",
      "• A formal Spec Sheet with Required flags + Download Spec Sheet (PDF).",
      "• Goes well with cross-sell, competitor cross-references, and Where to Buy links.",
    ],
  },
  {
    id: "compare",
    title: "Compare products",
    body: [
      "Tick Compare on up to 4 products, then open the comparison view:",
      "• Side-by-side specs with differences highlighted.",
      "• The cheapest option flagged.",
      "• Download Comparison (PDF) prints a clean sheet.",
    ],
  },
  {
    id: "basket",
    title: "Basket, quotes & sharing",
    body: [
      "Add products at any quantity, then open the Cart:",
      "• Volume and contract pricing apply per line automatically.",
      "• Generate Quote (PDF) — branded quote with auto number, 30-day validity, your name & branch.",
      "• Share Basket copies a link that rebuilds the basket for anyone who opens it.",
      "• Export CSV downloads the basket as a spreadsheet with effective pricing and a total row.",
      "• Saved baskets — name a basket per job/customer and reload it anytime.",
    ],
  },
  {
    id: "quotes",
    title: "Saved quotes & status tracking",
    body: [
      "Below the quote sheet, Save Quote stores the basket as a quote with its number, customer, and project.",
      "Saved Quotes (in the cart) tracks each one through a status workflow:",
      "• Draft → Sent → Won / Lost — set the status from the dropdown.",
      "• Load reopens a quote's items into your basket.",
      "Quotes are scoped to the customer you're quoting for, so follow-ups stay organized.",
    ],
  },
  {
    id: "bulk-check",
    title: "Bulk price & availability",
    body: [
      "Bulk Price Check (by the search box) turns a pasted list into a priced, in-stock table — an instant RFQ response.",
      "• Paste or upload SKUs, competitor/legacy part numbers, or descriptions — one per line (quantities like “12x …” work).",
      "• Each line resolves by exact SKU → cross-reference → search, tagged so you can see how it matched.",
      "• Get effective pricing, line totals, and stock per row; Export CSV or add all matched to the basket.",
    ],
  },
  {
    id: "submittal",
    title: "Submittal package (PDF)",
    body: [
      "In the cart, Submittal Package (PDF) builds an approval-ready document for the whole basket:",
      "• A cover page (package number, customer, project, date, item index).",
      "• One spec sheet per item — full specifications with Required flags.",
      "• Print / Save PDF to hand to the customer or GC for submittal.",
      "Built on the same accurate spec data as the cross-reference engine.",
    ],
  },
  {
    id: "approval",
    title: "Below-margin quote approval",
    body: [
      "Quotes whose blended margin falls below 20% are automatically flagged “Approval pending”.",
      "• They can't be converted to an order until a manager signs off.",
      "• Managers see Approve / Reject controls on the quote; the pipeline lists everything awaiting approval.",
      "Turns the internal margin view into real discount governance.",
    ],
  },
  {
    id: "complete-job",
    title: "Complete this job (cross-sell)",
    body: [
      "When your basket has items, the cart shows a “Complete this job” panel with commonly-paired products you're missing.",
      "• It only suggests categories your basket doesn't already cover — genuine gaps, not noise.",
      "• Example: conduit in the basket → it suggests fittings and boxes; a receptacle → a wall plate.",
      "• + Add drops a suggestion straight into the basket.",
      "Fewer callbacks and return trips for the missing piece.",
    ],
  },
  {
    id: "email-quote",
    title: "Email a quote (real send)",
    body: [
      "In the cart, Email Quote opens an inline form pre-filled with a recipient address.",
      "• With an email key configured, Send Quote delivers a REAL branded email via Resend — the full line table, your note and terms, and a one-tap Review & Accept button that opens the customer quote link.",
      "• Without a key it falls back to a clearly-labeled simulated send.",
      "• Either way the quote is saved with status “Sent” and tracked for follow-up; the form tells you which mode is active.",
      "(Free-tier note: until a sending domain is verified with Resend, emails deliver only to the account owner's address.)",
    ],
  },
  {
    id: "pipeline",
    title: "Quote pipeline (managers)",
    body: [
      "The Insights dashboard includes a Quote Pipeline view:",
      "• Value and count by status — Draft, Sent, Won, Lost.",
      "• Open value (draft + sent), won/lost totals, and win rate.",
      "• A follow-up alert lists Sent quotes older than 14 days.",
      "Saved/emailed quotes flow straight into this view.",
    ],
  },
  {
    id: "templates",
    title: "Job templates / recurring kits",
    body: [
      "Turn a basket into a reusable kit — e.g. “Standard office buildout” or a panel change-out.",
      "• Build a basket, then Save under Job Templates.",
      "• Add to Basket merges a template into your current cart (it adds, it doesn't replace) so you can combine kits.",
      "Templates persist across sessions — stop rebuilding the same lists.",
    ],
  },
  {
    id: "margin",
    title: "Rep margin (internal)",
    body: [
      "The cart shows your gross margin — per line and a basket total — so you know how much room you have to discount.",
      "• Color-coded: red under 15%, amber 15–30%, green 30%+.",
      "• Marked “internal” — margin never appears on the printed quote, shared basket, or customer CSV.",
      "(Cost is estimated from list price in this demo; wire a real cost feed via the pricing adapter.)",
    ],
  },
  {
    id: "quote-to-order",
    title: "Convert a quote to an order",
    body: [
      "In Saved Quotes, Convert to Order turns a quote into a placed order in one click — without disturbing your current basket.",
      "• The quote is marked Won and tagged “✓ ordered”.",
      "• The order appears in Order History with the quote's lines and total.",
      "Conversion feeds the manager pipeline's conversion rate.",
    ],
  },
  {
    id: "stock-warning",
    title: "Quantity stock warnings",
    body: [
      "If you order more than is available, the cart line flags it:",
      "• “Ordering 50 · 30 in stock · 20 on backorder ~1–2 weeks.”",
      "• Availability counts your branch + DC stock; the shortfall gets a realistic backorder window.",
      "No more promising a quantity the shelf can't cover.",
    ],
  },
  {
    id: "delivery-eta",
    title: "Delivery ETA in the basket",
    body: [
      "The cart shows a “Ships complete by” date — when the whole order can be fulfilled:",
      "• In stock at your branch ships fastest.",
      "• Branch transfer or DC stock takes a few days.",
      "• Out-of-stock lines extend the date to their lead time.",
      "The date reflects the slowest line, so it's the realistic “everything arrives” promise.",
    ],
  },
  {
    id: "orders",
    title: "Orders & one-click reorder",
    body: [
      "Add to Order records the basket as a placed order (per the customer you're quoting for).",
      "Order History lives in the cart drawer:",
      "• Click an order's item count to expand its lines (qty, product, SKU).",
      "• Reorder loads the whole order back into your basket in one click.",
    ],
  },
  {
    id: "csv-export",
    title: "Exporting to CSV",
    body: [
      "Two one-click spreadsheet exports:",
      "• Results bar → Export CSV: the visible search results with SKU, brand, category, price, and stock totals.",
      "• Cart → Export CSV: basket lines with quantities, list vs. effective unit pricing, line totals, and a grand total.",
      "Both open directly in Excel / Google Sheets.",
    ],
  },
  {
    id: "bom-import",
    title: "Import a parts list / BOM",
    body: [
      "Click Import List / BOM by the search box:",
      "• Paste a list (one item per line) or upload a .csv / .txt file.",
      "• Quantities are understood — “12x 15A breaker”, “5 led troffer”, “3, transformer”.",
      "• Each line matches to the best catalog product; add all matched lines to the cart at once.",
    ],
  },
  {
    id: "customers",
    title: "Customers & contract pricing",
    body: [
      "Pick who you're quoting for in the header. For contract customers:",
      "• Cards and the cart show List → Your price → You save N%.",
      "• Category discounts and negotiated net prices layer with volume tiers.",
      "• Orders, quotes, and order history follow the selected customer.",
      "(Simulated CRM data — built on swap-in adapters for real systems.)",
    ],
  },
  {
    id: "cross-reference",
    title: "Competitor cross-reference",
    body: [
      "Click Cross-reference by the search box and paste a competitor or legacy part number to find the Meridian equivalent.",
      "Each product's detail view also lists the parts it Replaces.",
    ],
  },
  {
    id: "saved-history",
    title: "Favorites, history & recently viewed",
    body: [
      "When browsing without an active search, panels above the grid show:",
      "• Search history — your last 12 searches as clickable chips.",
      "• Recently viewed — the last products you explored.",
      "• ★ Favorites — anything you starred.",
      "All persist across sessions in your browser.",
    ],
  },
  {
    id: "dashboard",
    title: "Analytics dashboard (managers)",
    body: [
      "Signed in as manager or admin, an Insights link appears in the header:",
      "• KPI cards — orders, total/average value, active customers.",
      "• Contract savings delivered, top categories, orders over time, customer mix.",
      "Sales reps don't see this view. (Derived from seeded sample orders.)",
    ],
  },
  {
    id: "tour",
    title: "Guided tour",
    body: [
      "New to the app? The guided tour walks the whole flow in about two minutes — search, filters, alternatives, basket & quotes, and the manager dashboard.",
      "• It opens automatically on your first visit.",
      "• Restart it anytime: open the command palette (Ctrl/Cmd-K) and run “Restart the product tour”.",
      "• Steps with a “try it” button run the real feature live — the tour stays out of your way.",
    ],
  },
  {
    id: "voice-search",
    title: "Voice search",
    body: [
      "Click the microphone in the search bar and just say the request.",
      "• Spoken numbers are normalized — “twenty amp breaker” becomes “20A breaker”.",
      "• Filler words (“please”, “search for”, “show me”) are stripped automatically.",
      "• The cleaned-up text runs through the same plain-English parser as typed searches, chips and all.",
      "(Requires a browser with speech recognition; everything is processed like a typed query.)",
    ],
  },
  {
    id: "command-palette",
    title: "Command palette (Ctrl/Cmd-K)",
    body: [
      "Press Ctrl-K (Windows) or Cmd-K (Mac) anywhere to open the command palette.",
      "• Jump to search or the Insights dashboard, open the cart, help, BOM import, or bulk price check.",
      "• Switch between the three demo roles without retyping credentials.",
      "• Run a quick-pick search, or type anything and hit Enter to search it.",
      "Arrow keys move the selection (it wraps); Enter runs the highlighted command.",
    ],
  },
  {
    id: "deep-links",
    title: "Shareable deep links",
    body: [
      "Every filtered view has a URL that rebuilds it exactly — filters, search text, specs, price range, and sort.",
      "• Copy the address bar (or use Share) and send it to a teammate; they land on the same results.",
      "• Shared basket links and filter links can be combined — the cart payload rides along untouched.",
      "• Junk or outdated parameters are ignored safely, so old links never break the page.",
    ],
  },
  {
    id: "did-you-mean",
    title: "“Did you mean…?” typo fixes",
    body: [
      "Misspelled searches don't dead-end:",
      "• When a search comes back empty and there's one clear fix (“breakr” → “breaker”), it's applied automatically — with a banner so you can undo it.",
      "• When results are sparse or the fix is ambiguous, you get a one-click suggestion instead.",
      "• Numbers and specs like “20A” or “12-2” are never “corrected”.",
    ],
    tryQuery: "breakr",
  },
  {
    id: "role-switcher",
    title: "Switching demo roles",
    body: [
      "Three demo accounts show how the app changes by role — all use the password meridian2024:",
      "• sales@meridiansupply.com — Sarah Chen, Sales Rep (Houston Downtown).",
      "• manager@meridiansupply.com — Marcus Rivera, Manager (Dallas North) — unlocks Insights and quote approvals.",
      "• admin@meridiansupply.com — Admin User (Corporate).",
      "Switch from the command palette (Ctrl/Cmd-K → “Switch to …”) or log out and back in. Your branch changes with the role, so stock and match scores shift too.",
    ],
  },
  {
    id: "for-you",
    title: "“For you” — reorder predictions & picks",
    body: [
      "The For-you rail on the landing view turns your history into one-tap actions:",
      "• Time to reorder — products from past orders, ranked by how often you buy them; a DUE badge appears 30+ days after the last order. Add pre-fills the last quantity.",
      "• From your favorites — starred products you haven't basketed yet.",
      "• Goes well with your orders — complementary products for your top reorder candidate.",
      "With a customer selected it uses their history; with no customer it looks across all orders (each card shows whose order it came from).",
    ],
  },
  {
    id: "price-override",
    title: "Line price override (margin-guarded)",
    body: [
      "Click ✎ price on any basket line to set a custom unit price — for price matching or close-the-deal discounts.",
      "• Guardrails: you can't price above list or below a 5% margin over estimated cost; out-of-band entries snap to the nearest bound.",
      "• Overridden lines show a CUSTOM badge and a reset link; line and basket margin update live.",
      "• The override flows into the quote sheet, saved quotes, orders, and CSV export.",
      "Deep discounts still trip the 20% margin floor — the quote saves as “Approval pending” for a manager to sign off.",
    ],
  },
  {
    id: "notifications",
    title: "Notification center (🔔)",
    body: [
      "The bell in the header gathers everything that needs your attention:",
      "• Approval requests — below-margin quotes awaiting sign-off (managers/admins).",
      "• Follow-ups — quotes sent more than 14 days ago with no decision.",
      "• Restock alerts — products you're watching, with an estimated restock date; you're alerted when the window is reached.",
      "Click a notification to jump straight to the quote section or product. Unread items are badged; Mark all read clears them.",
    ],
  },
  {
    id: "customer-link",
    title: "Customer quote link — review & accept",
    body: [
      "Every saved quote has a Customer Link button — it copies a link your customer can open with no login.",
      "They see a branded quote (number, validity, line prices, total) with Accept and Decline buttons.",
      "• Accept converts the quote to an order and marks it Won — the full loop in one click.",
      "• Decline marks it Lost so your pipeline stays honest.",
      "• Expired or approval-pending quotes can't be accepted — the page says why.",
      "Copying the link also moves a Draft quote to Sent. (Demo note: acceptance state lives in the browser where the link is opened.)",
    ],
  },
  {
    id: "bom-confidence",
    title: "BOM match confidence & alternates",
    body: [
      "Import List / BOM now scores every matched line 0–100%:",
      "• Green (80%+) — the product covers your line text, including exact numbers like “20A”. Exact SKUs always score 100%.",
      "• Amber / red — worth a look; a “to review” count appears in the summary.",
      "• Lines that aren't a confident match list up to two alternatives — click Use to swap one in.",
      "• Typos are auto-corrected (“circut breakr” → “circuit breaker”) and flagged on the line.",
    ],
  },
  {
    id: "job-wizard",
    title: "Ask Meridian — Job Wizard",
    body: [
      "Describe the job instead of building the basket part by part. Open it from the 🧰 Job Wizard button by the search bar (or Ctrl/Cmd-K → \"Start a job\").",
      "• Pick a job — 200A service upgrade, office network drops, warehouse LED retrofit, security cameras, or an EV charger install.",
      "• Every step resolves to a stocked, priced product from the catalog, branch stock preferred — with alternates you can swap in and quantities you can adjust.",
      "• Optional steps (like whole-home surge protection — an easy upsell) start unchecked.",
      "• One click adds the whole bill of materials to the basket; contract and volume pricing apply there.",
      "Deterministic recommendations from your catalog — the conversational version of Ask Meridian is on the roadmap.",
    ],
  },
  {
    id: "win-loss-insights",
    title: "Pricing win/loss insights",
    body: [
      "Every saved quote captures its margin and ends life Won or Lost — crossing the two tells you where quotes actually close.",
      "• In the basket, a 📊 guidance line under the margin shows how quotes in your current margin band have historically performed.",
      "• In Insights, the Pricing Win/Loss card breaks down win rate by margin band (<15%, 15–20%, 20–25%, 25–30%, 30%+) and compares the average margin of won vs lost quotes.",
      "• Guidance only appears once a band has at least 3 decided quotes — no advice from thin air.",
      "Fresh browsers come seeded with a simulated quote history so the insights are visible immediately.",
    ],
  },
  {
    id: "customer-health",
    title: "Customer health scores",
    body: [
      "Each account's order cadence is tracked automatically: \"usually orders every 30 days — now 38 days quiet.\"",
      "• A status dot (Healthy / Watch / At risk) appears under the \"Quoting for\" selector for the active customer.",
      "• At-risk accounts raise a 📉 alert in the notification bell — click it to jump to their order history.",
      "• Managers get the full Customer Health panel in Insights, most urgent first.",
      "Statuses: within 1.25× their usual cadence = Healthy; up to 2× = Watch; beyond = At risk. New accounts show as New.",
    ],
  },
  {
    id: "commodity-index",
    title: "Metals index (simulated)",
    body: [
      "Electrical distribution pricing lives on copper. The landing view shows a simulated daily metals index — Copper and Aluminum $/lb with a 30-day trend.",
      "• Copper trending up → a nudge to quote wire & cable now and lock the 30-day validity window.",
      "• Quotes and the customer acceptance page note the index date their pricing reflects.",
      "Simulated and deterministic (same values all day, every browser) — a live feed is a drop-in upgrade.",
    ],
  },
  {
    id: "counter-offer",
    title: "Counter-offers (Request changes)",
    body: [
      "Customers don't just accept or decline — the quote link also has Request changes.",
      "• The customer writes what should change (\"need it under $60/unit\"); the quote stays open.",
      "• The rep sees an amber COUNTERED badge on the quote, the customer's note inline, and a ↩️ bell notification.",
      "• Managers see counter-offers awaiting a response in the Insights quote pipeline.",
      "Click Revise on the quote, adjust pricing or products, and send a fresh Customer Link — the counter is answered by the new version.",
    ],
  },
  {
    id: "quote-revisions",
    title: "Quote revisions (v1 → v2)",
    body: [
      "Customer countered? Numbers changed? Don't edit history — revise it.",
      "• Click Revise on any open quote: its lines, customer, project, note, and terms load into the basket with a \"Revising Q-X\" banner.",
      "• Adjust anything — quantities, products, ✎ price overrides — then Save Quote creates v2, linked to the original.",
      "• The old version is marked superseded: it leaves the pipeline, its alerts go quiet, and its customer link politely says a newer version exists.",
      "• Won and already-ordered quotes can't be revised — ask for a fresh quote instead.",
      "Revisions chain: revising v2 creates v3, and the History trail records every step.",
    ],
  },
  {
    id: "audit-trail",
    title: "Quote history (audit trail)",
    body: [
      "Every saved quote keeps a receipt of its life — expand History on the quote row:",
      "• Created (and by whom), status changes (Draft → Sent → Won/Lost), approvals and rejections with the manager's name.",
      "• Customer-side events too: link copies, counter-offers, and the acceptance that converted it to an order.",
      "• Revisions log on both versions — v1 shows \"superseded by v2\", v2 shows what it revised.",
      "Append-only and capped at 50 entries per quote — a receipt, not a database.",
    ],
  },
  {
    id: "quote-terms",
    title: "Quote notes & terms blocks",
    body: [
      "The quote sheet now carries the boring-but-critical fine print:",
      "• A free-text Note field (site access, scheduling, alternates offered) — persists between quotes like customer/project.",
      "• Selectable Terms & Conditions blocks: freight, returns, payment, commodity escalation, lead times.",
      "• Both print on the quote PDF and travel inside the Customer Link, so the customer sees exactly what the rep agreed to.",
    ],
  },
  {
    id: "verified-crosses",
    title: "Verified cross-references (source-backed)",
    body: [
      "For real, verified products, cross-references are no longer similarity guesses — every pair cites the official document that states it. 200 source-backed pairs cover fuses, ballasts, enclosures, wiring devices, contactors, terminal blocks, cable, and grounding/compression lugs.",
      "• Sources: manufacturer cross tools and PDFs (ABB's competitor lookup, Mersen's pocket cross guide, Hammond's Hoffman cross table, Hubbell's bin-stock guide, Signify's ballast guides), datasheets, distributor tables, and industry charts — each result links its source. A 166-source registry built from a 1,000-row source workbook tracks what's ingested and what still needs licenses or a browser session.",
      "• Every recommendation is explainable: match reason, which attributes agree, what's missing or conflicting, and warning flags straight from the source (\"UL Classified for listed panels only\", \"verify dimensions before substituting\").",
      "• Confidence is scored by source authority; anything below 95% never reaches the recommendation — it stays in the review queue. When sources contradict, a documented rule picks the winning record: source authority, then source quality score, then recency.",
      "Try it: search FRN-R-30 (Bussmann fuse) and open View Details — Mersen's own cross guide maps it to the TR30R we stock. LC1D09G7 → ABB AF09-30-10-13 still works too.",
      "Result cards flag it up front: a ⇄ VERIFIED CROSS badge means documented substitutes exist — click it to see them.",
      "Simulated catalog SKUs keep their clearly-labeled simulated equivalence engine — the two paths never mix.",
    ],
    tryQuery: "FRN-R-30",
  },
  {
    id: "cross-explorer",
    title: "Cross-Reference Explorer, conversion & review queue",
    body: [
      "Ways to put the verified cross dataset to work beyond the detail view:",
      "• Cross-Reference Explorer (/product-finder/crosses, or Ctrl+K → \"Open Cross-Reference Explorer\"): browse every source-backed pair — filter by brand, part number, or source kind, see which sides we stock, and click through to the document that states each cross. The Sources tab shows the full ingestion registry: 166 sources from a 1,000-row workbook, classified as ingested, ingestible, browser-gated, API-key, or licensed.",
      "• Competitor-BOM conversion: paste a bill of materials with competitor part numbers into Import List / BOM. Lines naming a documented competitor part get a green \"Verified cross — we stock the equivalent\" box with the source citation; one click swaps the stocked equivalent in.",
      "• Bulk Cross-Ref (toolbar, or Ctrl+K → \"Bulk cross-reference\"): paste up to 100 competitor part numbers and get a table of stocked equivalents with cited sources — export the CSV back to procurement, or add it all to the basket.",
      "• Review queue (Explorer tab): crosses below 95% confidence (distributor / industry tables) wait here for a reviewer to Approve or Reject — the human-in-the-loop promotion path. Managers also get a Cross-Reference Coverage card on the Insights dashboard.",
      "Try it: open Import List / BOM and paste \"4x QTP2X32T8/UNV-SC\" and \"2 Hoffman A1212CHFL\" — competitor parts we don't stock, crossed to the Philips Advance and Hammond equivalents we do, manufacturer documents linked.",
      "Only production-grade crosses (≥95% source confidence) are ever suggested; everything is explainable and cited.",
    ],
  },
  {
    id: "substitute-save",
    title: "Substitute & save in quotes",
    body: [
      "While you build a basket or quote, any line that has a cheaper STOCKED documented cross shows a green \"Save $X\" box right on the line.",
      "• It names the equivalent we stock, the % less it costs, and links the manufacturer document that states the cross — one click swaps it in at the same quantity.",
      "• Pricing of both sides honors the customer's contract, volume tiers, and any manual override, so the saving shown is the real saving.",
      "• The basket header totals the documented swap savings available across all lines.",
      "Only ≥95%-confidence, source-backed crosses are ever offered — no guessing on a substitution the customer will question.",
    ],
  },
  {
    id: "ask-meridian-ai",
    title: "Ask Meridian — the conversational AI assistant",
    body: [
      "Click the green 💬 Ask Meridian button (or Ctrl+K → \"Ask Meridian — AI assistant\") to ask in plain English.",
      "• It searches the catalog, cross-references a competitor part to what we stock (with the source document and confidence), answers spec questions, and checks availability — every answer grounded in the real catalog and the source-backed cross dataset.",
      "• It never invents SKUs, prices, specs, or crosses. If nothing is documented, it says so — and points you to the Bulk Cross-Ref tool or the Job Wizard.",
      "• It shows which tools it used (\"✓ cross-referenced a part\") so the answer is auditable.",
      "Activation: the assistant is wired to the Anthropic API and lights up when an ANTHROPIC_API_KEY is set on the deployment — until then it runs in a labeled preview mode at zero AI cost. The deterministic Job Wizard and Bulk Cross-Ref work today regardless.",
    ],
  },
  {
    id: "sso",
    title: "Enterprise single sign-on (SSO)",
    body: [
      "The login screen offers \"Sign in with SSO\" alongside the password form.",
      "• In demo mode it simulates the round-trip and signs you in as an identity mapped from IdP group claims — proving the role mapping (a \"branch-manager\" group lands you as a Manager).",
      "• When your identity provider is configured (Azure AD, Okta, Ping — set the SSO_* environment variables), the button starts the real OIDC sign-in against your tenant. The claims→role mapping is already built and tested; the final token-exchange wiring is a short onboarding step (docs/sso.md).",
      "Password login always remains available for the demo accounts.",
    ],
  },
  {
    id: "procurement-export",
    title: "Procurement export — cXML PunchOut & EDI 850",
    body: [
      "Open the cart and look under the quote actions for Procurement export.",
      "• cXML PunchOut downloads a PunchOutOrderMessage — the payload an Ariba / Coupa / SAP punchout returns to a buyer's procurement system.",
      "• EDI 850 PO downloads a valid X12 850 purchase order — the transaction set an ERP exchanges over EDI.",
      "Both are generated from the live basket with real prices and quantities, in standards-faithful envelopes — \"how a Meridian quote becomes a purchase order in the customer's own buying system,\" one click.",
    ],
  },
  {
    id: "white-label",
    title: "White-label brand mode",
    body: [
      "The app's brand — name, logo lockup, and accent — is a swappable profile, so the same product re-skins to any distributor.",
      "• Use the Brand switcher in the header to flip between profiles (Meridian and a Wesco demo profile). The header logo, login screen, quote PDF, and submittal package all re-skin instantly, and your choice is remembered.",
      "• Real logo art and an exact brand palette drop into a profile (lib/brand.ts) without touching any component — point a deployment at a brand and it ships that way.",
      "It's the \"imagine this with your name on it\" moment for a pitch — and the path to a per-customer branded deployment.",
    ],
  },
  {
    id: "mcp-server",
    title: "MCP server — agentic procurement",
    body: [
      "The recommender ships an MCP (Model Context Protocol) server so any MCP client — Claude Desktop, Claude Code, or an agent — can do procurement against the catalog programmatically.",
      "• Tools: search_products, cross_reference, bulk_cross_reference, product_detail, check_availability, coverage_summary — all backed by the live API, all source-cited, zero AI cost to run.",
      "• Run it with `npm run mcp`; connect it per mcp/README.md. Then an agent can answer \"what do you stock that replaces this competitor BOM?\" and build an order without a human in the loop.",
      "This is the same tool surface the in-app Ask Meridian assistant uses — the catalog as an agent-ready API.",
    ],
  },
  {
    id: "saved-searches",
    title: "Saved searches & alerts",
    body: [
      "Found a search you run often? Click ★ Save this search (under the search bar) and name it — it captures your query and every active filter.",
      "• Saved searches appear as chips: click one to re-run it instantly; each carries a 🔔 toggle for new-match alerts and a ✕ to delete.",
      "• When alerts are on and a saved search picks up new matches, the notification bell flags it — click the alert to jump straight back into that search.",
      "• Each saved search is a deep link, so the exact filtered view rebuilds every time.",
      "Two example searches are seeded so you can see the feature immediately.",
    ],
  },
  {
    id: "live-pricing",
    title: "Live distributor pricing (Mouser / Digi-Key)",
    body: [
      "For real, verified products, the detail view fetches LIVE price, stock, and datasheet data from distributor APIs — actual market data, not simulation.",
      "• Try a real part: search AF09-30-10-13 (ABB contactor) or UTPSP5BUY (Panduit patch cord) and open View Details.",
      "• Each quote shows the matched part, live stock, price breaks, and a link to the distributor page.",
      "• Simulated catalog SKUs are never sent to distributor APIs — the panel only queries verified part numbers.",
      "Mouser is active; Digi-Key lights up when its OAuth credentials are added. Data is fetched per-request and never stored.",
    ],
    tryQuery: "AF09-30-10-13",
  },
  {
    id: "offer-ladder",
    title: "Offer ladder & volume price curve",
    body: [
      "On a product's detail view, the Offer Ladder stacks every place you can get the part into one ranked list: in-stock first, then lowest entry price, with authorized distributors winning ties.",
      "• The Meridian branch/DC offer is always shown, with its quantity-break price curve sparkline.",
      "• When their API keys are set, authorized-distributor (ECIA TrustedParts) and broad aggregator (OEMsecrets) offers stack in alongside the live Mouser/Digi-Key quotes — all real, fetched per-request, never stored.",
      "• External sources only query real (verified/curated) part numbers; simulated catalog SKUs stay internal-only.",
      "Until those keys are added it shows the Meridian volume ladder — $0 and no outbound calls.",
    ],
    tryQuery: "AF09-30-10-13",
  },
  {
    id: "jobsite-weather",
    title: "Jobsite weather risk",
    body: [
      "When you track a jobsite-delivery order, an install-risk weather chip can appear for the fulfilling branch metro, powered by the free National Weather Service feed.",
      "• Flags conditions that matter to electrical crews — rain on open terminations, freezing (PVC cement / torque out of spec), high wind limiting aerial work, storm holds.",
      "• Worst-case across the next few periods drives the chip color: clear, caution, or hold.",
      "On-demand only (it never polls), nothing stored. Dormant until a weather contact + geocoding key are set, so it stays quiet in the demo.",
    ],
  },
  {
    id: "deposits",
    title: "Collecting a deposit",
    body: [
      "On a sent or won quote you can request a customer deposit (when the Stripe payment seam is configured):",
      "• Click Request deposit on the quote row — it creates a secure Stripe Checkout link (default 30% of the quote) and opens it for the customer.",
      "• Card and bank (ACH) are both accepted; no card details ever touch this app — payment happens on Stripe's hosted page.",
      "• Once paid, the quote row shows Deposit paid ✓.",
      "This is the only money-moving feature, so it's off until keys are set, a charge is created only by your explicit click, and nothing is ever charged automatically.",
    ],
  },
  {
    id: "order-lifecycle",
    title: "cXML order confirmation & ship notice",
    body: [
      "Open Track order on a placed order to download the two procurement documents a buyer's system expects after the PO:",
      "• Order confirmation — cXML ConfirmationRequest accepting the order with an estimated ship date.",
      "• Ship notice (ASN) — cXML ShipNoticeRequest with ship/delivery dates and a line-by-line manifest.",
      "Both are generated on demand for the buyer's Ariba / Coupa / SAP system — $0, deterministic, and only when you click (never on a schedule).",
    ],
  },
  {
    id: "demand-forecast",
    title: "Branch demand forecast",
    body: [
      "Insights now projects what the branch should stock next:",
      "• Trailing 90 days of orders plus won quotes, aggregated by subcategory.",
      "• A half-window trend (▲ accelerating / ▼ cooling) adjusts a simple moving-average projection for the next 30 days.",
      "• Each row shows the volume behind the number and the top product — click through to browse the subcategory.",
      "Simple, explainable math on demo data — a real forecasting model plugs into the same panel.",
    ],
  },
  {
    id: "seasonal",
    title: "Seasonal demand signals",
    body: [
      "Under the metals index, a weekly merchandising banner surfaces what's about to sell:",
      "• Storm watch — surge protection, temporary power, PPE.",
      "• Heat advisory, construction-season kickoff, and quarter-end datacom refresh rotate week by week.",
      "• Each signal carries one-tap searches for the trending categories.",
      "Simulated and deterministic — a live weather or market feed is a drop-in upgrade.",
    ],
  },
  {
    id: "mobile",
    title: "Using it on a phone",
    body: [
      "The finder works one-handed at the counter or on a job site:",
      "• Filters live behind the floating Filters button (bottom sheet).",
      "• The basket opens as a full-width drawer; quotes, orders, and templates all work.",
      "• Customer quote links are mobile-first — customers usually open them on a phone.",
      "• Voice search and the notification bell are in easy thumb reach in the header.",
    ],
  },
  {
    id: "bom-intelligence",
    title: "BOM intelligence — health & landed cost",
    body: [
      "Click 🩺 BOM Health by the search bar (or Ctrl/Cmd-K → \"BOM intelligence\") to grade your current basket.",
      "• Every line gets an A/B/C health grade across lifecycle, stock depth, single-source risk, and substitute availability — with a rollup: worst grade, average score, and how many lines need a look.",
      "• Each flagged line gets a recommended fix: swap to the active successor, qualify a second source, or take a cheaper documented cross.",
      "• The landed-cost optimizer scores each line's options — the current part, stocked crosses, and the active successor — by list price + estimated freight + a lead-time carrying penalty, and recommends the best award with the savings and the reasoning.",
      "• Compliance enrichment flags each line — UL listing, RoHS/REACH/Prop 65, country-of-origin, and Section 301 tariff exposure — with a BOM rollup (lines flagged, tariff-exposed) for bid-grade submittals. Derived attributes today; a real UL/manufacturer feed is the upgrade.",
      "Deterministic — no AI key needed. Make the actual swaps from each line's detail view.",
    ],
  },
  {
    id: "rfq-auto-quote",
    title: "Inbound RFQ → draft quote",
    body: [
      "Got a customer's bill of materials by email? Click 📥 RFQ → Quote by the search bar (or Ctrl/Cmd-K → \"Inbound RFQ\").",
      "• Paste the takeoff or upload a .csv/.txt; the app parses quantities, fuzzy-matches every line to the catalog with a confidence score, and crosses competitor parts to the equivalents we stock.",
      "• You see \"N of M lines matched · K to review\" — eyeball the low-confidence lines, then click Create draft quote.",
      "• It adds the matched lines to the basket and saves a draft quote with the customer and project you entered — ready to review and send.",
      "Deterministic, no AI key needed. With an Anthropic key configured, an LLM step can read messier formats; the rep always reviews before sending.",
    ],
  },
  {
    id: "order-tracking",
    title: "Order tracking, delivery & will-call",
    body: [
      "The app no longer goes dark after checkout. In the cart's Orders list, click Track order on any order:",
      "• A status timeline — Placed → Confirmed → Processing → Shipped → Out for delivery → Delivered — with a promised date from the stocking ETA.",
      "• Toggle Jobsite delivery vs Will-call pickup; the timeline re-labels (Staged for pickup → Ready for pickup → Picked up).",
      "Simulated from the order date and ETA today — a real carrier/WMS feed drops in behind the same adapter.",
    ],
  },
  {
    id: "returns-rma",
    title: "Self-service returns (RMA)",
    body: [
      "Wrong item or over-ordered for the job? Click Start a return on any order in the cart's Orders list.",
      "• Tick the lines to send back, pick a reason, and Generate RMA — you get an RMA number and an estimated credit.",
      "• Track the return through Requested → Approved → In transit → Received → Credit issued; the 🔔 bell flags open RMAs until they're resolved.",
      "The RMA number and status are tracked in-app; emailing the customer an RMA confirmation is on the roadmap (the quote-email path already proves the Resend integration).",
    ],
  },
  {
    id: "guided-selectors",
    title: "Guided engineering selectors (conduit / wire / breaker)",
    body: [
      "Open the 📐 Selectors button by the search bar (or Ctrl/Cmd-K → \"Guided selectors\") to size a run and land on a stocked part.",
      "• Conduit fill — pick conductor size, count, and EMT or PVC; get the smallest trade size within NEC fill limits.",
      "• Wire size — enter load, length, voltage, phase, and copper/aluminum; get the conductor that satisfies BOTH ampacity and your voltage-drop target (3% default), whichever governs.",
      "• Breaker sizing — enter the load and whether it's continuous; get the next standard OCPD (NEC 240.6), sized at 125% for continuous loads.",
      "• Ampacity check — pick conductor size, copper or aluminum, number of conductors in the raceway, and ambient temperature; get the derated allowable ampacity per NEC 310.15 (bundle derating + temperature correction).",
      "• Box fill — enter the AWG of the largest conductor, conductor count, device count, clamp presence, and ground count; get the minimum box volume and a matching stocked box per NEC 314.16.",
      "Each answer resolves to an active, in-stock catalog product you can add to the basket in one click.",
      "Guidance from a compact NEC subset (copper THHN assumed) — verify against the full code and the AHJ before installation.",
    ],
  },
  {
    id: "cut-to-length",
    title: "Cut-to-length ordering (wire, conduit, strut)",
    body: [
      "Products sold by the foot (wire, conduit, strut) show a cut-to-length panel directly in the product detail view.",
      "• Enter the footage you need; the panel rounds up to the nearest whole foot, shows the extended price, and displays the NEC 310.15 ampacity for wire products.",
      "• Click Add to Basket to add exactly that footage quantity to your cart.",
      "Footage is always ceiled — you never order less than you need.",
    ],
    tryQuery: "12/2 NM-B cable",
  },
  {
    id: "kits-assemblies",
    title: "Kits & assemblies — add a whole bundle in one click",
    body: [
      "Open the 🔧 Kits button in the search toolbar to browse curated product bundles for common electrical jobs.",
      "• Each kit resolves every component to the best in-stock, priced catalog match and shows a line-by-line breakdown with a total price rollup.",
      "• Click Add kit to cart to add all components (at the right qty) to the basket at once.",
      "• Optional lines (e.g., LED bypass driver) are included in the price rollup but marked; all required lines must be in stock for the kit to be orderable as a unit.",
      "Kits today: GFCI outlet, 3-way switch, panel circuit addition, exterior weatherproof outlet, office LED retrofit, EV charger circuit.",
    ],
    tryQuery: "GFCI outlet",
  },
  {
    id: "submittal-pdf-server",
    title: "Submittal package PDF (server-side Gotenberg)",
    body: [
      "The submittal package in the cart drawer lets you generate a branded PDF via Gotenberg (server-side rendering) when GOTENBERG_URL is configured.",
      "• Without the env key, the client-side print-to-PDF path (browser Print → Save as PDF) remains fully functional.",
      "• The server PDF route (/api/pdf/submittal) is auth-gated, rate-limited (10/min), and input-validated — safe to expose to rep workflows.",
      "• The PDF carries the configured brand name and accent color, cover page, and one row per product with specs and spec-sheet links.",
      "Set GOTENBERG_URL to a running Gotenberg instance (self-hosted or cloud) to activate the server path.",
    ],
  },
  {
    id: "next-best-actions",
    title: "Next Best Actions (rep coaching)",
    body: [
      "The manager dashboard opens with a single ranked “what to do next” list, built from your live data — no AI, no guesswork.",
      "• Counter-offers awaiting a reply and below-margin quotes needing sign-off rank highest (a customer or a deal is waiting).",
      "• Then stale sent quotes (>14 days), at-risk accounts (gone quiet vs their usual cadence), unclaimed SPA rebates, and subcategories trending up to stock.",
      "• Each row deep-links to where you act — the quote list, the account's orders, or a search.",
      "It composes the same numbers the cards below show, so it can never disagree with them.",
    ],
  },
  {
    id: "lighting-rebates",
    title: "Utility rebate estimates for lighting",
    body: [
      "Open any LED fixture or lamp and you'll see an estimated utility rebate — the kind of incentive that often closes a lighting retrofit.",
      "• Shows a per-fixture (or per-lamp) range and the total for your quantity, grounded in real 2025-2026 utility program structures.",
      "• If the product has occupancy/daylight/0-10V controls, the higher controls-incentive band is applied automatically.",
      "• A “DLC-eligible category” badge marks fixtures that utilities typically require to be DLC-listed to qualify.",
      "It's an honest estimate, not a quote — the actual amount is set by the customer's local utility worksheet, and there's no free national feed of exact rebate dollars. Confirm with the local program.",
    ],
    tryQuery: "LED troffer",
  },
  {
    id: "esignature",
    title: "Send a quote for e-signature (Dropbox Sign)",
    body: [
      "On a saved quote you can email the customer a Dropbox Sign link to sign and accept — a legally-binding close — when the seam is configured.",
      "• The “✍️ Send for signature” button appears on open quotes only when DROPBOX_SIGN_API_KEY is set; it stays hidden in the dormant demo.",
      "• It defaults to Dropbox test mode (free, non-binding) until you explicitly set DROPBOX_SIGN_TEST_MODE=false, so it costs nothing while you try it.",
      "• When the customer signs, Dropbox's webhook flips the quote's signature status (verified by HMAC) and records a tamper-evident audit entry.",
      "The customer's signing document is the branded quote PDF on our own server, so no card or document data passes through a third party beyond Dropbox.",
    ],
  },
  {
    id: "audit-log",
    title: "Tamper-evident audit log & compliance export",
    body: [
      "The dashboard's Audit Log records key business events (signatures, orders, deposits, quote decisions) in a hash-chained, tamper-evident trail for compliance/SOC2 readiness.",
      "• Each entry chains to the previous via an HMAC hash — any insertion, deletion, edit, or reorder breaks the chain, and the card shows a live “✓ Chain verified” / “✗ Broken” badge.",
      "• Export the full chain as CSV for an auditor; every row carries its hash and the prior hash.",
      "• It's always on ($0) and scoped per tenant. Set AUDIT_SECRET (or rely on the SSO SESSION_SECRET) for production-grade signing.",
    ],
  },
  {
    id: "semantic-search",
    title: "Semantic search (AI-powered relevance)",
    body: [
      "On top of keyword and fuzzy matching, the search can blend in semantic (meaning-based) relevance — so “breaker that won't trip on motor inrush” finds the right parts even without the exact words.",
      "• It's a fourth ranking signal fused into the existing hybrid search, never an override — your keyword filters and facets still apply.",
      "• Dormant and $0 by default: it activates only when an embeddings key (Voyage AI by default — its free tier covers embedding the whole catalog) and the Neon vector store are configured.",
      "• Once keys are set, an operator runs a one-time backfill to embed the catalog; until then search behaves exactly as today.",
      "Setup is in docs/semantic-search.md.",
    ],
    tryQuery: "low voltage motor starter",
  },
  {
    id: "visual-part-id",
    title: "Identify a part from a photo (AI vision)",
    body: [
      "Open the barcode scanner (Ctrl/⌘-K → “Scan barcode”) and you can photograph a part — not just a clean nameplate — to identify it.",
      "• AI vision reads the brand, catalog number, and ratings it can see, then the catalog resolves a real stocked SKU — it never invents a part number.",
      "• Works on whole-product photos, angled or worn nameplates, where flat-label OCR struggles.",
      "• Dormant and $0 until an ANTHROPIC_API_KEY is set (the same key that powers Ask Meridian) — the photo option falls back to OCR or manual entry otherwise.",
      "The image is processed server-side and never logged.",
    ],
  },
  {
    id: "data-quality",
    title: "Catalog data-quality score",
    body: [
      "Every product carries a data-quality score (0-100) so the catalog team knows what to enrich and you know how complete a record is.",
      "• The product detail header shows a ⬡ Data badge — hover to see the score and what's missing (specs, datasheet, provenance, lifecycle, identifiers).",
      "• The manager dashboard has a Catalog Data Quality card: the average score, the tier mix, and the biggest gaps across the catalog.",
      "• It's deterministic and $0 — and the same completeness signal improves semantic-search recall (richer specs make better embeddings).",
    ],
  },
  {
    id: "will-call",
    title: "Will-call pickup queue & pick tickets",
    body: [
      "Branch staff get a queue of the orders staged for will-call pickup, with a printable pick ticket to pull the stock.",
      "• When the will-call queue has orders, a card appears on the manager dashboard — open it to see the queue (order, customer, items, date).",
      "• Click Print pick ticket on any order to open a printable ticket (browser Print → Save as PDF) with check-off boxes per line.",
      "• An order lands here when a rep marks its fulfillment method as will-call (vs delivery) — the same method that drives order tracking.",
      "$0 and deterministic; no setup required.",
    ],
  },
  {
    id: "customer-portal",
    title: "Customer self-service portal",
    body: [
      "Logged-in customers can view their own order history and reorder at /product-finder/customer.",
      "• Each order shows its date, total, status, and (expanded) the line detail.",
      "• Reorder resolves the order's items against the catalog and drops them in the cart for review before buying.",
      "• Orders are scoped to the customer's account via single sign-on — a customer only ever sees their own (read-only; no write access).",
      "Works with the shipped SSO; no new setup required.",
    ],
  },
  {
    id: "language",
    title: "Switch language (English / Español)",
    body: [
      "Use the Language toggle in the header to switch the rep-facing UI between English and Español.",
      "• Your choice is remembered on this device.",
      "• English is the default; the will-call queue, customer portal, and key actions are translated, with more coverage rolling out.",
      "$0, no setup.",
    ],
  },
  {
    id: "lifecycle-eol",
    title: "Lifecycle status & designing out obsolete parts",
    body: [
      "Every product now carries a manufacturer lifecycle status, so you never quote a dead part by accident.",
      "• Result cards and the detail view flag obsolescent parts with a ⚠ badge — NRND (not recommended for new designs), Last buy, EOL, or Discontinued.",
      "• Tick Active products only in the left sidebar (Product Lifecycle) to hide everything that isn't actively produced.",
      "• Open an obsolescent part's details and the app surfaces the active equivalent we stock — one click adds the successor to the cart instead.",
      "Verified real parts (the ones with live distributor pricing) are always Active.",
    ],
    tryQuery: "circuit breaker",
  },
  {
    id: "second-source",
    title: "Second-source / single-source risk",
    body: [
      "Open any product's details to see its sourcing grade — how many interchangeable, in-stock sources can fulfill it.",
      "• Single-source (red) means only one stocked option — a supply risk worth a second source; Dual-source is amber; Multi/Well/Broadly-sourced are green.",
      "• The count includes true functional equivalents plus documented verified cross-references we stock.",
      "It's the same cross-reference engine you already use, reframed as the single-source risk view procurement teams ask for.",
    ],
    tryQuery: "FRN-R-30",
  },
  {
    id: "procurement-readiness",
    title: "UNSPSC codes, approval policy & live metals",
    body: [
      "Three procurement-readiness upgrades:",
      "• UNSPSC classification — every line carries an 8-digit UNSPSC commodity code, emitted in the cXML PunchOut and EDI 850 exports (the code Ariba/Coupa require before a catalog goes live).",
      "• Approval policy — quotes now route for sign-off on more than just thin margin: a large order (over $25k) or a deep discount (more than 25% off list) also trips Approval pending, and the reason is recorded in the quote's history.",
      "• Live metals index — with a (free) FRED key configured, the landing-view metals strip shows REAL copper/aluminum prices cited by date instead of the simulated index; without a key it stays on the labeled simulation.",
    ],
  },
  {
    id: "reliability-security",
    title: "Reliability & security",
    body: [
      "The pilot is hardened for shared, real-world use, not just a happy-path demo:",
      "• Write-heavy and AI endpoints are rate-limited per caller (the assistant at 20 requests/min) — bursts get a polite 429 with a Retry-After instead of running up cost or load.",
      "• Every page response carries security headers (clickjacking, MIME-sniffing, referrer, and permissions policy, plus HSTS) set in one middleware.",
      "• A /api/health endpoint reports which integrations are live (assistant, SSO, email, distributor APIs) as booleans — never any secret value — for uptime monitoring.",
      "• Errors are logged server-side as structured JSON; API responses never leak internal messages or stack traces to the browser.",
      "• The render-critical UI is covered by component tests (React Testing Library) on top of the full unit suite, so a broken control is caught before deploy.",
      "Operator detail lives in docs/security.md; nothing here changes how you use the app day to day.",
    ],
  },
  {
    id: "speed-and-filters",
    title: "Faster browsing: filters bar, quick-add & compare",
    body: [
      "A set of speed touches make everyday browsing quicker:",
      "• Active filters bar — every facet you've applied (category, brand, stock, price, specs…) now shows as a removable chip above the results. Click any chip's ✕ to drop just that filter, or Clear all to reset.",
      "• Instant detail — hovering or tabbing to a product quietly pre-loads it, so View Details opens with no wait.",
      "• Quick add from the table — the dense Table view (▦) now has a quantity stepper and Add on every row, so a known SKU goes straight to the basket. As the quantity crosses a volume break, the better tier price is shown inline.",
      "• Compare differences only — in the compare view, toggle “Show differences only” to hide specs every product shares and highlight just the cells that differ; the product header stays pinned as you scroll.",
    ],
  },
  {
    id: "refine-sort-scope",
    title: "Sort any column, refine fast, search within a category",
    body: [
      "Three touches make narrowing a big result set quick:",
      "• Sort by any column — in the dense Table view (▦), click any column header to sort the whole result set by it (▲/▼ shows the active one). Every visible column is now sortable.",
      "• Refine by — after a search, a row of one-tap chips suggests the highest-signal ways to narrow what you found (a brand, a subcategory, a voltage…), each showing how many results match.",
      "• Search within a category — when what you type matches a category, the dropdown offers “Search only in …”. Pick it to scope your browsing to that branch; remove the scope chip anytime to go back to everything.",
      "• Documented crosses only — a new sidebar filter keeps just the parts that carry source-backed cross-references.",
    ],
  },
  {
    id: "margin-tariff-takeoff",
    title: "Reclaim rebates, see tariffs, import a takeoff",
    body: [
      "Four deterministic tools for margin and estimating:",
      "• SPA rebate claim-back — the manager dashboard surfaces unclaimed Special-Pricing-Agreement dollars across your won quotes, broken down by manufacturer, with a one-click claim-file CSV export.",
      "• Tariff-aware landed cost — BOM Intelligence now shows the Section-301 duty on China-origin lines and the tariff-adjusted landed cost, so the real importer cost is visible.",
      "• Smarter relevance — plain-English searches now blend exact-keyword and fuzzy matching, so paraphrased or partial queries surface the right part more often.",
      "• Plan-takeoff import — paste or upload an estimating / Bluebeam takeoff CSV (Description + Count columns) into BOM import; it's auto-detected and run through the same confidence-matching as a pasted list.",
    ],
  },
  {
    id: "cycle-count-bins",
    title: "Cycle count & bins (scan to reorder)",
    body: [
      "Count a shelf, van, or bin from your phone and reorder what's low — open it from Ctrl/⌘-K → “Cycle count & bins”.",
      "• Scan each SKU with the camera (continuous — keep scanning a whole shelf) or key/scan it with a wedge scanner into the box.",
      "• Enter the counted on-hand for each line. Anything below its VMI min/max policy is flagged Reorder or Critical with the quantity to restock back up to max.",
      "• One tap adds every below-min line to your basket — review and check out as normal.",
      "Set a SKU's min/max first in VMI (also under Ctrl/⌘-K). Counts are point-in-time; nothing is ordered until you check out.",
    ],
  },
  {
    id: "outbound-alerts",
    title: "Outbound alerts & rep scorecard",
    body: [
      "Sprint 5 connects Meridian to the channels your team already lives in — all dormant and $0 until an operator turns each on:",
      "• Push alerts — when a workspace enables web push, an Enable alerts button appears in the header. One tap and a quote/approval/order ping reaches you even when the Meridian app is closed. (iPhone: add Meridian to your Home Screen first.)",
      "• Slack — high-signal events (a quote accepted, an inbound RFQ matched, an approval needed) can post to a Slack channel automatically, so nothing waits in an inbox.",
      "• Branded PDFs — quotes can render to a polished, white-label PDF server-side, identical to the emailed version, ready to attach to a PO.",
      "• Rep scorecard — the dashboard shows a manager table of volume, win rate, average margin, cross-sell attach, and average cycle time per rep, built from your own quote history.",
      "• Procurement networks — Meridian is ready to punch out to SAP Business Network (Ariba) and Coupa using their free supplier accounts.",
    ],
  },
  {
    id: "data-enrichment",
    title: "Manufacturer, ETIM class & compliance enrichment",
    body: [
      "Open any product's details and scroll to the Data Enrichment panel — it grounds the part in three real, sourced datasets, all computed on-device at $0:",
      "• Manufacturer entity — the brand's parent and ultimate-parent company, its GLEIF LEI (the global legal-entity ID), and former names. So “Cutler-Hammer” is shown as Eaton, and you can see which brands are corporate siblings.",
      "• ETIM class — the international electrotechnical class code (e.g. EC000042 for a miniature circuit breaker) and the engineering features that class expects, with a coverage bar showing which the product already lists.",
      "• Compliance watch — a CAS-anchored “may contain” list (REACH-SVHC / RoHS / Prop 65) inferred from the product's materials, plus the product's real per-subcategory US HTS code and the actual landed duty (MFN + the correct Section 301 rate for that category — 7.5% for datacom, 25% for most gear — plus a steel Section 232 surcharge where it applies). Shown on the BOM Intelligence landed-cost view. Always labeled an estimate a customs broker confirms.",
      "Search benefits too: type a former name like “Cutler-Hammer” or a parent like “Schneider” and the brand alias expands to the canonical catalog brand automatically. When semantic search is enabled, the same entity + ETIM text enriches each product's embedding for better recall.",
      "Every fact carries a source link and a confidence level; nothing here is fabricated.",
    ],
    tryQuery: "Cutler-Hammer breaker",
  },
  {
    id: "live-data-sources",
    title: "Live data sources (admin-activated, free)",
    body: [
      "Beyond the built-in enrichment, Meridian can pull LIVE data from eight free public sources. Each stays completely off (zero cost, zero network) until an admin sets its key, so nothing here changes your bill — it just deepens the data when switched on:",
      "• ENERGY STAR & DLC — confirm a lighting product's certification and pull lumens / watts / efficacy, the gate for most utility rebates.",
      "• FCC Equipment Authorization — turn an FCC ID into the real manufacturer behind a wireless/datacom part.",
      "• Open Icecat — manufacturer datasheets, images, and GTINs for participating brands.",
      "• GLEIF & Wikidata — live company-ownership lookups (LEI, parent and ultimate-parent) that extend the built-in manufacturer panel beyond the curated set.",
      "• BLS Producer Price Index — electrical / switchgear / lighting price trends alongside the copper & aluminum strip.",
      "• OpenEI utility rates — local electric tariffs by jobsite address for operating-cost context.",
      "Seven of the eight are free to run; only DLC's API needs a paid subscription. Your admin enables each one with a single setting — see docs/dataset-ingestion-live-seams.md for the step-by-step.",
    ],
  },
  {
    id: "cross-sell-companions",
    title: "Cross-sell companions — complete the assembly",
    body: [
      "Open any product and the Cross-sell companions section shows the parts that go WITH it — so a quote never ships missing the pieces the job needs.",
      "Two kinds of companion, each labelled:",
      "• Required (green) — engineering-mandatory. A switch needs a wall plate; conduit needs fittings; a breaker needs a lug. These are grouped under “Complete the assembly” with an “Add all required” button so you attach them in one click.",
      "• Add-on (blue) — frequently attached items that round out the order.",
      "Every companion shows an attach score (0-100) — how strongly the engine believes it belongs with the selected product — and the reason behind it (a spec rule, a co-purchase pattern, or a known affinity).",
      "It works the same on the cart: the engine looks across everything in the basket, flags any required companions you’re missing, and de-dupes the suggestions you already have.",
      "All of this is deterministic and runs at zero added cost. The suggestions get sharper as real order history accumulates — the engine layers in market-basket “bought-together” lift on top of the always-on engineering rules.",
    ],
  },
  {
    id: "quote-copilot",
    title: "Quote Copilot — paste an RFQ, draft with companions",
    body: [
      "Ctrl/⌘-K → “Quote Copilot”. Paste a customer’s RFQ or takeoff (one item per line) and Copilot drafts the quote AND pre-loads each line’s cross-sell companions.",
      "• Every line is resolved against the full catalog (fuzzy + typo rescue); low-confidence matches are flagged “review”.",
      "• Required companions (a switch’s wall plate, conduit’s fittings) are pre-checked; tick the add-ons you want.",
      "• One button adds the whole draft plus the companions you kept to the cart.",
      "It’s deterministic and free. Parsing a messy prose RFQ email with AI is an optional upgrade that turns on only when an Anthropic key is set; the plain-text parser is always the fallback.",
    ],
  },
  {
    id: "account-360",
    title: "Account 360 — whitespace & call prep",
    body: [
      "Ctrl/⌘-K → “Account 360”. For the account you’re quoting, it turns their history into a call sheet:",
      "• What they buy — families ranked by spend.",
      "• Whitespace — adjacent families they should buy from us but don’t (the biggest order-size lever). Required gaps — they buy the device but not the mandatory companion from us — sort to the top.",
      "• Reorder shortlist — their most-ordered SKUs, ready to re-add.",
      "Whitespace is computed from the same companion graph as the cross-sell engine. $0, deterministic; it fills in as the account’s quote history grows.",
    ],
  },
  {
    id: "segment-builder",
    title: "Segment Solution Builder — complete the package",
    body: [
      "On the cart, the “Complete the …” strip shows the Wesco solution package (EES / CSS / UBS) your basket is closest to finishing — a branch-wiring package, a structured-cabling package, and so on.",
      "A coverage meter shows how many families you’ve got; each empty family lists a stocked product with a one-click add, so one search becomes a full multi-family segment package.",
      "$0 and deterministic — built from the Wesco segment taxonomy over the shipped catalog.",
    ],
  },
  {
    id: "services-attach",
    title: "Services Attach — kitting, labeling, VMI, cut-to-length",
    body: [
      "The cart’s “Add Wesco services” strip offers the high-margin services that fit the shape of the order:",
      "• Cut-to-length — when there’s sold-by-the-foot wire/cable.",
      "• Kitting & bagging — for a multi-family BOM with enough lines.",
      "• Panel labeling & schedules — when there’s distribution gear.",
      "• VMI / bin stock — when there are several consumable lines.",
      "• Project staging — for large orders; plus jobsite delivery / will-call on any order.",
      "Each offer explains why it triggered. $0, computed locally from the cart.",
    ],
  },
  {
    id: "private-label",
    title: "Preferred-brand swaps — penetration & bulk swap",
    body: [
      "The cart’s “Preferred-brand swaps” strip finds commodity lines that have a preferred / private-label functional equivalent at the same-or-lower customer price, and shows the margin lift.",
      "A penetration meter shows how much of the cart is preferred now vs. after the swaps; “Swap all” converts every eligible line at once — pure margin, no spec change, no extra cost to the customer.",
      "$0 and deterministic, built on the shipped cross-reference engine and margin math.",
    ],
  },
  {
    id: "contract-attach",
    title: "Contract pricing & on-contract attach",
    body: [
      "When you’re quoting for an account that has a contract (set “Quoting for”), the cross-sell rails know it.",
      "• Companions on the account’s contract get an “On contract” badge and show the contract (discounted) price struck through list.",
      "• That keeps the order on contract — the highest-margin, stickiest place for it to be.",
      "Contracts map families (and specific SKUs) to a negotiated discount; $0 and deterministic. In production they come from the contract/entitlement feed.",
    ],
  },
  {
    id: "compare-upgrade",
    title: "Compare → complete the upgrade",
    body: [
      "When you compare products and trade the customer UP to a richer SKU, the compare view shows “Complete the upgrade”: the companions the upgrade needs that the cheaper option didn’t.",
      "• A GFCI needs a weather-resistant cover; a smart breaker needs a neutral kit — they’re surfaced with one-click add.",
      "• It only lists what’s NEW vs. the products you’re comparing, so you attach exactly the delta.",
      "Built on the cross-sell engine; $0.",
    ],
  },
  {
    id: "icecat-relations",
    title: "Manufacturer accessory relations (Open Icecat)",
    body: [
      "Beyond our spec rules and co-purchase signals, the engine can layer in MANUFACTURER-declared relations — the accessories and compatible parts a brand publishes for a product.",
      "This comes from Open Icecat and stays completely off ($0, no network) until an admin sets the free Open Icecat account key. When on, each related part is resolved to a stocked SKU where we carry it.",
      "GET /api/products/{id}/relations returns the relations (or {enabled:false} while dormant).",
    ],
  },
  {
    id: "cpq-mcp",
    title: "Quote/CPQ & CRM for agents (MCP)",
    body: [
      "The Meridian MCP server lets an AI agent quote and sync without the UI:",
      "• draft_quote — price a list of { sku, qty }, total it, and attach the cross-sell companions (no order placed).",
      "• place_order — book it (idempotent).",
      "• push_quote_to_crm — push a won quote to HubSpot (Contact + Deal) or Salesforce (Contact + Opportunity). Each CRM stays dormant until its keys are set.",
      "These reuse the same $0 cross-sell engine the UI uses.",
    ],
  },
  {
    id: "quick-order-chips",
    title: "Quick-Order Pad — companion chips",
    body: [
      "Ctrl/⌘-K → “Quick-Order Pad”. Paste your SKUs and resolve them — then an “Add these too” row of cross-sell companion chips appears beneath the matched lines.",
      "• Required companions show in green; tap a chip to add it to the cart.",
      "• It’s basket-aware: companions are gathered across your resolved SKUs and de-duped against what you already pasted.",
      "$0 and deterministic — the same cross-sell engine the rep surfaces use.",
    ],
  },
  {
    id: "reorder-subscription",
    title: "Self-service reorder & subscriptions",
    body: [
      "On the customer portal (/product-finder/customer), expand any past order to:",
      "• Reorder it — resolves the SKUs back into your cart for review.",
      "• Subscribe to reorder — pick a cadence (weekly … quarterly) and it previews your next reorder date.",
      "• Add companions — “Customers also add” chips put the cross-sell items into the reorder with one tap.",
      "Your orders are scoped to your account via single sign-on. Subscriptions are $0; the durable subscription schedule is the production path.",
    ],
  },
  {
    id: "order-history-import",
    title: "Import order history — activate co-purchase lift",
    body: [
      "Ctrl/⌘-K → “Import order history”. Paste or upload a customer’s past orders (a CSV of order lines) and the app mines real “bought-together” patterns from them.",
      "• Recognized columns: an order/PO/invoice id, a sku/part/item number, and an optional qty. A header row is required; unmatched SKUs are reported, never guessed.",
      "• After import, the cross-sell rail blends real co-purchase LIFT on top of the always-on spec-rule + affinity model — so “customers who bought X also bought Y” reflects this account’s actual orders.",
      "• The modal shows what was mined (orders, matched lines, rules, top pairs) and lets you clear it.",
      "This is the single highest-leverage data step: until an order file is imported, the behavioral engines run on the deterministic backbone only. $0 — it reuses the app’s own database.",
    ],
  },
  {
    id: "catalog-crosswalk",
    title: "Customer catalog numbers — find parts by your own #",
    body: [
      "Ctrl/⌘-K → “Import catalog numbers”. Load a customer’s own item-number → product mapping (a CSV of “your number, sku”) so their buyers find parts by the numbers they already use.",
      "• After import, typing a customer number in the search box surfaces the carried product with a “your #” badge; pasting customer numbers into the Quick-Order pad resolves them too.",
      "• Exact manufacturer SKU is always tried first, so a customer number never shadows a real SKU. Unmatched rows are reported, never invented.",
      "Until a real crosswalk is imported, an illustrative DEMO crosswalk is active — try searching “WX-100000”. Import replaces it with the customer’s real numbers. $0.",
    ],
    tryQuery: "WX-100000",
  },
  {
    id: "data-ingestion",
    title: "Data ingestion — renewable source adapters",
    body: [
      "Ctrl/⌘-K → “Data ingestion” opens the operator panel for the renewable collection framework that keeps the catalog’s attributes, spec sheets, images, and cross-references fresh from outside sources.",
      "Each source is a Source Adapter that runs the same renewable pipeline: fetch → parse → gate → snapshot → diff. The GATE only keeps a record that carries a real identity (a SKU, MPN, or GTIN), a source URL, and a confidence of 95 or higher — anything unverifiable is dropped, never invented. The DIFF compares each run against the last snapshot so you see exactly what was added, changed, or removed.",
      "• Re-run any source (or all) from the panel on demand — that’s the “renewable” part: the recommender can re-check a source later for new product data. Runs are operator-triggered (or queued), never on a hidden schedule.",
      "• The framework prefers official structured data (schema.org / JSON-LD product blocks) before scraping HTML, fetches politely (≤1 request/second per host), and captures factual specs only — not copyrighted prose.",
      "• The default deploy ships only a built-in self-test source, so a run is $0 and never touches the network. Live external sources stay dormant until an operator declares them in the INGEST_SOURCES environment variable.",
      "• Adapters also drive the MCP tools ingest_status and ingest_run, so an agent can read what’s registered and trigger a refresh.",
    ],
  },
  {
    id: "attribute-backbone",
    title: "Attribute backbone — one canonical spec language",
    body: [
      "Different sources spell the same engineering spec a dozen ways — “Amps”, “Amperage”, “Current Rating (A)”. The attribute backbone normalizes every ingested spec onto ONE canonical taxonomy (key + canonical unit) so the same attribute from any source lines up and merges. It’s the foundation the distributor and manufacturer harvests build on.",
      "• When a source runs, each kept record gains a canonical view of its specs (the raw values are kept untouched as provenance), and the run reports its “% canonical” coverage — how much of what the source published the backbone recognized.",
      "• Honest: a spec name the taxonomy doesn’t know is reported as unmapped, never force-fit; a unit is only attached when it’s actually in the source value (a bare “2” is never relabeled “2 A”).",
      "• The Data-ingestion panel lists the recognized canonical attributes (e.g. Amperage (A), Voltage (V), Interrupting rating (kAIC), Luminous flux (lm)); the MCP run/status reports carry the coverage number.",
    ],
  },
  {
    id: "distributor-harvest",
    title: "Distributor harvest — fill datasheet & brand gaps",
    body: [
      "A data-ingestion source that enriches a list of manufacturer part numbers from the distributor APIs (Mouser, Digi-Key, Nexar/Octopart) to fill in missing manufacturer names and datasheet links.",
      "• It respects each distributor’s terms: it ingests ONLY the factual identity linkage — the part number, the manufacturer, and the datasheet URL. Their proprietary catalog content (pricing, stock, descriptions, parametric specs) is deliberately never cached. Live pricing/stock is still available per request elsewhere in the app.",
      "• Dormant and $0 by default. It activates only when (1) a distributor key is set (MOUSER_API_KEY, DIGIKEY_CLIENT_ID/SECRET, or NEXAR_CLIENT_ID/SECRET) AND (2) a seed MPN list is provided in INGEST_DISTRIBUTOR_MPNS — then a “distributor:identity” source appears in the Data-ingestion panel.",
      "• Records from multiple distributors for the same part merge into one, and flow through the same gate (≥95% provenance) → snapshot → diff as every other source.",
    ],
  },
  {
    id: "manufacturer-harvest",
    title: "Manufacturer harvest — accurate specs & images",
    body: [
      "A data-ingestion source that harvests product attributes, datasheets, and accurate product IMAGES straight from the manufacturer’s own product pages (Eaton, Schneider, Siemens, ABB, Hubbell, Leviton, and more).",
      "• The manufacturer is the authoritative source for its own products, and — unlike third-party distributor catalog content — its own image of its own product is fine to use, so this is where the app gets real, accurate images. Each harvested record is placed in the right Wesco segment automatically from a built-in brand map.",
      "• Honest images: every image link is resolved to a full URL and obvious placeholders (spinners, “no-image”, “coming-soon”) are skipped — so a product either gets a real, loadable image or none, never a fake one. Only factual specs are read, never copyrighted marketing prose.",
      "• Dormant and $0 until you declare manufacturer sources in INGEST_MANUFACTURERS — then a “manufacturer:<brand>” source appears in the Data-ingestion panel and runs through the same provenance gate → snapshot → diff as every other source.",
    ],
  },
  {
    id: "crossref-lifecycle-harvest",
    title: "Cross-reference & lifecycle harvest",
    body: [
      "Two more signals the data-ingestion framework captures: competitive cross-references and product lifecycle.",
      "• Cross-references: for a seed list of part numbers, the Nexar/Octopart source brings back the “second sources” — the same part made by an alternate manufacturer — and records them as cross-reference edges. They’re labeled honestly as “second-source” (not overclaimed as exact equivalents), and the primary part and duplicates are excluded. Dormant/$0 until Nexar is keyed; reuses the same seed list as the distributor harvest.",
      "• Lifecycle: when a manufacturer’s page marks a product Discontinued (via schema.org availability), the harvester records a “Lifecycle status: Discontinued” fact. Only a true end-of-life signal counts — ordinary in/out-of-stock is availability, not lifecycle, so it’s never mistaken for one. The signal flows through the same gate, the attribute backbone, and the diff as every other spec.",
    ],
  },
  {
    id: "tips",
    title: "Quick tips",
    body: [
      "• No results? Clear search & filters and start over.",
      "• Quantities of 10/50/100+ unlock volume pricing automatically.",
      "• Save a basket per repeat job instead of rebuilding it.",
      "• Different logins have different home branches — match scores change with you.",
      "• Results load 24 at a time — Load more or narrow with filters.",
    ],
  },
];

/** Case-insensitive filter over title + body. Empty query returns all topics. */
export function searchHelpTopics(topics: HelpTopic[], query: string): HelpTopic[] {
  const q = query.trim().toLowerCase();
  if (!q) return topics;
  return topics.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.body.some((line) => line.toLowerCase().includes(q)),
  );
}
