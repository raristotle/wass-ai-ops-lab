/**
 * Lightweight i18n (v4-S4 #16) — pure, $0, zero dependencies. A flat key→string
 * map per locale plus a `t(key, locale)` lookup that falls back to English then
 * to the key itself. English is the default, and every `en` value matches the
 * existing UI text verbatim, so turning this on changes nothing until a user
 * picks Español — the existing test net (which queries English) stays green.
 *
 * Scope is a curated set of high-value rep-facing strings (search, primary
 * actions, nav, common modal verbs) plus the v4-S4 surfaces. Expand the maps to
 * widen coverage; a future pass can move to a context provider + pluralization.
 */

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** English is the source of truth; `es` is the translation. Keep `en` verbatim. */
const EN: Record<string, string> = {
  "search.placeholder": "Search products, brands, or part numbers…",
  "action.search": "Search",
  "action.clear": "Clear",
  "action.addToBasket": "Add to Basket",
  "action.addToCart": "Add to cart",
  "action.close": "Close",
  "action.cancel": "Cancel",
  "action.print": "Print",
  "action.reorder": "Reorder",
  "action.viewDetails": "View Details",
  "nav.cart": "Cart",
  "nav.quotes": "Quotes",
  "nav.orders": "Orders",
  "nav.dashboard": "Dashboard",
  "lang.label": "Language",
  // will-call (#12)
  "willcall.title": "Will-Call Queue",
  "willcall.subtitle": "Orders staged for branch pickup",
  "willcall.empty": "No will-call orders right now.",
  "willcall.printTicket": "Print pick ticket",
  "willcall.readyForPickup": "Ready for pickup",
  "willcall.col.order": "Order",
  "willcall.col.customer": "Customer",
  "willcall.col.items": "Items",
  "willcall.col.placed": "Placed",
  "willcall.pickTicket": "Pick Ticket",
  // customer portal (#13)
  "portal.title": "My Orders",
  "portal.subtitle": "Your order history and reorders",
  "portal.empty": "You have no orders yet.",
  "portal.orderTotal": "Total",
  "portal.placedOn": "Placed",
  "portal.status": "Status",
  "portal.signIn": "Please sign in to view your orders.",
  "portal.back": "← Back to Finder",
};

const ES: Record<string, string> = {
  "search.placeholder": "Buscar productos, marcas o números de parte…",
  "action.search": "Buscar",
  "action.clear": "Limpiar",
  "action.addToBasket": "Agregar al carrito",
  "action.addToCart": "Agregar al carrito",
  "action.close": "Cerrar",
  "action.cancel": "Cancelar",
  "action.print": "Imprimir",
  "action.reorder": "Reordenar",
  "action.viewDetails": "Ver detalles",
  "nav.cart": "Carrito",
  "nav.quotes": "Cotizaciones",
  "nav.orders": "Pedidos",
  "nav.dashboard": "Panel",
  "lang.label": "Idioma",
  "willcall.title": "Cola de recogida (Will-Call)",
  "willcall.subtitle": "Pedidos preparados para recoger en sucursal",
  "willcall.empty": "No hay pedidos de recogida en este momento.",
  "willcall.printTicket": "Imprimir hoja de surtido",
  "willcall.readyForPickup": "Listo para recoger",
  "willcall.col.order": "Pedido",
  "willcall.col.customer": "Cliente",
  "willcall.col.items": "Artículos",
  "willcall.col.placed": "Realizado",
  "willcall.pickTicket": "Hoja de surtido",
  "portal.title": "Mis pedidos",
  "portal.subtitle": "Tu historial de pedidos y reórdenes",
  "portal.empty": "Aún no tienes pedidos.",
  "portal.orderTotal": "Total",
  "portal.placedOn": "Realizado",
  "portal.status": "Estado",
  "portal.signIn": "Inicia sesión para ver tus pedidos.",
  "portal.back": "← Volver al buscador",
};

const MESSAGES: Record<Locale, Record<string, string>> = { en: EN, es: ES };

/** Translate `key` for `locale`, falling back to English, then the key itself. */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key;
}

/** Every key defined in English (for tests / coverage checks). */
export function messageKeys(): string[] {
  return Object.keys(EN);
}
