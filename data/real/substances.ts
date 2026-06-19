import type { Substance, HtsChapter } from "@/lib/catalog/compliance-substances";

/**
 * Real compliance reference data — 9 substances common in electrical goods with
 * CAS numbers + which regulatory lists they appear on (ECHA REACH SVHC Candidate
 * List, EU RoHS Annex II, CA Prop 65), and 5 USITC HTS chapters with Section-301
 * exposure notes. All sourced (ECHA / OEHHA / USITC). Web-verified 2026-06-19. Generated;
 * consumed by lib/catalog/compliance-substances.ts. No fabricated CAS/HTS codes.
 */
export const SUBSTANCES: Substance[] = [
  {
    "name": "Lead (and lead compounds)",
    "cas": "7439-92-1",
    "lists": [
      "RoHS",
      "Prop65",
      "REACH-SVHC"
    ],
    "electricalUse": "Brass alloys in connectors/terminals/lugs, tin-lead solder, PVC cable-jacket heat stabilizers, battery plates. RoHS limit 0.1% by weight (with copper-alloy exemptions). Various lead compounds appear individually on the ECHA Candidate List.",
    "sourceUrl": "https://oehha.ca.gov/proposition-65/proposition-65-list"
  },
  {
    "name": "Cadmium (and cadmium compounds)",
    "cas": "7440-43-9",
    "lists": [
      "RoHS",
      "Prop65",
      "REACH-SVHC"
    ],
    "electricalUse": "Contact platings/coatings, brazing alloys, PVC pigment/stabilizer, NiCd battery electrodes. Tightest RoHS limit at 0.01% by weight. Cadmium and several cadmium compounds are on the ECHA Candidate List.",
    "sourceUrl": "https://oehha.ca.gov/proposition-65/proposition-65-list"
  },
  {
    "name": "Mercury",
    "cas": "7439-97-6",
    "lists": [
      "RoHS"
    ],
    "electricalUse": "Fluorescent lamps, tilt switches, relays. RoHS Annex II restricted, limit 0.1% by weight. (Mercury and many mercury compounds also appear on Prop 65, but the elemental metal is included here primarily for its RoHS status.)",
    "sourceUrl": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=PI_COM:C(2022)7590"
  },
  {
    "name": "Hexavalent chromium / Chromium (VI) compounds",
    "cas": "18540-29-9",
    "lists": [
      "RoHS",
      "Prop65"
    ],
    "electricalUse": "Corrosion-resistant chromate conversion coatings on steel/zinc hardware, fasteners, enclosures. RoHS Annex II restricted, limit 0.1% by weight. 'Chromium (hexavalent compounds)' listed on Prop 65 for cancer and developmental/reproductive toxicity. CAS 18540-29-9 is the generic chromium(VI) ion identifier.",
    "sourceUrl": "https://oehha.ca.gov/proposition-65/proposition-65-list"
  },
  {
    "name": "Chromium trioxide",
    "cas": "1333-82-0",
    "lists": [
      "REACH-SVHC"
    ],
    "electricalUse": "Hard/decorative chrome electroplating and chromate surface treatment of metal electrical hardware. SVHC on the ECHA Candidate List (Carc. 1A, Muta. 1B) and on REACH Annex XIV (Authorisation List, sunset date 21 Sept 2017). A specific hexavalent-chromium source substance.",
    "sourceUrl": "https://echa.europa.eu/candidate-list-table"
  },
  {
    "name": "Bis(2-ethylhexyl) phthalate (DEHP)",
    "cas": "117-81-7",
    "lists": [
      "REACH-SVHC",
      "RoHS",
      "Prop65"
    ],
    "electricalUse": "Primary plasticizer in flexible PVC cable insulation, jacketing, and wire harnesses. On ECHA Candidate List (toxic for reproduction; later also endocrine disruptor); RoHS Annex II phthalate (added by Directive 2015/863, limit 0.1%); Prop 65 listed for cancer, developmental and male reproductive toxicity.",
    "sourceUrl": "https://oehha.ca.gov/proposition-65/chemicals/di2-ethylhexylphthalate-dehp"
  },
  {
    "name": "Benzyl butyl phthalate (BBP)",
    "cas": "85-68-7",
    "lists": [
      "REACH-SVHC",
      "RoHS",
      "Prop65"
    ],
    "electricalUse": "Plasticizer in flexible PVC compounds used for cable and wire insulation. On ECHA Candidate List (toxic for reproduction); RoHS Annex II phthalate (Directive 2015/863, limit 0.1%); Prop 65 listed effective 12/02/2005 for developmental/reproductive toxicity.",
    "sourceUrl": "https://oehha.ca.gov/chemicals/butyl-benzyl-phthalate"
  },
  {
    "name": "Dibutyl phthalate (DBP)",
    "cas": "84-74-2",
    "lists": [
      "REACH-SVHC",
      "RoHS",
      "Prop65"
    ],
    "electricalUse": "Plasticizer in PVC insulation/jacketing and in some adhesives/coatings. On ECHA Candidate List (toxic for reproduction); RoHS Annex II phthalate (Directive 2015/863, limit 0.1%); Prop 65 listed for developmental and female/male reproductive toxicity.",
    "sourceUrl": "https://oehha.ca.gov/proposition-65/chemicals/di-n-butyl-phthalate-dbp"
  },
  {
    "name": "Diisobutyl phthalate (DIBP)",
    "cas": "84-69-5",
    "lists": [
      "REACH-SVHC",
      "RoHS"
    ],
    "electricalUse": "Plasticizer used in flexible PVC and coatings, often alongside/replacing DBP. On ECHA Candidate List (toxic for reproduction; endocrine disruptor); RoHS Annex II phthalate (Directive 2015/863, limit 0.1%). Not independently listed on Prop 65.",
    "sourceUrl": "https://echa.europa.eu/candidate-list-table"
  }
];

