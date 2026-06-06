import type { WescoProduct } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";

/**
 * Affinity map: subcategory name → complementary subcategory names.
 * Keys/values must match exact subcategory names from TAXONOMY in taxonomy.ts.
 */
export const AFFINITY: Partial<Record<string, string[]>> = {
  // ── Electrical: Power Distribution ───────────────────────────────────────
  "Circuit Breakers": ["Load Centers", "Panelboards", "Lugs & Wire Connectors"],
  "Load Centers": ["Circuit Breakers", "Lugs & Wire Connectors", "Surge Protective Devices"],
  "Panelboards": ["Circuit Breakers", "Lugs & Wire Connectors", "Surge Protective Devices"],
  "Safety Switches & Disconnects": ["Fuses", "Lugs & Wire Connectors", "Motor Starters & Controls"],
  "Fuses": ["Safety Switches & Disconnects", "Panelboards", "Motor Starters & Controls"],

  // ── Electrical: Wiring & Conduit ──────────────────────────────────────────
  "Wire & Cable": ["Lugs & Wire Connectors", "Conduit", "Conduit Fittings"],
  "Conduit": ["Conduit Fittings", "Boxes & Covers", "Strut & Channel"],
  "Conduit Fittings": ["Conduit", "Boxes & Covers", "Strut & Channel"],
  "Flexible Conduit & Liquidtight": ["Conduit Fittings", "Boxes & Covers"],
  "Lugs & Wire Connectors": ["Wire & Cable", "Conduit", "Grounding & Bonding"],
  "Grounding & Bonding": ["Lugs & Wire Connectors", "Conduit", "Safety Switches & Disconnects"],
  "Cable Tray": ["Strut & Channel", "Wire & Cable", "Conduit"],
  "Strut & Channel": ["Cable Tray", "Conduit", "Enclosures"],
  "Boxes & Covers": ["Wall Plates & Covers", "Conduit Fittings"],
  "Enclosures": ["Strut & Channel", "Conduit Fittings", "Motor Starters & Controls"],

  // ── Electrical: Wiring Devices ────────────────────────────────────────────
  "Receptacles & Outlets": ["Wall Plates & Covers", "Boxes & Covers"],
  "Switches": ["Wall Plates & Covers", "Dimmers & Lighting Controls"],
  "Wall Plates & Covers": ["Receptacles & Outlets", "Switches"],
  "Dimmers & Lighting Controls": ["Switches", "Occupancy & Vacancy Sensors", "LED Troffers & Panels"],
  "Occupancy & Vacancy Sensors": ["Dimmers & Lighting Controls", "LED Troffers & Panels"],
  "Combination Devices": ["Wall Plates & Covers", "Boxes & Covers"],
  "Cord Plugs & Connectors": ["Wire & Cable", "Lugs & Wire Connectors"],
  "Industrial Plugs & Receptacles": ["Wire & Cable", "Safety Switches & Disconnects"],

  // ── Electrical: Lighting ──────────────────────────────────────────────────
  "LED Troffers & Panels": ["Drivers & Ballasts", "Occupancy & Vacancy Sensors"],
  "High Bay Fixtures": ["Drivers & Ballasts", "Occupancy & Vacancy Sensors"],
  "Strip & Wrap Fixtures": ["Drivers & Ballasts", "Lamps & Tubes"],
  "LED Downlights": ["Drivers & Ballasts", "Occupancy & Vacancy Sensors"],
  "Drivers & Ballasts": ["LED Troffers & Panels", "High Bay Fixtures", "Strip & Wrap Fixtures"],
  "Lamps & Tubes": ["Drivers & Ballasts", "Strip & Wrap Fixtures"],
  "Outdoor & Area Lighting": ["Photo Controls", "Occupancy & Vacancy Sensors"],
  "Photo Controls": ["Outdoor & Area Lighting", "Timers & Time Switches"],
  "Exit & Emergency Lighting": ["Drivers & Ballasts", "Occupancy & Vacancy Sensors"],

  // ── Electrical: Controls ──────────────────────────────────────────────────
  "Motor Starters & Controls": ["Contactors", "Safety Switches & Disconnects"],
  "Contactors": ["Motor Starters & Controls", "Timers & Time Switches"],
  "Timers & Time Switches": ["Photo Controls", "Contactors"],
  "EV Charging Stations": ["Safety Switches & Disconnects", "Wire & Cable"],
  "Dry-Type Transformers": ["Panelboards", "Safety Switches & Disconnects"],
  "Meter Sockets": ["Load Centers", "Safety Switches & Disconnects"],
  "Surge Protective Devices": ["Load Centers", "Panelboards"],

  // ── Datacom ───────────────────────────────────────────────────────────────
  "Ethernet Cable": ["Patch Panels", "Connectivity"],
  "Patch Panels": ["Ethernet Cable", "Racks & Cabinets"],
  "Connectivity": ["Ethernet Cable", "Patch Panels"],
  "Network Switches": ["Ethernet Cable", "Racks & Cabinets"],
  "Racks & Cabinets": ["Patch Panels", "Network Switches"],
  "Fiber Optic Cable": ["Patch Panels", "Racks & Cabinets"],
  "Wireless Access Points": ["Network Switches", "Racks & Cabinets"],
  "UPS & Power Protection": ["Racks & Cabinets", "Network Switches"],

  // ── Security ──────────────────────────────────────────────────────────────
  "IP Cameras": ["NVRs", "Network Switches"],
  "NVRs": ["IP Cameras", "Racks & Cabinets"],
  "Access Control": ["Intercom & Entry Systems", "Security Cable & Power Supplies"],
  "Intrusion Sensors": ["Alarm Panels", "Security Cable & Power Supplies"],
  "Alarm Panels": ["Intrusion Sensors", "Security Cable & Power Supplies"],
  "Intercom & Entry Systems": ["Access Control", "Security Cable & Power Supplies"],
  "Security Cable & Power Supplies": ["IP Cameras", "Alarm Panels"],

  // ── Safety ────────────────────────────────────────────────────────────────
  "Hard Hats": ["Safety Glasses", "Hi-Vis Apparel"],
  "Safety Glasses": ["Hard Hats", "Gloves"],
  "Gloves": ["Safety Glasses", "Hi-Vis Apparel"],
  "Hi-Vis Apparel": ["Hard Hats", "Gloves"],
  "Fall Protection": ["Hard Hats", "Gloves"],
  "Hearing Protection": ["Hard Hats", "Respiratory Protection"],
  "Respiratory Protection": ["Hearing Protection", "Safety Glasses"],
  "Lockout/Tagout": ["Safety Glasses", "Gloves"],
};

