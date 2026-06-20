/**
 * Network-free self-test adapter (Sprint D1).
 *
 * Ships enabled so the ingestion framework is demonstrable end-to-end at $0 with no
 * external calls: it returns an embedded JSON-LD fixture instead of fetching, then
 * runs the SAME parse → gate → snapshot → diff path every real adapter uses. It proves
 * the pipeline (and gives the admin UI live content) without touching the network or
 * the real product catalog. Its snapshot lives under its own id and is never merged.
 *
 * The fixture deliberately includes one well-formed product (passes the gate) and one
 * name-only product (honestly dropped), so a run always shows kept + dropped > 0.
 */

import type { RawPayload, SourceAdapter } from "@/lib/ingest/source-adapter";
import { productsFromHtml } from "@/lib/ingest/fetcher";
import { schemaProductToRecord } from "@/lib/ingest/adapters/schema-org-product";

export const SELFTEST_ADAPTER_ID = "selftest:schema-org";

/** A tiny page with two JSON-LD Product nodes: one keyed (kept), one name-only (dropped). */
export const SELFTEST_FIXTURE_HTML = `<!doctype html><html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"20A 1-Pole Circuit Breaker",
 "brand":{"@type":"Brand","name":"ExampleElec"},"mpn":"EX-BR120","sku":"WX-DEMO-1",
 "gtin13":"0712345678904","image":"https://example.com/img/ex-br120.jpg",
 "url":"https://example.com/p/ex-br120",
 "additionalProperty":[{"@type":"PropertyValue","name":"Amperage","value":"20 A"},
   {"@type":"PropertyValue","name":"Poles","value":"1"},
   {"@type":"PropertyValue","name":"Voltage","value":"120/240 V"}]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"Unkeyed Mystery Part"}
</script>
</head><body></body></html>`;

const SELFTEST_SOURCE_URL = "self-test://ingest/fixture";

/**
 * The built-in self-test adapter. Overrides fetch() to return the embedded fixture so
 * it never hits the network; parse() is the ordinary schema.org path.
 */
export const selfTestAdapter: SourceAdapter = {
  id: SELFTEST_ADAPTER_ID,
  label: "Framework self-test (schema.org fixture)",
  segment: "cross-segment",
  dataTypes: ["attributes", "images", "gtin-identity"],
  license: "Synthetic fixture — demonstrates the pipeline; never merged into the catalog.",
  async fetch(): Promise<RawPayload[]> {
    return [{ url: SELFTEST_SOURCE_URL, contentType: "text/html", body: SELFTEST_FIXTURE_HTML }];
  },
  parse(raw: RawPayload) {
    return productsFromHtml(raw.body).map((p) => schemaProductToRecord(p, raw.url, "ExampleElec"));
  },
};
