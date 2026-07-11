// Client-safe xref display metadata. Deliberately data-free: SearchBar (a client
// component) needs crossRelationMeta, and importing it from xref-index dragged the
// entire packed xref dataset (~18 MB minified) into the browser bundle on every main
// route (see docs/perf-audit-2026-07-10.md). Anything UI-facing about xref rendering
// belongs here; anything that touches XREF_PACKED stays in xref-index (server-only).

/** Documented cross relation kind (mirrors XrefHit["relation"] in xref-index). */
export type XrefRelation = "equivalent" | "functional-substitute";

/**
 * Banded confidence chip for a documented cross relation (B2). "Equivalent" is a drop-in documented
 * replacement; "functional-substitute" performs the same function but confirm the flagged specs.
 * Colors are Meridian brand tertiaries (WCAG-safe on white).
 */
export function crossRelationMeta(relation: XrefRelation): { label: string; color: string; blurb: string } {
  return relation === "equivalent"
    ? { label: "Documented equivalent", color: "#00573F", blurb: "Manufacturer-documented drop-in equivalent." }
    : { label: "Functional substitute", color: "#004986", blurb: "Performs the same function — confirm the application-critical specs before substituting." };
}
