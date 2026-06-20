/**
 * Image-URL utilities for the manufacturer harvester (Sprint D4).
 *
 * Manufacturer product pages reference images in inconsistent ways — absolute,
 * protocol-relative (`//cdn…`), or root/relative (`/img/x.jpg`) — and often include
 * placeholder/spinner images before the real one. These pure helpers resolve a reference
 * to an absolute URL against the page it came from and filter out obvious placeholders, so
 * the ingested `imageUrl` is an accurate, loadable link to the manufacturer's OWN product
 * image (a link we store, never the bytes — and the manufacturer's own image of their own
 * product, unlike third-party catalog content).
 */

/**
 * Placeholder image FILENAMES (separators removed, lowercased). We match the basename as a
 * whole, NOT a substring of the URL — otherwise a real product whose name contains a word
 * like "loading" ("loading-dock-panel.jpg"), "blank" ("blank-cover-plate.jpg"),
 * "transparent" ("transparent-housing.jpg"), or "spacer" ("spacer-bar.jpg") would be
 * wrongly dropped. A placeholder's whole basename IS the marker; a real product's basename
 * merely contains the word among others.
 */
const PLACEHOLDER_BASENAMES = new Set([
  "placeholder",
  "noimage",
  "noimg",
  "nophoto",
  "nopicture",
  "imagenotavailable",
  "imagecomingsoon",
  "notavailable",
  "comingsoon",
  "spinner",
  "loading",
  "loader",
  "spacer",
  "blank",
  "transparent",
  "missing",
  "default",
  "1x1",
  "pixel",
  "empty",
  "dummy",
  "tbd",
  "na",
]);

/** A trailing token that's just a size/dimension/variant, dropped before the basename check. */
const SIZE_TOKEN = /^(\d+|\d+x\d+|thumb|thumbnail|small|large|med|medium|sm|lg|xl|hi|lo|hires|lowres|px|\d+px)$/;

/**
 * True when a URL's filename looks like a placeholder / non-product image. Operates on the
 * filename BASENAME (path's last segment, sans extension and trailing size tokens) compared
 * as a whole word, so it can't over-trigger on a product-name slug.
 */
export function isLikelyPlaceholder(url: string): boolean {
  const path = url.split(/[?#]/)[0];
  const file = path.substring(path.lastIndexOf("/") + 1).replace(/\.[a-z0-9]+$/i, "");
  const tokens = file.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  while (tokens.length > 1 && SIZE_TOKEN.test(tokens[tokens.length - 1])) tokens.pop();
  return PLACEHOLDER_BASENAMES.has(tokens.join(""));
}

/**
 * Resolve an image reference to an absolute http(s) URL against the page URL it was found
 * on. Handles absolute, protocol-relative, and root/relative refs. Returns null when it
 * can't produce a valid absolute http(s) URL (e.g. a data: URI or garbage).
 */
export function resolveImageUrl(src: string, pageUrl: string): string | null {
  const ref = src.trim();
  if (!ref) return null;
  // Reject inline data URIs outright — not a stable, citable source.
  if (/^data:/i.test(ref)) return null;
  try {
    // `new URL(ref, base)` resolves protocol-relative and relative refs against the page.
    const base = /^https?:\/\//i.test(pageUrl) ? pageUrl : undefined;
    const resolved = new URL(ref, base);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    // Never store a URL carrying embedded credentials (suspicious + not a clean source).
    if (resolved.username || resolved.password) return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

/**
 * From a list of candidate image refs, return the best absolute URL: the first that
 * resolves to a valid http(s) URL and isn't a placeholder. Returns undefined when none
 * qualify (honest — we don't fabricate an image).
 */
export function pickBestImage(candidates: string[], pageUrl: string): string | undefined {
  for (const c of candidates) {
    const abs = resolveImageUrl(c, pageUrl);
    if (abs && !isLikelyPlaceholder(abs)) return abs;
  }
  return undefined;
}
