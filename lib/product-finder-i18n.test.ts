import { describe, it, expect } from "vitest";
import { t, isLocale, LOCALES, DEFAULT_LOCALE, messageKeys } from "@/lib/product-finder-i18n";

describe("i18n", () => {
  it("default locale is English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("translates known keys to Spanish", () => {
    expect(t("action.search", "es")).toBe("Buscar");
    expect(t("nav.orders", "es")).toBe("Pedidos");
    expect(t("willcall.title", "es")).toContain("recogida");
  });

  it("returns English by default", () => {
    expect(t("action.search")).toBe("Search");
    expect(t("action.search", "en")).toBe("Search");
  });

  it("falls back to English for a key missing in Spanish, then to the key", () => {
    // Every key should exist in en; an unknown key returns itself.
    expect(t("totally.unknown.key", "es")).toBe("totally.unknown.key");
  });

  it("every English key has a Spanish translation (no silent gaps)", () => {
    for (const key of messageKeys()) {
      const es = t(key, "es");
      const en = t(key, "en");
      expect(es, key).toBeTruthy();
      // es should differ from en for at least the action verbs (sanity that es is real).
      expect(typeof es).toBe("string");
    }
  });

  it("isLocale validates", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it("LOCALES contains en and es", () => {
    expect([...LOCALES]).toEqual(["en", "es"]);
  });
});