/**
 * Returns up to k "goes well with" products for the given product.
 *
 * Strategy:
 * 1. Look up AFFINITY[product.subcategory] → list of complementary subcats.
 * 2. Collect products whose subcategory is in that list (in listed order),
 *    excluding the product itself.
 * 3. Sort: preferred desc, then total branch stock desc.
 * 4. Take up to k.
 *
 * Fallback (unknown subcategory or empty affinity yield):
 * Same category, different subcategory products — preferred first, then by
 * total branch stock.
 *
 * Deterministic: no random; same catalog → same output.
 */
export function goesWith(product: WescoProduct, k = 6): WescoProduct[] {
  const { products } = getCatalog();

  const affinityList = AFFINITY[product.subcategory];

  if (affinityList && affinityList.length > 0) {
    const affinitySet = new Set(affinityList);
    // Preserve the affinity order: group by affinity index then sort within
    const pool = products.filter(
      (p) => p.id !== product.id && affinitySet.has(p.subcategory)
    );

    if (pool.length > 0) {
      return sortByPreferredThenStock(pool, affinityList).slice(0, k);
    }
  }

  // Fallback: same category, different subcategory
  const fallback = products.filter(
    (p) =>
      p.id !== product.id &&
      p.category === product.category &&
      p.subcategory !== product.subcategory
  );

  return sortByPreferredThenStock(fallback, []).slice(0, k);
}

/**
 * Sort products: preferred first, then by total branch stock descending.
 * When affinityList is provided, products in earlier affinity positions
 * rank higher among same preferred/stock tier.
 */
function sortByPreferredThenStock(
  pool: WescoProduct[],
  affinityList: string[]
): WescoProduct[] {
  const affinityIndex = new Map(affinityList.map((sub, i) => [sub, i]));

  return [...pool].sort((a, b) => {
    // preferred first
    if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;

    // then affinity order (lower index = higher priority)
    const ai = affinityIndex.get(a.subcategory) ?? Infinity;
    const bi = affinityIndex.get(b.subcategory) ?? Infinity;
    if (ai !== bi) return ai - bi;

    // then total branch stock descending
    const aStock = a.branchStock.reduce((s, bs) => s + bs.quantity, 0);
    const bStock = b.branchStock.reduce((s, bs) => s + bs.quantity, 0);
    return bStock - aStock;
  });
}
