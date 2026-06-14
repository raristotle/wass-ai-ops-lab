/**
 * White-label brand config.
 *
 * The app's brand identity (name + logo lockup + accent) is a swappable profile,
 * not hardcoded — so the same product re-skins to any distributor. "meridian" is
 * the code default; "wesco" is a demo profile for pitching to a Wesco audience.
 * A live in-app switcher (BrandSwitcher) flips it on stage; the choice persists
 * in localStorage. Real logo art and an exact palette drop into a profile
 * without touching components.
 *
 * Pure data — no React, no DOM — so it is unit-testable and usable server-side.
 */

export interface BrandProfile {
  id: string;
  /** Full company name shown in app chrome. */
  name: string;
  /** Primary logo lockup word, e.g. "MERIDIAN". */
  logoMark: string;
  /** Secondary lockup line, e.g. "Supply Co.". */
  logoSub: string;
  /** Hex accent for the logo lockup (the rest of the palette is config-extensible). */
  accent: string;
}

export const BRANDS: Record<string, BrandProfile> = {
  meridian: {
    id: "meridian",
    name: "Meridian Supply Co.",
    logoMark: "MERIDIAN",
    logoSub: "Supply Co.",
    accent: "#00AA13",
  },
  wesco: {
    id: "wesco",
    name: "Wesco",
    logoMark: "WESCO",
    logoSub: "Distribution",
    // Demo placeholder — the real Wesco logo art + exact brand color slot in here.
    accent: "#004986",
  },
};

export const DEFAULT_BRAND_ID = "meridian";

export const BRAND_IDS = Object.keys(BRANDS);

/** Resolve a brand id to its profile, falling back to the default. */
export function getBrand(id: string | null | undefined): BrandProfile {
  return (id && BRANDS[id]) || BRANDS[DEFAULT_BRAND_ID];
}

/** Whether an id names a known brand profile. */
export function isBrandId(id: string | null | undefined): id is string {
  return typeof id === "string" && id in BRANDS;
}
