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
  /** Relative commonality within its category; defaults to 1 when absent. */
  weight?: number;
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
    { name: "Circuit Breakers", skuPrefix: "CB", uom: "EA", icon: "⚡", priceRange: [6, 90], weight: 16, brands: ["Square D", "Eaton", "Siemens", "GE", "ABB"], specs: [
      { name: "Amperage", isNonNeg: true, values: ["15A", "20A", "30A", "40A", "50A", "60A"] },
      { name: "Voltage", isNonNeg: true, values: ["120/240V", "277/480V"] },
      { name: "Poles", isNonNeg: true, values: ["1-Pole", "2-Pole", "3-Pole"] },
      { name: "Int. Rating", values: ["10kAIC", "22kAIC", "65kAIC"] } ] },
    { name: "Wire & Cable", skuPrefix: "WC", uom: "FT", icon: "🔌", priceRange: [0.2, 4], weight: 20, brands: ["Southwire", "Encore Wire", "Cerro Wire", "General Cable"], specs: [
      { name: "Gauge", isNonNeg: true, values: ["14 AWG", "12 AWG", "10 AWG", "8 AWG"] },
      { name: "Conductor", isNonNeg: true, values: ["Copper", "Aluminum"] },
      { name: "Insulation", values: ["THHN", "XHHW", "Romex NM-B"] } ] },
    { name: "Conduit", skuPrefix: "CD", uom: "FT", icon: "🧵", priceRange: [0.5, 12], weight: 18, brands: ["Allied Tube", "Wheatland", "Republic Conduit"], specs: [
      { name: "Trade Size", isNonNeg: true, values: ['1/2"', '3/4"', '1"', '2"'] },
      { name: "Type", isNonNeg: true, values: ["EMT", "Rigid", "PVC"] } ] },
    { name: "Wiring Devices", skuPrefix: "WD", uom: "EA", icon: "🔘", priceRange: [1, 35], weight: 16, brands: ["Leviton", "Hubbell", "Pass & Seymour", "Lutron"], specs: [
      { name: "Type", isNonNeg: true, values: ["Receptacle", "Switch", "GFCI", "Dimmer"] },
      { name: "Amperage", isNonNeg: true, values: ["15A", "20A"] },
      { name: "Color", values: ["White", "Ivory", "Black", "Gray"] } ] },
    { name: "Load Centers", skuPrefix: "LC", uom: "EA", icon: "🏠", priceRange: [45, 850], weight: 8, brands: ["Square D", "Eaton", "Siemens", "GE", "Leviton"], specs: [
      { name: "Main Rating", isNonNeg: true, values: ["100A", "125A", "150A", "200A", "225A", "400A"] },
      { name: "Spaces", isNonNeg: true, values: ["12-Space", "20-Space", "30-Space", "40-Space", "42-Space"] },
      { name: "Main Type", isNonNeg: true, values: ["Main Breaker", "Main Lug"] },
      { name: "Enclosure", values: ["NEMA 1 Indoor", "NEMA 3R Outdoor"] },
      { name: "Phase", values: ["1-Phase", "3-Phase"] } ] },
    { name: "Panelboards", skuPrefix: "PN", uom: "EA", icon: "🗃️", priceRange: [600, 9500], weight: 10, brands: ["Square D", "Eaton", "Siemens", "ABB", "GE"], specs: [
      { name: "Amperage", isNonNeg: true, values: ["100A", "225A", "400A", "600A", "800A"] },
      { name: "Voltage", isNonNeg: true, values: ["208Y/120V", "480Y/277V", "240V Delta"] },
      { name: "Type", isNonNeg: true, values: ["Lighting & Appliance", "Power Distribution"] },
      { name: "Bus Material", values: ["Copper", "Aluminum"] },
      { name: "Enclosure", values: ["NEMA 1", "NEMA 3R"] } ] },
    { name: "Dry-Type Transformers", skuPrefix: "TR", uom: "EA", icon: "🔌", priceRange: [350, 18000], weight: 8, brands: ["Square D", "Eaton", "Siemens", "Hammond Power Solutions", "Acme Electric"], specs: [
      { name: "kVA", isNonNeg: true, values: ["15 kVA", "30 kVA", "45 kVA", "75 kVA", "112.5 kVA", "150 kVA", "225 kVA"] },
      { name: "Primary Voltage", isNonNeg: true, values: ["480V Delta", "240V Delta", "600V Delta"] },
      { name: "Secondary Voltage", isNonNeg: true, values: ["208Y/120V", "240/120V", "480Y/277V"] },
      { name: "Temperature Rise", values: ["115C", "150C", "80C"] },
      { name: "Efficiency", values: ["DOE 2016", "Standard"] } ] },
    { name: "Safety Switches & Disconnects", skuPrefix: "DS", uom: "EA", icon: "🔒", priceRange: [35, 2400], weight: 14, brands: ["Square D", "Eaton", "Siemens", "GE", "ABB"], specs: [
      { name: "Amperage", isNonNeg: true, values: ["30A", "60A", "100A", "200A", "400A", "600A"] },
      { name: "Voltage", isNonNeg: true, values: ["240V", "600V"] },
      { name: "Duty", isNonNeg: true, values: ["General Duty", "Heavy Duty"] },
      { name: "Fusing", values: ["Fusible", "Non-Fusible"] },
      { name: "Enclosure", values: ["NEMA 1", "NEMA 3R", "NEMA 4X"] } ] },
    { name: "Fuses", skuPrefix: "FU", uom: "PK", icon: "🧯", priceRange: [3, 320], weight: 15, brands: ["Bussmann", "Littelfuse", "Mersen", "Eaton"], specs: [
      { name: "Amperage", isNonNeg: true, values: ["15A", "20A", "30A", "60A", "100A", "200A", "400A"] },
      { name: "Class", isNonNeg: true, values: ["Class RK5", "Class RK1", "Class J", "Class CC", "Class T"] },
      { name: "Voltage", isNonNeg: true, values: ["250V", "600V"] },
      { name: "Speed", values: ["Time-Delay", "Fast-Acting"] } ] },
    { name: "Meter Sockets", skuPrefix: "MS", uom: "EA", icon: "📟", priceRange: [40, 950], weight: 9, brands: ["Milbank", "Eaton", "Siemens", "Square D", "Midwest Electric"], specs: [
      { name: "Amperage", isNonNeg: true, values: ["100A", "125A", "200A", "320A", "400A"] },
      { name: "Jaws", isNonNeg: true, values: ["4-Jaw", "5-Jaw", "7-Jaw"] },
      { name: "Type", values: ["Ringless", "Ring Type"] },
      { name: "Bypass", values: ["No Bypass", "Lever Bypass", "Horn Bypass"] } ] },
    { name: "Surge Protective Devices", skuPrefix: "SR", uom: "EA", icon: "🛡️", priceRange: [55, 3200], weight: 7, brands: ["Square D", "Eaton", "Siemens", "Leviton", "Intermatic"], specs: [
      { name: "Type", isNonNeg: true, values: ["Type 1", "Type 2", "Type 3"] },
      { name: "Voltage", isNonNeg: true, values: ["120/240V", "208Y/120V", "480Y/277V"] },
      { name: "Surge Current", isNonNeg: true, values: ["50kA", "100kA", "150kA", "240kA"] },
      { name: "Mount", values: ["Panel Integrated", "External NEMA 4X", "Din Rail"] } ] },
    { name: "Generators & Transfer Switches", skuPrefix: "GN", uom: "EA", icon: "⛽", priceRange: [450, 25000], weight: 5, brands: ["Generac", "Kohler", "Cummins", "Briggs & Stratton", "ASCO"], specs: [
      { name: "Type", isNonNeg: true, values: ["Standby Generator", "Portable Generator", "Automatic Transfer Switch", "Manual Transfer Switch"] },
      { name: "Power Rating", isNonNeg: true, values: ["7.5kW", "14kW", "22kW", "26kW", "48kW", "60kW"] },
      { name: "Fuel", values: ["Natural Gas", "LP", "Diesel", "Gasoline"] },
      { name: "Phase", values: ["1-Phase", "3-Phase"] } ] },
    { name: "Conduit Fittings", skuPrefix: "CF", uom: "EA", icon: "🔩", priceRange: [0.3, 28], weight: 20, brands: ["Bridgeport", "Appleton", "Raco", "Arlington", "Topaz"], specs: [
      { name: "Trade Size", isNonNeg: true, values: ['1/2"', '3/4"', '1"', '1-1/4"', '2"'] },
      { name: "Conduit Type", isNonNeg: true, values: ["EMT", "Rigid", "PVC", "Flex"] },
      { name: "Fitting Type", isNonNeg: true, values: ["Coupling", "Connector", "Strap", "LB Body", "Bushing"] },
      { name: "Material", values: ["Steel", "Die-Cast Zinc", "Malleable Iron", "PVC"] } ] },
    { name: "Boxes & Covers", skuPrefix: "BX", uom: "EA", icon: "📦", priceRange: [0.8, 65], weight: 19, brands: ["Raco", "Steel City", "Carlon", "Appleton", "Hubbell"], specs: [
      { name: "Box Type", isNonNeg: true, values: ["Device", "Junction", "Octagon", "Square", "Floor"] },
      { name: "Material", isNonNeg: true, values: ["Steel", "PVC", "Cast Aluminum"] },
      { name: "Gang", values: ["1-Gang", "2-Gang", "3-Gang", "4-Gang"] },
      { name: "Depth", values: ['1-1/2"', '2-1/8"', '3"'] } ] },
    { name: "Enclosures", skuPrefix: "EN", uom: "EA", icon: "🗃️", priceRange: [25, 950], weight: 9, brands: ["Hoffman", "Wiegmann", "Hammond", "Saginaw"], specs: [
      { name: "NEMA Rating", isNonNeg: true, values: ["NEMA 1", "NEMA 3R", "NEMA 4", "NEMA 4X", "NEMA 12"] },
      { name: "Size (HxWxD)", isNonNeg: true, values: ["8x8x4", "12x12x6", "16x16x6", "24x24x8", "36x30x10"] },
      { name: "Material", values: ["Carbon Steel", "Stainless Steel", "Polycarbonate"] },
      { name: "Door", values: ["Hinged", "Screw Cover"] } ] },
    { name: "Flexible Conduit & Liquidtight", skuPrefix: "FL", uom: "FT", icon: "🌀", priceRange: [0.4, 9], weight: 14, brands: ["Southwire", "AFC Cable Systems", "Electri-Flex", "Anamet"], specs: [
      { name: "Trade Size", isNonNeg: true, values: ['3/8"', '1/2"', '3/4"', '1"', '2"'] },
      { name: "Type", isNonNeg: true, values: ["FMC Steel", "FMC Aluminum", "LFMC Liquidtight", "LFNC Nonmetallic"] },
      { name: "Jacket Color", values: ["Gray", "Black", "Blue"] } ] },
    { name: "Cable Tray", skuPrefix: "CT", uom: "FT", icon: "🪜", priceRange: [8, 130], weight: 6, brands: ["Eaton B-Line", "Legrand Cablofil", "Cope", "Chalfant"], specs: [
      { name: "Width", isNonNeg: true, values: ['6"', '12"', '18"', '24"'] },
      { name: "Tray Type", isNonNeg: true, values: ["Ladder", "Wire Mesh", "Solid Bottom"] },
      { name: "Material", isNonNeg: true, values: ["Aluminum", "Galvanized Steel", "Stainless Steel"] },
      { name: "Load Depth", values: ['3"', '4"', '6"'] } ] },
    { name: "Strut & Channel", skuPrefix: "ST", uom: "FT", icon: "🛠️", priceRange: [1.5, 14], weight: 15, brands: ["Unistrut", "Eaton B-Line", "Superstrut", "Power-Strut"], specs: [
      { name: "Profile", isNonNeg: true, values: ['1-5/8" x 1-5/8"', '1-5/8" x 13/16"', "Back-to-Back"] },
      { name: "Finish", isNonNeg: true, values: ["Pre-Galvanized", "Hot-Dip Galvanized", "Green Painted", "Stainless"] },
      { name: "Slot Style", values: ["Solid", "Slotted", "Half-Slot"] } ] },
    { name: "Grounding & Bonding", skuPrefix: "GB", uom: "EA", icon: "🌍", priceRange: [1.5, 85], weight: 11, brands: ["Burndy", "nVent Erico", "Harger", "Ilsco", "Thomas & Betts"], specs: [
      { name: "Product Type", isNonNeg: true, values: ["Ground Rod", "Ground Clamp", "Bonding Bushing", "Ground Bar", "Exothermic Mold"] },
      { name: "Material", isNonNeg: true, values: ["Copper", "Copper-Bonded Steel", "Bronze", "Galvanized Steel"] },
      { name: "Conductor Range", values: ["10-2 AWG", "8 AWG-2/0", "2/0-250 kcmil"] } ] },
    { name: "Lugs & Wire Connectors", skuPrefix: "LG", uom: "EA", icon: "🔗", priceRange: [0.15, 40], weight: 18, brands: ["Burndy", "Ilsco", "3M", "Ideal", "Panduit"], specs: [
      { name: "Wire Range", isNonNeg: true, values: ["14-10 AWG", "8-6 AWG", "4-2 AWG", "2/0-4/0", "250-500 kcmil"] },
      { name: "Connector Type", isNonNeg: true, values: ["Mechanical Lug", "Compression Lug", "Twist-On", "Split Bolt", "Insulated Tap"] },
      { name: "Conductor Rating", isNonNeg: true, values: ["CU Only", "AL Only", "Dual-Rated CU/AL"] } ] },
    { name: "Motor Starters & Controls", skuPrefix: "MC", uom: "EA", icon: "⚙️", priceRange: [45, 1800], weight: 8, brands: ["Square D", "Eaton", "Siemens", "Allen-Bradley", "ABB"], specs: [
      { name: "HP Rating", isNonNeg: true, values: ["1 HP", "3 HP", "5 HP", "10 HP", "25 HP", "50 HP"] },
      { name: "Voltage", isNonNeg: true, values: ["208V", "240V", "480V", "600V"] },
      { name: "Type", values: ["Manual", "NEMA Magnetic", "IEC Magnetic", "Combination"] },
      { name: "Enclosure", values: ["Open", "NEMA 1", "NEMA 4X"] } ] },
    { name: "Contactors", skuPrefix: "CN", uom: "EA", icon: "🔗", priceRange: [18, 650], weight: 11, brands: ["Square D", "Eaton", "Siemens", "ABB", "Schneider Electric"], specs: [
      { name: "Amperage", isNonNeg: true, values: ["9A", "18A", "30A", "40A", "60A", "90A"] },
      { name: "Coil Voltage", isNonNeg: true, values: ["24VAC", "120VAC", "240VAC", "480VAC"] },
      { name: "Poles", isNonNeg: true, values: ["2-Pole", "3-Pole", "4-Pole"] },
      { name: "Style", values: ["IEC", "NEMA", "Definite Purpose", "Lighting"] } ] },
    { name: "Timers & Time Switches", skuPrefix: "TM", uom: "EA", icon: "⏲️", priceRange: [14, 260], weight: 9, brands: ["Intermatic", "Tork", "Leviton", "Eaton"], specs: [
      { name: "Type", isNonNeg: true, values: ["24-Hour Mechanical", "7-Day Digital", "Astronomic", "Spring-Wound Countdown"] },
      { name: "Voltage", isNonNeg: true, values: ["120V", "208-277V", "120-277V"] },
      { name: "Poles", values: ["SPST", "DPST"] },
      { name: "Enclosure", values: ["Indoor NEMA 1", "Outdoor NEMA 3R"] } ] },
    { name: "Photo Controls", skuPrefix: "PC", uom: "EA", icon: "🌗", priceRange: [6, 75], weight: 10, brands: ["Intermatic", "Tork", "Precision Multiple Controls", "Leviton"], specs: [
      { name: "Voltage", isNonNeg: true, values: ["120V", "208-277V", "480V", "105-305V"] },
      { name: "Mounting", isNonNeg: true, values: ["Stem & Swivel", "Locking Twist-Lock", "Fixed Wall"] },
      { name: "Load Rating", values: ["1000W", "1800W", "2000VA"] } ] },
    { name: "Occupancy & Vacancy Sensors", skuPrefix: "OC", uom: "EA", icon: "👁️", priceRange: [20, 190], weight: 13, brands: ["Lutron", "Leviton", "Wattstopper", "Hubbell", "Sensor Switch"], specs: [
      { name: "Technology", isNonNeg: true, values: ["PIR", "Ultrasonic", "Dual-Tech"] },
      { name: "Mounting", isNonNeg: true, values: ["Wall Switch", "Ceiling", "High-Bay Fixture"] },
      { name: "Coverage", values: ["450 sq ft", "1000 sq ft", "2000 sq ft"] },
      { name: "Mode", values: ["Occupancy Auto-On", "Vacancy Manual-On"] } ] },
    { name: "Dimmers & Lighting Controls", skuPrefix: "DM", uom: "EA", icon: "🎚️", priceRange: [9, 160], weight: 16, brands: ["Lutron", "Leviton", "Pass & Seymour", "Hubbell"], specs: [
      { name: "Load Type", isNonNeg: true, values: ["LED/CFL", "Incandescent", "ELV", "0-10V"] },
      { name: "Wattage", isNonNeg: true, values: ["150W LED", "450W LED", "600W", "1000W"] },
      { name: "Control Style", values: ["Slide", "Rocker/Tap", "Rotary", "Smart Wi-Fi"] },
      { name: "Color", values: ["White", "Light Almond", "Black", "Gray"] } ] },
    { name: "EV Charging Stations", skuPrefix: "EV", uom: "EA", icon: "🔋", priceRange: [420, 9500], weight: 7, brands: ["ChargePoint", "Leviton", "Eaton", "Square D", "Wallbox"], specs: [
      { name: "Level", isNonNeg: true, values: ["Level 1", "Level 2", "DC Fast"] },
      { name: "Output Current", isNonNeg: true, values: ["16A", "32A", "48A", "80A"] },
      { name: "Connector", isNonNeg: true, values: ["J1772", "NACS", "CCS1"] },
      { name: "Mounting", values: ["Wall", "Pedestal"] },
      { name: "Connectivity", values: ["Networked", "Non-Networked"] } ] },
    { name: "Industrial Plugs & Receptacles", skuPrefix: "PL", uom: "EA", icon: "🔌", priceRange: [11, 480], weight: 12, brands: ["Hubbell", "Leviton", "Pass & Seymour", "Meltric", "Appleton"], specs: [
      { name: "Amperage", isNonNeg: true, values: ["20A", "30A", "60A", "100A"] },
      { name: "Voltage", isNonNeg: true, values: ["125V", "250V", "480V", "600V"] },
      { name: "Configuration", isNonNeg: true, values: ["Twist-Lock L5-20", "Twist-Lock L6-30", "Twist-Lock L14-30", "Pin & Sleeve IEC 60309"] },
      { name: "Environmental", values: ["Watertight IP67", "Splashproof IP44", "Standard"] } ] },
    { name: "LED Troffers & Panels", skuPrefix: "TF", uom: "EA", icon: "💡", priceRange: [35, 240], weight: 18, brands: ["Lithonia Lighting", "Philips Day-Brite", "Cree Lighting", "Metalux", "Columbia Lighting"], specs: [
      { name: "Size", isNonNeg: true, values: ["2x2", "2x4", "1x4"] },
      { name: "Lumens", isNonNeg: true, values: ["3300 lm", "4400 lm", "5300 lm", "6300 lm"] },
      { name: "CCT", values: ["3500K", "4000K", "5000K"] },
      { name: "Voltage", isNonNeg: true, values: ["120-277V", "347-480V"] },
      { name: "Dimming", values: ["0-10V", "Non-Dimming"] } ] },
    { name: "High Bay Fixtures", skuPrefix: "HB", uom: "EA", icon: "🏭", priceRange: [90, 650], weight: 12, brands: ["Lithonia Lighting", "Cree Lighting", "RAB Lighting", "Metalux", "Holophane"], specs: [
      { name: "Lumens", isNonNeg: true, values: ["15000 lm", "24000 lm", "30000 lm", "42000 lm"] },
      { name: "Voltage", isNonNeg: true, values: ["120-277V", "277-480V"] },
      { name: "Form", isNonNeg: true, values: ["UFO Round", "Linear"] },
      { name: "CCT", values: ["4000K", "5000K"] } ] },
    { name: "Strip & Wrap Fixtures", skuPrefix: "LF", uom: "EA", icon: "📏", priceRange: [22, 130], weight: 13, brands: ["Lithonia Lighting", "Metalux", "Columbia Lighting", "Philips Day-Brite"], specs: [
      { name: "Length", isNonNeg: true, values: ["2ft", "4ft", "8ft"] },
      { name: "Lumens", isNonNeg: true, values: ["2200 lm", "4000 lm", "5500 lm", "8000 lm"] },
      { name: "CCT", values: ["3500K", "4000K", "5000K"] },
      { name: "Style", values: ["Strip", "Wraparound"] } ] },
    { name: "LED Downlights", skuPrefix: "DL", uom: "EA", icon: "🔦", priceRange: [12, 110], weight: 14, brands: ["Halo", "Juno", "Lithonia Lighting", "Philips Lightolier", "Nora Lighting"], specs: [
      { name: "Aperture", isNonNeg: true, values: ['4"', '6"', '8"'] },
      { name: "Lumens", isNonNeg: true, values: ["700 lm", "1000 lm", "1500 lm", "2000 lm"] },
      { name: "CCT", values: ["2700K", "3000K", "3500K", "4000K", "Selectable"] },
      { name: "Trim", values: ["Baffle", "Smooth Reflector", "Gimbal"] } ] },
    { name: "Lamps & Tubes", skuPrefix: "LM", uom: "PK", icon: "🔆", priceRange: [2, 30], weight: 20, brands: ["Philips", "GE Lighting", "Sylvania", "TCP", "Satco"], specs: [
      { name: "Type", isNonNeg: true, values: ["LED A19", "LED T8 4ft", "LED BR30", "LED PAR38"] },
      { name: "Base", isNonNeg: true, values: ["E26 Medium", "G13 Bi-Pin"] },
      { name: "CCT", values: ["2700K", "3500K", "4000K", "5000K"] },
      { name: "Wattage", values: ["9W", "12W", "15W", "18W"] } ] },
    { name: "Drivers & Ballasts", skuPrefix: "BD", uom: "EA", icon: "🔋", priceRange: [8, 95], weight: 9, brands: ["Philips Advance", "Sylvania", "Fulham", "Universal Lighting", "Hatch"], specs: [
      { name: "Type", isNonNeg: true, values: ["LED Driver CC", "LED Driver CV", "T8 Electronic Ballast", "T5 Electronic Ballast"] },
      { name: "Input Voltage", isNonNeg: true, values: ["120V", "120-277V", "277V"] },
      { name: "Output", values: ["20W", "40W", "60W", "96W"] },
      { name: "Dimming", values: ["0-10V", "Non-Dimming"] } ] },
    { name: "Exit & Emergency Lighting", skuPrefix: "EM", uom: "EA", icon: "🚪", priceRange: [25, 260], weight: 11, brands: ["Lithonia Lighting", "Dual-Lite", "Sure-Lites", "Philips Chloride"], specs: [
      { name: "Type", isNonNeg: true, values: ["LED Exit Sign", "Emergency Unit", "Exit/Emergency Combo", "Remote Head"] },
      { name: "Battery Runtime", isNonNeg: true, values: ["90 min", "120 min"] },
      { name: "Voltage", values: ["120/277V", "120/347V"] },
      { name: "Housing", values: ["Thermoplastic", "Steel", "Die-Cast"] } ] },
    { name: "Outdoor & Area Lighting", skuPrefix: "OL", uom: "EA", icon: "🌃", priceRange: [60, 950], weight: 10, brands: ["Lithonia Lighting", "RAB Lighting", "Cree Lighting", "Hubbell Outdoor", "Holophane"], specs: [
      { name: "Type", isNonNeg: true, values: ["Wall Pack", "Area/Parking", "Flood", "Bollard"] },
      { name: "Lumens", isNonNeg: true, values: ["3000 lm", "7500 lm", "15000 lm", "30000 lm"] },
      { name: "Voltage", isNonNeg: true, values: ["120-277V", "277-480V"] },
      { name: "Controls", values: ["Photocell", "Motion Sensor", "None"] } ] },
  ],
  datacom: [
    { name: "Ethernet Cable", skuPrefix: "EC", uom: "FT", icon: "🌐", priceRange: [0.1, 2], weight: 14, brands: ["Belden", "CommScope", "Panduit", "Berk-Tek"], specs: [
      { name: "Category", isNonNeg: true, values: ["Cat5e", "Cat6", "Cat6A"] },
      { name: "Shielding", isNonNeg: true, values: ["UTP", "STP", "F/UTP"] },
      { name: "Jacket", values: ["CMR", "CMP Plenum"] } ] },
    { name: "Patch Panels", skuPrefix: "PP", uom: "EA", icon: "🎛️", priceRange: [25, 220], weight: 5, brands: ["Panduit", "Leviton", "CommScope", "Hubbell"], specs: [
      { name: "Ports", isNonNeg: true, values: ["24-Port", "48-Port"] },
      { name: "Category", isNonNeg: true, values: ["Cat6", "Cat6A"] } ] },
    { name: "Network Switches", skuPrefix: "NS", uom: "EA", icon: "🔀", priceRange: [120, 3500], weight: 5, brands: ["Cisco", "Juniper", "Aruba", "Netgear"], specs: [
      { name: "Ports", isNonNeg: true, values: ["8-Port", "24-Port", "48-Port"] },
      { name: "Speed", isNonNeg: true, values: ["1GbE", "10GbE"] },
      { name: "Mgmt", values: ["Managed", "Unmanaged"] } ] },
    { name: "Racks & Cabinets", skuPrefix: "RC", uom: "EA", icon: "🗄️", priceRange: [80, 1800], weight: 5, brands: ["Tripp Lite", "Panduit", "Chatsworth", "APC"], specs: [
      { name: "Height", isNonNeg: true, values: ["12U", "24U", "42U"] },
      { name: "Type", isNonNeg: true, values: ["Open Frame", "Enclosed"] } ] },
    { name: "Fiber Optic Cable", skuPrefix: "FO", uom: "FT", icon: "🧶", priceRange: [0.3, 6], weight: 12, brands: ["Corning", "CommScope", "OFS", "AFL", "Belden", "Panduit"], specs: [
      { name: "Mode", isNonNeg: true, values: ["OS2 Singlemode", "OM3 Multimode", "OM4 Multimode"] },
      { name: "Fiber Count", isNonNeg: true, values: ["6-Fiber", "12-Fiber", "24-Fiber", "48-Fiber", "144-Fiber"] },
      { name: "Jacket", values: ["OFNR Riser", "OFNP Plenum", "Outdoor OSP"] } ] },
    { name: "Wireless Access Points", skuPrefix: "WA", uom: "EA", icon: "📶", priceRange: [95, 1900], weight: 10, brands: ["Cisco", "Aruba", "Ruckus", "Ubiquiti", "Extreme Networks"], specs: [
      { name: "Wi-Fi Standard", isNonNeg: true, values: ["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"] },
      { name: "Environment", isNonNeg: true, values: ["Indoor", "Outdoor"] },
      { name: "PoE Input", values: ["802.3af", "802.3at", "802.3bt"] },
      { name: "Radio Bands", values: ["Dual-Band", "Tri-Band"] } ] },
    { name: "UPS & Power Protection", skuPrefix: "UP", uom: "EA", icon: "🔋", priceRange: [120, 5500], weight: 11, brands: ["APC", "Eaton", "Tripp Lite", "Vertiv", "CyberPower"], specs: [
      { name: "Capacity", isNonNeg: true, values: ["750VA", "1000VA", "1500VA", "3000VA", "5000VA", "10kVA"] },
      { name: "Topology", isNonNeg: true, values: ["Standby", "Line-Interactive", "Online Double-Conversion"] },
      { name: "Form Factor", values: ["Tower", "Rackmount 2U", "Rackmount 4U"] } ] },
    { name: "Connectivity", skuPrefix: "CY", uom: "EA", icon: "🔗", priceRange: [1, 45], weight: 16, brands: ["Leviton", "Panduit", "Hubbell", "CommScope", "Siemon", "Legrand"], specs: [
      { name: "Type", isNonNeg: true, values: ["Keystone Jack", "Faceplate", "Patch Cord", "Surface Mount Box"] },
      { name: "Category", isNonNeg: true, values: ["Cat5e", "Cat6", "Cat6A"] },
      { name: "Color", values: ["White", "Ivory", "Black", "Blue"] } ] },
  ],
  "oem-electrical": [
    { name: "Relays", skuPrefix: "RL", uom: "EA", icon: "🔧", priceRange: [4, 120], weight: 5, brands: ["Allen-Bradley", "Phoenix Contact", "Omron", "Schneider Electric"], specs: [
      { name: "Coil Voltage", isNonNeg: true, values: ["24VDC", "120VAC", "240VAC"] },
      { name: "Contacts", isNonNeg: true, values: ["SPDT", "DPDT", "3PDT"] } ] },
    { name: "Terminal Blocks", skuPrefix: "TB", uom: "EA", icon: "🔩", priceRange: [0.5, 18], weight: 5, brands: ["Phoenix Contact", "Weidmuller", "Wago", "Allen-Bradley"], specs: [
      { name: "Wire Range", isNonNeg: true, values: ["26-12 AWG", "22-10 AWG"] },
      { name: "Mount", isNonNeg: true, values: ["DIN Rail", "Panel"] } ] },
    { name: "Power Supplies", skuPrefix: "PS", uom: "EA", icon: "🔋", priceRange: [25, 600], weight: 5, brands: ["Mean Well", "Phoenix Contact", "Omron", "Sola"], specs: [
      { name: "Output", isNonNeg: true, values: ["12VDC", "24VDC", "48VDC"] },
      { name: "Wattage", isNonNeg: true, values: ["60W", "120W", "240W", "480W"] } ] },
    { name: "Push Buttons", skuPrefix: "PB", uom: "EA", icon: "🔴", priceRange: [3, 60], weight: 5, brands: ["Allen-Bradley", "Schneider Electric", "Siemens", "Eaton"], specs: [
      { name: "Type", isNonNeg: true, values: ["Momentary", "Maintained", "E-Stop"] },
      { name: "Color", values: ["Red", "Green", "Black", "Yellow"] } ] },
    { name: "PLCs & I/O Modules", skuPrefix: "PI", uom: "EA", icon: "🤖", priceRange: [95, 4500], weight: 5, brands: ["Allen-Bradley", "Siemens", "Schneider Electric", "Omron", "Mitsubishi Electric"], specs: [
      { name: "Type", isNonNeg: true, values: ["CPU/Controller", "Digital Input", "Digital Output", "Analog I/O", "Comms Module"] },
      { name: "Voltage", isNonNeg: true, values: ["24VDC", "120VAC"] },
      { name: "I/O Points", values: ["8-Point", "16-Point", "32-Point"] },
      { name: "Protocol", values: ["EtherNet/IP", "Modbus TCP", "PROFINET"] } ] },
    { name: "Sensors & Proximity Switches", skuPrefix: "PX", uom: "EA", icon: "📡", priceRange: [14, 450], weight: 7, brands: ["Banner Engineering", "Pepperl+Fuchs", "SICK", "Turck", "Omron", "ifm efector"], specs: [
      { name: "Sensing Type", isNonNeg: true, values: ["Inductive", "Capacitive", "Photoelectric", "Ultrasonic"] },
      { name: "Sensing Range", isNonNeg: true, values: ["2mm", "8mm", "15mm", "100mm", "2m"] },
      { name: "Output", values: ["PNP", "NPN"] },
      { name: "Body Size", values: ["M8", "M12", "M18", "M30"] } ] },
  ],
  av: [
    { name: "Displays", skuPrefix: "DP", uom: "EA", icon: "📺", priceRange: [300, 6000], weight: 5, brands: ["Samsung", "LG", "Sony", "NEC"], specs: [
      { name: "Size", isNonNeg: true, values: ['43"', '55"', '65"', '75"', '86"'] },
      { name: "Resolution", isNonNeg: true, values: ["1080p", "4K UHD"] } ] },
    { name: "Projectors", skuPrefix: "PJ", uom: "EA", icon: "📽️", priceRange: [400, 9000], weight: 5, brands: ["Epson", "Christie", "Barco", "BenQ"], specs: [
      { name: "Brightness", isNonNeg: true, values: ["3000 lm", "5000 lm", "7500 lm"] },
      { name: "Resolution", isNonNeg: true, values: ["1080p", "4K UHD"] } ] },
    { name: "Speakers", skuPrefix: "SP", uom: "EA", icon: "🔊", priceRange: [40, 900], weight: 5, brands: ["JBL", "Bose", "QSC", "Atlas Sound"], specs: [
      { name: "Type", isNonNeg: true, values: ["Ceiling", "Surface", "Pendant"] },
      { name: "Power", isNonNeg: true, values: ["30W", "70W", "100W"] } ] },
    { name: "Signal Extenders", skuPrefix: "SX", uom: "EA", icon: "🧰", priceRange: [60, 1200], weight: 5, brands: ["Extron", "Crestron", "Atlona", "Kramer"], specs: [
      { name: "Signal", isNonNeg: true, values: ["HDMI", "HDBaseT", "SDI"] },
      { name: "Range", isNonNeg: true, values: ["100ft", "230ft", "330ft"] } ] },
    { name: "Microphones & Audio Capture", skuPrefix: "MI", uom: "EA", icon: "🎤", priceRange: [60, 3800], weight: 6, brands: ["Shure", "Sennheiser", "Audio-Technica", "Biamp", "AKG"], specs: [
      { name: "Type", isNonNeg: true, values: ["Gooseneck", "Boundary", "Ceiling Array", "Handheld Wireless", "Lavalier"] },
      { name: "Connectivity", isNonNeg: true, values: ["XLR Analog", "Dante", "USB"] },
      { name: "Polar Pattern", values: ["Cardioid", "Omnidirectional", "Supercardioid"] } ] },
    { name: "Display & Projector Mounts", skuPrefix: "MT", uom: "EA", icon: "🗜️", priceRange: [25, 700], weight: 10, brands: ["Chief", "Peerless-AV", "Premier Mounts", "Sanus", "Crimson AV"], specs: [
      { name: "Mount Type", isNonNeg: true, values: ["Fixed Wall", "Tilt", "Full-Motion", "Ceiling Projector", "Mobile Cart"] },
      { name: "Max Load", isNonNeg: true, values: ["60 lb", "125 lb", "175 lb", "250 lb"] },
      { name: "VESA Pattern", values: ["200x200", "400x400", "600x400", "800x400"] } ] },
    { name: "Video Conferencing", skuPrefix: "VC", uom: "EA", icon: "📹", priceRange: [250, 9500], weight: 7, brands: ["Poly", "Logitech", "Cisco", "Crestron", "Yealink", "Neat"], specs: [
      { name: "Room Size", isNonNeg: true, values: ["Huddle", "Small Room", "Medium Room", "Large Room"] },
      { name: "Camera Resolution", isNonNeg: true, values: ["1080p", "4K UHD"] },
      { name: "Platform", values: ["Microsoft Teams Rooms", "Zoom Rooms", "BYOD"] } ] },
    { name: "Amplifiers & DSP", skuPrefix: "AM", uom: "EA", icon: "🎚️", priceRange: [280, 6000], weight: 5, brands: ["QSC", "Crown", "Biamp", "Extron", "Bose Professional"], specs: [
      { name: "Type", isNonNeg: true, values: ["Power Amplifier", "Mixer Amplifier", "DSP Processor"] },
      { name: "Output", isNonNeg: true, values: ["70V Line", "100V Line", "Low-Z 8 Ohm"] },
      { name: "Channels", values: ["2-Channel", "4-Channel", "8-Channel"] },
      { name: "Power per Channel", values: ["60W", "120W", "250W", "500W"] } ] },
  ],
  security: [
    { name: "IP Cameras", skuPrefix: "IC", uom: "EA", icon: "🎥", priceRange: [90, 1400], weight: 5, brands: ["Axis", "Hanwha", "Bosch", "Hikvision"], specs: [
      { name: "Resolution", isNonNeg: true, values: ["2MP", "4MP", "8MP"] },
      { name: "Form", isNonNeg: true, values: ["Dome", "Bullet", "PTZ"] },
      { name: "IR", values: ["IR 30m", "IR 50m"] } ] },
    { name: "Access Control", skuPrefix: "AC", uom: "EA", icon: "🔐", priceRange: [60, 2200], weight: 5, brands: ["HID", "Genetec", "LenelS2", "Honeywell"], specs: [
      { name: "Type", isNonNeg: true, values: ["Reader", "Controller", "Door Lock"] },
      { name: "Credential", isNonNeg: true, values: ["Prox", "Smart Card", "Mobile"] } ] },
    { name: "NVRs", skuPrefix: "NV", uom: "EA", icon: "💽", priceRange: [200, 3500], weight: 5, brands: ["Axis", "Hanwha", "Bosch", "Milestone"], specs: [
      { name: "Channels", isNonNeg: true, values: ["8-Ch", "16-Ch", "32-Ch"] },
      { name: "Storage", isNonNeg: true, values: ["4TB", "8TB", "16TB"] } ] },
    { name: "Intrusion Sensors", skuPrefix: "IS", uom: "EA", icon: "🚨", priceRange: [10, 180], weight: 5, brands: ["Honeywell", "Bosch", "DSC", "Interlogix"], specs: [
      { name: "Type", isNonNeg: true, values: ["PIR Motion", "Door Contact", "Glass Break"] },
      { name: "Range", values: ["12m", "15m"] } ] },
    { name: "Alarm Panels", skuPrefix: "AP", uom: "EA", icon: "🛡️", priceRange: [110, 950], weight: 9, brands: ["Honeywell", "Bosch", "DSC", "Napco", "Qolsys"], specs: [
      { name: "Zones", isNonNeg: true, values: ["8-Zone", "16-Zone", "32-Zone", "64-Zone"] },
      { name: "Communication", isNonNeg: true, values: ["IP", "Cellular LTE", "Dual Path", "PSTN"] },
      { name: "Keypad", values: ["LCD", "Touchscreen", "None"] } ] },
    { name: "Intercom & Entry Systems", skuPrefix: "IN", uom: "EA", icon: "📞", priceRange: [75, 2400], weight: 7, brands: ["Aiphone", "2N", "Comelit", "DoorBird", "Viking Electronics"], specs: [
      { name: "Type", isNonNeg: true, values: ["Audio Only", "Video", "Telephone Entry"] },
      { name: "Connectivity", isNonNeg: true, values: ["2-Wire", "IP/PoE", "Wireless"] },
      { name: "Mount", values: ["Surface", "Flush"] } ] },
    { name: "Security Cable & Power Supplies", skuPrefix: "SW", uom: "EA", icon: "🧶", priceRange: [45, 650], weight: 13, brands: ["Honeywell Genesis", "West Penn Wire", "Windy City Wire", "Altronix", "Southwire"], specs: [
      { name: "Type", isNonNeg: true, values: ["18/2 Cable 500ft", "22/4 Cable 1000ft", "18/4 Cable 500ft", "RG59 Siamese 500ft", "12VDC Power Supply", "24VAC Power Supply"] },
      { name: "Rating", isNonNeg: true, values: ["CMR Riser", "CMP Plenum", "UL 294 Listed"] },
      { name: "Jacket Color", values: ["White", "Gray", "Red"] } ] },
  ],
  safety: [
    { name: "Hard Hats", skuPrefix: "HH", uom: "EA", icon: "⛑️", priceRange: [8, 45], weight: 10, brands: ["MSA", "3M", "Honeywell", "Pyramex"], specs: [
      { name: "Type", isNonNeg: true, values: ["Type I", "Type II"] },
      { name: "Class", isNonNeg: true, values: ["Class E", "Class G", "Class C"] },
      { name: "Color", values: ["White", "Yellow", "Orange", "Blue"] } ] },
    { name: "Safety Glasses", skuPrefix: "SG", uom: "EA", icon: "🥽", priceRange: [2, 24], weight: 12, brands: ["3M", "Honeywell", "Pyramex", "MCR Safety"], specs: [
      { name: "Lens", isNonNeg: true, values: ["Clear", "Gray", "Anti-Fog"] },
      { name: "Rating", isNonNeg: true, values: ["ANSI Z87.1"] } ] },
    { name: "Gloves", skuPrefix: "GL", uom: "PR", icon: "🧤", priceRange: [1, 30], weight: 14, brands: ["Ansell", "MCR Safety", "Mechanix", "Showa"], specs: [
      { name: "Material", isNonNeg: true, values: ["Nitrile", "Leather", "Cut-Resistant"] },
      { name: "Cut Level", isNonNeg: true, values: ["A2", "A4", "A6"] } ] },
    { name: "Hi-Vis Apparel", skuPrefix: "HV", uom: "EA", icon: "🦺", priceRange: [6, 60], weight: 8, brands: ["ML Kishigo", "PIP", "Radians", "Ergodyne"], specs: [
      { name: "Class", isNonNeg: true, values: ["Class 2", "Class 3"] },
      { name: "Type", isNonNeg: true, values: ["Vest", "Jacket", "T-Shirt"] } ] },
    { name: "Fall Protection", skuPrefix: "FP", uom: "EA", icon: "🪢", priceRange: [20, 850], weight: 6, brands: ["3M DBI-SALA", "Guardian Fall Protection", "Honeywell Miller", "MSA", "FallTech"], specs: [
      { name: "Type", isNonNeg: true, values: ["Full-Body Harness", "Shock-Absorbing Lanyard", "Self-Retracting Lifeline", "Anchor Point", "Roof Kit"] },
      { name: "Capacity", isNonNeg: true, values: ["310 lb", "420 lb"] },
      { name: "Standard", values: ["ANSI Z359", "OSHA 1926.502"] } ] },
    { name: "Hearing Protection", skuPrefix: "HG", uom: "PK", icon: "🎧", priceRange: [4, 175], weight: 6, brands: ["3M", "Honeywell Howard Leight", "Moldex", "Radians"], specs: [
      { name: "Type", isNonNeg: true, values: ["Foam Earplugs", "Corded Earplugs", "Earmuffs", "Banded"] },
      { name: "NRR", isNonNeg: true, values: ["22 dB", "25 dB", "28 dB", "31 dB", "33 dB"] },
      { name: "Style", values: ["Disposable", "Reusable"] } ] },
    { name: "Respiratory Protection", skuPrefix: "RS", uom: "EA", icon: "😷", priceRange: [1.5, 600], weight: 6, brands: ["3M", "Honeywell North", "Moldex", "MSA"], specs: [
      { name: "Type", isNonNeg: true, values: ["N95 Disposable", "Half-Mask", "Full-Face", "PAPR"] },
      { name: "Filter Rating", isNonNeg: true, values: ["N95", "P100", "OV/AG Cartridge"] },
      { name: "Size", values: ["S", "M", "L"] } ] },
    { name: "Lockout/Tagout", skuPrefix: "LO", uom: "EA", icon: "🔒", priceRange: [3, 400], weight: 6, brands: ["Master Lock", "Brady", "ABUS", "Panduit"], specs: [
      { name: "Type", isNonNeg: true, values: ["Safety Padlock", "Breaker Lockout", "Valve Lockout", "Hasp", "Station Kit"] },
      { name: "Keying", values: ["Keyed Different", "Keyed Alike"] },
      { name: "Body Material", values: ["Aluminum", "Nylon", "Steel"] } ] },
  ],
};

export const ALL_SUBCATEGORIES: string[] = [
  ...new Set(CATEGORIES.flatMap((c) => TAXONOMY[c].map((s) => s.name))),
].sort();

export const ALL_BRANDS: string[] = [
  ...new Set(CATEGORIES.flatMap((c) => TAXONOMY[c].flatMap((s) => s.brands))),
].sort();
