"use client";

import { useEffect, useState } from "react";
import { isDeadLink, type LinkStatusMap } from "@/lib/product-finder-linkrot";

/**
 * B14 — "link may be outdated" badge. Given a datasheet URL, it checks the recorded link-rot status
 * (from the scheduled sweep) and renders a small warning ONLY when that URL is known-dead (a real
 * 404/410 the sweep caught) — so a rep sees it before emailing a submittal built on a stale link.
 *
 * Nothing renders until the (dormant) sweep has actually flagged the link, so there are never
 * speculative warnings. Results are cached per URL at module scope to avoid refetching. $0.
 */
const cache = new Map<string, boolean>(); // normalized URL → isDead

export function DatasheetLinkRotBadge({ url }: { url?: string }) {
  const [dead, setDead] = useState(false);

  useEffect(() => {
    if (!url) return;
    if (cache.has(url)) {
      setDead(cache.get(url) as boolean);
      return;
    }
    let cancelled = false;
    void fetch("/api/datasheets/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: [url] }),
    })
      .then((r) => (r.ok ? r.json() : { statuses: {} }))
      .then((j: { statuses?: LinkStatusMap }) => {
        const d = isDeadLink(j.statuses ?? {}, url);
        cache.set(url, d);
        if (!cancelled) setDead(d);
      })
      .catch(() => {
        /* advisory only — never block on a status check */
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!dead) return null;
  return (
    <span
      className="ml-1.5 inline-flex items-center rounded bg-[#DB6B30]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#993C1D]"
      title="Our last check couldn't reach this datasheet (link gone / 404) — verify it before sending."
    >
      ⚠ link may be outdated
    </span>
  );
}
