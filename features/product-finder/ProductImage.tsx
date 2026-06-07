"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { imageUrlFor } from "@/lib/product-finder-images";
import { ProductArt } from "@/features/product-finder/ProductArt";
import type { CatalogProduct } from "@/features/product-finder/types";

interface ProductImageProps {
  product: CatalogProduct;
  className?: string;
}

/**
 * Renders a keyword-based photo from LoremFlickr for the product.
 * On image load error, falls back to the deterministic ProductArt SVG so a
 * failed third-party load never shows a broken image.
 */
export function ProductImage({ product, className }: ProductImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return <ProductArt product={product} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrlFor(product)}
      alt={product.name}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn(
        "w-full h-full object-cover rounded",
        className
      )}
    />
  );
}
