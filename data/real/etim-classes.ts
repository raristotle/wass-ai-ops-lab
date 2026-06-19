import type { EtimClass } from "@/lib/catalog/etim-specs";

/**
 * ETIM (electrical product classification) class map — 79 catalog subcategories
 * mapped to their ETIM class + the required engineering FEATURES that class defines.
 * From the free ETIM International model (ODC-By). Web-verified 2026-06-19. Generated;
 * consumed by lib/catalog/etim-specs.ts. Attribution: ETIM International (etim-international.com).
 */
export const ETIM_CLASS_ENTRIES: EtimClass[] = [
  {
    "subcategory": "Access Control",
    "classCode": "EC001771",
    "className": "Electronic data medium / access control device",
    "requiredFeatures": [
      "Reading strategy (biometric / code / data medium / card)",
      "Number of users",
      "Type of voltage",
      "Operating voltage (V)",
      "Power over Ethernet (PoE)",
      "Installation/mounting method",
      "Suitable for indoor/outdoor installation",
      "Network/interface type",
      "Housing material",
      "Degree of protection (IP)",
      "Width/height/depth (mm)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Alarm Panels",
    "classCode": "EC001763",
    "className": "Fire detector (alarm/control family)",
    "requiredFeatures": [
      "Operating principle",
      "Number of zones/loops",
      "Optical message",
      "Acoustic report / minimum sound level (dB at 3 m)",
      "Standalone capability",
      "Network connectivity options",
      "Power supply / operating voltage (V)",
      "Battery backup",
      "Contact / interface types",
      "Mounting method",
      "Degree of protection (IP)",
      "Dimensions (W/H/D)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Amplifiers & DSP",
    "classCode": "EC001354",
    "className": "Audio amplifier / electronic sound generator",
    "requiredFeatures": [
      "Output power (W)",
      "Number of audio channels",
      "Number of audio inputs/outputs",
      "Input/output connector type",
      "Output voltage (100V line / low-impedance)",
      "Frequency response (Hz)",
      "DSP / signal processing capability",
      "Supply voltage (V)",
      "Mounting method (rack / 19-inch height units)",
      "Dimensions (W/H/D)"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Boxes & Covers",
    "classCode": "EC002601",
    "className": "Box/housing for built-in mounting in the wall/ceiling",
    "requiredFeatures": [
      "Model / type of box",
      "Number of gangs",
      "Shape",
      "For flush/surface mounting",
      "Number / type of cable entries",
      "Installation diameter and depth (mm)",
      "Material",
      "Halogen free",
      "Degree of protection (IP)",
      "Impact resistance (IK)",
      "Fire behaviour / glow-wire",
      "Colour"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Cable Tray",
    "classCode": "EC000853 / EC000047",
    "className": "Mesh cable tray / Channel cable tray (Cable tray, ladder & wire basket systems)",
    "requiredFeatures": [
      "Profile shape",
      "Width (mm)",
      "Height (mm)",
      "Length / working length (mm)",
      "Usable cross section (mm²)",
      "Material",
      "Material quality",
      "Surface protection",
      "Load test type per IEC 61537",
      "Safe working load vs support spacing (IEC 61537)",
      "Working temperature (°C)",
      "Suitable for circuit integrity"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Circuit Breakers",
    "classCode": "EC000042",
    "className": "Miniature circuit breaker (MCB)",
    "requiredFeatures": [
      "Tripping characteristic (B/C/D/K/Z)",
      "Number of poles (total)",
      "Number of protected poles",
      "Current rating / rated current In (A)",
      "Voltage rating (V)",
      "Rated short-circuit breaking capacity Icn per EN 60898 at 230 V / 400 V (kA)",
      "Rated short-circuit breaking capacity Icu per IEC 60947-2 (kA)",
      "Current limiting class",
      "Width (module count)",
      "Operating ambient temperature (°C)",
      "Degree of protection (IP)"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Combination Devices",
    "classCode": "EC000020",
    "className": "Combination switch/push button with receptacle outlet",
    "requiredFeatures": [
      "Model",
      "Method of operation",
      "Number of controls / gangs",
      "Number of receptacle outlets",
      "Connection type",
      "Number of poles",
      "Nominal voltage (V)",
      "Nominal current (A)",
      "Mounting/fastening type",
      "Material",
      "Degree of protection (IP)",
      "Colour"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Conduit",
    "classCode": "EC000253",
    "className": "Cable protection tube / rigid conduit (underground & rigid conduit systems)",
    "requiredFeatures": [
      "Material",
      "Material quality",
      "Shape",
      "Inside diameter (mm)",
      "Outside diameter (mm)",
      "Lowest bending radius",
      "Impact strength per EN 61386-24",
      "Compression strength per EN 61386-24",
      "Suitable for outdoor use",
      "Colour",
      "Separable"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Conduit Fittings",
    "classCode": "EC001180",
    "className": "Metallic flexible conduit fittings",
    "requiredFeatures": [
      "Nominal diameter (mm) / nominal size (inch)",
      "Degree of protection (IP)",
      "Construction type",
      "Connection / thread type and size",
      "Housing material",
      "Surface protection",
      "Lowest inner / max outer hose diameter (mm)",
      "Thread length / total length (mm)",
      "Approval combinations (EN 61386-23 / UL / CSA)",
      "Working temperature (°C)",
      "With grounding connection"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Connectivity",
    "classCode": "EC001122 / EC000796",
    "className": "Fiber optic connector / Contact for industrial connectors (data & connector group)",
    "requiredFeatures": [
      "Connector / contact type",
      "Category (e.g. Cat 5e/6/6A or fiber type)",
      "Shielded",
      "Connection method",
      "Number of contacts/ports",
      "Conductor cross section / fiber count",
      "Gender (male/female)",
      "Material / contact plating",
      "Degree of protection (IP)",
      "Mounting method"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Contactors",
    "classCode": "EC000176",
    "className": "Power contactor (low-voltage control systems)",
    "requiredFeatures": [
      "Rated operational current Ie at AC-3 / AC-1 (A)",
      "Rated operational voltage Ue (V)",
      "Rated power at AC-3, 400 V (kW)",
      "Number of poles / main contacts",
      "Number of auxiliary contacts (NO/NC)",
      "Control supply voltage Uc (V)",
      "Coil/control voltage type (AC/DC)",
      "Utilisation category",
      "Mounting method (DIN rail)",
      "Degree of protection (IP)",
      "Width (mm / modules)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Cord Plugs & Connectors",
    "classCode": "EC000204b",
    "className": "Plug / connector for connecting cable (rewirable plug & connector)",
    "requiredFeatures": [
      "Number of poles",
      "With earthing/protective contact",
      "Rated current (A)",
      "Rated voltage (V)",
      "Connection type",
      "Cable entry / max cable diameter (mm)",
      "Mounting (inline / rewirable)",
      "Material",
      "Degree of protection (IP)",
      "Colour"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Displays",
    "classCode": "EC001412",
    "className": "Graphic panel / operator display (PLC HMI)",
    "requiredFeatures": [
      "Screen size (inch)",
      "Resolution",
      "Display type (TFT/touch)",
      "Number of colours",
      "Interface / communication ports",
      "Supply voltage (V)",
      "Mounting method",
      "Degree of protection (IP) front",
      "Operating temperature (°C)",
      "Dimensions (W/H/D)"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Dimmers & Lighting Controls",
    "classCode": "EC000636",
    "className": "Electronic insert for domestic switching devices (dimmer/lighting control insert)",
    "requiredFeatures": [
      "Control function (dimmer / switch / scene)",
      "Dimming technology (leading/trailing edge, 0-10V, DALI, PWM)",
      "Load type compatibility (LED/halogen/incandescent)",
      "Min/max connected load (W)",
      "Number of channels",
      "Nominal voltage (V)",
      "Nominal current (A)",
      "Bus/smart-home protocol",
      "Mounting method",
      "Material / colour"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Drivers & Ballasts",
    "classCode": "EC000281",
    "className": "Electronic control gear / LED driver (ballast)",
    "requiredFeatures": [
      "Type (LED driver / electronic ballast)",
      "Output power (W)",
      "Output current (mA) / output voltage range (V)",
      "Constant current / constant voltage",
      "Dimmable + dimming interface (DALI / 0-10V / PWM)",
      "Number of lamps/outputs",
      "Input/nominal voltage (V)",
      "Power factor",
      "Efficiency",
      "Degree of protection (IP)",
      "Dimensions (W/H/D)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Dry-Type Transformers",
    "classCode": "EC002046",
    "className": "Power supply transformer",
    "requiredFeatures": [
      "Primary voltage(s) (V)",
      "Secondary voltage(s) (V)",
      "Number of phases",
      "Rated power (VA / kVA)",
      "Accuracy class",
      "Degree of protection (IP)",
      "Degree of protection (NEMA)",
      "Toroidal core",
      "Suitable for distribution board / PCB mounting",
      "Width/height/depth (mm)"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "EV Charging Stations",
    "classCode": "EC002883",
    "className": "Charging device for electric vehicles",
    "requiredFeatures": [
      "Number of charging points",
      "Max power per charging point (kW)",
      "Nominal connection power (kW)",
      "Connector types (Type 2 / Type 2 CCS / CHAdeMO / socket)",
      "Input/output AC/DC voltage (V)",
      "Max output current (A)",
      "Mounting (wall / floor / portable)",
      "Earth leakage protection (type A/B) + DC RCD",
      "Load management (static/dynamic)",
      "Network connectivity (LAN/Wi-Fi/4G) + OCPP",
      "RFID/NFC authentication",
      "Degree of protection (IP) + IK",
      "Dimensions (W/H/D)"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Enclosures",
    "classCode": "EC000261",
    "className": "Enclosure/cabinet (empty)",
    "requiredFeatures": [
      "Width / height / depth (mm)",
      "Material + material quality",
      "Surface finishing / colour / RAL",
      "Floor-standing / wall-mounting / couplable",
      "With mounting plate",
      "With door / number of doors / number of locks",
      "Degree of protection (IP)",
      "Degree of protection (NEMA)",
      "Impact strength (IK)",
      "Suitable for outdoor installation",
      "Thermal dissipation (W) per IEC/TR 60890",
      "Max permitted load (N) per IEC 62208"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Ethernet Cable",
    "classCode": "EC003249",
    "className": "Data and communication cable",
    "requiredFeatures": [
      "Cable type",
      "Conductor category (e.g. Cat 5e/6/6A/7)",
      "Conductor material / diameter (mm) / AWG",
      "Number of cores / stranding elements",
      "Core insulation material",
      "Individual + overall screen type (U/UTP, F/UTP, S/FTP)",
      "Sheath material + colour",
      "Characteristic impedance (Ohm)",
      "Outer diameter (mm)",
      "Nominal voltage U (V)",
      "Armouring/reinforcement"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Exit & Emergency Lighting",
    "classCode": "EC001957",
    "className": "Emergency luminaire",
    "requiredFeatures": [
      "Function (escape route / anti-panic / exit sign)",
      "Mounting method",
      "With pictogram / type of indicator",
      "Standby vs continuous (maintained/non-maintained) circuit",
      "Emergency function monitoring system",
      "Battery technology",
      "Nominal operation time (h)",
      "Luminous flux in emergency mode (lm)",
      "Power consumption in emergency mode (W)",
      "Colour temperature (K)",
      "Degree of protection (IP)",
      "Protection class per IEC 61140"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Fall Protection",
    "classCode": "EC002940",
    "className": "PPE — fall-arrest / height-safety (workwear & PPE group)",
    "requiredFeatures": [
      "Type of fall-protection equipment (harness / lanyard / SRL / anchor)",
      "Standard / certification (EN 361 / EN 354 / EN 360 / ANSI Z359)",
      "Number of attachment points",
      "Max user weight / load rating (kg)",
      "Material",
      "Size / length (m)",
      "Connector type (carabiner / snap hook)",
      "Colour"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Fiber Optic Cable",
    "classCode": "EC000034",
    "className": "Fiber optic cable",
    "requiredFeatures": [
      "Number of fibers",
      "Fiber type (OS2/OM3/OM4/OM5)",
      "Type of tube + fibers per tube",
      "Category",
      "Armor type / material",
      "With strain relief",
      "Rodent-proof",
      "Outer jacket material + colour",
      "Longitudinal/radial water blocking",
      "Outer diameter (mm)",
      "Fire safety rating"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Flexible Conduit & Liquidtight",
    "classCode": "EC001180",
    "className": "Metallic flexible conduit fittings / flexible conduit",
    "requiredFeatures": [
      "Nominal diameter (mm) / size (inch)",
      "Inner / outer diameter (mm)",
      "Construction type (metallic / liquidtight / non-metallic)",
      "Connection / thread type and size",
      "Degree of protection (IP)",
      "Housing material + surface protection",
      "Working temperature (°C)",
      "Lowest bending radius",
      "Approval combinations (EN 61386 / UL / CSA)",
      "With grounding connection"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Fuses",
    "classCode": "EC000218",
    "className": "Fuse link (low-voltage HRC / NH / cylindrical / D-system)",
    "requiredFeatures": [
      "Rated current In (A)",
      "Rated voltage (V)",
      "Operating class / gG-gL / aM / utilisation category",
      "Size / NH size (00/0/1/2/3) or cylindrical dimensions",
      "Rated breaking capacity (kA)",
      "Voltage type (AC/DC)",
      "Contact / blade type",
      "With striker / indicator",
      "Power dissipation (W)",
      "Body material"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Generators & Transfer Switches",
    "classCode": "EC000216",
    "className": "Switch disconnector / isolator (ATS family) + generator set",
    "requiredFeatures": [
      "Rated permanent current Iu (A)",
      "Rated operating voltage Ue (V)",
      "Number of poles",
      "Number of switch positions / changeover",
      "Utilisation category (AC-23 etc.)",
      "Rated short-time withstand current Icw (kA)",
      "Motor drive (optional/integrated)",
      "Mounting / device construction",
      "Degree of protection (IP)",
      "(Generator) rated power output (kVA/kW), fuel type, voltage, phases"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Gloves",
    "classCode": "EC002940",
    "className": "PPE — protective gloves (workwear & PPE group)",
    "requiredFeatures": [
      "Glove type / protection class",
      "Standard (EN 388 mechanical / EN 60903 electrical insulating / EN 407)",
      "Electrical class (00/0/1/2/3/4) + max working voltage",
      "Size",
      "Material (leather / nitrile / latex)",
      "Cut resistance level",
      "Length (mm)",
      "Colour"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Grounding & Bonding",
    "classCode": "EC000490",
    "className": "Accessories/spare parts for grounding and lightning protection",
    "requiredFeatures": [
      "Type of accessory (lug / clamp / rod / conductor / rail)",
      "Material",
      "Material quality",
      "Surface protection",
      "Conductor cross section / connectable size (mm²)",
      "Thread / bolt size",
      "Corrosion resistance"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Hard Hats",
    "classCode": "EC002940",
    "className": "PPE — head protection / safety helmet (workwear & PPE group)",
    "requiredFeatures": [
      "Helmet type / standard (EN 397 / EN 50365 electrical / ANSI Z89.1)",
      "Electrical insulation class",
      "Shell material (HDPE / ABS)",
      "Harness/suspension type",
      "Number of suspension points",
      "With chin strap",
      "Ventilation",
      "Colour",
      "Size range"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Hearing Protection",
    "classCode": "EC002940",
    "className": "PPE — hearing protection (workwear & PPE group)",
    "requiredFeatures": [
      "Type (earmuff / earplug / banded)",
      "Standard (EN 352)",
      "Attenuation SNR (dB)",
      "Attenuation H/M/L values (dB)",
      "Reusable / disposable",
      "With communication/electronics",
      "Material",
      "Size"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "High Bay Fixtures",
    "classCode": "EC002892",
    "className": "Ceiling-/wall luminaire (industrial high-bay)",
    "requiredFeatures": [
      "Mounting method (suspended/surface)",
      "Luminous flux (lm)",
      "Power consumption (W)",
      "Efficacy (lm/W)",
      "Colour temperature (K)",
      "Colour rendering index (CRI)",
      "Beam angle / light distribution",
      "Dimming technology (0-10V/DALI)",
      "Degree of protection (IP)",
      "Impact resistance (IK)",
      "Protection class",
      "Operating temperature (°C)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Hi-Vis Apparel",
    "classCode": "EC002940",
    "className": "PPE — high-visibility workwear (workwear & PPE group)",
    "requiredFeatures": [
      "Garment type (vest / jacket / trousers)",
      "Visibility class (EN ISO 20471 class 1/2/3)",
      "Colour (fluorescent yellow/orange)",
      "Size",
      "Material / fabric",
      "Number of reflective bands",
      "With pockets / closure type",
      "Breathable / waterproof"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Industrial Plugs & Receptacles",
    "classCode": "EC001321",
    "className": "CEE socket outlet (IEC 60309) / pin-and-sleeve",
    "requiredFeatures": [
      "IEC amperage (A)",
      "Number of poles",
      "Voltage per EN 60309-2",
      "Clock-hour position (h)",
      "Identification colour",
      "Degree of protection (IP)",
      "Mounting method",
      "Connection system",
      "Cable entry",
      "Contact material / surface coating",
      "Lockable / interlocked"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Intercom & Entry Systems",
    "classCode": "EC000349",
    "className": "Functional module for door communication",
    "requiredFeatures": [
      "Model (audio / video / control / reader module)",
      "Reading strategy (code/biometric/data medium)",
      "Installation method (flush/surface)",
      "With camera (opening angle, zoom/pan/tilt)",
      "Number of call buttons",
      "Contains keypad",
      "Number of users",
      "Operating voltage (V) / PoE",
      "Suitable for indoor/outdoor",
      "Housing material",
      "Width/height/depth (mm)"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Intrusion Sensors",
    "classCode": "EC000133",
    "className": "Movement sensor complete (PIR / presence detector)",
    "requiredFeatures": [
      "Sensor technology (PIR / dual-tech / microwave)",
      "Scan/detection angle",
      "Detection / presence range (m)",
      "Mounting height (m)",
      "Mounting method",
      "Switching capacity / contact type",
      "Adjustable sensitivity & threshold",
      "Nominal voltage (V)",
      "Degree of protection (IP)",
      "Wireless transmission"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "IP Cameras",
    "classCode": "EC001527",
    "className": "Video surveillance system / IP camera",
    "requiredFeatures": [
      "Model camera / construction type (dome/bullet/PTZ)",
      "Number of pixels (megapixel)",
      "With video motion detector",
      "With infrared lighting",
      "Degree of protection (IP) camera",
      "Picture system",
      "Wired/wireless connection + number of RJ45",
      "PoE / integrated power supply",
      "Type of storage medium / cloud storage",
      "Transmission technique",
      "Mounting (wall/ceiling/corner)",
      "Suitable for outdoor use"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "LED Downlights",
    "classCode": "EC002892",
    "className": "Ceiling-/wall luminaire (recessed downlight)",
    "requiredFeatures": [
      "Mounting method (recessed/built-in)",
      "Luminous flux (lm)",
      "Power consumption (W)",
      "Efficacy (lm/W)",
      "Colour temperature (K)",
      "Colour rendering index (CRI)",
      "Beam angle",
      "UGR glare rating",
      "Dimming technology",
      "Cut-out / recess diameter (mm)",
      "Degree of protection (IP)",
      "Protection class"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "LED Troffers & Panels",
    "classCode": "EC002892",
    "className": "Ceiling-/wall luminaire (LED panel/troffer)",
    "requiredFeatures": [
      "Mounting method (recessed grid / surface / suspended)",
      "Luminous flux (lm)",
      "Power consumption (W)",
      "Efficacy (lm/W)",
      "Colour temperature (K)",
      "Colour rendering index (CRI)",
      "UGR glare rating",
      "Light distribution",
      "Dimming technology (DALI/0-10V)",
      "Dimensions (e.g. 600x600 / 1200x300 mm)",
      "Degree of protection (IP)",
      "Protection class"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Lamps & Tubes",
    "classCode": "EC000037",
    "className": "Lamp (LED retrofit / metal halide / fluorescent tube family)",
    "requiredFeatures": [
      "Lamp type / technology (LED / HID / fluorescent)",
      "Cap/base type (E27, E40, G13, GU10, etc.)",
      "Power consumption (W)",
      "Luminous flux (lm)",
      "Colour temperature (K)",
      "Colour rendering index (CRI)",
      "Nominal voltage (V)",
      "Rated life (h)",
      "Dimmable",
      "Bulb/tube shape + dimensions (mm)",
      "Beam angle (directional lamps)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Lighting Accessories",
    "classCode": "EC000204",
    "className": "Lamp holder / luminaire accessories (lighting components)",
    "requiredFeatures": [
      "Type of accessory (holder / bracket / lens / louvre / driver mount)",
      "Compatible lamp cap / luminaire type",
      "Material",
      "Mounting method",
      "Rated voltage (V)",
      "Rated current (A)",
      "Degree of protection (IP)",
      "Dimensions (mm)",
      "Colour"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Load Centers",
    "classCode": "EC002288",
    "className": "Small distribution board equipped (load centre)",
    "requiredFeatures": [
      "Mounting method",
      "Number of rows / modular width",
      "Number of phases",
      "Number of single-/three-phase MCBs",
      "Tripping characteristic",
      "Rated short-circuit breaking capacity Icn per EN 60898 (kA)",
      "Number of earth-leakage circuit breakers (RCD)",
      "Total number of groups/circuits",
      "Degree of protection (IP)",
      "Main switch rating (A)",
      "Busbar rating (A)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Lockout/Tagout",
    "classCode": "EC002940",
    "className": "Safety / LOTO device (tools, hardware & site supplies group)",
    "requiredFeatures": [
      "Device type (padlock / hasp / breaker lockout / valve lockout / tag)",
      "Lockout application (electrical / mechanical)",
      "Number of lock holes",
      "Shackle diameter / material",
      "Body material",
      "Compatible device size range",
      "Colour",
      "With tag / labelling"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Lugs & Wire Connectors",
    "classCode": "EC000490b",
    "className": "Cable lug / wire connector (cable connection & jointing group)",
    "requiredFeatures": [
      "Connector type (ring lug / pin / butt splice / mechanical connector / wire nut)",
      "Connectable conductor cross section (mm² / AWG)",
      "Number of conductors",
      "Connection method (crimp / mechanical / compression)",
      "Bolt / stud hole size (mm)",
      "Material (copper / aluminium / bi-metal)",
      "Surface coating (tin/silver)",
      "Insulated / non-insulated",
      "Rated current (A) / voltage (V)",
      "Wire range"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Meter Sockets",
    "classCode": "EC003517",
    "className": "Cable distribution cabinet / metering enclosure (energy distribution)",
    "requiredFeatures": [
      "Number of meter positions",
      "Rated current (A)",
      "Rated voltage (V)",
      "Number of phases",
      "Mounting (surface / flush / pedestal)",
      "Jaw configuration / socket type",
      "With bypass",
      "Material",
      "Degree of protection (IP) / NEMA",
      "Dimensions (W/H/D)"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Microphones & Audio Capture",
    "classCode": "EC002754",
    "className": "Microphone / audio capture (PA & audio group)",
    "requiredFeatures": [
      "Microphone type (dynamic / condenser / boundary / gooseneck)",
      "Polar pattern",
      "Frequency response (Hz)",
      "Sensitivity (mV/Pa)",
      "Connector type (XLR / RJ45 / wireless)",
      "Phantom power requirement",
      "Wired / wireless",
      "Mounting (handheld / stand / ceiling)",
      "Supply voltage (V)"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Motor Starters & Controls",
    "classCode": "EC000216c",
    "className": "Motor protective / motor starter switch (low-voltage control systems)",
    "requiredFeatures": [
      "Rated operational current Ie (A)",
      "Current setting range / overload trip range (A)",
      "Rated operational voltage Ue (V)",
      "Rated motor power at 400 V (kW)",
      "Number of poles",
      "Utilisation category (AC-3)",
      "Type (manual motor starter / DOL / star-delta / soft starter)",
      "Short-circuit breaking capacity (kA)",
      "Auxiliary contacts (NO/NC)",
      "Mounting method (DIN rail)",
      "Degree of protection (IP)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "NVRs",
    "classCode": "EC001772",
    "className": "Image storage for video surveillance system (NVR/DVR)",
    "requiredFeatures": [
      "Number of camera/video inputs",
      "Max recording resolution",
      "Storage capacity (TB) / number of drive bays",
      "Number of RJ45 / network ports",
      "PoE ports + total PoE budget (W)",
      "Number of HDMI outputs",
      "Compression format",
      "Cloud / remote access",
      "Power supply / voltage (V)",
      "Mounting / dimensions"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Occupancy & Vacancy Sensors",
    "classCode": "EC000133",
    "className": "Movement sensor complete (occupancy/presence detector)",
    "requiredFeatures": [
      "Sensor technology (PIR / ultrasonic / dual-tech)",
      "Occupancy vs vacancy (auto-on/manual-on)",
      "Detection / presence range (m)",
      "Scan angle",
      "Mounting height (m) / mounting method",
      "Constant-light / daylight control",
      "Light-level threshold (lux)",
      "Switching capacity / load type",
      "Time delay",
      "Nominal voltage (V)",
      "Degree of protection (IP)"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Outdoor & Area Lighting",
    "classCode": "EC000062",
    "className": "Luminaire for streets and places (area/outdoor)",
    "requiredFeatures": [
      "Mounting method (pole top / side entry / catenary)",
      "Luminous flux (lm)",
      "Power consumption (W)",
      "Efficacy (lm/W)",
      "Colour temperature (K)",
      "Light distribution / photometric class",
      "Beam / throw",
      "Dimming / control (DALI / NEMA socket)",
      "Degree of protection (IP)",
      "Impact resistance (IK)",
      "Surge protection level (kV)",
      "Operating temperature (°C)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Panelboards",
    "classCode": "EC002288",
    "className": "Distribution board / panelboard (equipped) — Energy distribution systems",
    "requiredFeatures": [
      "Mounting method",
      "Number of phases",
      "Main device rating / main switch (A)",
      "Busbar rating (A)",
      "Number of circuits / branch positions",
      "Number & type of installed breakers",
      "Rated short-circuit breaking capacity (kA)",
      "Rated voltage (V)",
      "Degree of protection (IP) / NEMA",
      "Dimensions (W/H/D)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Patch Panels",
    "classCode": "EC001128",
    "className": "Patch panel (copper-twisted pair)",
    "requiredFeatures": [
      "Number of ports / couplings",
      "Suitable for number of connectors",
      "Type of connector (RJ45 / keystone)",
      "Category (Cat 5e/6/6A)",
      "Shielded",
      "Connection type (IDC / punch-down)",
      "Number of height units (U)",
      "Mounting method",
      "Colour",
      "Width/height/depth (mm)"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Photo Controls",
    "classCode": "EC000133b",
    "className": "Daylight / photoelectric switch (twilight switch, domestic switching devices)",
    "requiredFeatures": [
      "Switching threshold (lux)",
      "Adjustable threshold range",
      "Switching capacity (A) / load type",
      "Number of channels",
      "Time delay",
      "Mounting (DIN rail / NEMA twist-lock / surface)",
      "Nominal voltage (V)",
      "Sensor type (integrated / remote)",
      "Degree of protection (IP)",
      "Operating temperature (°C)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Projectors",
    "classCode": "EC004718b",
    "className": "Projector / AV display device (IT & multimedia group)",
    "requiredFeatures": [
      "Brightness (ANSI lumens)",
      "Native resolution",
      "Projection technology (DLP/LCD/laser)",
      "Contrast ratio",
      "Throw ratio",
      "Input interfaces (HDMI/USB/network)",
      "Lamp/laser life (h)",
      "Power consumption (W)",
      "Mounting / dimensions",
      "Noise level (dB)"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Push Buttons",
    "classCode": "EC000443",
    "className": "Built-in switch and push button",
    "requiredFeatures": [
      "Method of operation (momentary / maintained)",
      "Number of controls",
      "Connection type",
      "Number of poles",
      "Contact configuration (NO/NC)",
      "Actuator type / colour",
      "Illuminated (lamp type)",
      "Nominal voltage (V)",
      "Nominal current (A)",
      "Mounting / installation diameter (mm)",
      "Degree of protection (IP)",
      "Material"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Racks & Cabinets",
    "classCode": "EC002499",
    "className": "Network/server enclosure (19-inch rack cabinet)",
    "requiredFeatures": [
      "Number of height units (U)",
      "Type of profile rail (19-inch)",
      "Width / height / depth (mm)",
      "Max load capacity (kg)",
      "Number / type of doors + locking system",
      "With glazed door",
      "Type of ventilation",
      "With vertical cable management",
      "With earthing",
      "Degree of protection (IP) / NEMA",
      "Material / colour",
      "Extendable"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Receptacles & Outlets",
    "classCode": "EC000125",
    "className": "Receptacle outlet",
    "requiredFeatures": [
      "Number of receptacle outlets",
      "Number of poles",
      "Protective/earth contact",
      "Tamper-resistant",
      "Number of USB-A / USB-C ports + USB current rating",
      "Nominal current (A)",
      "Nominal voltage (V)",
      "Connection type",
      "Mounting method",
      "With overvoltage / fault-current protection",
      "Degree of protection (IP)",
      "Material / colour"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Relays",
    "classCode": "EC001440",
    "className": "Monitoring / control relay (current, voltage, timer family)",
    "requiredFeatures": [
      "Relay function (monitoring / interface / coupling / time)",
      "Number of contacts / contact configuration (NO/NC/CO)",
      "Contact rating / switching capacity (A)",
      "Coil / control voltage (V) + type (AC/DC)",
      "Measuring/monitoring range",
      "Adjustable setpoint + hysteresis",
      "Time range (for timer relays)",
      "Mounting method (DIN rail / socket)",
      "Number of poles",
      "Width (mm)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Respiratory Protection",
    "classCode": "EC002940",
    "className": "PPE — respiratory protection (workwear & PPE group)",
    "requiredFeatures": [
      "Type (disposable FFP mask / half mask / full face / PAPR)",
      "Filter class (FFP1/2/3 or P/A/B/E/K)",
      "Standard (EN 149 / EN 140 / EN 143)",
      "With exhalation valve",
      "Filter connection type",
      "Reusable / disposable",
      "Size",
      "Material"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Safety Glasses",
    "classCode": "EC002940",
    "className": "PPE — eye protection / safety glasses (workwear & PPE group)",
    "requiredFeatures": [
      "Type (spectacle / goggle / face shield)",
      "Standard (EN 166 / ANSI Z87.1)",
      "Optical class",
      "Impact rating (F/B/A)",
      "Lens tint / UV protection",
      "Anti-fog / anti-scratch coating",
      "Frame material",
      "Adjustable"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Safety Switches & Disconnects",
    "classCode": "EC000216",
    "className": "Switch disconnector / isolator",
    "requiredFeatures": [
      "Rated permanent current Iu (A)",
      "Rated operating voltage Ue (V)",
      "Number of poles",
      "Utilisation category (AC-23 / AC-21)",
      "Rated short-time withstand current Icw (kA)",
      "Fused / non-fused",
      "Version (main / maintenance / emergency-stop)",
      "Interlockable / lockable",
      "Device construction / mounting",
      "Degree of protection (IP) / NEMA",
      "Type of control element"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Security Cable & Power Supplies",
    "classCode": "EC003249b",
    "className": "Data/communication & control cable + power supply (datacom + power-supply group)",
    "requiredFeatures": [
      "(Cable) cable type / number of cores / AWG / shield type / sheath material / voltage",
      "(Power supply) output voltage (V)",
      "Output current (A) / output power (W)",
      "Input voltage (V)",
      "Regulated / unregulated",
      "With battery backup",
      "Number of outputs",
      "Mounting",
      "Degree of protection (IP)"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Sensors & Proximity Switches",
    "classCode": "EC001821",
    "className": "Proximity / photoelectric sensor (e.g. diffuse reflective photoelectric sensor)",
    "requiredFeatures": [
      "Sensing principle (inductive / capacitive / photoelectric / ultrasonic)",
      "Sensing/switching distance (mm)",
      "Output type (PNP/NPN, NO/NC, analog)",
      "Supply voltage (V)",
      "Switching frequency (Hz)",
      "Housing form / size (M8/M12/M18/M30)",
      "Connection type (cable / connector)",
      "Degree of protection (IP)",
      "Operating temperature (°C)",
      "Flush/non-flush mountable"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Signal Extenders",
    "classCode": "EC000734b",
    "className": "Signal extender / media converter / repeater (data networking group)",
    "requiredFeatures": [
      "Signal type (HDMI / USB / Ethernet / fiber)",
      "Max transmission distance (m)",
      "Max resolution / bandwidth",
      "Number of input/output ports",
      "Transmission medium (Cat / fiber / coax)",
      "PoE pass-through",
      "Supply voltage (V)",
      "Mounting",
      "Degree of protection (IP)"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Speakers",
    "classCode": "EC001354b",
    "className": "Loudspeaker (PA / sound system)",
    "requiredFeatures": [
      "Speaker type (ceiling / wall / horn / column / cabinet)",
      "Rated power (W)",
      "Sound pressure level / sensitivity (dB)",
      "Frequency range (Hz)",
      "Impedance (Ohm) / 100V-line tappings (W)",
      "Number of drivers / ways",
      "Mounting method",
      "Degree of protection (IP)",
      "Material / colour",
      "Dimensions"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Strip & Wrap Fixtures",
    "classCode": "EC002892",
    "className": "Ceiling-/wall luminaire (strip/batten/wrap)",
    "requiredFeatures": [
      "Mounting method (surface / suspended)",
      "Length (mm)",
      "Luminous flux (lm)",
      "Power consumption (W)",
      "Efficacy (lm/W)",
      "Colour temperature (K)",
      "Colour rendering index (CRI)",
      "Light distribution",
      "Dimming technology",
      "Degree of protection (IP)",
      "Protection class",
      "Lamp type"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Strut & Channel",
    "classCode": "EC000386",
    "className": "Mounting rail/-profile (strut / channel)",
    "requiredFeatures": [
      "Length (mm)",
      "Width (mm)",
      "Height (mm)",
      "Slot/slit width (mm)",
      "Material thickness (mm)",
      "Profile shape",
      "Type of perforation",
      "Load bearing capacity (kN)",
      "Material",
      "Surface protection",
      "Colour"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Surge Protective Devices",
    "classCode": "EC002677",
    "className": "Surge protection device (SPD) — LV class derived from MV class EC002677",
    "requiredFeatures": [
      "SPD type/class (Type 1 / Type 2 / Type 3, i.e. T1/T2/T3)",
      "Nominal discharge current In (kA, 8/20)",
      "Max discharge current Imax (kA)",
      "Impulse current Iimp (kA, 10/350)",
      "Voltage protection level Up (kV)",
      "Max continuous operating voltage Uc (V)",
      "Number of poles / protection modes",
      "Network configuration (TN/TT)",
      "With remote signalling contact",
      "Replaceable cartridge",
      "Mounting (DIN rail)",
      "Degree of protection (IP)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Switches",
    "classCode": "EC000443",
    "className": "Built-in switch and push button (wall switch / installation switch)",
    "requiredFeatures": [
      "Method of operation (1-way / 2-way / intermediate)",
      "Number of controls / gangs",
      "Number of poles",
      "Connection type",
      "Nominal voltage (V)",
      "Nominal current (A)",
      "Illuminated",
      "Mounting / fastening type",
      "Recess depth (mm)",
      "Material",
      "Degree of protection (IP)",
      "Colour"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Terminal Blocks",
    "classCode": "EC001284",
    "className": "Single- and multi-pole terminal strip",
    "requiredFeatures": [
      "Rated current In (A)",
      "Voltage rating (V)",
      "Connectable conductor cross section solid/stranded (mm²)",
      "Type of electrical connection (screw / spring / push-in)",
      "Number of poles",
      "Number of clamp positions per pole",
      "Mounting method (DIN rail)",
      "Insulating material + UL94 flammability class",
      "Operating temperature (°C)",
      "Width/height/depth (mm)",
      "Colour"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Timers & Time Switches",
    "classCode": "EC001439",
    "className": "Timer relay / time switch",
    "requiredFeatures": [
      "Function (time switch / staircase timer / multifunction timer relay)",
      "Time range (s/min/h/day-week program)",
      "Number of channels",
      "Number of switching outputs / contact config",
      "Switching capacity (A) / load type",
      "Astronomical / digital / analog",
      "With battery reserve",
      "Supply / nominal voltage (V)",
      "Mounting method (DIN rail)",
      "Width (modules)"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Wall Plates & Covers",
    "classCode": "EC000007",
    "className": "Cover plate for wiring accessories",
    "requiredFeatures": [
      "Number of units / gangs",
      "Number of modules (module system)",
      "Mounting direction",
      "Flush-mounted / built-in",
      "Material",
      "Halogen free",
      "Surface protection / finish",
      "Colour / RAL",
      "Degree of protection (IP)",
      "Impact resistance (IK)",
      "Type of fastening",
      "With hinged lid"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Wireless Access Points",
    "classCode": "EC000734c",
    "className": "Wireless access point (data networking group)",
    "requiredFeatures": [
      "Wi-Fi standard (Wi-Fi 5/6/6E/7, 802.11ax etc.)",
      "Frequency bands (2.4/5/6 GHz)",
      "Max data rate (Mbps/Gbps)",
      "Number of spatial streams (MIMO)",
      "Number / type of Ethernet uplink ports",
      "PoE powered (type) / PoE budget",
      "Antenna type (internal/external) + gain (dBi)",
      "Mounting (ceiling/wall)",
      "Supply voltage (V)",
      "Degree of protection (IP)",
      "Operating temperature (°C)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Wire & Cable",
    "classCode": "EC000034b",
    "className": "Cable / wire (insulated power & control cable, cables-and-wires group)",
    "requiredFeatures": [
      "Cable type / designation",
      "Number of cores",
      "Nominal cross-sectional area of conductor (mm² / AWG)",
      "Conductor material",
      "Conductor class (solid/stranded)",
      "Core insulation material",
      "Sheath material + colour",
      "Rated voltage U0/U (V)",
      "Armouring / shield",
      "Outer diameter (mm)",
      "Fire/flame behaviour rating",
      "Weight (kg/km)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Wiring Devices",
    "classCode": "EC000125",
    "className": "Wiring devices (receptacle outlets, switches, covers — wiring-accessories group)",
    "requiredFeatures": [
      "Device type (outlet / switch / dimmer / cover)",
      "Number of gangs / modules",
      "Nominal current (A)",
      "Nominal voltage (V)",
      "Number of poles",
      "Connection type",
      "Mounting method",
      "Tamper-resistant / with USB",
      "Degree of protection (IP)",
      "Material / colour"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "UPS & Power Protection",
    "classCode": "EC002850",
    "className": "Uninterruptible power supply (UPS) — accessories class EC002850 confirmed, UPS unit in same group",
    "requiredFeatures": [
      "Topology (offline / line-interactive / online double-conversion)",
      "Rated output power (VA / W)",
      "Output voltage (V)",
      "Input voltage range (V)",
      "Number of phases (in/out)",
      "Battery technology + runtime at load (min)",
      "Number / type of output sockets",
      "Communication interface (USB / SNMP / network card)",
      "Bypass",
      "Form factor (tower / rack U)",
      "Degree of protection (IP)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "Video Conferencing",
    "classCode": "EC001527b",
    "className": "Video conferencing system / AV codec (IT & multimedia / surveillance-adjacent)",
    "requiredFeatures": [
      "Camera resolution (megapixel / 4K)",
      "Field of view / pan-tilt-zoom",
      "Number of microphones / mic pickup range (m)",
      "Integrated speaker (W)",
      "Connectivity (HDMI / USB / network)",
      "Codec / platform compatibility",
      "Number of supported participants/displays",
      "Supply voltage (V) / PoE",
      "Mounting",
      "Dimensions"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Display & Projector Mounts",
    "classCode": "EC002620b",
    "className": "Mounting bracket / support for display & projector (mounting systems group)",
    "requiredFeatures": [
      "Mount type (fixed / tilt / full-motion / ceiling / projector)",
      "Compatible screen size range (inch)",
      "VESA pattern (mm)",
      "Max load capacity (kg)",
      "Tilt / swivel / rotation range (°)",
      "Extension / arm length (mm)",
      "Mounting surface (wall / ceiling / pole)",
      "Material",
      "Colour",
      "Cable management"
    ],
    "confidence": "low"
  },
  {
    "subcategory": "Network Switches",
    "classCode": "EC000734",
    "className": "Network switch",
    "requiredFeatures": [
      "Number & speed of RJ45 ports (10/100/1000 Mbps, 10 Gbps)",
      "Number / type of SFP / SFP+ (Mini-GBIC) uplink ports",
      "Power over Ethernet (PoE) capability + PoE budget (W)",
      "Managed / unmanaged (Layer 2 / Layer 3)",
      "Switching capacity / throughput",
      "Stackable",
      "Redundant power supply",
      "Mounting method (rack / DIN)",
      "Power consumption (W)",
      "Degree of protection (IP)",
      "Dimensions (H/W/D)"
    ],
    "confidence": "high"
  },
  {
    "subcategory": "Power Supplies",
    "classCode": "EC002046b",
    "className": "Power supply / switched-mode power supply (AC-DC, low-voltage components group)",
    "requiredFeatures": [
      "Output voltage (V)",
      "Output current (A)",
      "Output power (W)",
      "Number of output channels",
      "Input voltage range (V) / AC or DC",
      "Regulated / adjustable output",
      "Efficiency (%)",
      "Mounting method (DIN rail / panel / PCB)",
      "Redundancy capability",
      "Operating temperature (°C)",
      "Degree of protection (IP)",
      "Dimensions (W/H/D)"
    ],
    "confidence": "medium"
  },
  {
    "subcategory": "PLCs & I/O Modules",
    "classCode": "EC001417",
    "className": "Logic module / PLC + I/O (control-engineering group)",
    "requiredFeatures": [
      "Device type (CPU / logic module / I/O module / expansion)",
      "Number of digital inputs / outputs",
      "Number of analog inputs / outputs",
      "Output type (relay / transistor / triac)",
      "I/O signal type/range (24V DC, 0-10V, 4-20mA)",
      "Program/data memory",
      "Communication interfaces / fieldbus (Profinet / Modbus / EtherCAT)",
      "Supply voltage (V)",
      "Mounting method (DIN rail)",
      "Number of expansion slots",
      "Operating temperature (°C)",
      "Width (mm)"
    ],
    "confidence": "medium"
  }
];
