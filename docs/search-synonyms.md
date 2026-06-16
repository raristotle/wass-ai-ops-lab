# Trade-term synonym & abbreviation search expansion (Sprint 1 · #5)

Expands electrical jargon and abbreviations to catalog vocabulary at query time, so a rep or
electrician's shorthand finds the right products instead of dead-ending. The single cheapest lift in
search recall; $0 at runtime.

## How it works

`lib/product-finder-synonyms.ts` holds a static, ordered `SYNONYMS` table and a pure `applySynonyms`
function that the NL search runs **first** (`lib/product-finder-nl-search.ts`):

- Case-insensitive, whole-token, whitespace-normalized; longest term wins; each entry applies once;
  replacement tokens are never re-scanned (no synonym chains).
- An entry may tag a taxonomy `subcategory`, which becomes a filter chip (e.g. "romex" → `NM-B` in
  *Wire & Cable*). Every `subcategory` value is validated against `ALL_SUBCATEGORIES` by the tests.

## This refresh

Expanded the table from ~37 to ~78 entries with more electrical shorthand and manufacturer aliases —
e.g. `disco`→`disconnect`, `mc cable`→`MC Metal-Clad`, `vfd`→`Variable Frequency Drive`,
`ocpd`→`circuit breaker`, `greenfield`→`FMC Flexible`, `mlo`→`Main Lug`, `wago`→`Lever Connector`,
`zip tie`→`Cable Tie`, `meter base`→`Meter Socket`, `whip`→`Fixture Whip`.

## Adding more

Edit the `SYNONYMS` array — `{ term: "<lowercase shorthand>", text: "<catalog text>", subcategory?:
"<verbatim taxonomy name>" }`. The layer is static TypeScript (compiled in), so additions ship on the
next deploy. The unit tests enforce: lowercase/unique terms, valid subcategories, and the
no-chains / longest-wins / once-each invariants.
