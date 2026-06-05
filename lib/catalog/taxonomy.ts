import type { ProductCategory } from "@/features/product-finder/types";

export const CATEGORIES: ProductCategory[] = [
  "electrical", "datacom", "oem-electrical", "av", "security", "safety",
];

export interface SpecTemplate {
  name: string;
  values: string[];
  isNonNeg?: boolean;
}

export interface SubcategoryTemplate {
  name: string;
  brands: string[];
  uom: string;
  icon: string;
  priceRange: [number, number];
  skuPrefix: string;
  specs: SpecTemplate[];
}

export const CATEGORY_META: Record<ProductCategory, { label: string; icon: string }> = {
  electrical: { label: "Electrical", icon: "⚡" },
  datacom: { label: "Datacom", icon: "🌐" },
  "oem-electrical": { label: "OEM Electrical", icon: "🔧" },
  av: { label: "AV", icon: "📺" },
  security: { label: "Security", icon: "🎥" },
  safety: { label: "Safety", icon: "🦺" },
};

export const TAXONOMY: Record<ProductCategory, SubcategoryTemplate[]> = {
  electrical: [
    { name: "Circuit Breakers", skuPrefix: "CB", uom: "EA", icon: "⚡", priceRange: [6, 90], brands: ["Square D", "Eaton", "Siemens", "GE", "ABB"], specs: [
      { name: "Amperage", isNonNeg: true, values: ["15A", "20A", "30A", "40A", "50A", "60A"] },
      { name: "Voltage", isNonNeg: true, values: ["120/240V", "277/480V"] },
      { name: "Poles", isNonNeg: true, values: ["1-Pole", "2-Pole", "3-Pole"] },
      { name: "Int. Rating", values: ["10kAIC", "22kAIC", "65kAIC"] } ] },
    { name: "Wire & Cable", skuPrefix: "WC", uom: "FT", icon: "🔌", priceRange: [0.2, 4], brands: ["Southwire", "Encore Wire", "Cerro Wire", "General Cable"], specs: [
      { name: "Gauge", isNonNeg: true, values: ["14 AWG", "12 AWG", "10 AWG", "8 AWG"] },
      { name: "Conductor", isNonNeg: true, values: ["Copper", "Aluminum"] },
      { name: "Insulation", values: ["THHN", "XHHW", "Romex NM-B"] } ] },
    { name: "Conduit", skuPrefix: "CD", uom: "FT", icon: "🧵", priceRange: [0.5, 12], brands: ["Allied Tube", "Wheatland", "Republic Conduit"], specs: [
      { name: "Trade Size", isNonNeg: true, values: ['1/2"', '3/4"', '1"', '2"'] },
      { name: "Type", isNonNeg: true, values: ["EMT", "Rigid", "PVC"] } ] },
    { name: "Wiring Devices", skuPrefix: "WD", uom: "EA", icon: "🔘", priceRange: [1, 35], brands: ["Leviton", "Hubbell", "Pass & Seymour", "Lutron"], specs: [
      { name: "Type", isNonNeg: true, values: ["Receptacle", "Switch", "GFCI", "Dimmer"] },
      { name: "Amperage", isNonNeg: true, values: ["15A", "20A"] },
      { name: "Color", values: ["White", "Ivory", "Black", "Gray"] } ] },
  ],
  datacom: [
    { name: "Ethernet Cable", skuPrefix: "EC", uom: "FT", icon: "🌐", priceRange: [0.1, 2], brands: ["Belden", "CommScope", "Panduit", "Berk-Tek"], specs: [
      { name: "Category", isNonNeg: true, values: ["Cat5e", "Cat6", "Cat6A"] },
      { name: "Shielding", isNonNeg: true, values: ["UTP", "STP", "F/UTP"] },
      { name: "Jacket", values: ["CMR", "CMP Plenum"] } ] },
    { name: "Patch Panels", skuPrefix: "PP", uom: "EA", icon: "🎛️", priceRange: [25, 220], brands: ["Panduit", "Leviton", "CommScope", "Hubbell"], specs: [
      { name: "Ports", isNonNeg: true, values: ["24-Port", "48-Port"] },
      { name: "Category", isNonNeg: true, values: ["Cat6", "Cat6A"] } ] },
    { name: "Network Switches", skuPrefix: "NS", uom: "EA", icon: "🔀", priceRange: [120, 3500], brands: ["Cisco", "Juniper", "Aruba", "Netgear"], specs: [
      { name: "Ports", isNonNeg: true, values: ["8-Port", "24-Port", "48-Port"] },
      { name: "Speed", isNonNeg: true, values: ["1GbE", "10GbE"] },
      { name: "Mgmt", values: ["Managed", "Unmanaged"] } ] },
    { name: "Racks & Cabinets", skuPrefix: "RC", uom: "EA", icon: "🗄️", priceRange: [80, 1800], brands: ["Tripp Lite", "Panduit", "Chatsworth", "APC"], specs: [
      { name: "Height", isNonNeg: true, values: ["12U", "24U", "42U"] },
      { name: "Type", isNonNeg: true, values: ["Open Frame", "Enclosed"] } ] },
  ],
  "oem-electrical": [
    { name: "Relays", skuPrefix: "RL", uom: "EA", icon: "🔧", priceRange: [4, 120], brands: ["Allen-Bradley", "Phoenix Contact", "Omron", "Schneider Electric"], specs: [
      { name: "Coil Voltage", isNonNeg: true, values: ["24VDC", "120VAC", "240VAC"] },
      { name: "Contacts", isNonNeg: true, values: ["SPDT", "DPDT", "3PDT"] } ] },
    { name: "Terminal Blocks", skuPrefix: "TB", uom: "EA", icon: "🔩", priceRange: [0.5, 18], brands: ["Phoenix Contact", "Weidmuller", "Wago", "Allen-Bradley"], specs: [
      { name: "Wire Range", isNonNeg: true, values: ["26-12 AWG", "22-10 AWG"] },
      { name: "Mount", isNonNeg: true, values: ["DIN Rail", "Panel"] } ] },
    { name: "Power Supplies", skuPrefix: "PS", uom: "EA", icon: "🔋", priceRange: [25, 600], brands: ["Mean Well", "Phoenix Contact", "Omron", "Sola"], specs: [
      { name: "Output", isNonNeg: true, values: ["12VDC", "24VDC", "48VDC"] },
      { name: "Wattage", isNonNeg: true, values: ["60W", "120W", "240W", "480W"] } ] },
    { name: "Push Buttons", skuPrefix: "PB", uom: "EA", icon: "🔴", priceRange: [3, 60], brands: ["Allen-Bradley", "Schneider Electric", "Siemens", "Eaton"], specs: [
      { name: "Type", isNonNeg: true, values: ["Momentary", "Maintained", "E-Stop"] },
      { name: "Color", values: ["Red", "Green", "Black", "Yellow"] } ] },
  ],
  av: [
    { name: "Displays", skuPrefix: "DP", uom: "EA", icon: "📺", priceRange: [300, 6000], brands: ["Samsung", "LG", "Sony", "NEC"], specs: [
      { name: "Size", isNonNeg: true, values: ['43"', '55"', '65"', '75"', '86"'] },
      { name: "Resolution", isNonNeg: true, values: ["1080p", "4K UHD"] } ] },
    { name: "Projectors", skuPrefix: "PJ", uom: "EA", icon: "📽️", priceRange: [400, 9000], brands: ["Epson", "Christie", "Barco", "BenQ"], specs: [
      { name: "Brightness", isNonNeg: true, values: ["3000 lm", "5000 lm", "7500 lm"] },
      { name: "Resolution", isNonNeg: true, values: ["1080p", "4K UHD"] } ] },
    { name: "Speakers", skuPrefix: "SP", uom: "EA", icon: "🔊", priceRange: [40, 900], brands: ["JBL", "Bose", "QSC", "Atlas Sound"], specs: [
      { name: "Type", isNonNeg: true, values: ["Ceiling", "Surface", "Pendant"] },
      { name: "Power", isNonNeg: true, values: ["30W", "70W", "100W"] } ] },
    { name: "Signal Extenders", skuPrefix: "SX", uom: "EA", icon: "🧰", priceRange: [60, 1200], brands: ["Extron", "Crestron", "Atlona", "Kramer"], specs: [
      { name: "Signal", isNonNeg: true, values: ["HDMI", "HDBaseT", "SDI"] },
      { name: "Range", isNonNeg: true, values: ["100ft", "230ft", "330ft"] } ] },
  ],
  security: [
    { name: "IP Cameras", skuPrefix: "IC", uom: "EA", icon: "🎥", priceRange: [90, 1400], brands: ["Axis", "Hanwha", "Bosch", "Hikvision"], specs: [
      { name: "Resolution", isNonNeg: true, values: ["2MP", "4MP", "8MP"] },
      { name: "Form", isNonNeg: true, values: ["Dome", "Bullet", "PTZ"] },
      { name: "IR", values: ["IR 30m", "IR 50m"] } ] },
    { name: "Access Control", skuPrefix: "AC", uom: "EA", icon: "🔐", priceRange: [60, 2200], brands: ["HID", "Genetec", "LenelS2", "Honeywell"], specs: [
      { name: "Type", isNonNeg: true, values: ["Reader", "Controller", "Door Lock"] },
      { name: "Credential", isNonNeg: true, values: ["Prox", "Smart Card", "Mobile"] } ] },
    { name: "NVRs", skuPrefix: "NV", uom: "EA", icon: "💽", priceRange: [200, 3500], brands: ["Axis", "Hanwha", "Bosch", "Milestone"], specs: [
      { name: "Channels", isNonNeg: true, values: ["8-Ch", "16-Ch", "32-Ch"] },
      { name: "Storage", isNonNeg: true, values: ["4TB", "8TB", "16TB"] } ] },
    { name: "Intrusion Sensors", skuPrefix: "IS", uom: "EA", icon: "🚨", priceRange: [10, 180], brands: ["Honeywell", "Bosch", "DSC", "Interlogix"], specs: [
      { name: "Type", isNonNeg: true, values: ["PIR Motion", "Door Contact", "Glass Break"] },
      { name: "Range", values: ["12m", "15m"] } ] },
  ],
  safety: [
    { name: "Hard Hats", skuPrefix: "HH", uom: "EA", icon: "⛑️", priceRange: [8, 45], brands: ["MSA", "3M", "Honeywell", "Pyramex"], specs: [
      { name: "Type", isNonNeg: true, values: ["Type I", "Type II"] },
      { name: "Class", isNonNeg: true, values: ["Class E", "Class G", "Class C"] },
      { name: "Color", values: ["White", "Yellow", "Orange", "Blue"] } ] },
    { name: "Safety Glasses", skuPrefix: "SG", uom: "EA", icon: "🥽", priceRange: [2, 24], brands: ["3M", "Honeywell", "Pyramex", "MCR Safety"], specs: [
      { name: "Lens", isNonNeg: true, values: ["Clear", "Gray", "Anti-Fog"] },
      { name: "Rating", isNonNeg: true, values: ["ANSI Z87.1"] } ] },
    { name: "Gloves", skuPrefix: "GL", uom: "PR", icon: "🧤", priceRange: [1, 30], brands: ["Ansell", "MCR Safety", "Mechanix", "Showa"], specs: [
      { name: "Material", isNonNeg: true, values: ["Nitrile", "Leather", "Cut-Resistant"] },
      { name: "Cut Level", isNonNeg: true, values: ["A2", "A4", "A6"] } ] },
    { name: "Hi-Vis Apparel", skuPrefix: "HV", uom: "EA", icon: "🦺", priceRange: [6, 60], brands: ["ML Kishigo", "PIP", "Radians", "Ergodyne"], specs: [
      { name: "Class", isNonNeg: true, values: ["Class 2", "Class 3"] },
      { name: "Type", isNonNeg: true, values: ["Vest", "Jacket", "T-Shirt"] } ] },
  ],
};

export const ALL_SUBCATEGORIES: string[] = [
  ...new Set(CATEGORIES.flatMap((c) => TAXONOMY[c].map((s) => s.name))),
].sort();

export const ALL_BRANDS: string[] = [
  ...new Set(CATEGORIES.flatMap((c) => TAXONOMY[c].flatMap((s) => s.brands))),
].sort();
