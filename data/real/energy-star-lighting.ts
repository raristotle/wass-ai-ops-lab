import type { ExternalProductEntry } from "@/lib/catalog/external-products";

/**
 * Real, EPA-certified ENERGY STAR lighting products (US-government PUBLIC DOMAIN,
 * 17 U.S.C. 105) pulled from the ENERGY STAR certified-light-bulbs dataset
 * (data.energystar.gov, Socrata, keyless), 2026-06-24. Brand + model number +
 * rich photometric specs are factual public-domain data; no list price or per-unit
 * datasheet exists in the source, so these carry the "indexed" external tier and a
 * shared source citation rather than a per-record spec sheet. Generated, not hand-edited.
 */
export const ENERGY_STAR_SOURCE_URL = "https://www.energystar.gov/productfinder/product/certified-light-bulbs/";
export const ENERGY_STAR_SOURCE_NAME = "ENERGY STAR certified light bulbs (EPA, public domain)";

export const ENERGY_STAR_LIGHTING: ExternalProductEntry[] = [
  {
   "mpn": "L8W-BR30-CCT-RGB-WiFi G2",
   "brand": "Simply Conserve",
   "name": "Simply Conserve Directional LED lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "81.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "L9W-A19-CCT-RGB-WiFi G2",
   "brand": "Simply Conserve",
   "name": "Simply Conserve Omnidirectional LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "L9W-A19-CCT-RGBWiFi",
   "brand": "Simply Conserve",
   "name": "Simply Conserve LED A19",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "L8W-BR30-CCT-RGBWiFi",
   "brand": "Simply Conserve",
   "name": "Simply Conserve LED BR30",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "81.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "1522533",
   "brand": "Noma",
   "name": "Noma LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 5.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "72.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "152-2594-2",
   "brand": "Noma",
   "name": "Noma LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 350 lm, 4.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "350 lm"
    },
    {
     "name": "Wattage",
     "value": "4.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "77.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "1522595",
   "brand": "Noma",
   "name": "Noma LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 500 lm, 6.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "76.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR20"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CL-SMRT-A19-10W-2757(WIFI,T20)",
   "brand": "CLEANLIFE",
   "name": "CLEANLIFE A19 LED Bulb",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "DW-SMRT-LMP-A19-001",
   "brand": "DELOS",
   "name": "DELOS A19 LED Bulb",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "PLYS510TW",
   "brand": "Luminus",
   "name": "Luminus Directional LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 11.5 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "11.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "69.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "PLYS120TW",
   "brand": "Luminus",
   "name": "Luminus Omnidirectional LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "82"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "PLYSH120RGB",
   "brand": "Luminus",
   "name": "Luminus Omnidirectional LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "83"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "HHA19089BLE40A",
   "brand": "Halo",
   "name": "Halo LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 806 lm, 9.4 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "806 lm"
    },
    {
     "name": "Wattage",
     "value": "9.4 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "85.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "HHA19089BLE40A-2PK",
   "brand": "Halo",
   "name": "Halo LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 806 lm, 9.4 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "806 lm"
    },
    {
     "name": "Wattage",
     "value": "9.4 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "85.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CMA19-60W-AL-827",
   "brand": "Connected Max",
   "name": "Connected Max CM A19 827",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "82"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CMA19-60W-AL-9ACK",
   "brand": "Connected Max",
   "name": "Connected Max CM A19 9ACK",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CMA19-60W-AL-9TW-GL",
   "brand": "Connected Max",
   "name": "Connected Max CM A19 9TW",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 7.5 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "7.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "106.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CMA21-100W-AL-9ACK",
   "brand": "Connected Max",
   "name": "Connected Max CM A21 9ACK",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 15 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "15 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "106.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CMB11-40W-AL-9TW-GL",
   "brand": "Connected Max",
   "name": "Connected Max CM B11 9TW",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 350 lm, 4 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "350 lm"
    },
    {
     "name": "Wattage",
     "value": "4 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "87.5 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B10"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CMBR30-65W-AL-9ACK",
   "brand": "Connected Max",
   "name": "Connected Max CM BR30 9ACK",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "81.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CMG25-40W-AL-9TW-GL",
   "brand": "Connected Max",
   "name": "Connected Max CM G25 9TW",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 350 lm, 4 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "350 lm"
    },
    {
     "name": "Wattage",
     "value": "4 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "87.5 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CMPAR38-120W-AL-9ACK",
   "brand": "Connected Max",
   "name": "Connected Max CM PAR38 9ACK",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1200 lm, 14 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1200 lm"
    },
    {
     "name": "Wattage",
     "value": "14 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "120 W"
    },
    {
     "name": "Efficacy",
     "value": "85.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CMST19-60W-AL-9TW-GL",
   "brand": "Connected Max",
   "name": "Connected Max CM ST19 9TW",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E26 (Medium) base, 800 lm, 7.5 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "7.5 W"
    },
    {
     "name": "Efficacy",
     "value": "106.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "ST"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "PLYS320TW",
   "brand": "Luminus",
   "name": "Luminus LED BR Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 500 lm, 6.5 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "76.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR20"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LBR38RGBW",
   "brand": "EarthBulb",
   "name": "EarthBulb Directional LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "81.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LA199RGBW",
   "brand": "EarthBulb",
   "name": "EarthBulb Omnidirectional LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LA199RGBWES",
   "brand": "EarthBulb",
   "name": "EarthBulb Omnidirectional LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "87"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LIS-A2001cec",
   "brand": "Euri lighting",
   "name": "Euri lighting LED A Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 810 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "810 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34200A",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34204",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34204A",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34208*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34212*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34213*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34358",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 500 lm, 6.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "76.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR20"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34358*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 500 lm, 6.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "76.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR20"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34869",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 500 lm, 6.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "76.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR20"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34871*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 500 lm, 5.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "82"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34918",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 350 lm, 4.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "350 lm"
    },
    {
     "name": "Wattage",
     "value": "4.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "77.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34918*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 350 lm, 4.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "350 lm"
    },
    {
     "name": "Wattage",
     "value": "4.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "77.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34919*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 500 lm, 5.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "ST19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34920*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 500 lm, 5.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34921*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34924",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 5.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "72.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34924*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 5.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "72.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34925",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 5.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "72.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34925*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 5.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "72.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "34982",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1100 lm, 12 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1100 lm"
    },
    {
     "name": "Wattage",
     "value": "12 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "91.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "35804",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "36819",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "37783",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "50035*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 715 lm, 8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "715 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "89.4 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "50043*",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 750 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "750 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "90 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "8092875",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "8092875A",
   "brand": "Globe",
   "name": "Globe LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "16000311",
   "brand": "Globe",
   "name": "Globe Smart Bulb",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 395 lm, 5.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "395 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "71.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "16000312",
   "brand": "Globe",
   "name": "Globe 16000312",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 15 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "15 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "106.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "83"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "35798",
   "brand": "Globe",
   "name": "Globe 35798",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "82"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "50589",
   "brand": "Globe",
   "name": "Globe 50589",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "50594",
   "brand": "Globe",
   "name": "Globe 50594",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 715 lm, 8.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "715 lm"
    },
    {
     "name": "Wattage",
     "value": "8.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "84.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/927CA/AG",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 60 Wi-Fi",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/950CA/AG",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 60 Wi-Fi",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/927CA/AG/3",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 60 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/927CA/AG(P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 60 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/950CA/AG/3",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 60 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/950CA/AG(P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 60 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "A1960CL/927CA/FIL/AG",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A1960 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM100/RGBW/CA/AG (P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 RGBW",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 17.7 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "17.7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "90.4 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BPA800/RGBW/2",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 RGBW WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BPA800/RGBW/AG/2",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 RGBW WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BPA800/RGBW/AG/2 (P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 RGBW WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 RGBW WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG/3",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 RGBW WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG (P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 RGBW WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "A800/RGBW/2",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WiFi",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "A800/RGBW/4",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WiFi",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "A1960CL/927CA/FIL/AG (S)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "DOM60/RGBW/AG/2",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/927CA/AG/3 (P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/927CA/AG (P1)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/950CA/AG/3 (P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/950CA/AG (P1)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG/3 (P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG/3 (P1)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG (P1)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG (P2)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED A19 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/RGBW/CA/AG/2",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/RGBW/CA/AG/3",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/RGBW/CA/AG (S)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/927CA/AG",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 65 Wi-Fi",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "81.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/950CA/AG",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 65 Wi-Fi",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "81.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/RGBW/CA/AG",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 65 Wi-Fi",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "81.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/RGBW/AG/2",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 WiFi",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/927CA/AG (P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/950CA/AG (P)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "BR30/RGBW/CA/AG (P1)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED BR30 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM100/RGBW/CA/AG (C)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC OMNI 100 RGBW WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 17.7 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "17.7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "90.4 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/CCT/CA/AG/2",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC Omnidirectional LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CFC40/927CA/FIL/AG (S)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED CFC40 WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 300 lm, 3.3 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "300 lm"
    },
    {
     "name": "Wattage",
     "value": "3.3 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "PAR38/RGBW/CA/AG",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC PAR38 WIFI RGBW",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1000 lm, 11.1 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1000 lm"
    },
    {
     "name": "Wattage",
     "value": "11.1 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "90 W"
    },
    {
     "name": "Efficacy",
     "value": "90.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG/3 (S)",
   "brand": "Feit Electroc",
   "name": "Feit Electroc LED OM60 RGBW WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG (S)",
   "brand": "Feit Electroc",
   "name": "Feit Electroc LED OM60 RGBW WIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG/3 (N)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED OM60 RGBW",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "OM60/RGBW/CA/AG (N)",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC LED OM60 RGBW",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93128981",
   "brand": "GE",
   "name": "GE CLEDA199CD1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93129484",
   "brand": "GE",
   "name": "GE CLEDA199CD1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93128962",
   "brand": "GE",
   "name": "GE CLEDA199LD1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93129480",
   "brand": "GE",
   "name": "GE CLEDA199LD1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130121",
   "brand": "GE",
   "name": "GE CLEDA199LDRV",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93128973",
   "brand": "GE",
   "name": "GE CLEDA199SD1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130188",
   "brand": "GE",
   "name": "GE CLEDBC6LDGF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130189",
   "brand": "GE",
   "name": "GE CLEDBC6LDGF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130193",
   "brand": "GE",
   "name": "GE CLEDBM6LDGF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130194",
   "brand": "GE",
   "name": "GE CLEDBM6LDGF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130186",
   "brand": "GE",
   "name": "GE CLEDG256LDGF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130187",
   "brand": "GE",
   "name": "GE CLEDG256LDGF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93129692",
   "brand": "GE",
   "name": "GE CLEDP3815CD1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1300 lm, 15 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1300 lm"
    },
    {
     "name": "Wattage",
     "value": "15 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "90 W"
    },
    {
     "name": "Efficacy",
     "value": "86.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93128985",
   "brand": "GE",
   "name": "GE CLEDR309CD1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 750 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "750 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "78.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93129487",
   "brand": "GE",
   "name": "GE CLEDR309CD1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 750 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "750 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "78.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93128977",
   "brand": "GE",
   "name": "GE CLEDR309SD1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 750 lm, 10 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "750 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "75 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130167",
   "brand": "GE",
   "name": "GE CLEDST196CDGS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 500 lm, 6.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "ST19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130182",
   "brand": "GE",
   "name": "GE CLEDST196CDGS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 500 lm, 6.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "ST19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130184",
   "brand": "GE",
   "name": "GE CLEDST196LDGF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "ST19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130185",
   "brand": "GE",
   "name": "GE CLEDST196LDGF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "ST19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93104413",
   "brand": "GE Lighting",
   "name": "GE Lighting CLEDA1911C2",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93096312",
   "brand": "GE Lighting",
   "name": "GE Lighting CLEDA199L2",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93119937",
   "brand": "GE Lighting",
   "name": "GE Lighting CLEDA199L2",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130169",
   "brand": "GE Lighting",
   "name": "GE Lighting CLEDG256CDGS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 500 lm, 6.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "93130183",
   "brand": "GE Lighting",
   "name": "GE Lighting CLEDG256CDGS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 500 lm, 6.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "CFC40/927CA/FIL/AG",
   "brand": "FEIT ELECTRIC",
   "name": "FEIT ELECTRIC CFC40 WIFI 2700K",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 300 lm, 3.3 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "300 lm"
    },
    {
     "name": "Wattage",
     "value": "3.3 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "BA10"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75663",
   "brand": "Sylvania",
   "name": "Sylvania LED9A19CIECWIFIS+",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LC-A19-RGBTW",
   "brand": "Liteline",
   "name": "Liteline A19",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LC-B12-RGBTW",
   "brand": "Liteline",
   "name": "Liteline B12",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "SLWZ-A19-RGBTW",
   "brand": "Spex Lighting",
   "name": "Spex Lighting A19",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "SLWZ-B12-RGBTW",
   "brand": "Spex Lighting",
   "name": "Spex Lighting B12",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "TLWZ-A19-RGBTW",
   "brand": "Trenz Lighting",
   "name": "Trenz Lighting A19",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "TLWZ-B12-RGBTW",
   "brand": "Trenz Lighting",
   "name": "Trenz Lighting B12",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LA1910WCCTRGBWIFI",
   "brand": "MegaLight",
   "name": "MegaLight LED LAMPS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LA1909WIFI",
   "brand": "Megalight Inc",
   "name": "Megalight Inc LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LBR3008WIFI",
   "brand": "Megalight Inc",
   "name": "Megalight Inc LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "81.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LPAR3809WIFI",
   "brand": "Megalight Inc",
   "name": "Megalight Inc LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 750 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "750 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "NL53E1YY",
   "brand": "Nanoleaf",
   "name": "Nanoleaf Essentials Matter BR30",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 730 lm, 8.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "730 lm"
    },
    {
     "name": "Wattage",
     "value": "8.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "85.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "NL67E1##",
   "brand": "Nanoleaf",
   "name": "Nanoleaf Nanoleaf Essentials Smart A19 Bulb",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 806 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "806 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "89.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "NL45-0800WT120E26",
   "brand": "Nanoleaf",
   "name": "Nanoleaf NL45-0800WT120E26",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 806 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "806 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "89.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9W/OMNI/SMART1",
   "brand": "Greenlite",
   "name": "Greenlite 9W/OMNI/SMART1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "HT-US-G9A1909W950-CW2E-V#",
   "brand": "HENGTE",
   "name": "HENGTE LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "HT-US-T1A199.5W950-RGBCW2E-V#",
   "brand": "HENGTE",
   "name": "HENGTE LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75814",
   "brand": "Sylvania",
   "name": "Sylvania 60A19TWBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75742-1",
   "brand": "Sylvania",
   "name": "Sylvania 60A19WBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75798",
   "brand": "Sylvania",
   "name": "Sylvania 60G25FILWCLWIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 500 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75799",
   "brand": "Sylvania",
   "name": "Sylvania 60ST19FILWCLWIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E26 (Medium) base, 500 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "ST"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75803",
   "brand": "Sylvania",
   "name": "Sylvania 65A19TWWIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75743-1",
   "brand": "Sylvania",
   "name": "Sylvania 65BR30CBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 770 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "770 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "81.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75815",
   "brand": "Sylvania",
   "name": "Sylvania 65BR30TWBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75804",
   "brand": "Sylvania",
   "name": "Sylvania 65BR30TWWIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75744-1",
   "brand": "Sylvania",
   "name": "Sylvania 65BR30WBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 770 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "770 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "85.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "M75651",
   "brand": "Sylvania",
   "name": "Sylvania 75641-1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "83"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "78126",
   "brand": "Sylvania",
   "name": "Sylvania A19CWF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "83"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "78127",
   "brand": "Sylvania",
   "name": "Sylvania A19WWF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "82"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED1835C6",
   "brand": "Ikea",
   "name": "Ikea LED1835C6",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 450 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "90 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "C9"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED1923R5",
   "brand": "Ikea",
   "name": "Ikea LED1923R5",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 380 lm, 4.6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "380 lm"
    },
    {
     "name": "Wattage",
     "value": "4.6 W"
    },
    {
     "name": "Efficacy",
     "value": "82.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "PAR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED1924G9",
   "brand": "Ikea",
   "name": "Ikea LED1924G9",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.9 W"
    },
    {
     "name": "Efficacy",
     "value": "89.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED1925G6",
   "brand": "Ikea",
   "name": "Ikea LED1925G6",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E12 (Candelabra) base, 450 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Efficacy",
     "value": "90 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED1949C5",
   "brand": "Ikea",
   "name": "Ikea LED1949C5",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 450 lm, 4.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "4.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED2002G5",
   "brand": "Ikea",
   "name": "Ikea LED2002G5",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E12 (Candelabra) base, 450 lm, 4.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "4.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED2003G10",
   "brand": "Ikea",
   "name": "Ikea LED2003G10",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1100 lm, 10 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1100 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "110 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED2004G8",
   "brand": "Ikea",
   "name": "Ikea LED2004G8",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED2005R5",
   "brand": "Ikea",
   "name": "Ikea LED2005R5",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 380 lm, 3.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "380 lm"
    },
    {
     "name": "Wattage",
     "value": "3.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "PAR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED2006R9",
   "brand": "Ikea",
   "name": "Ikea LED2006R9",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 896 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "896 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "90 W"
    },
    {
     "name": "Efficacy",
     "value": "99.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED2103G5",
   "brand": "Ikea",
   "name": "Ikea Self-Ballasted LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 5.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "5.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "135.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LED2104R3",
   "brand": "Ikea",
   "name": "Ikea Self-Ballasted LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 380 lm, 3.3 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "380 lm"
    },
    {
     "name": "Wattage",
     "value": "3.3 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "115.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "PAR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "60A19CBLE",
   "brand": "LEDVANCE LLC",
   "name": "LEDVANCE LLC LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "60A19CBLEWO2PK",
   "brand": "LEDVANCE LLC",
   "name": "LEDVANCE LLC LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "60A19WBLE",
   "brand": "LEDVANCE LLC",
   "name": "LEDVANCE LLC LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "94.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "60A19WBLEWO2PK",
   "brand": "LEDVANCE LLC",
   "name": "LEDVANCE LLC LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "94.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "65BR30CBLE",
   "brand": "LEDVANCE LLC",
   "name": "LEDVANCE LLC LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "65BR30CBLEWO2PK",
   "brand": "LEDVANCE LLC",
   "name": "LEDVANCE LLC LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9.5 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "65BR30WBLE",
   "brand": "LEDVANCE LLC",
   "name": "LEDVANCE LLC LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "65BR30WBLEWO2PK",
   "brand": "LEDVANCE LLC",
   "name": "LEDVANCE LLC LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75806",
   "brand": "Sylvania",
   "name": "Sylvania 100A21CWIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75817",
   "brand": "Sylvania",
   "name": "Sylvania 100A21TCBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 15 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "15 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "106.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75816",
   "brand": "Sylvania",
   "name": "Sylvania 100A21TWBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 16.4 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "16.4 W"
    },
    {
     "name": "Efficacy",
     "value": "97.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75805",
   "brand": "Sylvania",
   "name": "Sylvania 100A21TWWIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75819",
   "brand": "Sylvania",
   "name": "Sylvania 50MR16GU10CBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75818",
   "brand": "Sylvania",
   "name": "Sylvania 50MR16GU10TWBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 500 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Efficacy",
     "value": "83.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75741-1",
   "brand": "Sylvania",
   "name": "Sylvania 60A19CBLE",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "75797",
   "brand": "Sylvania",
   "name": "Sylvania 60A19FILWCLWIFI",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 7.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "7.5 W"
    },
    {
     "name": "Efficacy",
     "value": "106.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "AB1026",
   "brand": "Peace By Hampton",
   "name": "Peace By Hampton LED lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 760 lm, 9.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "760 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "AB1012",
   "brand": "Peace By Hampton",
   "name": "Peace By Hampton LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "HT-US-G9BR3008W950-RGBCW2E-V#",
   "brand": "HENGTE",
   "name": "HENGTE LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "55 W"
    },
    {
     "name": "Efficacy",
     "value": "81.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "8W/BR30/SMART1",
   "brand": "Greenlite",
   "name": "Greenlite 8W/BR30/SMART1",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 670 lm, 8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "670 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "83.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022768",
   "brand": "PHILIPS",
   "name": "PHILIPS 13PAR38/MC/930/F25/IA",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1200 lm, 13 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1200 lm"
    },
    {
     "name": "Wattage",
     "value": "13 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "120 W"
    },
    {
     "name": "Efficacy",
     "value": "92.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022771",
   "brand": "PHILIPS",
   "name": "PHILIPS 13PAR38/MC/930/F40/IA",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1200 lm, 13 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1200 lm"
    },
    {
     "name": "Wattage",
     "value": "13 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "120 W"
    },
    {
     "name": "Efficacy",
     "value": "92.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024493",
   "brand": "PHILIPS",
   "name": "PHILIPS 14.5A21/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024493A",
   "brand": "PHILIPS",
   "name": "PHILIPS 14.5A21/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024490",
   "brand": "PHILIPS",
   "name": "PHILIPS 14.5A21/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024490A",
   "brand": "PHILIPS",
   "name": "PHILIPS 14.5A21/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024491",
   "brand": "PHILIPS",
   "name": "PHILIPS 14.5A21/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024491A",
   "brand": "PHILIPS",
   "name": "PHILIPS 14.5A21/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024492A",
   "brand": "PHILIPS",
   "name": "PHILIPS 14.5A21/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022660",
   "brand": "PHILIPS",
   "name": "PHILIPS 3.8G25/WiFi DIM/927/CL",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 350 lm, 3.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "350 lm"
    },
    {
     "name": "Wattage",
     "value": "3.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "92.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022662",
   "brand": "PHILIPS",
   "name": "PHILIPS 3.8ST19/WiFi DIM/927/CL",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 350 lm, 3.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "350 lm"
    },
    {
     "name": "Wattage",
     "value": "3.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "92.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "ST19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024476",
   "brand": "PHILIPS",
   "name": "PHILIPS 3.9B12/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024476A",
   "brand": "PHILIPS",
   "name": "PHILIPS 3.9B12/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290030820",
   "brand": "PHILIPS",
   "name": "PHILIPS 3.9B12/Wi-Fi BLE Color/922-65 E26",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290030820A",
   "brand": "PHILIPS",
   "name": "PHILIPS 3.9B12/Wi-Fi BLE Color/922-65 E26",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E26 (Medium) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024475A",
   "brand": "PHILIPS",
   "name": "PHILIPS 3.9B12/Wi-Fi BLE Tunable/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024475",
   "brand": "PHILIPS",
   "name": "PHILIPS 3.9B12/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024472",
   "brand": "PHILIPS",
   "name": "PHILIPS 4.9GU10/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 4.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "4.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "81.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "PAR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022541",
   "brand": "PHILIPS",
   "name": "PHILIPS 8PAR30L/MC/930/F25/IA",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 850 lm, 8 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "850 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "106.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR30L"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022544",
   "brand": "PHILIPS",
   "name": "PHILIPS 8PAR30L/MC/930/F40/IA",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 850 lm, 8 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "850 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "106.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR30L"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022547",
   "brand": "PHILIPS",
   "name": "PHILIPS 8PAR30S/MC/930/F25/IA",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 850 lm, 8 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "850 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "106.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR30S"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022550",
   "brand": "PHILIPS",
   "name": "PHILIPS 8PAR30S/MC/930/F40/IA",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 850 lm, 8 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "850 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "106.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR30S"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024472A",
   "brand": "PHILIPS",
   "name": "PHILIPS 4.9GU10/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 4.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "4.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "81.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "PAR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024471",
   "brand": "PHILIPS",
   "name": "PHILIPS 4.9GU10/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 4.9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "4.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "81.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "PAR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290030233",
   "brand": "PHILIPS",
   "name": "PHILIPS 9.8PAR30S/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 900 lm, 9.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "900 lm"
    },
    {
     "name": "Wattage",
     "value": "9.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "91.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR30S"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "21A23/Wi-Fi BLE Color/922-65",
   "brand": "PHILIPS",
   "name": "PHILIPS LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 2550 lm, 21 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "2550 lm"
    },
    {
     "name": "Wattage",
     "value": "21 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "150 W"
    },
    {
     "name": "Efficacy",
     "value": "121.4 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A23"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290011369B",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290011369B",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 840 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "840 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.4 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "81"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290011998B",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290011998B",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290011998C",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290011998C",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290012575",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290012575",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "83"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290012575A",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290012575A",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "82"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290012575B",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290012575B",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "89"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022658",
   "brand": "PHILIPS",
   "name": "PHILIPS 5A19/WiFi DIM/927/CL",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 450 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "90 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290012596",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290012596",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 680 lm, 9.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "680 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "71.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "81"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290013012",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290013012",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 9 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "72.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290018189",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290018189",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1300 lm, 14 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1300 lm"
    },
    {
     "name": "Wattage",
     "value": "14 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "92.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290018194",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290018194",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "90"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290018215",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290018215",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "90"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290030188",
   "brand": "PHILIPS",
   "name": "PHILIPS 5R20/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 450 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "45 W"
    },
    {
     "name": "Efficacy",
     "value": "90 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "R20"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022166",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290022166",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "89"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022175",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290022175",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "76.5 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022176",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290022176",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "86.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022266",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290022266",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022267",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290022267",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 7.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "7.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "106.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022268",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290022268",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022268B",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290022268B",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022775",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290022775",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 600 lm, 7 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "600 lm"
    },
    {
     "name": "Wattage",
     "value": "7 W"
    },
    {
     "name": "Efficacy",
     "value": "85.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023351",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290023351",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 17 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "17 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "94.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023834",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2200 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2200 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023834A",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023351A",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290023351A",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 17 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "17 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "94.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023351B",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290023351B",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 17 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "17 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "94.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024691",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290024691",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1100 lm, 10.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1100 lm"
    },
    {
     "name": "Wattage",
     "value": "10.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "104.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024691A",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290024691A",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1100 lm, 10.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1100 lm"
    },
    {
     "name": "Wattage",
     "value": "10.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "104.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024717",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290024717",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 16 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "16 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "87"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024720",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290024720",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 16 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "16 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "87"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290031509",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290031509",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1300 lm, 12 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1300 lm"
    },
    {
     "name": "Wattage",
     "value": "12 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "108.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290034793",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290034793",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1200 lm, 12.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1200 lm"
    },
    {
     "name": "Wattage",
     "value": "12.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "85 W"
    },
    {
     "name": "Efficacy",
     "value": "96 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "89"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290034794",
   "brand": "Philips Hue",
   "name": "Philips Hue 9290034794",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1200 lm, 11.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1200 lm"
    },
    {
     "name": "Wattage",
     "value": "11.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "85 W"
    },
    {
     "name": "Efficacy",
     "value": "104.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022266A",
   "brand": "Philips Hue",
   "name": "Philips Hue LED lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "87"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022267A",
   "brand": "Philips Hue",
   "name": "Philips Hue LED lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 7.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "7.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "106.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "86"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023834B",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023834C",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024500",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024500A",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024500B",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024501",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024501A",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024501B",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023832",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023832A",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023832B",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022657",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/WiFi Color+TunableWhite 4/1FB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022652",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/WiFi DIM/927 4/1FB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022653",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/WiFi DIM/950 4/1FB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022655",
   "brand": "PHILIPS",
   "name": "PHILIPS 7.2BR30/WiFi TunableWhite/927-50 4/1FB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023833",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2200 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2200 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023833A",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023833B",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023833C",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024498",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024498A",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024498B",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024499",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024499A",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024499B",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023831",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023831A",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023831B",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022656",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/WiFi Color+TunableWhite4/1FB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "90"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022650",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/WiFi DIM/927 4/1FB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022651",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/WiFi DIM/950 4/1FB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290022654",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8A19/WiFi TunableWhite/927-50 4/1FB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290030189",
   "brand": "PHILIPS",
   "name": "PHILIPS 8.8BR40/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR40"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "B11-N11",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.7 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "92 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "B11-N12",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.7 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "92 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "B11-N1E",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.7 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "92 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "B1F-N5G",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 450 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "90 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "W13-NC5",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 450 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "90 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "W1E-NC1",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 450 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "90 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "W21-N13",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.7 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "92 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "W31-N11",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.7 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "92 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "W31-N11DL",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.7 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "92 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "W31-N15",
   "brand": "SENGLED",
   "name": "SENGLED LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.7 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "92 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "91"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "B02-BL-A19",
   "brand": "SONOFF",
   "name": "SONOFF LED Bulb",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 806 lm, 9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "806 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "89.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "86"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "B05-BL-A19",
   "brand": "SONOFF",
   "name": "SONOFF LED Bulb",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 806 lm, 9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "806 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "89.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "85"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBA19-10-E26-9SS",
   "brand": "RAB",
   "name": "RAB LCBA19-10-E26-9SS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "97"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBA19-10-E26-9TW-SS-NS",
   "brand": "RAB",
   "name": "RAB LCBA19-10-E26-9TW-SS-NS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "97"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBBR30-10-E26-9SS",
   "brand": "RAB",
   "name": "RAB LCBBR30-10-E26-9SS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 10 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "98"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBBR30-10-E26-9TW-SS-NS",
   "brand": "RAB",
   "name": "RAB LCBBR30-10-E26-9TW-SS-NS",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 10 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "98"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBBR30-7-E26-9RGB-SS",
   "brand": "RAB",
   "name": "RAB LED lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "92.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBA19-6-E26-9TW-F-C-SS",
   "brand": "RAB",
   "name": "RAB LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 6 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "133.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "97"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBA19-9-E26-9RGB-SS",
   "brand": "RAB",
   "name": "RAB LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBB11-5-E26-9TW-F-C-SS",
   "brand": "RAB",
   "name": "RAB LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 500 lm, 5 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "500 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "100 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBG25-6-E26-9TW-F-C-SS",
   "brand": "RAB",
   "name": "RAB LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Globe lamp, E26 (Medium) base, 800 lm, 6 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "133.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "G25"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "LCBST19-6-E26-9TW-F-C-SS",
   "brand": "RAB",
   "name": "RAB LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E26 (Medium) base, 800 lm, 6 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "133.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "ST19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11277",
   "brand": "Satco",
   "name": "Satco PAR38-15-RGB9T/B1B5/15DF/CB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1200 lm, 15 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1200 lm"
    },
    {
     "name": "Wattage",
     "value": "15 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "90 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11258",
   "brand": "Satco",
   "name": "Satco PAR38G55-15-**/B1B5/15DF-X8",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1200 lm, 15 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1200 lm"
    },
    {
     "name": "Wattage",
     "value": "15 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "90 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "83"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11283",
   "brand": "Satco",
   "name": "Satco R20-6-RGB9T/B1BJ/14D/CB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 480 lm, 6 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "480 lm"
    },
    {
     "name": "Wattage",
     "value": "6 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "45 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "R20"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "5AT1S3",
   "brand": "Ring",
   "name": "Ring 5AT1S3",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.5 W, 3500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "94.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "5AT1S4",
   "brand": "Ring",
   "name": "Ring 5AT1S4",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1500 lm, 16 W, 3500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1500 lm"
    },
    {
     "name": "Wattage",
     "value": "16 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "150 W"
    },
    {
     "name": "Efficacy",
     "value": "93.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3500 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "5AT3X3",
   "brand": "Ring",
   "name": "Ring 5AT3X3",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.5 W, 3500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "94.1 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11275",
   "brand": "Satco",
   "name": "Satco A19-10-RGBT/B1BJ/14D/T2/CB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11254",
   "brand": "Satco",
   "name": "Satco A19-10-RGBT/B1BJ/14D/T2/TY",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11252",
   "brand": "Satco",
   "name": "Satco A19-9.5-**/B1BJ/14D/RGBTW/XTY",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "83"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11287",
   "brand": "Satco",
   "name": "Satco A21-13-RGBT/B1BJ/14D/T2/CB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1100 lm, 13 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1100 lm"
    },
    {
     "name": "Wattage",
     "value": "13 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "84.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11255",
   "brand": "Satco",
   "name": "Satco BR30-9.5-RGB8T/B1BJ/14D/ZXTY",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "83"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11276",
   "brand": "Satco",
   "name": "Satco BR30-9.5-RGB8T/B1BJ/14D/ZXTY",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 760 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "760 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "83"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11257",
   "brand": "Satco",
   "name": "Satco BR30-9.5-RGB9T/B1BJ/14D/ZXTY",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 760 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "760 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "A19-10-E26-9SS/LC",
   "brand": "RAB",
   "name": "RAB Omnidirectional LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 10 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "10 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "97"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11284",
   "brand": "Satco",
   "name": "Satco BR40-12-RGB9T/B1Bj/14D/CB-J",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 960 lm, 12 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "960 lm"
    },
    {
     "name": "Wattage",
     "value": "12 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "80 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR40"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11271",
   "brand": "Satco",
   "name": "Satco GU10-5.5-**/B159/54D/RGBTW/TY",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 5.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "72.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "84"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "S11278",
   "brand": "Satco",
   "name": "Satco GU10-5.5-RGB9T/B159/15D/CB",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 385 lm, 5.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "385 lm"
    },
    {
     "name": "Wattage",
     "value": "5.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "70 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "MR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "11A19060WRGBW01",
   "brand": "EcoSmart",
   "name": "EcoSmart LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "11A19060WRGBW21",
   "brand": "EcoSmart",
   "name": "EcoSmart LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "11PR38120RGBWH2",
   "brand": "EcoSmart",
   "name": "EcoSmart LED LAMP",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 1200 lm, 13.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1200 lm"
    },
    {
     "name": "Wattage",
     "value": "13.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "120 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR38"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "1004532874",
   "brand": "EcoSmart",
   "name": "EcoSmart A9A19A60WESDZ02",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 9.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "84.2 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "1004532871",
   "brand": "EcoSmart",
   "name": "EcoSmart A9BR3065WESDZ02",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 8.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "8.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "76.5 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024493B",
   "brand": "Phillips",
   "name": "Phillips 14.5A21/Wi-Fi BLE Color/922-65 4/1PF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024493",
   "brand": "WiZ",
   "name": "WiZ 14.5A21/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024493A",
   "brand": "WiZ",
   "name": "WiZ 14.5A21/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024493B",
   "brand": "WiZ",
   "name": "WiZ 14.5A21/Wi-Fi BLE Color/922-65 4/1PF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024490",
   "brand": "WiZ",
   "name": "WiZ 14.5A21/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024490A",
   "brand": "WiZ",
   "name": "WiZ 14.5A21/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024491",
   "brand": "WiZ",
   "name": "WiZ 14.5A21/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024491A",
   "brand": "WiZ",
   "name": "WiZ 14.5A21/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024492",
   "brand": "WiZ",
   "name": "WiZ 14.5A21/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024492A",
   "brand": "WiZ",
   "name": "WiZ 14.5A21/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1600 lm, 14.5 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1600 lm"
    },
    {
     "name": "Wattage",
     "value": "14.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "100 W"
    },
    {
     "name": "Efficacy",
     "value": "110.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A21"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024476",
   "brand": "WiZ",
   "name": "WiZ 3.9B12/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024476A",
   "brand": "WiZ",
   "name": "WiZ 3.9B12/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290030820A",
   "brand": "WiZ",
   "name": "WiZ 3.9B12/Wi-Fi BLE Color/922-65 E26",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Decorative lamp, E26 (Medium) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "B13"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024475",
   "brand": "WiZ",
   "name": "WiZ 3.9B12/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Other lamp, E12 (Candelabra) base, 355 lm, 3.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "355 lm"
    },
    {
     "name": "Wattage",
     "value": "3.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "40 W"
    },
    {
     "name": "Efficacy",
     "value": "91 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E12 (Candelabra)"
    },
    {
     "name": "Bulb Type",
     "value": "B11"
    },
    {
     "name": "Rated Life",
     "value": "15000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024472",
   "brand": "WiZ",
   "name": "WiZ 4.9GU10/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 4.9 W, 3000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "4.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "81.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "PAR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024472A",
   "brand": "WiZ",
   "name": "WiZ 4.9GU10/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 4.9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "4.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "81.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "PAR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024471",
   "brand": "WiZ",
   "name": "WiZ 4.9GU10/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, GU10 base, 400 lm, 4.9 W, 6500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "400 lm"
    },
    {
     "name": "Wattage",
     "value": "4.9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "81.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "6500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "GU10"
    },
    {
     "name": "Bulb Type",
     "value": "PAR16"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290030188",
   "brand": "WiZ",
   "name": "WiZ 5R20/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 450 lm, 5 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "450 lm"
    },
    {
     "name": "Wattage",
     "value": "5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "45 W"
    },
    {
     "name": "Efficacy",
     "value": "90 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "R20"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023834",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023834A",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023834B",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023834C",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024500A",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024500B",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024500",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE DIM/927 6/1PF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024501A",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024501B",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024501",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE DIM/950 6/1PF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023832B",
   "brand": "WiZ",
   "name": "WiZ 7.2BR30/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 650 lm, 7.2 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "650 lm"
    },
    {
     "name": "Wattage",
     "value": "7.2 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "65 W"
    },
    {
     "name": "Efficacy",
     "value": "90.3 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023833",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023833A",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023833B",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023833C",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024498A",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024498B",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE DIM/927",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024498",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE DIM/927 4/2PF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024499A",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024499B",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE DIM/950",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "96"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290024499",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE DIM/950 6/1PF",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 5000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "5000 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023831A",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290023831B",
   "brand": "WiZ",
   "name": "WiZ 8.8A19/Wi-Fi BLE Tunable/927-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 800 lm, 8.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "8.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "60 W"
    },
    {
     "name": "Efficacy",
     "value": "90.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "92"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "9290030233",
   "brand": "WiZ",
   "name": "WiZ 9.8PAR30S/Wi-Fi BLE Color/922-65",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 900 lm, 9.8 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "900 lm"
    },
    {
     "name": "Wattage",
     "value": "9.8 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "91.8 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR30S"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "WLPA19C",
   "brand": "WYZE",
   "name": "WYZE LED Lamp",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1100 lm, 12 W, 3500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1100 lm"
    },
    {
     "name": "Wattage",
     "value": "12 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "91.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "WLPA19CV2",
   "brand": "WYZE",
   "name": "WYZE WLPA19CV2",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED General Purpose Replacement lamp, E26 (Medium) base, 1100 lm, 12 W, 3500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "1100 lm"
    },
    {
     "name": "Wattage",
     "value": "12 W"
    },
    {
     "name": "Efficacy",
     "value": "91.7 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3500 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "A19"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "WLPBR30C",
   "brand": "WYZE",
   "name": "WYZE WLPBR30C",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 950 lm, 11.5 W, 3500 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "950 lm"
    },
    {
     "name": "Wattage",
     "value": "11.5 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "75 W"
    },
    {
     "name": "Efficacy",
     "value": "82.6 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "3500 K"
    },
    {
     "name": "CRI",
     "value": "95"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "BR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "WYZEPB2725",
   "brand": "WYZE",
   "name": "WYZE WYZEPB2725",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9 W, 2700 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "2700 K"
    },
    {
     "name": "CRI",
     "value": "93"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  },
  {
   "mpn": "WYZEPB4025",
   "brand": "WYZE",
   "name": "WYZE WYZEPB4025",
   "category": "electrical",
   "subcategory": "Lamps & Bulbs",
   "description": "LED Reflector (Flood/Spot) lamp, E26 (Medium) base, 800 lm, 9 W, 4000 K. ENERGY STAR certified.",
   "specs": [
    {
     "name": "Technology",
     "value": "LED",
     "isNonNeg": true
    },
    {
     "name": "Brightness",
     "value": "800 lm"
    },
    {
     "name": "Wattage",
     "value": "9 W"
    },
    {
     "name": "Wattage Equivalency",
     "value": "50 W"
    },
    {
     "name": "Efficacy",
     "value": "88.9 lm/W"
    },
    {
     "name": "Color Temperature",
     "value": "4000 K"
    },
    {
     "name": "CRI",
     "value": "94"
    },
    {
     "name": "Base Type",
     "value": "E26 (Medium)"
    },
    {
     "name": "Bulb Type",
     "value": "PAR30"
    },
    {
     "name": "Rated Life",
     "value": "25000 hrs"
    },
    {
     "name": "Dimmable",
     "value": "Dimmable"
    }
   ],
   "verifiedAt": "2026-06-24"
  }
 ];
