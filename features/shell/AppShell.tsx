"use client";

import { LeftNav } from "./LeftNav";
import { ShellFilters } from "./ShellFilters";
import { PrototypeBanner } from "@/features/governance/PrototypeBanner";
import { AuditLogDrawer } from "@/features/governance/AuditLogDrawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <PrototypeBanner />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftNav />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <ShellFilters />
          <main className="flex-1 overflow-y-auto p-4 space-y-4">{children}</main>
        </div>
      </div>
      <AuditLogDrawer />
    </div>
  );
}
