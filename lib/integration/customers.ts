// INTEGRATION SEAM — lib/integration/customers.ts
//
// Seeded, deterministic CustomerAccount data.
// Replace with a real CRM / ERP client in lib/integration/index.ts;
// the CustomerProvider interface in types.ts is the contract.

import type { CustomerAccount, CustomerProvider } from "@/lib/integration/types";

// ─── Seeded accounts ──────────────────────────────────────────────────────────

export const CUSTOMER_ACCOUNTS: CustomerAccount[] = [
  {
    id: "CUST-001",
    name: "Gulf Coast Industrial",
    tier: "contract",
    discountByCategory: {
      electrical: 0.15,
      "oem-electrical": 0.12,
    },
    netPrices: {
      // Special net prices on high-volume breaker SKUs
      "CB-SQD-QO115": 6.95,
      "CB-SQD-QO115DF": 18.50,
      "CB-EAT-CH115": 7.20,
    },
    shipToCity: "Houston, TX",
    terms: "Net 30",
  },

  {
    id: "CUST-002",
    name: "Lone Star Data Systems",
    tier: "contract",
    discountByCategory: {
      datacom: 0.18,
      av: 0.10,
    },
    netPrices: {},
    shipToCity: "Austin, TX",
    terms: "Net 45",
  },

  {
    id: "CUST-003",
    name: "Apex Facilities Mgmt",
    tier: "contract",
    discountByCategory: {
      electrical: 0.08,
      datacom: 0.08,
      safety: 0.08,
      security: 0.08,
      av: 0.08,
      "oem-electrical": 0.08,
    },
    netPrices: {},
    shipToCity: "Dallas, TX",
    terms: "Net 30",
  },

  {
    id: "CUST-000",
    name: "Walk-in / Standard",
    tier: "standard",
    discountByCategory: {},
    netPrices: {},
    shipToCity: "—",
    terms: "Prepaid",
  },
];

// ─── Mock provider implementation ─────────────────────────────────────────────

export const mockCustomerProvider: CustomerProvider = {
  list(): CustomerAccount[] {
    return CUSTOMER_ACCOUNTS;
  },

  get(id: string): CustomerAccount | null {
    return CUSTOMER_ACCOUNTS.find((c) => c.id === id) ?? null;
  },
};
