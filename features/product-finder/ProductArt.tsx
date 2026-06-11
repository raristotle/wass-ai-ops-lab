import type { CatalogProduct, ProductCategory } from "@/features/product-finder/types";
import { glyphIdFor } from "@/lib/product-finder-glyph-map";
import { keySpecCallout } from "@/lib/product-finder-plate";
import { GLYPH_ART } from "@/features/product-finder/glyphs";

// ─── Category palette ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<ProductCategory, { band: string; plate: string; text: string }> = {
  electrical:      { band: "#EAAA00", plate: "#FFF8E1", text: "#1D252D" },
  datacom:         { band: "#64CCC9", plate: "#E0F7F7", text: "#1D252D" },
  "oem-electrical":{ band: "#DB6B30", plate: "#FDF0E8", text: "#1D252D" },
  av:              { band: "#004986", plate: "#E8F0F8", text: "#FFFFFF" },
  security:        { band: "#00573F", plate: "#E5F3EE", text: "#FFFFFF" },
  safety:          { band: "#B7C9D3", plate: "#F2F6F8", text: "#1D252D" },
};

interface ProductArtProps {
  product: CatalogProduct;
  className?: string;
  /** Render the key-spec callout badge (detail views only; thumbnails stay clean). */
  showCallout?: boolean;
}

/**
 * Deterministic SVG product plate. Same product → identical output (no randomness).
 * Uses a category-tinted background band + a soft inner plate with a subcategory
 * line-art glyph, subcategory label, brand name, and SKU. Meridian palette per category.
 */
export function ProductArt({ product, className, showCallout = false }: ProductArtProps) {
  const colors = CATEGORY_COLORS[product.category] ?? CATEGORY_COLORS.electrical;
  const glyph = GLYPH_ART[glyphIdFor(product.subcategory, product.category)];
  const callout = showCallout ? keySpecCallout(product.specs) : null;

  const displaySubcat = product.subcategory.length > 30
    ? product.subcategory.slice(0, 30) + "…"
    : product.subcategory;

  // Truncate brand/sku for display — deterministic, no randomness
  const displayBrand = product.brand.length > 22 ? product.brand.slice(0, 22) + "…" : product.brand;
  const displaySku   = product.sku.length > 20   ? product.sku.slice(0, 20)   + "…" : product.sku;

  return (
    <svg
      viewBox="0 0 320 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={product.name}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {/* ── Background ───────────────────────────────────────── */}
      <rect width="320" height="240" rx="10" fill={colors.plate} />

      {/* ── Top accent band ──────────────────────────────────── */}
      <rect width="320" height="52" rx="0" fill={colors.band} />
      <rect y="42" width="320" height="10" rx="0" fill={colors.band} opacity="0.4" />

      {/* ── Inner product plate (card) ───────────────────────── */}
      <rect x="24" y="64" width="272" height="148" rx="8" fill="#FFFFFF" opacity="0.85"
        stroke={colors.band} strokeWidth="1.5" />

      {/* ── Subcategory line-art glyph on category-tinted disc ── */}
      <circle cx="160" cy="100" r="33" fill={colors.plate} />
      <svg x="132" y="72" width="56" height="56" viewBox="0 0 48 48">
        <g
          fill="none"
          stroke="#1D252D"
          strokeOpacity="0.82"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {glyph}
        </g>
      </svg>

      {/* ── Key-spec callout badge (top-right of inner plate) ── */}
      {callout !== null && (
        <g>
          <rect
            x="236"
            y="70"
            width="56"
            height="22"
            rx="6"
            fill="#FFFFFF"
            stroke={colors.band}
            strokeWidth="1.5"
          />
          <text
            x="264"
            y="81.5"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fontWeight="700"
            fontFamily="'Titillium Web', 'Arial Bold', Arial, sans-serif"
            fill="#1D252D"
          >
            {callout}
          </text>
        </g>
      )}

      {/* ── Subcategory label ────────────────────────────────── */}
      <text
        x="160"
        y="146"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="600"
        fontFamily="'Source Sans Pro', Arial, sans-serif"
        fill="#4F758B"
        letterSpacing="0.4"
      >
        {displaySubcat}
      </text>

      {/* ── Brand name label ─────────────────────────────────── */}
      <text
        x="160"
        y="166"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fontWeight="600"
        fontFamily="'Titillium Web', 'Arial Bold', Arial, sans-serif"
        fill="#1D252D"
        letterSpacing="0.3"
      >
        {displayBrand}
      </text>

      {/* ── SKU label ────────────────────────────────────────── */}
      <text
        x="160"
        y="186"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontFamily="'Source Sans Pro', Arial, sans-serif"
        fill="#4F758B"
        letterSpacing="0.5"
      >
        SKU: {displaySku}
      </text>

      {/* ── Band label (category) ────────────────────────────── */}
      <text
        x="160"
        y="26"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="700"
        fontFamily="'Titillium Web', 'Arial Bold', Arial, sans-serif"
        fill={colors.text}
        letterSpacing="1.5"
      >
        {product.category.toUpperCase().replace("-", " ")}
      </text>
    </svg>
  );
}
