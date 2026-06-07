import type { CatalogProduct, ProductCategory } from "@/features/product-finder/types";

// ─── Subcategory → LoremFlickr keyword(s) ─────────────────────────────────────
// Keys must exactly match subcategory names in lib/catalog/taxonomy.ts

export const SUBCATEGORY_KEYWORDS: Record<string, string> = {
  // electrical — wiring / overcurrent protection
  "Circuit Breakers":              "circuit,breaker",
  "Wire & Cable":                  "electrical,wire",
  "Conduit":                       "conduit,pipe",
  "Wiring Devices":                "electrical,outlet",
  "Receptacles & Outlets":         "electrical,receptacle",
  "Switches":                      "light,switch",
  "Wall Plates & Covers":          "wall,plate",
  "Cord Plugs & Connectors":       "electrical,connector",
  "Combination Devices":           "electrical,device",
  "Lighting Accessories":          "lighting,fixture",
  "Load Centers":                  "electrical,panel",
  "Panelboards":                   "panelboard,electrical",
  "Dry-Type Transformers":         "transformer,electrical",
  "Safety Switches & Disconnects": "safety,switch",
  "Fuses":                         "fuse,electrical",
  "Meter Sockets":                 "meter,electrical",
  "Surge Protective Devices":      "surge,protection",
  "Generators & Transfer Switches":"generator,power",
  "Conduit Fittings":              "conduit,fitting",
  "Boxes & Covers":                "electrical,box",
  "Enclosures":                    "industrial,enclosure",
  "Flexible Conduit & Liquidtight":"flexible,conduit",
  "Cable Tray":                    "cable,tray",
  "Strut & Channel":               "strut,channel",
  "Grounding & Bonding":           "grounding,electrical",
  "Lugs & Wire Connectors":        "wire,connector",
  "Motor Starters & Controls":     "motor,starter",
  "Contactors":                    "contactor,electrical",
  "Timers & Time Switches":        "timer,electrical",
  "Photo Controls":                "photo,control",
  "Occupancy & Vacancy Sensors":   "occupancy,sensor",
  "Dimmers & Lighting Controls":   "dimmer,light",
  "EV Charging Stations":          "electric,vehicle,charger",
  "Industrial Plugs & Receptacles":"industrial,plug",
  // electrical — lighting
  "LED Troffers & Panels":         "led,light,panel",
  "High Bay Fixtures":             "high,bay,light",
  "Strip & Wrap Fixtures":         "led,strip,light",
  "LED Downlights":                "led,downlight",
  "Lamps & Tubes":                 "light,bulb",
  "Drivers & Ballasts":            "led,driver",
  "Exit & Emergency Lighting":     "exit,emergency,light",
  "Outdoor & Area Lighting":       "outdoor,area,light",
  // datacom
  "Ethernet Cable":                "network,ethernet,cable",
  "Patch Panels":                  "network,patch,panel",
  "Network Switches":              "network,switch",
  "Racks & Cabinets":              "server,rack,cabinet",
  "Fiber Optic Cable":             "fiber,optic,cable",
  "Wireless Access Points":        "wireless,access,point",
  "UPS & Power Protection":        "ups,power,supply",
  "Connectivity":                  "network,cable",
  // oem-electrical
  "Relays":                        "relay,electrical",
  "Terminal Blocks":               "terminal,block",
  "Power Supplies":                "power,supply",
  "Push Buttons":                  "push,button,control",
  "PLCs & I/O Modules":            "plc,industrial,controller",
  "Sensors & Proximity Switches":  "industrial,sensor",
  // av
  "Displays":                      "display,screen",
  "Projectors":                    "projector,screen",
  "Speakers":                      "speaker,audio",
  "Signal Extenders":              "hdmi,extender",
  "Microphones & Audio Capture":   "microphone,audio",
  "Display & Projector Mounts":    "display,mount",
  "Video Conferencing":            "video,conference",
  "Amplifiers & DSP":              "audio,amplifier",
  // security
  "IP Cameras":                    "security,camera",
  "Access Control":                "access,control,door",
  "NVRs":                          "network,video,recorder",
  "Intrusion Sensors":             "security,sensor",
  "Alarm Panels":                  "alarm,panel",
  "Intercom & Entry Systems":      "intercom,door,entry",
  "Security Cable & Power Supplies":"security,cable",
  // safety
  "Hard Hats":                     "hard,hat",
  "Safety Glasses":                "safety,glasses",
  "Gloves":                        "work,gloves",
  "Hi-Vis Apparel":                "hi-vis,vest,safety",
  "Fall Protection":               "fall,protection,harness",
  "Hearing Protection":            "hearing,protection,earmuff",
  "Respiratory Protection":        "respirator,mask",
  "Lockout/Tagout":                "lockout,tagout,safety",
};

// ─── Category-level fallback keywords ─────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<ProductCategory, string> = {
  electrical:        "electrical,supply",
  datacom:           "network,cable",
  "oem-electrical":  "industrial,electrical",
  av:                "audio,video",
  security:          "security,camera",
  safety:            "safety,equipment",
};

// ─── Stable hash of product.id → positive integer ────────────────────────────
// djb2-style hash: deterministic, no Date.now, no Math.random.

function stableHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // hash * 33 + charCode
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  // Ensure positive 32-bit int, min 1
  return (hash >>> 0) || 1;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a deterministic LoremFlickr URL for a given product.
 * Resolution order: subcategory keyword → category fallback → generic.
 * The `lock` param is a stable hash of `product.id` so each product gets a
 * consistent photo across renders.
 */
export function imageUrlFor(product: CatalogProduct): string {
  const keywords =
    SUBCATEGORY_KEYWORDS[product.subcategory] ??
    CATEGORY_KEYWORDS[product.category] ??
    "industrial,supply";

  const lock = stableHash(product.id);
  return `https://loremflickr.com/400/300/${keywords}?lock=${lock}`;
}
