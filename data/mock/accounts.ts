export type SBU = "Manufacturing" | "Distribution" | "Healthcare" | "Retail" | "Government";
export type OpsFunction = "Finance" | "Procurement" | "Operations" | "Sales" | "IT" | "Logistics";

export const SBU_LIST: SBU[] = ["Manufacturing", "Distribution", "Healthcare", "Retail", "Government"];
export const FUNCTION_LIST: OpsFunction[] = ["Finance", "Procurement", "Operations", "Sales", "IT", "Logistics"];
export const REGION_LIST = ["North America", "EMEA", "APAC", "LATAM"];

export interface Account {
  id: string;
  name: string;
  sbu: SBU;
  function: OpsFunction;
  region: string;
  tier: "Gold" | "Silver" | "Bronze";
  status: "Active" | "Inactive" | "Prospect";
  annualRevenue: number;
  contactName: string;
  contactEmail: string;
  accountManager: string;
  createdAt: string;
}

export const mockAccounts: Account[] = [
  { id: "ACC-001", name: "Meridian Industrial Corp",   sbu: "Manufacturing",  function: "Procurement", region: "North America", tier: "Gold",   status: "Active",   annualRevenue: 124_500_000, contactName: "Sarah Chen",      contactEmail: "s.chen@meridian.com",          accountManager: "Alice Thornton", createdAt: "2024-05-15T00:00:00Z" },
  { id: "ACC-002", name: "Apex Healthcare Systems",    sbu: "Healthcare",     function: "IT",          region: "North America", tier: "Gold",   status: "Active",   annualRevenue:  89_200_000, contactName: "Michael Torres",   contactEmail: "m.torres@apexhealth.com",       accountManager: "Bob Reyes",      createdAt: "2024-06-02T00:00:00Z" },
  { id: "ACC-003", name: "NovaDist Solutions",         sbu: "Distribution",   function: "Logistics",   region: "EMEA",          tier: "Silver", status: "Active",   annualRevenue:  34_600_000, contactName: "Elena Müller",     contactEmail: "e.muller@novadist.com",         accountManager: "Carol Singh",    createdAt: "2024-06-18T00:00:00Z" },
  { id: "ACC-004", name: "ClearPath Retail Group",     sbu: "Retail",         function: "Finance",     region: "North America", tier: "Silver", status: "Active",   annualRevenue:  28_900_000, contactName: "James Park",       contactEmail: "j.park@clearpath.com",          accountManager: "David Park",     createdAt: "2024-07-01T00:00:00Z" },
  { id: "ACC-005", name: "Vanguard Manufacturing Ltd", sbu: "Manufacturing",  function: "Operations",  region: "APAC",          tier: "Gold",   status: "Active",   annualRevenue: 215_000_000, contactName: "Wei Zhang",        contactEmail: "w.zhang@vanguardmfg.com",       accountManager: "Emma Wilson",    createdAt: "2024-07-14T00:00:00Z" },
  { id: "ACC-006", name: "Vertex Government Solutions",sbu: "Government",     function: "IT",          region: "North America", tier: "Gold",   status: "Active",   annualRevenue:  67_300_000, contactName: "Patricia Burns",   contactEmail: "p.burns@vertexgov.com",         accountManager: "Alice Thornton", createdAt: "2024-07-28T00:00:00Z" },
  { id: "ACC-007", name: "Atlas Distribution Inc",     sbu: "Distribution",   function: "Procurement", region: "North America", tier: "Silver", status: "Active",   annualRevenue:  41_200_000, contactName: "Robert King",      contactEmail: "r.king@atlasdist.com",          accountManager: "Bob Reyes",      createdAt: "2024-08-10T00:00:00Z" },
  { id: "ACC-008", name: "Summit Healthcare Partners", sbu: "Healthcare",     function: "Procurement", region: "EMEA",          tier: "Silver", status: "Active",   annualRevenue:  19_800_000, contactName: "Aisha Johnson",    contactEmail: "a.johnson@summithp.com",        accountManager: "Carol Singh",    createdAt: "2024-08-24T00:00:00Z" },
  { id: "ACC-009", name: "Prism Retail Holdings",      sbu: "Retail",         function: "Operations",  region: "LATAM",         tier: "Bronze", status: "Active",   annualRevenue:   7_400_000, contactName: "Carlos Gómez",     contactEmail: "c.gomez@prismretail.com",       accountManager: "David Park",     createdAt: "2024-09-05T00:00:00Z" },
  { id: "ACC-010", name: "CoreMfg Technologies",       sbu: "Manufacturing",  function: "Finance",     region: "North America", tier: "Silver", status: "Active",   annualRevenue:  52_100_000, contactName: "Laura Mitchell",   contactEmail: "l.mitchell@coremfg.com",        accountManager: "Emma Wilson",    createdAt: "2024-09-19T00:00:00Z" },
  { id: "ACC-011", name: "Federal Systems Group",      sbu: "Government",     function: "Procurement", region: "North America", tier: "Gold",   status: "Active",   annualRevenue: 142_000_000, contactName: "Thomas Hayes",     contactEmail: "t.hayes@fedgroup.com",          accountManager: "Alice Thornton", createdAt: "2024-10-03T00:00:00Z" },
  { id: "ACC-012", name: "BlueLine Distributors",      sbu: "Distribution",   function: "Logistics",   region: "North America", tier: "Bronze", status: "Active",   annualRevenue:   8_300_000, contactName: "Nancy Owens",      contactEmail: "n.owens@blueline.com",          accountManager: "Bob Reyes",      createdAt: "2024-10-17T00:00:00Z" },
  { id: "ACC-013", name: "LifeCare Medical Inc",       sbu: "Healthcare",     function: "IT",          region: "APAC",          tier: "Silver", status: "Active",   annualRevenue:  23_700_000, contactName: "Kenji Sato",       contactEmail: "k.sato@lifecare.com",           accountManager: "Carol Singh",    createdAt: "2024-10-31T00:00:00Z" },
  { id: "ACC-014", name: "MegaMart Stores Corp",       sbu: "Retail",         function: "Finance",     region: "North America", tier: "Gold",   status: "Active",   annualRevenue: 387_000_000, contactName: "Sandra Lewis",     contactEmail: "s.lewis@megamart.com",          accountManager: "David Park",     createdAt: "2024-11-12T00:00:00Z" },
  { id: "ACC-015", name: "Forge Industrial Ltd",       sbu: "Manufacturing",  function: "Logistics",   region: "EMEA",          tier: "Silver", status: "Active",   annualRevenue:  31_500_000, contactName: "Hans Bauer",       contactEmail: "h.bauer@forgeindustrial.com",   accountManager: "Emma Wilson",    createdAt: "2024-11-26T00:00:00Z" },
  { id: "ACC-016", name: "Municipal Services Co",      sbu: "Government",     function: "Finance",     region: "North America", tier: "Bronze", status: "Active",   annualRevenue:   4_200_000, contactName: "Dorothy Clark",    contactEmail: "d.clark@municipalsvcs.com",     accountManager: "Alice Thornton", createdAt: "2024-12-10T00:00:00Z" },
  { id: "ACC-017", name: "Gateway Distribution LLC",   sbu: "Distribution",   function: "Operations",  region: "LATAM",         tier: "Bronze", status: "Prospect", annualRevenue:   5_900_000, contactName: "Lucia Herrera",    contactEmail: "l.herrera@gatewaydist.com",     accountManager: "Bob Reyes",      createdAt: "2024-12-24T00:00:00Z" },
  { id: "ACC-018", name: "Horizon Health Systems",     sbu: "Healthcare",     function: "Operations",  region: "North America", tier: "Gold",   status: "Active",   annualRevenue: 103_000_000, contactName: "Andrew Cooper",    contactEmail: "a.cooper@horizonhealth.com",    accountManager: "Carol Singh",    createdAt: "2025-01-07T00:00:00Z" },
  { id: "ACC-019", name: "ShopFirst Group",            sbu: "Retail",         function: "IT",          region: "EMEA",          tier: "Silver", status: "Active",   annualRevenue:  16_800_000, contactName: "Fiona Walsh",      contactEmail: "f.walsh@shopfirst.com",         accountManager: "David Park",     createdAt: "2025-01-21T00:00:00Z" },
  { id: "ACC-020", name: "IronWorks Manufacturing",    sbu: "Manufacturing",  function: "Procurement", region: "North America", tier: "Bronze", status: "Inactive", annualRevenue:   3_100_000, contactName: "Raymond Fox",      contactEmail: "r.fox@ironworks.com",           accountManager: "Emma Wilson",    createdAt: "2025-02-04T00:00:00Z" },
  { id: "ACC-021", name: "Capitol Advisory Services",  sbu: "Government",     function: "IT",          region: "North America", tier: "Silver", status: "Active",   annualRevenue:  12_600_000, contactName: "Margaret Stone",   contactEmail: "m.stone@capitoladv.com",        accountManager: "Alice Thornton", createdAt: "2025-02-18T00:00:00Z" },
  { id: "ACC-022", name: "FastFreight Logistics",      sbu: "Distribution",   function: "Logistics",   region: "North America", tier: "Silver", status: "Active",   annualRevenue:  27_400_000, contactName: "Victor Hammond",   contactEmail: "v.hammond@fastfreight.com",     accountManager: "Bob Reyes",      createdAt: "2025-03-04T00:00:00Z" },
  { id: "ACC-023", name: "MedTech Supplies Inc",       sbu: "Healthcare",     function: "Procurement", region: "EMEA",          tier: "Bronze", status: "Active",   annualRevenue:   6_700_000, contactName: "Ingrid Larsen",    contactEmail: "i.larsen@medtech.com",          accountManager: "Carol Singh",    createdAt: "2025-03-18T00:00:00Z" },
  { id: "ACC-024", name: "ValueMax Retail",            sbu: "Retail",         function: "Finance",     region: "APAC",          tier: "Bronze", status: "Prospect", annualRevenue:   2_800_000, contactName: "Joon-ho Kim",      contactEmail: "j.kim@valuemax.com",            accountManager: "David Park",     createdAt: "2025-04-01T00:00:00Z" },
  { id: "ACC-025", name: "Precision Parts Corp",       sbu: "Manufacturing",  function: "Operations",  region: "North America", tier: "Gold",   status: "Active",   annualRevenue:  78_900_000, contactName: "Gregory Nash",     contactEmail: "g.nash@precisionparts.com",     accountManager: "Emma Wilson",    createdAt: "2025-04-15T00:00:00Z" },
];
