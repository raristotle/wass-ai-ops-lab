import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GLYPH_ART } from "@/features/product-finder/glyphs";
import {
  GLYPH_IDS,
  SUBCATEGORY_GLYPH,
  CATEGORY_GLYPH,
  glyphIdFor,
  type GlyphId,
} from "@/lib/product-finder-glyph-map";

/**
 * glyphs.tsx exports GLYPH_ART: Record<GlyphId, ReactElement> — one stroke-only
 * SVG fragment per glyph id. These tests render every fragment the way the real
 * consumer (ProductArt) does (inside an <svg><g> with fill="none" strokes) so
 * each entry's JSX is exercised, and they assert the table is keyed exactly to
 * the GLYPH_IDS vocabulary that the Record<GlyphId, …> type is built from.
 */

/** Render a glyph fragment exactly as ProductArt mounts it. */
function renderGlyph(id: GlyphId) {
  return render(
    <svg viewBox="0 0 48 48" data-testid={`glyph-${id}`}>
      <g
        fill="none"
        stroke="#1D252D"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPH_ART[id]}
      </g>
    </svg>,
  );
}

describe("GLYPH_ART (glyphs.tsx)", () => {
  it("render-smoke: renders the 'breaker' glyph into an SVG with stroked geometry", () => {
    const { container } = renderGlyph("breaker");
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // The breaker glyph is built from <rect> + <path> strokes; assert real
    // geometry made it into the DOM (not an empty fragment).
    expect(container.querySelectorAll("rect, path, circle").length).toBeGreaterThan(0);
  });

  it("exposes artwork for exactly the GLYPH_IDS vocabulary (no missing, no extra)", () => {
    const artKeys = Object.keys(GLYPH_ART).sort();
    const idKeys = [...GLYPH_IDS].sort();
    expect(artKeys).toEqual(idKeys);
    expect(artKeys).toHaveLength(GLYPH_IDS.length);
  });

  it("renders every glyph in the table without throwing, each emitting drawable geometry", () => {
    for (const id of GLYPH_IDS) {
      const { container, unmount } = renderGlyph(id);
      const shapes = container.querySelectorAll(
        "path, rect, circle, ellipse, line, polygon, polyline",
      );
      expect(
        shapes.length,
        `glyph "${id}" rendered no drawable geometry`,
      ).toBeGreaterThan(0);
      unmount();
    }
  });

  it("every entry is a defined React element (no undefined holes in the record)", () => {
    for (const id of GLYPH_IDS) {
      const art = GLYPH_ART[id];
      expect(art, `glyph "${id}" is missing`).toBeDefined();
      expect(art).not.toBeNull();
    }
  });

  it("resolves real product subcategories to art via the consumer path (glyphIdFor)", () => {
    // Exercise the subcategory → glyph branch for every mapped subcategory and
    // confirm each resolves to a glyph that has artwork (the ProductArt lookup).
    for (const [subcat, expectedId] of Object.entries(SUBCATEGORY_GLYPH)) {
      const id = glyphIdFor(subcat, "electrical");
      expect(id).toBe(expectedId);
      expect(GLYPH_ART[id]).toBeDefined();
    }
  });

  it("falls back to the category glyph for an unknown subcategory, and that glyph has art", () => {
    // Unknown subcategory → category fallback branch in glyphIdFor.
    for (const [category, expectedId] of Object.entries(CATEGORY_GLYPH)) {
      const id = glyphIdFor(
        "Totally Unknown Subcategory",
        category as keyof typeof CATEGORY_GLYPH,
      );
      expect(id).toBe(expectedId);
      const { container, unmount } = renderGlyph(id);
      expect(
        container.querySelectorAll("path, rect, circle, ellipse, line").length,
      ).toBeGreaterThan(0);
      unmount();
    }
  });
});
