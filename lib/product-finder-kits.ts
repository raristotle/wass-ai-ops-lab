/**
 * Kitting / assemblies — curated product bundles that resolve to stocked catalog
 * items and roll up into a single priced kit line in the quote. Pure data.
 *
 * Each KitLine uses the same (searchQuery, subcategory) resolver as the Job
 * Wizard — the UI calls apiSearch to find the best in-stock match per line.
 */

export interface KitLine {
  /** Short display label for this component. */
  label: string;
  /** Catalog search query for this component (same resolver as Job Wizard). */
  searchQuery: string;
  /** Exact taxonomy subcategory to constrain the search. */
  subcategory: string;
  /** Default quantity. */
  qty: number;
  /** Optional lines start un-selected in the kit browser. */
  optional?: boolean;
  /** Field note shown under this line ("code requires…", sizing hints). */
  note?: string;
}

export interface KitDef {
  id: string;
  name: string;
  description: string;
  /** Grouping category shown in the kit browser. */
  category: "wiring" | "lighting" | "power" | "datacom" | "safety";
  /** Approximate installed price range (display only). */
  priceRange?: string;
  lines: KitLine[];
}

/**
 * Price/stock rollup for a kit whose lines have been resolved to products.
 * `inStock` is true only when every required line is in stock at the branch.
 */
export function kitRollup(
  lines: { def: KitLine; unitPrice: number | null; inStock: boolean }[],
): { totalPrice: number; inStock: boolean } {
  const required = lines.filter((l) => !l.def.optional);
  const total = lines.reduce((sum, l) => sum + (l.unitPrice ?? 0) * l.def.qty, 0);
  const allInStock = required.every((l) => l.inStock);
  return { totalPrice: total, inStock: allInStock };
}

