import { ProductArt } from "@/features/product-finder/ProductArt";
import type { CatalogProduct } from "@/features/product-finder/types";

interface ProductImageProps {
  product: CatalogProduct;
  className?: string;
}

/**
 * Renders the deterministic ProductArt SVG plate for the product.
 * Previously this loaded keyword photos from LoremFlickr, but the photos
 * bore no relation to the product name, category, or brand — the SVG plate
 * (category band + icon + brand + SKU) is always aligned with the product.
 */
export function ProductImage({ product, className }: ProductImageProps) {
  return <ProductArt product={product} className={className} />;
}
