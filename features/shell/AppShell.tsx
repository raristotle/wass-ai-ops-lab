"use client";

import { LeftNav } from "./LeftNav";
import { ShellFilters } from "./ShellFilters";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <LeftNav />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <ShellFilters />
        <main className="flex-1 overflow-y-auto p-4 space-y-4">{children}</main>
      </div>
    </div>
  );
}