export const KIT_DEFS: readonly KitDef[] = [
  {
    id: "gfci-outlet-kit",
    name: "GFCI Outlet Kit (bathroom / kitchen)",
    description:
      "Everything for one code-compliant GFCI outlet: outlet, old-work box, cover plate, and 50 ft of 12/2 wire.",
    category: "wiring",
    priceRange: "$25–$60",
    lines: [
      { label: "20A GFCI outlet", searchQuery: "GFCI duplex outlet 20A", subcategory: "GFCI Receptacles", qty: 1 },
      { label: "Old-work wall box", searchQuery: "old work switch box", subcategory: "Boxes & Covers", qty: 1 },
      { label: "GFCI cover plate", searchQuery: "GFCI wallplate cover", subcategory: "Wall Plates & Covers", qty: 1 },
      { label: "12/2 NM-B wire (50 ft)", searchQuery: "12/2 NM-B cable", subcategory: "Wire & Cable", qty: 50 },
    ],
  },
  {
    id: "3way-switch-kit",
    name: "3-Way Switch Kit",
    description:
      "Two 3-way switches with boxes, plates, and 3-conductor wire for stairwell / hallway runs.",
    category: "wiring",
    priceRange: "$30–$80",
    lines: [
      { label: "3-way switches (×2)", searchQuery: "3-way switch 15A", subcategory: "Switches", qty: 2 },
      { label: "Switch boxes (×2)", searchQuery: "single gang switch box", subcategory: "Boxes & Covers", qty: 2 },
      { label: "Single-gang plates (×2)", searchQuery: "single gang blank wall plate", subcategory: "Wall Plates & Covers", qty: 2 },
      {
        label: "14/3 NM-B wire (50 ft)",
        searchQuery: "14/3 NM-B cable",
        subcategory: "Wire & Cable",
        qty: 50,
        note: "14/3 carries the traveler wires between the two 3-way switches.",
      },
    ],
  },
  {
    id: "panel-circuit-kit",
    name: "Panel Circuit Addition Kit (20A / 120V)",
    description:
      "Add a new 20A 120V branch circuit: breaker, 100 ft of 12/2, receptacle, box, and wire connectors.",
    category: "power",
    priceRange: "$40–$120",
    lines: [
      { label: "20A single-pole breaker", searchQuery: "20A 1-pole circuit breaker", subcategory: "Circuit Breakers", qty: 1 },
      { label: "12/2 NM-B wire (100 ft)", searchQuery: "12/2 NM-B cable", subcategory: "Wire & Cable", qty: 100 },
      { label: "20A duplex receptacle", searchQuery: "20A duplex receptacle", subcategory: "Receptacles", qty: 1 },
      { label: "Outlet box", searchQuery: "plastic outlet box", subcategory: "Boxes & Covers", qty: 1 },
      { label: "Outlet cover plate", searchQuery: "single outlet cover plate", subcategory: "Wall Plates & Covers", qty: 1 },
      { label: "Wire connectors", searchQuery: "wire connectors nuts", subcategory: "Lugs & Wire Connectors", qty: 1 },
    ],
  },
  {
    id: "exterior-outlet-kit",
    name: "Exterior Weatherproof GFCI Outlet Kit",
    description:
      "Code-compliant exterior outlet: 20A GFCI, in-use bubble cover, weatherproof box, and 50 ft of 12/2 UF-B.",
    category: "wiring",
    priceRange: "$35–$90",
    lines: [
      { label: "20A GFCI receptacle", searchQuery: "GFCI receptacle 20A", subcategory: "GFCI Receptacles", qty: 1 },
      { label: "In-use weatherproof cover", searchQuery: "in-use weatherproof cover", subcategory: "Boxes & Covers", qty: 1 },
      { label: "Weatherproof outlet box", searchQuery: "weatherproof outlet box", subcategory: "Boxes & Covers", qty: 1 },
      {
        label: "12/2 UF-B wire (50 ft)",
        searchQuery: "12/2 UF-B cable",
        subcategory: "Wire & Cable",
        qty: 50,
        note: "UF-B is rated for direct burial and wet locations.",
      },
    ],
  },
  {
    id: "office-led-kit",
    name: "Office LED Retrofit Kit (4-lamp fixture)",
    description:
      "Replace one 4-lamp fluorescent fixture with LED T8 tubes, plus an optional bypass driver for direct-wire installation.",
    category: "lighting",
    priceRange: "$50–$150",
    lines: [
      { label: "LED T8 tubes 4000K (×4)", searchQuery: "LED T8 tube lamp 4ft 4000K", subcategory: "LED Lamps", qty: 4 },
      {
        label: "Bypass driver / tombstone",
        searchQuery: "LED bypass driver T8",
        subcategory: "LED Drivers & Ballasts",
        qty: 1,
        optional: true,
        note: "Required for Type B direct-wire bypass tubes (removes the ballast).",
      },
    ],
  },
  {
    id: "ev-charger-circuit-kit",
    name: "EV Charger Circuit Kit (Level 2, 50A)",
    description:
      "Dedicated 240V 50A circuit for a Level 2 EVSE: 2-pole breaker, 6/3 NM-B wire, and a NEMA 14-50 outlet.",
    category: "power",
    priceRange: "$80–$200",
    lines: [
      { label: "50A 2-pole breaker", searchQuery: "50A double pole circuit breaker", subcategory: "Circuit Breakers", qty: 1 },
      {
        label: "6/3 NM-B wire (50 ft)",
        searchQuery: "6/3 NM-B cable",
        subcategory: "Wire & Cable",
        qty: 50,
        note: "6 AWG Cu handles 50A at runs up to ~100 ft before voltage drop (NEC guidance).",
      },
      { label: "NEMA 14-50 receptacle", searchQuery: "NEMA 14-50 receptacle", subcategory: "Receptacles", qty: 1 },
      { label: "Single-gang box", searchQuery: "single gang box", subcategory: "Boxes & Covers", qty: 1 },
    ],
  },
];
