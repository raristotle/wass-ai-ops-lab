import type { VerifiedCrossEntry } from "@/lib/catalog/verified-crosses";

/**
 * Real Crouse-Hinds ↔ Appleton interchange crosses from a rep-supplied Wesco
 * "MFG COMPARISON" cost sheet (Prime Controls BOM), parsed 2026-06-24.
 *
 * 21 of 23 were INDEPENDENTLY CONFIRMED against the Appleton Group
 * Competitor Cross Reference tool (edt.youritdept.com, Emerson's own authoritative tool,
 * driven in-browser 2026-06-24, filtering results to Comp. Brand = Crouse-Hinds) — those carry
 * sourceKind "manufacturer-cross". The 2 unconfirmed (GRC strut straps 496-4 / 496-5, which the
 * tool returned no Crouse-Hinds cross for) stay "distributor-cross", rep-asserted only.
 * Each pair maps both manufacturer parts to their Wesco SKU (in statedAttributes).
 * Hand-curated from citable sources — NOT generated, NOT scraped/cached from a ToS-restricted page.
 */
export const BOM_CROSS_ENTRIES: VerifiedCrossEntry[] = [
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "461",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "5075S",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "3/4’ emt Set Screw couplings. Wesco SKUs: Crouse-Hinds 78456410461 / Appleton 68785585106. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 461 → Appleton 5075S. Also validated on wesco.com + distributor specs (both 3/4 in EMT set-screw steel).",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456410461",
    "Appleton Wesco SKU": "68785585106"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "451",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "4075S",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "3/4” emt Set Screw connectors. Wesco SKUs: Crouse-Hinds 78456410451 / Appleton 68785584606. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 451 → Appleton 4075S.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456410451",
    "Appleton Wesco SKU": "68785584606"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "201",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "1902",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "3/4” emt 1 hole straps. Wesco SKUs: Crouse-Hinds 78456410201 / Appleton 68785521902. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 201 → Appleton 1902.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456410201",
    "Appleton Wesco SKU": "68785521902"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "661RT",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "6075GSR",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "3/4’ emt compression couplings, rain tight. Wesco SKUs: Crouse-Hinds 78456400447 / Appleton 68785587658. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 661RT → Appleton 6075GSR.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456400447",
    "Appleton Wesco SKU": "68785587658"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "651RT",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "7075GSR",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "3/4” emt compression connectors, rain tight. Wesco SKUs: Crouse-Hinds 78456400437 / Appleton 68785587666. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 651RT → Appleton 7075GSR.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456400437",
    "Appleton Wesco SKU": "68785587666"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "LT75",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "ST75",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "3/4” liquid tite metallic straight connectors. Wesco SKUs: Crouse-Hinds 78456430075 / Appleton 78138167925. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds LT75 → Appleton ST75.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456430075",
    "Appleton Wesco SKU": "78138167925"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "LT7545",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "ST4575",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "3/4’ liquid tite  metallic connectors, 45 degrees. Wesco SKUs: Crouse-Hinds 78456445075 / Appleton 78138168000. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds LT7545 → Appleton ST4575.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456445075",
    "Appleton Wesco SKU": "78138168000"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "LT7590",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "ST9075",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "3/4” liquid tite metallic connectors 90 degree connectors. Wesco SKUs: Crouse-Hinds 78456490075 / Appleton 78138168015. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds LT7590 → Appleton ST9075.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456490075",
    "Appleton Wesco SKU": "78138168015"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "496-4",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "CF-750",
   "relation": "equivalent",
   "sourceKind": "distributor-cross",
   "sourceUrl": "rep-supplied: Prime Controls cost sheet — MFG COMPARISON worksheet",
   "notes": "3/4” GRC  galvanized strut straps. Wesco SKUs: Crouse-Hinds 78456414964 / Appleton 78138118900. Appleton's competitor cross tool returned no Crouse-Hinds cross for 496-4 as of 2026-06-24; rep-asserted (MFG COMPARISON) only.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456414964",
    "Appleton Wesco SKU": "78138118900"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "462",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "5100S",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "1’ emt Set Screw couplings. Wesco SKUs: Crouse-Hinds 78456410462 / Appleton 68785585111. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 462 → Appleton 5100S.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456410462",
    "Appleton Wesco SKU": "68785585111"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "452",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "4100S",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "1’ emt Set Screw connectors. Wesco SKUs: Crouse-Hinds 78456410452 / Appleton 68785584611. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 452 → Appleton 4100S.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456410452",
    "Appleton Wesco SKU": "68785584611"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "202",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "TWCL-100",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "1” emt 1 hole straps. Wesco SKUs: Crouse-Hinds 78456410202 / Appleton 78138169225. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 202 → Appleton TWCL-100.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456410202",
    "Appleton Wesco SKU": "78138169225"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "662RT",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "6100GSR",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "1 “emt compression couplings, rain tight. Wesco SKUs: Crouse-Hinds 78456400448 / Appleton 68785587659. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 662RT → Appleton 6100GSR.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456400448",
    "Appleton Wesco SKU": "68785587659"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "652RT",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "7100GSR",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "1 “emt compression connectors, rain tight. Wesco SKUs: Crouse-Hinds 78456400438 / Appleton 68785587665. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 652RT → Appleton 7100GSR.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456400438",
    "Appleton Wesco SKU": "68785587665"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "LT100",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "ST100",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "1” liquid tite metallic straight connectors. Wesco SKUs: Crouse-Hinds 78456430100 / Appleton 78138167940. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds LT100 → Appleton ST100.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456430100",
    "Appleton Wesco SKU": "78138167940"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "LT10045",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "ST45100",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "1” liquid tite  metallic connectors, 45 degrees. Wesco SKUs: Crouse-Hinds 78456445100 / Appleton 78138168020. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds LT10045 → Appleton ST45100.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456445100",
    "Appleton Wesco SKU": "78138168020"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "LT10090",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "ST90100",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "1” liquid tite metallic connectors 90 degree connectors. Wesco SKUs: Crouse-Hinds 78456490100 / Appleton 78138168055. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds LT10090 → Appleton ST90100.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456490100",
    "Appleton Wesco SKU": "78138168055"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "496-5",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "CF-100",
   "relation": "equivalent",
   "sourceKind": "distributor-cross",
   "sourceUrl": "rep-supplied: Prime Controls cost sheet — MFG COMPARISON worksheet",
   "notes": "1” GRC  galvanized strut straps. Wesco SKUs: Crouse-Hinds 78456414965 / Appleton 78138118865. Appleton's competitor cross tool returned no Crouse-Hinds cross for 496-5 as of 2026-06-24; rep-asserted (MFG COMPARISON) only.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456414965",
    "Appleton Wesco SKU": "78138118865"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "465",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "5200S",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "2” EMT Set Screw couplings. Wesco SKUs: Crouse-Hinds 78456410465 / Appleton 68785585126. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 465 → Appleton 5200S.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456410465",
    "Appleton Wesco SKU": "68785585126"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "455",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "4200S",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "2” EMT Set Screw connectors. Wesco SKUs: Crouse-Hinds 78456410455 / Appleton 68785584626. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds 455 → Appleton 4200S.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78456410455",
    "Appleton Wesco SKU": "68785584626"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "TP560",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "4SJD-1",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "4-11/16” deep boxes w/ 2x1” KOs on each side. Wesco SKUs: Crouse-Hinds 78618910560 / Appleton 68785575170. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds TP560 → Appleton 4SJD-1.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78618910560",
    "Appleton Wesco SKU": "68785575170"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "TP554",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "4SJD-3/4",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "4-11/16’ deep boxes with 3/4” KOs. Wesco SKUs: Crouse-Hinds 78618910554 / Appleton 68785575185. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds TP554 → Appleton 4SJD-3/4.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78618910554",
    "Appleton Wesco SKU": "68785575185"
   }
  },
  {
   "aBrand": "Eaton (Crouse-Hinds)",
   "aMpn": "TP568",
   "bBrand": "Appleton (Emerson)",
   "bMpn": "8487",
   "relation": "equivalent",
   "sourceKind": "manufacturer-cross",
   "sourceUrl": "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
   "notes": "4-11/16” blank KO covers. Wesco SKUs: Crouse-Hinds 78618910568 / Appleton 68785577760. Confirmed by the Appleton Group Competitor Cross Reference tool (2026-06-24): Crouse-Hinds TP568 → Appleton 8487.",
   "verifiedAt": "2026-06-24",
   "statedAttributes": {
    "Category": "Fitting",
    "Crouse-Hinds Wesco SKU": "78618910568",
    "Appleton Wesco SKU": "68785577760"
   }
  }
 ];
