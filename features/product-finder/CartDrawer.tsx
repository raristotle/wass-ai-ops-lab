"use client";

import { useProductFinder, selectCartCount, selectCartTotal } from "@/lib/product-finder-store";
import { tierUnitPrice, priceTiers } from "@/lib/product-finder-pricing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const cartOpen = useProductFinder((s) => s.cartOpen);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const cart = useProductFinder((s) => s.cart);
  const removeFromCart = useProductFinder((s) => s.removeFromCart);
  const updateCartQty = useProductFinder((s) => s.updateCartQty);
  const clearCart = useProductFinder((s) => s.clearCart);
  const cartCount = useProductFinder(selectCartCount);
  const cartTotal = useProductFinder(selectCartTotal);

  const items = Object.values(cart);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-white shadow-2xl transition-transform duration-300 sm:w-96",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping basket"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-[#1D252D] px-5 py-4">
          <span className="font-semibold text-white">
            Basket ({cartCount} {cartCount === 1 ? "item" : "items"})
          </span>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="text-[#B7C9D3] transition-colors hover:text-white"
            aria-label="Close basket"
          >
            ✕
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <span className="text-5xl" role="img" aria-label="Empty cart">
                🛒
              </span>
              <p className="font-semibold text-[#1D252D]">Your basket is empty</p>
              <p className="text-sm text-[#4F758B]">
                Add products from the finder to build your quote or order.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#B7C9D3]">
              {items.map(({ product, qty }) => {
                const effectiveUnitPrice = tierUnitPrice(product, qty);
                const lineTotal = effectiveUnitPrice * qty;
                // Find the qualifying tier break (minQty > 1 means a vol-price discount applies)
                const tiers = priceTiers(product);
                const activeTier = [...tiers].reverse().find((t) => qty >= t.minQty);
                const hasVolBreak = activeTier !== undefined && activeTier.minQty > 1;
                return (
                  <li key={product.id} className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span
                        className="mt-0.5 text-2xl"
                        role="img"
                        aria-label={product.name}
                      >
                        {product.imageIcon}
                      </span>

                      {/* Name + SKU */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1D252D]">
                          {product.name}
                        </p>
                        <p className="text-xs text-[#4F758B]">SKU: {product.sku}</p>

                        {/* Unit price × qty */}
                        <p className="mt-1 text-xs text-[#4F758B]">
                          ${effectiveUnitPrice.toFixed(2)} × {qty} ={" "}
                          <span className="font-semibold text-[#1D252D]">
                            ${lineTotal.toFixed(2)}
                          </span>
                        </p>

                        {/* Vol. price note */}
                        {hasVolBreak && activeTier && (
                          <p className="mt-0.5 text-[10px] font-semibold text-[#00AA13]">
                            vol. price ({activeTier.minQty}+)
                          </p>
                        )}

                        {/* Qty stepper */}
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateCartQty(product.id, qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#B7C9D3] text-sm font-semibold text-[#1D252D] hover:border-[#4F758B]"
                            aria-label={`Decrease quantity of ${product.name}`}
                          >
                            −
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-semibold text-[#1D252D]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(product.id, qty + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#B7C9D3] text-sm font-semibold text-[#1D252D] hover:border-[#4F758B]"
                            aria-label={`Increase quantity of ${product.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="shrink-0 text-[#B7C9D3] transition-colors hover:text-red-600"
                        aria-label={`Remove ${product.name} from basket`}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-[#B7C9D3] bg-white px-5 py-5 space-y-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4F758B]">Subtotal</span>
              <span className="text-xl font-bold text-[#1D252D]">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {/* CTAs */}
            <Button
              className="w-full bg-[#00AA13] text-white hover:bg-[#009911]"
              onClick={() => {
                // Add to Quote — no-op in demo
              }}
            >
              Add to Quote
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#1D252D] text-[#1D252D] hover:bg-[#F8FAFB]"
              onClick={() => {
                // Add to Order — no-op in demo
              }}
            >
              Add to Order
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#4F758B] text-[#4F758B] hover:bg-[#EEF4F7]"
              onClick={() => {
                // Export BOM — no-op in demo
              }}
            >
              Export BOM
            </Button>

            {/* Clear cart */}
            <button
              type="button"
              onClick={clearCart}
              className="w-full text-center text-xs text-[#DB6B30] underline underline-offset-2 hover:text-[#c05a22]"
            >
              Clear basket
            </button>
          </div>
        )}
      </div>
    </>
  );
}
