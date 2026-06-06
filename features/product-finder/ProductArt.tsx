import type { CatalogProduct, ProductCategory } from "@/features/product-finder/types";

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
}

/**
 * Deterministic SVG product plate. Same product → identical output (no randomness).
 * Uses a category-tinted background band + a soft inner plate with the product emoji,
 * brand name, and SKU. Wesco tertiary palette per category.
 */
export function ProductArt({ product, className }: ProductArtProps) {
  const colors = CATEGORY_COLORS[product.category] ?? CATEGORY_COLORS.electrical;

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

      {/* ── Category emoji icon ──────────────────────────────── */}
      <text
        x="160"
        y="128"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="54"
        fontFamily="'Segoe UI Emoji', 'Apple Color Emoji', sans-serif"
      >
        {product.imageIcon}
      </text>

      {/* ── Brand name label ─────────────────────────────────── */}
      <text
        x="160"
        y="168"
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
        y="188"
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
