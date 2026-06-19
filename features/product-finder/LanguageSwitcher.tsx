"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import { LOCALES, LOCALE_LABEL, isLocale, t } from "@/lib/product-finder-i18n";

/**
 * Header language toggle (v4-S4 #16). Flips the rep-facing UI between English and
 * Español. The choice persists; English is the default so nothing changes until a
 * user opts in. Mirrors the BrandSwitcher pattern.
 */
export function LanguageSwitcher() {
  const locale = useProductFinder((s) => s.locale);
  const setLocale = useProductFinder((s) => s.setLocale);

  return (
    <div className="hidden flex-col gap-0.5 sm:flex">
      <label htmlFor="language-switcher" className="text-[9px] font-semibold uppercase tracking-widest text-[#B7C9D3]">
        {t("lang.label", locale)}:
      </label>
      <select
        id="language-switcher"
        value={locale}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value);
        }}
        className="rounded border border-[#4F758B] bg-[#1D252D] px-2 py-0.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
        aria-label={t("lang.label", locale)}
      >
        {LOCALES.map((id) => (
          <option key={id} value={id}>
            {LOCALE_LABEL[id]}
          </option>
        ))}
      </select>
    </div>
  );
}
