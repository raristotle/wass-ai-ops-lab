"use client";

import { useProductFinder, DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/product-finder-store";

/**
 * Header demo-role switcher. One-click persona change: selecting an account
 * logs in as that demo user (shared demo password) — the header name/branch
 * and all role-gated UI update immediately via the store.
 */
export function RoleSwitcher() {
  const user = useProductFinder((s) => s.user);
  const login = useProductFinder((s) => s.login);

  return (
    <div className="hidden flex-col gap-0.5 sm:flex">
      <span className="flex items-center gap-1.5">
        <label
          htmlFor="role-switcher"
          className="text-[9px] font-semibold uppercase tracking-widest text-[#B7C9D3]"
        >
          Demo role:
        </label>
        <span className="rounded-full border border-[#EAAA00]/60 px-1.5 text-[8px] font-bold uppercase tracking-wide text-[#EAAA00]">
          demo
        </span>
      </span>
      <select
        id="role-switcher"
        value={user?.email ?? ""}
        onChange={(e) => {
          const email = e.target.value;
          if (!email || email === user?.email) return;
          login(email, DEMO_PASSWORD);
        }}
        className="rounded border border-[#4F758B] bg-[#1D252D] px-2 py-0.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
      >
        {user === null && <option value="">— Signed out —</option>}
        {DEMO_ACCOUNTS.map((account) => (
          <option key={account.email} value={account.email}>
            {account.name} — {account.role}
          </option>
        ))}
      </select>
    </div>
  );
}
