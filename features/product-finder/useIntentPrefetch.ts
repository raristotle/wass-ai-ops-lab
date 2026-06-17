"use client";

import { useMemo } from "react";
import { prefetchProductDetail } from "@/lib/product-finder-prefetch";

/**
 * Returns DOM handlers that warm the product-detail cache on user intent
 * (hover / keyboard-focus / touch). Spread onto a result card or table row:
 *
 *   const intent = useIntentPrefetch(product.id, user?.branchId);
 *   <div {...intent}> … </div>
 *
 * `onFocus` bubbles (focusin), so tabbing to any control inside the card warms it.
 */
export function useIntentPrefetch(id: string, branchId?: string) {
  return useMemo(() => {
    const warm = () => prefetchProductDetail(id, branchId);
    return { onMouseEnter: warm, onFocus: warm, onTouchStart: warm };
  }, [id, branchId]);
}
