import type { SBU, OpsFunction } from "./accounts";

export type QuoteStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected" | "Expired";

export interface Quote {
  id: string;
  accountId: string;
  accountName: string;
  title: string;
  value: number;
  margin: number;
  status: QuoteStatus;
  sbu: SBU;
  function: OpsFunction;
  currency: string;
  validUntil: string;
  createdAt: string;
  owner: string;
}

export const mockQuotes: Quote[] = [
  { id: "QUO-001", accountId: "ACC-001", accountName: "Meridian Industrial Corp",   title: "Annual Supply Agreement 2025",         value: 1_850_000, margin: 0.24, status: "Approved",     sbu: "Manufacturing", function: "Procurement", currency: "USD", validUntil: "2025-03-01T00:00:00Z", createdAt: "2024-05-20T00:00:00Z", owner: "Alice Thornton" },
  { id: "QUO-002", accountId: "ACC-002", accountName: "Apex Healthcare Systems",    title: "EHR Integration Platform License",     value:   920_000, margin: 0.41, status: "Approved",     sbu: "Healthcare",    function: "IT",          currency: "USD", validUntil: "2025-01-15T00:00:00Z", createdAt: "2024-06-10T00:00:00Z", owner: "Bob Reyes"      },
  { id: "QUO-003", accountId: "ACC-003", accountName: "NovaDist Solutions",         title: "Warehouse Management System",          value: 2_150_000, margin: 0.31, status: "Approved",     sbu: "Distribution",  function: "Logistics",   currency: "EUR", validUntil: "2025-02-28T00:00:00Z", createdAt: "2024-06-25T00:00:00Z", owner: "Carol Singh"    },
  { id: "QUO-004", accountId: "ACC-004", accountName: "ClearPath Retail Group",     title: "POS Modernisation Programme",          value:   480_000, margin: 0.28, status: "Submitted",    sbu: "Retail",        function: "Finance",     currency: "USD", validUntil: "2025-06-30T00:00:00Z", createdAt: "2024-07-08T00:00:00Z", owner: "David Park"     },
  { id: "QUO-005", accountId: "ACC-005", accountName: "Vanguard Manufacturing Ltd", title: "Robotics Automation Line Q3",          value: 4_700_000, margin: 0.19, status: "Approved",     sbu: "Manufacturing", function: "Operations",  currency: "USD", validUntil: "2025-04-30T00:00:00Z", createdAt: "2024-07-22T00:00:00Z", owner: "Emma Wilson"    },
  { id: "QUO-006", accountId: "ACC-006", accountName: "Vertex Government Solutions",title: "Secure Cloud Migration Phase 1",       value: 3_200_000, margin: 0.22, status: "Under Review", sbu: "Government",    function: "IT",          currency: "USD", validUntil: "2025-07-31T00:00:00Z", createdAt: "2024-08-02T00:00:00Z", owner: "Alice Thornton" },
  { id: "QUO-007", accountId: "ACC-007", accountName: "Atlas Distribution Inc",     title: "Fleet Telematics Platform",            value:   670_000, margin: 0.33, status: "Approved",     sbu: "Distribution",  function: "Procurement", currency: "USD", validUntil: "2025-01-31T00:00:00Z", createdAt: "2024-08-15T00:00:00Z", owner: "Bob Reyes"      },
  { id: "QUO-008", accountId: "ACC-008", accountName: "Summit Healthcare Partners", title: "Medical Supply Chain Optimisation",    value:   310_000, margin: 0.37, status: "Approved",     sbu: "Healthcare",    function: "Procurement", currency: "EUR", validUntil: "2025-03-15T00:00:00Z", createdAt: "2024-09-01T00:00:00Z", owner: "Carol Singh"    },
  { id: "QUO-009", accountId: "ACC-009", accountName: "Prism Retail Holdings",      title: "Customer Analytics Dashboard",         value:   125_000, margin: 0.45, status: "Draft",        sbu: "Retail",        function: "Operations",  currency: "USD", validUntil: "2025-08-01T00:00:00Z", createdAt: "2024-09-14T00:00:00Z", owner: "David Park"     },
  { id: "QUO-010", accountId: "ACC-010", accountName: "CoreMfg Technologies",       title: "Financial Consolidation Tool",         value:   880_000, margin: 0.29, status: "Rejected",     sbu: "Manufacturing", function: "Finance",     currency: "USD", validUntil: "2024-12-31T00:00:00Z", createdAt: "2024-09-28T00:00:00Z", owner: "Emma Wilson"    },
  { id: "QUO-011", accountId: "ACC-011", accountName: "Federal Systems Group",      title: "National ID Verification System",      value: 6_400_000, margin: 0.17, status: "Approved",     sbu: "Government",    function: "Procurement", currency: "USD", validUntil: "2025-05-31T00:00:00Z", createdAt: "2024-10-10T00:00:00Z", owner: "Alice Thornton" },
  { id: "QUO-012", accountId: "ACC-012", accountName: "BlueLine Distributors",      title: "Route Optimisation SaaS",              value:   145_000, margin: 0.52, status: "Approved",     sbu: "Distribution",  function: "Logistics",   currency: "USD", validUntil: "2025-04-01T00:00:00Z", createdAt: "2024-10-22T00:00:00Z", owner: "Bob Reyes"      },
  { id: "QUO-013", accountId: "ACC-013", accountName: "LifeCare Medical Inc",       title: "Lab Information System Upgrade",       value:   530_000, margin: 0.34, status: "Under Review", sbu: "Healthcare",    function: "IT",          currency: "USD", validUntil: "2025-06-30T00:00:00Z", createdAt: "2024-11-05T00:00:00Z", owner: "Carol Singh"    },
  { id: "QUO-014", accountId: "ACC-014", accountName: "MegaMart Stores Corp",       title: "Enterprise Retail ERP (Phase 2)",     value: 8_900_000, margin: 0.21, status: "Approved",     sbu: "Retail",        function: "Finance",     currency: "USD", validUntil: "2025-08-31T00:00:00Z", createdAt: "2024-11-18T00:00:00Z", owner: "David Park"     },
  { id: "QUO-015", accountId: "ACC-015", accountName: "Forge Industrial Ltd",       title: "Predictive Maintenance IoT Suite",     value: 1_120_000, margin: 0.26, status: "Submitted",    sbu: "Manufacturing", function: "Logistics",   currency: "EUR", validUntil: "2025-07-31T00:00:00Z", createdAt: "2024-12-02T00:00:00Z", owner: "Emma Wilson"    },
  { id: "QUO-016", accountId: "ACC-016", accountName: "Municipal Services Co",      title: "Citizen Portal Redesign",              value:   195_000, margin: 0.38, status: "Approved",     sbu: "Government",    function: "Finance",     currency: "USD", validUntil: "2025-05-15T00:00:00Z", createdAt: "2024-12-15T00:00:00Z", owner: "Alice Thornton" },
  { id: "QUO-017", accountId: "ACC-018", accountName: "Horizon Health Systems",     title: "Clinical Decision Support AI",        value: 2_640_000, margin: 0.32, status: "Approved",     sbu: "Healthcare",    function: "Operations",  currency: "USD", validUntil: "2025-09-30T00:00:00Z", createdAt: "2025-01-10T00:00:00Z", owner: "Carol Singh"    },
  { id: "QUO-018", accountId: "ACC-019", accountName: "ShopFirst Group",            title: "Omnichannel Commerce Platform",        value:   760_000, margin: 0.35, status: "Under Review", sbu: "Retail",        function: "IT",          currency: "GBP", validUntil: "2025-08-31T00:00:00Z", createdAt: "2025-01-24T00:00:00Z", owner: "David Park"     },
  { id: "QUO-019", accountId: "ACC-021", accountName: "Capitol Advisory Services",  title: "Policy Management SaaS",              value:   390_000, margin: 0.44, status: "Draft",        sbu: "Government",    function: "IT",          currency: "USD", validUntil: "2025-09-01T00:00:00Z", createdAt: "2025-02-07T00:00:00Z", owner: "Alice Thornton" },
  { id: "QUO-020", accountId: "ACC-022", accountName: "FastFreight Logistics",      title: "Last-Mile Delivery Optimisation",      value:   840_000, margin: 0.30, status: "Approved",     sbu: "Distribution",  function: "Logistics",   currency: "USD", validUntil: "2025-07-31T00:00:00Z", createdAt: "2025-02-21T00:00:00Z", owner: "Bob Reyes"      },
  { id: "QUO-021", accountId: "ACC-023", accountName: "MedTech Supplies Inc",       title: "Regulatory Compliance Module",         value:   210_000, margin: 0.40, status: "Submitted",    sbu: "Healthcare",    function: "Procurement", currency: "EUR", validUntil: "2025-08-15T00:00:00Z", createdAt: "2025-03-07T00:00:00Z", owner: "Carol Singh"    },
  { id: "QUO-022", accountId: "ACC-025", accountName: "Precision Parts Corp",       title: "Quality Control Vision System",        value: 1_380_000, margin: 0.27, status: "Approved",     sbu: "Manufacturing", function: "Operations",  currency: "USD", validUntil: "2025-10-01T00:00:00Z", createdAt: "2025-03-21T00:00:00Z", owner: "Emma Wilson"    },
  { id: "QUO-023", accountId: "ACC-001", accountName: "Meridian Industrial Corp",   title: "Spare Parts Procurement Portal",       value:   470_000, margin: 0.36, status: "Approved",     sbu: "Manufacturing", function: "Procurement", currency: "USD", validUntil: "2025-10-31T00:00:00Z", createdAt: "2025-04-04T00:00:00Z", owner: "Alice Thornton" },
  { id: "QUO-024", accountId: "ACC-005", accountName: "Vanguard Manufacturing Ltd", title: "Supply Chain Risk Dashboard",          value:   650_000, margin: 0.38, status: "Draft",        sbu: "Manufacturing", function: "Operations",  currency: "USD", validUntil: "2025-10-31T00:00:00Z", createdAt: "2025-04-18T00:00:00Z", owner: "Emma Wilson"    },
  { id: "QUO-025", accountId: "ACC-014", accountName: "MegaMart Stores Corp",       title: "Loyalty Programme Analytics",          value: 1_050_000, margin: 0.42, status: "Submitted",    sbu: "Retail",        function: "Finance",     currency: "USD", validUntil: "2025-11-15T00:00:00Z", createdAt: "2025-05-01T00:00:00Z", owner: "David Park"     },
];
