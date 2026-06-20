/**
 * Contract / entitlement attach engine (v5-S3 #11) — $0, deterministic.
 *
 * A national account buys on a negotiated contract: certain families (and certain
 * SKUs) are on-contract at a fixed discount, and the rep's job is to keep the order
 * ON that contract. This engine answers, for any product or companion: is it on the
 * customer's contract, what's the contract price, and how much of the cart is
 * already on-contract — so the cross-sell rails can surface contracted items first.
 *
 * Pure. The demo contracts below stand in for what would come from an ERP/CPQ
 * contract feed; `contractForCustomer` resolves the active account to one.
 */

export interface Contract {
  id: string;
  /** Customer/account name this contract belongs to. */
  customer: string;
  name: string;
  /** Families on contract. */
  contractedSubcategories: string[];
  /** Specific SKUs explicitly on contract (always on-contract regardless of family). */
  contractedSkus: string[];
  /** Off-list discount applied to on-contract lines (0..1). */
  discountPct: number;
}

/**
 * Demo contracts — one per seeded demo account. In production these come from the
 * contract/entitlement feed; here they make the engine demoable end-to-end.
 */
export const DEMO_CONTRACTS: readonly Contract[] = [
  {
    id: "C-GULF-2026",
    customer: "Gulf Coast Industrial",
    name: "Gulf Coast Industrial — National Account 2026",
    contractedSubcategories: [
      "Circuit Breakers",
      "Panelboards",
      "Load Centers",
      "Wire & Cable",
      "Conduit",
      "Conduit Fittings",
      "Lugs & Wire Connectors",
      "Safety Switches & Disconnects",
    ],
    contractedSkus: [],
    discountPct: 0.08,
  },
  {
    id: "C-LONESTAR-2026",
    customer: "Lone Star Data Systems",
    name: "Lone Star Data Systems — Datacom Agreement 2026",
    contractedSubcategories: [
      "Ethernet Cable",
      "Fiber Optic Cable",
      "Network Switches",
      "Patch Panels",
      "Racks & Cabinets",
      "Connectivity",
    ],
    contractedSkus: [],
    discountPct: 0.1,
  },
];

/** Resolve a customer/account name to its contract, or null. Case-insensitive. */
export function contractForCustomer(customer: string | null | undefined): Contract | null {
  if (!customer) return null;
  const c = customer.trim().toLowerCase();
  return DEMO_CONTRACTS.find((ct) => ct.customer.toLowerCase() === c) ?? null;
}

/** Is this product on the given contract (by explicit SKU or by family)? */
export function isOnContract(product: { sku: string; subcategory: string }, contract: Contract | null): boolean {
  if (!contract) return false;
  if (contract.contractedSkus.includes(product.sku)) return true;
  return contract.contractedSubcategories.includes(product.subcategory);
}

/** The contract (discounted) unit price for an on-contract product; list price otherwise. */
export function contractPrice(unitPrice: number, product: { sku: string; subcategory: string }, contract: Contract | null): number {
  if (!isOnContract(product, contract)) return unitPrice;
  return Math.round(unitPrice * (1 - contract!.discountPct) * 100) / 100;
}

export interface ContractAnnotated<T> {
  item: T;
  onContract: boolean;
}

/**
 * Annotate + reorder a list of products/companions so on-contract items come first
 * (stable within each group). Each carries an `onContract` flag for badging.
 */
export function annotateContract<T extends { sku: string; subcategory: string }>(
  items: T[],
  contract: Contract | null,
): ContractAnnotated<T>[] {
  const annotated = items.map((item) => ({ item, onContract: isOnContract(item, contract) }));
  // Stable partition: on-contract first, original order preserved within each group.
  return [...annotated.filter((a) => a.onContract), ...annotated.filter((a) => !a.onContract)];
}

export interface ContractCoverage {
  onContractLines: number;
  totalLines: number;
  /** 0..100. */
  coveragePct: number;
  /** Dollars saved on the on-contract lines at contract pricing. */
  contractSavings: number;
}

/** How much of a cart is on-contract, and the savings the contract delivers. */
export function contractCoverage(
  lines: { product: { sku: string; subcategory: string; unitPrice: number }; qty: number }[],
  contract: Contract | null,
): ContractCoverage {
  let onContractLines = 0;
  let contractSavings = 0;
  for (const { product, qty } of lines) {
    if (isOnContract(product, contract)) {
      onContractLines += 1;
      contractSavings += (product.unitPrice - contractPrice(product.unitPrice, product, contract)) * qty;
    }
  }
  return {
    onContractLines,
    totalLines: lines.length,
    coveragePct: lines.length > 0 ? Math.round((onContractLines / lines.length) * 100) : 0,
    contractSavings: Math.round(contractSavings * 100) / 100,
  };
}
