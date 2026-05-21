import type { SBU } from "./accounts";

export type SupplierStatus = "Active" | "Approved" | "Onboarding" | "Suspended" | "Inactive";
export type SupplierTier = "Strategic" | "Preferred" | "Approved" | "Spot";

export interface Supplier {
  id: string;
  name: string;
  category: string;
  country: string;
  region: string;
  tier: SupplierTier;
  status: SupplierStatus;
  annualSpend: number;
  leadTimeDays: number;
  qualityScore: number;
  deliveryScore: number;
  contactName: string;
  contactEmail: string;
  sbu: SBU;
  function: "Procurement";
  createdAt: string;
}

export const mockSuppliers: Supplier[] = [
  { id: "SUP-001", name: "SteelForge Metals Ltd",       category: "Raw Materials",    country: "USA",     region: "North America", tier: "Strategic",  status: "Active",     annualSpend: 18_400_000, leadTimeDays: 14, qualityScore: 9.2, deliveryScore: 9.5, contactName: "Dan Kowalski",     contactEmail: "d.kowalski@steelforge.com",    sbu: "Manufacturing", function: "Procurement", createdAt: "2024-05-12T00:00:00Z" },
  { id: "SUP-002", name: "Pharma Raw GmbH",             category: "Raw Materials",    country: "Germany", region: "EMEA",          tier: "Strategic",  status: "Active",     annualSpend: 11_200_000, leadTimeDays: 21, qualityScore: 9.6, deliveryScore: 9.1, contactName: "Sabine Richter",   contactEmail: "s.richter@pharmaraw.de",       sbu: "Healthcare",    function: "Procurement", createdAt: "2024-05-25T00:00:00Z" },
  { id: "SUP-003", name: "TransLogix Corp",             category: "Logistics",        country: "USA",     region: "North America", tier: "Preferred",  status: "Active",     annualSpend:  7_850_000, leadTimeDays:  3, qualityScore: 8.7, deliveryScore: 9.3, contactName: "Maria Vega",       contactEmail: "m.vega@translogix.com",        sbu: "Distribution",  function: "Procurement", createdAt: "2024-06-08T00:00:00Z" },
  { id: "SUP-004", name: "TechParts Asia Co",           category: "Components",       country: "Taiwan",  region: "APAC",          tier: "Strategic",  status: "Active",     annualSpend: 24_600_000, leadTimeDays: 28, qualityScore: 9.0, deliveryScore: 8.8, contactName: "Ming-Wei Lin",     contactEmail: "mwlin@techpartsasia.com",      sbu: "Manufacturing", function: "Procurement", createdAt: "2024-06-22T00:00:00Z" },
  { id: "SUP-005", name: "GreenPack Solutions",         category: "Packaging",        country: "UK",      region: "EMEA",          tier: "Preferred",  status: "Active",     annualSpend:  3_120_000, leadTimeDays:  7, qualityScore: 8.4, deliveryScore: 8.9, contactName: "James Thornton",   contactEmail: "j.thornton@greenpack.co.uk",   sbu: "Retail",        function: "Procurement", createdAt: "2024-07-05T00:00:00Z" },
  { id: "SUP-006", name: "Medline Equipment Inc",       category: "Medical Devices",  country: "USA",     region: "North America", tier: "Strategic",  status: "Active",     annualSpend: 15_900_000, leadTimeDays: 10, qualityScore: 9.7, deliveryScore: 9.4, contactName: "Patricia Holmes",  contactEmail: "p.holmes@medlineequip.com",    sbu: "Healthcare",    function: "Procurement", createdAt: "2024-07-18T00:00:00Z" },
  { id: "SUP-007", name: "Apex Fasteners BV",           category: "Components",       country: "Netherlands", region: "EMEA",     tier: "Approved",   status: "Active",     annualSpend:  1_840_000, leadTimeDays: 18, qualityScore: 8.1, deliveryScore: 8.5, contactName: "Pieter van Dijk",  contactEmail: "p.vandijk@apexfasteners.nl",   sbu: "Manufacturing", function: "Procurement", createdAt: "2024-08-01T00:00:00Z" },
  { id: "SUP-008", name: "QuickPrint Labels",           category: "Packaging",        country: "Canada",  region: "North America", tier: "Approved",   status: "Active",     annualSpend:    640_000, leadTimeDays:  5, qualityScore: 8.3, deliveryScore: 9.0, contactName: "Rachel Bouchard",  contactEmail: "r.bouchard@quickprint.ca",     sbu: "Retail",        function: "Procurement", createdAt: "2024-08-14T00:00:00Z" },
  { id: "SUP-009", name: "Global Freight Partners",     category: "Logistics",        country: "Singapore", region: "APAC",       tier: "Preferred",  status: "Active",     annualSpend:  5_380_000, leadTimeDays:  5, qualityScore: 8.8, deliveryScore: 8.6, contactName: "Ravi Sharma",      contactEmail: "r.sharma@globalfreight.sg",    sbu: "Distribution",  function: "Procurement", createdAt: "2024-08-28T00:00:00Z" },
  { id: "SUP-010", name: "ElectroComp Korea",           category: "Electronics",      country: "South Korea", region: "APAC",    tier: "Strategic",  status: "Active",     annualSpend: 31_200_000, leadTimeDays: 35, qualityScore: 9.4, deliveryScore: 9.0, contactName: "Ji-Woon Park",     contactEmail: "jwpark@electrocomp.kr",        sbu: "Manufacturing", function: "Procurement", createdAt: "2024-09-11T00:00:00Z" },
  { id: "SUP-011", name: "SafeGuard Consumables",       category: "Safety & PPE",     country: "USA",     region: "North America", tier: "Approved",   status: "Active",     annualSpend:    920_000, leadTimeDays:  7, qualityScore: 8.5, deliveryScore: 8.8, contactName: "Tom Bradley",      contactEmail: "t.bradley@safeguard.com",      sbu: "Manufacturing", function: "Procurement", createdAt: "2024-09-25T00:00:00Z" },
  { id: "SUP-012", name: "BioSupply LATAM SA",          category: "Biological",       country: "Brazil",  region: "LATAM",         tier: "Approved",   status: "Active",     annualSpend:  2_100_000, leadTimeDays: 45, qualityScore: 7.9, deliveryScore: 7.5, contactName: "Fernanda Costa",   contactEmail: "f.costa@biosupply.br",         sbu: "Healthcare",    function: "Procurement", createdAt: "2024-10-09T00:00:00Z" },
  { id: "SUP-013", name: "PaperMax Group",              category: "Office Supplies",  country: "USA",     region: "North America", tier: "Spot",       status: "Active",     annualSpend:    280_000, leadTimeDays:  3, qualityScore: 7.6, deliveryScore: 8.2, contactName: "Susan Hall",       contactEmail: "s.hall@papermax.com",          sbu: "Government",    function: "Procurement", createdAt: "2024-10-23T00:00:00Z" },
  { id: "SUP-014", name: "DigiSign Tech",               category: "Software",         country: "USA",     region: "North America", tier: "Preferred",  status: "Active",     annualSpend:  1_450_000, leadTimeDays:  1, qualityScore: 9.1, deliveryScore: 9.8, contactName: "Kevin Walsh",      contactEmail: "k.walsh@digisign.com",         sbu: "Government",    function: "Procurement", createdAt: "2024-11-06T00:00:00Z" },
  { id: "SUP-015", name: "Armfield Textiles",           category: "Raw Materials",    country: "India",   region: "APAC",          tier: "Approved",   status: "Onboarding", annualSpend:    870_000, leadTimeDays: 30, qualityScore: 8.0, deliveryScore: 7.8, contactName: "Priya Nair",       contactEmail: "p.nair@armfield.in",           sbu: "Retail",        function: "Procurement", createdAt: "2024-11-20T00:00:00Z" },
  { id: "SUP-016", name: "ColdChain Logistics EU",      category: "Cold Storage",     country: "France",  region: "EMEA",          tier: "Preferred",  status: "Active",     annualSpend:  4_650_000, leadTimeDays:  4, qualityScore: 9.3, deliveryScore: 9.2, contactName: "Claire Dubois",    contactEmail: "c.dubois@coldchain-eu.fr",     sbu: "Healthcare",    function: "Procurement", createdAt: "2024-12-04T00:00:00Z" },
  { id: "SUP-017", name: "SecureVault IT",              category: "IT Security",      country: "Israel",  region: "EMEA",          tier: "Approved",   status: "Active",     annualSpend:  2_300_000, leadTimeDays:  7, qualityScore: 9.0, deliveryScore: 9.4, contactName: "Yoav Levi",        contactEmail: "y.levi@securevault.co.il",     sbu: "Government",    function: "Procurement", createdAt: "2024-12-18T00:00:00Z" },
  { id: "SUP-018", name: "Riverton Chemicals",          category: "Chemicals",        country: "USA",     region: "North America", tier: "Strategic",  status: "Active",     annualSpend:  9_100_000, leadTimeDays: 12, qualityScore: 8.9, deliveryScore: 8.7, contactName: "Eric Chambers",    contactEmail: "e.chambers@rivertonchemicals.com", sbu: "Manufacturing", function: "Procurement", createdAt: "2025-01-08T00:00:00Z" },
  { id: "SUP-019", name: "Pacific Fleet Services",      category: "Shipping",         country: "Japan",   region: "APAC",          tier: "Preferred",  status: "Active",     annualSpend:  6_700_000, leadTimeDays: 10, qualityScore: 8.6, deliveryScore: 8.9, contactName: "Hiroshi Yamamoto", contactEmail: "h.yamamoto@pacificfleet.jp",    sbu: "Distribution",  function: "Procurement", createdAt: "2025-01-22T00:00:00Z" },
  { id: "SUP-020", name: "GovPrint Services",           category: "Print & Media",    country: "USA",     region: "North America", tier: "Spot",       status: "Suspended",  annualSpend:    160_000, leadTimeDays:  5, qualityScore: 6.8, deliveryScore: 6.5, contactName: "Dale Murray",      contactEmail: "d.murray@govprint.com",        sbu: "Government",    function: "Procurement", createdAt: "2025-02-05T00:00:00Z" },
];
