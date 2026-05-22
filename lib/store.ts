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
  | "ai-use-cases"
  | "imt-risk"
  | "eproc-risk"
  | "sales-nba"
  | "project-orchestrator"
  | "dc-control-tower";

export type AuditAction = "VIEW_RECORD" | "OPEN_SECTION" | "FILTER_APPLIED" | "EXPORT_ATTEMPTED";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  section: Section;
  detail?: string;
}

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

  // governance — audit log
  auditLog: AuditEntry[];
  auditLogOpen: boolean;
  logAuditEvent: (entry: Omit<AuditEntry, "id" | "timestamp">) => void;
  toggleAuditLog: () => void;
}

const today = new Date().toISOString().split("T")[0];
const oneYearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString().split("T")[0];

let _seq = 0;
function nextId() {
  return `AUD-${String(++_seq).padStart(4, "0")}`;
}

export const useOpsStore = create<OpsStore>((set, get) => ({
  // legacy
  timeRange: "24h",
  selectedModel: null,
  sidebarOpen: true,
  setTimeRange: (range) => set({ timeRange: range }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // shell nav
  activeSection: "dashboard",
  navCollapsed: false,
  setActiveSection: (section) => {
    set({ activeSection: section, selectedRowId: null, drawerOpen: false });
    get().logAuditEvent({ action: "OPEN_SECTION", section, detail: section });
  },
  toggleNav: () => set((s) => ({ navCollapsed: !s.navCollapsed })),

  // filters
  selectedSbus: [],
  selectedFunctions: [],
  dateFrom: oneYearAgo,
  dateTo: today,
  setSelectedSbus: (v) => {
    set({ selectedSbus: v });
    get().logAuditEvent({
      action: "FILTER_APPLIED",
      section: get().activeSection,
      detail: `SBU: ${v.join(", ") || "all"}`,
    });
  },
  setSelectedFunctions: (v) => {
    set({ selectedFunctions: v });
    get().logAuditEvent({
      action: "FILTER_APPLIED",
      section: get().activeSection,
      detail: `Function: ${v.join(", ") || "all"}`,
    });
  },
  setDateFrom: (v) => {
    set({ dateFrom: v });
    get().logAuditEvent({
      action: "FILTER_APPLIED",
      section: get().activeSection,
      detail: `Date from: ${v}`,
    });
  },
  setDateTo: (v) => {
    set({ dateTo: v });
    get().logAuditEvent({
      action: "FILTER_APPLIED",
      section: get().activeSection,
      detail: `Date to: ${v}`,
    });
  },

  // table / drawer
  selectedRowId: null,
  drawerOpen: false,
  selectRow: (id) => {
    set({ selectedRowId: id, drawerOpen: id !== null });
    if (id) {
      get().logAuditEvent({ action: "VIEW_RECORD", section: get().activeSection, detail: id });
    }
  },
  closeDrawer: () => set({ selectedRowId: null, drawerOpen: false }),

  // governance
  auditLog: [],
  auditLogOpen: false,
  logAuditEvent: (entry) =>
    set((s) => ({
      auditLog: [
        { ...entry, id: nextId(), timestamp: new Date().toISOString() },
        ...s.auditLog,
      ].slice(0, 100),
    })),
  toggleAuditLog: () => set((s) => ({ auditLogOpen: !s.auditLogOpen })),
}));
