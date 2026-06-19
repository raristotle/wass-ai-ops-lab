import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { LanguageSwitcher } from "@/features/product-finder/LanguageSwitcher";
import { useProductFinder } from "@/lib/product-finder-store";
import { DEFAULT_LOCALE } from "@/lib/product-finder-i18n";

/**
 * Render-net coverage for the header LanguageSwitcher (v4-S4 #16). Seeds the real
 * Zustand store via setState, exercises both locale branches (English default vs
 * a seeded Español), and drives the onChange handler — including the invalid-value
 * guard (`isLocale`) that the select can never produce but the handler still checks.
 */
describe("LanguageSwitcher (component)", () => {
  beforeEach(() => useProductFinder.setState({ locale: "en" }));
  afterEach(() => useProductFinder.setState({ locale: DEFAULT_LOCALE }));

  it("renders the labelled select with both locale options (English default)", () => {
    render(<LanguageSwitcher />);
    // English label from i18n; the trailing colon is rendered in the <label>.
    expect(screen.getByText("Language:")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "Language" }) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe("en");
    // Both locales offered, labelled by their native names.
    const options = within(select).getAllByRole("option") as HTMLOptionElement[];
    expect(options.map((o) => o.value)).toEqual(["en", "es"]);
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Español" })).toBeInTheDocument();
  });

  it("reflects a seeded Spanish locale (label + value translated)", () => {
    useProductFinder.setState({ locale: "es" });
    render(<LanguageSwitcher />);
    // "lang.label" translates to "Idioma" in Spanish.
    expect(screen.getByText("Idioma:")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "Idioma" }) as HTMLSelectElement;
    expect(select.value).toBe("es");
  });

  it("calls setLocale and updates the store when a valid locale is chosen", () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole("combobox", { name: "Language" });
    fireEvent.change(select, { target: { value: "es" } });
    expect(useProductFinder.getState().locale).toBe("es");
    // The store persists the choice; localStorage exists under jsdom.
    expect(localStorage.getItem("pf_locale")).toBe("es");
    // Switching back to English flows through the same handler.
    fireEvent.change(select, { target: { value: "en" } });
    expect(useProductFinder.getState().locale).toBe("en");
  });

  it("ignores a non-locale value (isLocale guard) and leaves the store unchanged", () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole("combobox", { name: "Language" });
    // Simulate an out-of-band change event whose value is not a known locale.
    fireEvent.change(select, { target: { value: "fr" } });
    // Handler's isLocale() check is false, so setLocale is never called.
    expect(useProductFinder.getState().locale).toBe("en");
  });
});
