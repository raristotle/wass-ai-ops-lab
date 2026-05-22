"use client";

import {
  LayoutDashboard,
  Building2,
  FileText,
  ShoppingCart,
  Package,
  Truck,
  BadgePercent,
  FolderOpen,
  Ship,
  Receipt,
  Sparkles,
  ShieldAlert,
  Network,
  Zap,
  Layers,
  Server,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOpsStore, type Section } from "@/lib/store";

const NAV_ITEMS: { key: Section; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "dashboard",    label: "Dashboard",    Icon: LayoutDashboard },
  { key: "accounts",     label: "Accounts",     Icon: Building2       },
  { key: "quotes",       label: "Quotes",       Icon: FileText        },
  { key: "orders",       label: "Orders",       Icon: ShoppingCart    },
  { key: "inventory",    label: "Inventory",    Icon: Package         },
  { key: "suppliers",    label: "Suppliers",    Icon: Truck           },
  { key: "rebates",      label: "Rebates",      Icon: BadgePercent    },
  { key: "projects",     label: "Projects",     Icon: FolderOpen      },
  { key: "shipments",    label: "Shipments",    Icon: Ship            },
  { key: "invoices",     label: "Invoices",     Icon: Receipt         },
  { key: "ai-use-cases", label: "AI Use Cases", Icon: Sparkles        },
  { key: "imt-risk",     label: "IMT Risk",     Icon: ShieldAlert     },
  { key: "eproc-risk",  label: "eProc Risk",   Icon: Network         },
  { key: "sales-nba",            label: "Sales NBA",         Icon: Zap    },
  { key: "project-orchestrator", label: "Project Orchestrator", Icon: Layers },
  { key: "dc-control-tower",     label: "DC Control Tower",     Icon: Server },
];

export function LeftNav() {
  const { activeSection, navCollapsed, setActiveSection, toggleNav } = useOpsStore();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-slate-900 transition-all duration-200",
        navCollapsed ? "w-14" : "w-56"
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center justify-between border-b border-slate-700 px-3">
        {!navCollapsed && (
          <span className="text-sm font-bold text-white tracking-wide">WASS Ops Lab</span>
        )}
        <button
          onClick={toggleNav}
          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors ml-auto"
          aria-label={navCollapsed ? "Expand nav" : "Collapse nav"}
        >
          {navCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto py-2 px-1.5">
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const active = activeSection === key;
          return (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              title={navCollapsed ? label : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                active
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!navCollapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 px-3 py-3">
        {!navCollapsed && (
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">v0.1.0</p>
        )}
      </div>
    </aside>
  );
}
