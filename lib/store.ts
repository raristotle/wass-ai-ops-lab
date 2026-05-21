import { create } from "zustand";

type TimeRange = "1h" | "6h" | "24h" | "7d";

interface OpsStore {
  timeRange: TimeRange;
  selectedModel: string | null;
  sidebarOpen: boolean;
  setTimeRange: (range: TimeRange) => void;
  setSelectedModel: (model: string | null) => void;
  toggleSidebar: () => void;
}

export const useOpsStore = create<OpsStore>((set) => ({
  timeRange: "24h",
  selectedModel: null,
  sidebarOpen: true,
  setTimeRange: (range) => set({ timeRange: range }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
