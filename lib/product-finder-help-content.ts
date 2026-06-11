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
    title: "Email a quote",
    body: [
      "In the cart, Email Quote opens an inline form pre-filled with a recipient address.",
      "• Send Quote saves the quote with status “Sent” and confirms — so it's tracked for follow-up.",
      "• Pair it with Saved Quotes to move it to Won or Lost later.",
      "(Demo: no email is actually transmitted; the quote is recorded as Sent.)",
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
