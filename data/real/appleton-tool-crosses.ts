import type { VerifiedCrossEntry } from "@/lib/catalog/verified-crosses";

/**
 * Cross-references for REAL catalog products (data/real/real-products.ts) obtained from the
 * Appleton Group Competitor Cross Reference tool — Emerson's own authoritative competitor→Appleton
 * cross tool (edt.youritdept.com/crossref) — driven in-browser on 2026-06-24, filtering each
 * result to the matching Comp. Brand.
 *
 * These cover the conduit-fitting / outlet-box subset of the uncrossed real products (RACO and
 * Bridgeport), the only uncrossed brands the Appleton tool actually cross-references. Wiring
 * devices, breakers, datacom and AV products in the catalog have no equivalent authoritative
 * single-source cross tool, so they are intentionally not represented here (documented in
 * docs/cross-coverage-audit.md).
 *
 * Hand-curated from a citable manufacturer tool — NOT generated, NOT scraped/cached from a
 * ToS-restricted page (the public tool was queried live and only the factual cross verdicts
 * recorded). Appleton item descriptions are quoted from the tool result row.
 */
export const APPLETON_TOOL_CROSS_ENTRIES: VerifiedCrossEntry[] = [
  {
    aBrand: "RACO",
    aMpn: "125",
    bBrand: "Appleton (Emerson)",
    bMpn: "4012",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "4 in octagon box. Appleton Group Competitor Cross Reference tool (2026-06-24): RACO 125 → Appleton 4012 \"4 IN OCT BOX 1-1/2 IN DEEP\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Boxes & Covers", "Appleton item": "4012 — 4 IN OCT BOX 1-1/2 IN DEEP" },
  },
  {
    aBrand: "RACO",
    aMpn: "232",
    bBrand: "Appleton (Emerson)",
    bMpn: "4SDEK",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "4 in square outlet box. Appleton Group Competitor Cross Reference tool (2026-06-24): RACO 232 → Appleton 4SDEK \"4 IN SQ OUTL BOX 2-1/8 DEEP\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Boxes & Covers", "Appleton item": "4SDEK — 4 IN SQ OUTL BOX 2-1/8 DEEP" },
  },
  {
    aBrand: "RACO",
    aMpn: "660",
    bBrand: "Appleton (Emerson)",
    bMpn: "4CS12",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "Handy box. Appleton Group Competitor Cross Reference tool (2026-06-24): RACO 660 → Appleton 4CS12 \"4 X 2-1/8 HANDY BOX\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Boxes & Covers", "Appleton item": "4CS12 — 4 X 2-1/8 HANDY BOX" },
  },
  {
    aBrand: "RACO",
    aMpn: "752",
    bBrand: "Appleton (Emerson)",
    bMpn: "8465",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "4 in square flat blank cover. Appleton Group Competitor Cross Reference tool (2026-06-24): RACO 752 → Appleton 8465 \"4 IN SQ CVR BLANK\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Boxes & Covers", "Appleton item": "8465 — 4 IN SQ CVR BLANK" },
  },
  {
    aBrand: "RACO",
    aMpn: "774",
    bBrand: "Appleton (Emerson)",
    bMpn: "846100",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "4 in square 1-device cover. Appleton Group Competitor Cross Reference tool (2026-06-24): RACO 774 → Appleton 846100 \"4 IN SQ CVR 1 IN RSD SGL DVC\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Boxes & Covers", "Appleton item": "846100 — 4 IN SQ CVR 1 IN RSD SGL DVC" },
  },
  {
    aBrand: "RACO",
    aMpn: "2602",
    bBrand: "Appleton (Emerson)",
    bMpn: "TC501",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "1/2 in EMT set-screw connector. Appleton Group Competitor Cross Reference tool (2026-06-24): RACO 2602 → Appleton TC501 \"1/2 IN EMT SSCR CONN ZNC D/C\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Conduit Fittings", "Appleton item": "TC501 — 1/2 IN EMT SSCR CONN" },
  },
  {
    aBrand: "RACO",
    aMpn: "2622",
    bBrand: "Appleton (Emerson)",
    bMpn: "TC511",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "1/2 in EMT set-screw coupling. Appleton Group Competitor Cross Reference tool (2026-06-24): RACO 2622 → Appleton TC511 \"1/2 IN EMT SSCR CPLG ZNC D/C\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Conduit Fittings", "Appleton item": "TC511 — 1/2 IN EMT SSCR CPLG" },
  },
  {
    aBrand: "RACO",
    aMpn: "2902",
    bBrand: "Appleton (Emerson)",
    bMpn: "7050S",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "1/2 in EMT compression connector. Appleton Group Competitor Cross Reference tool (2026-06-24): RACO 2902 → Appleton 7050S \"1/2 IN EMT COMP CONN\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Conduit Fittings", "Appleton item": "7050S — 1/2 IN EMT COMP CONN" },
  },
  {
    aBrand: "Bridgeport",
    aMpn: "250-DC2",
    bBrand: "Appleton (Emerson)",
    bMpn: "TC601",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "1/2 in EMT compression connector. Appleton Group Competitor Cross Reference tool (2026-06-24): Bridgeport 250-DC2 → Appleton TC601 \"1/2 IN EMT COMP CONN ZNC D/C\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Conduit Fittings", "Appleton item": "TC601 — 1/2 IN EMT COMP CONN" },
  },
  {
    aBrand: "Bridgeport",
    aMpn: "251-DC2",
    bBrand: "Appleton (Emerson)",
    bMpn: "TC602",
    relation: "equivalent",
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    notes:
      "3/4 in EMT compression connector. Appleton Group Competitor Cross Reference tool (2026-06-24): Bridgeport 251-DC2 → Appleton TC602 \"3/4 IN EMT COMP CONN ZNC D/C\".",
    verifiedAt: "2026-06-24",
    statedAttributes: { Category: "Conduit Fittings", "Appleton item": "TC602 — 3/4 IN EMT COMP CONN" },
  },
];
