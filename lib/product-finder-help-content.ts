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
      "Everything runs on 60,000 synthetic products — click around freely; nothing leaves the app.",
    ],
  },
  {
    id: "search",
    title: "Search & plain-English queries",
    body: [
      "Search runs server-side over all 60,000 products. Type a product name, SKU, brand, or spec.",
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
    title: "Find Alternatives — scored recommendations",
    body: [
      "Click Find Alternatives on any card to see scored alternatives — no black box:",
      "• A match ring with a percentage: Excellent / Good / Partial.",
      "• Reason chips (“✓ All 5 specs”, “✓ In stock · your branch”).",
      "• “Why recommended?” opens the full point breakdown.",
      "Products score higher for matching key specs, branch stock, Preferred lines, lower price, and same product type.",
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
