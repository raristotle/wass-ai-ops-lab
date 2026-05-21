import { create } from "zustand";

type TimeRange = "1h" | "6h" | "24h" | "7d";

export type Section =
  | "dashboard"
  | "accounts"
  | "quotes"
  | "orders"
  | "inventory"
  | "suppliers"
  | "rebates"
  | "projects"
  | "shipments"
  | "invoices"
  | "ai-use-cases";

interface OpsStore {
  // legacy AI-ops dashboard
  timeRange: TimeRange;
  selectedModel: string | null;
  sidebarOpen: boolean;
  setTimeRange: (range: TimeRange) => void;
  setSelectedModel: (model: string | null) => void;
  toggleSidebar: () => void;

  // shell nav
  activeSection: Section;
  navCollapsed: boolean;
  setActiveSection: (s: Section) => void;
  toggleNav: () => void;

  // filters
  selectedSbus: string[];
  selectedFunctions: string[];
  dateFrom: string;
  dateTo: string;
  setSelectedSbus: (v: string[]) => void;
  setSelectedFunctions: (v: string[]) => void;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;

  // table / drawer
  selectedRowId: string | null;
  drawerOpen: boolean;
  selectRow: (id: string | null) => void;
  closeDrawer: () => void;
}

const today = new Date().toISOString().split("T")[0];
const oneYearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString().split("T")[0];

export const useOpsStore = create<OpsStore>((set) => ({
  timeRange: "24h",
  selectedModel: null,
  sidebarOpen: true,
  setTimeRange: (range) => set({ timeRange: range }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  activeSection: "dashboard",
  navCollapsed: false,
  setActiveSection: (s) =>
    set({ activeSection: s, selectedRowId: null, drawerOpen: false }),
  toggleNav: () => set((s) => ({ navCollapsed: !s.navCollapsed })),

  selectedSbus: [],
  selectedFunctions: [],
  dateFrom: oneYearAgo,
  dateTo: today,
  setSelectedSbus: (v) => set({ selectedSbus: v }),
  setSelectedFunctions: (v) => set({ selectedFunctions: v }),
  setDateFrom: (v) => set({ dateFrom: v }),
  setDateTo: (v) => set({ dateTo: v }),

  selectedRowId: null,
  drawerOpen: false,
  selectRow: (id) => set({ selectedRowId: id, drawerOpen: id !== null }),
  closeDrawer: () => set({ selectedRowId: null, drawerOpen: false }),
}));