export const HTS_CHAPTERS: HtsChapter[] = [
  {
    "chapter": "85",
    "description": "Electrical machinery and equipment and parts thereof; sound/TV recorders and reproducers; etc. Core chapter for electrical goods: conductors, connectors, switchgear, circuit breakers, transformers, motors/generators, lamps/LED light sources (e.g. 8539), insulated wire and cable (8544), boards/panels (8537).",
    "section301Note": "Heavy Section 301 exposure. Many Chapter 85 subheadings sit on List 1 (electrical equipment, +25%, effective July 2018) and the broad List 3 (+25%); insulated wire/cable and electronics components are prominently covered.",
    "exampleCategory": "Wire & cable, connectors/terminals/lugs, circuit breakers and switchgear, transformers, LED light engines/lamps"
  },
  {
    "chapter": "84",
    "description": "Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof. Covers electromechanical machinery and industrial equipment that is adjacent to electrical distribution (motors-driven apparatus, pumps, fans/blowers, certain enclosures and mechanical assemblies).",
    "section301Note": "Significant Section 301 exposure. Chapter 84 machinery codes are heavily represented on List 1 (+25%, July 2018); USTR runs a machinery-exclusion process specifically for certain Chapter 84/85 subheadings used in domestic manufacturing.",
    "exampleCategory": "Motor-driven equipment, industrial enclosures/mechanical apparatus, fans and blowers"
  },
  {
    "chapter": "94",
    "description": "Furniture; bedding, mattresses; lamps and lighting fittings not elsewhere specified; illuminated signs/nameplates; prefabricated buildings. Heading 9405 covers complete luminaires and lighting fittings (fixtures with a permanently fixed light source) and parts thereof.",
    "section301Note": "Notable Section 301 exposure. Many 9405 luminaire lines fall on List 3 (+25%); some lighting/consumer lines fall on List 4A (+7.5%). LED fixtures classify in 9405 while bare LED lamps/bulbs classify in 8539.50 (Chapter 85).",
    "exampleCategory": "Lighting fixtures / luminaires (commercial, industrial, and outdoor LED fixtures)"
  },
  {
    "chapter": "74",
    "description": "Copper and articles thereof. Covers copper in forms used upstream of finished electrical goods: refined copper, copper wire/rod/bar, copper conductors and busbars, and copper fittings.",
    "section301Note": "Section 301 exposure on List 3 (+25%) for many copper article lines; copper is also a Section 232 / commodity-tariff-sensitive metal, so finished electrical goods carry copper-driven cost/landed-price exposure.",
    "exampleCategory": "Bare copper conductor, copper busbar, grounding wire and lugs (copper)"
  },
  {
    "chapter": "76",
    "description": "Aluminum and articles thereof. Covers aluminum stock and articles used in electrical products: aluminum conductor, busbar, heat sinks, fixture housings, conduit and enclosures.",
    "section301Note": "Section 301 exposure (List 3, +25%) for many aluminum article lines, layered on top of Section 232 aluminum tariffs; relevant to aluminum-bodied fixtures, conduit, and ACSR/aluminum conductor.",
    "exampleCategory": "Aluminum conductor (e.g. building wire / ACSR), conduit, fixture housings and heat sinks"
  }
];
