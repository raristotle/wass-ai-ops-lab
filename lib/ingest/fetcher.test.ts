import { describe, it, expect } from "vitest";
import { extractJsonLd, schemaOrgProducts, productsFromHtml, politeGet } from "@/lib/ingest/fetcher";

const PAGE = `<!doctype html><html><head>
<title>x</title>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"Breaker","brand":{"@type":"Brand","name":"Acme"},
 "mpn":"BR-1","sku":"WX-1","gtin13":"0712345678901","image":["https://ex.com/a.jpg","https://ex.com/b.jpg"],
 "url":"https://ex.com/p/br-1",
 "additionalProperty":[{"@type":"PropertyValue","name":"Amps","value":"20"}]}
</script>
<script type="application/ld+json">
{"@graph":[{"@type":"Organization","name":"Acme"},{"@type":"Product","name":"No Key Part"}]}
</script>
<script type="application/ld+json">{ this is not valid json }</script>
</head><body></body></html>`;

describe("extractJsonLd", () => {
  it("extracts every ld+json block, flattens @graph, and skips malformed blocks", () => {
    const nodes = extractJsonLd(PAGE);
    // Product + Organization + Product (graph) = 3 valid nodes; the malformed block is skipped.
    expect(nodes).toHaveLength(3);
    expect(nodes.map((n) => n["@type"])).toEqual(["Product", "Organization", "Product"]);
  });

  it("returns [] for a page with no structured data", () => {
    expect(extractJsonLd("<html><body>nothing</body></html>")).toEqual([]);
  });

  it("matches blocks regardless of attribute order", () => {
    const html = `<script data-x="1" type='application/ld+json'>{"@type":"Product","name":"Y","sku":"S"}</script>`;
    expect(extractJsonLd(html)).toHaveLength(1);
  });
});

describe("schemaOrgProducts", () => {
  it("keeps only Product nodes and normalizes the shape", () => {
    const products = schemaOrgProducts(extractJsonLd(PAGE));
    expect(products).toHaveLength(2);
    const p = products[0];
    expect(p).toMatchObject({
      name: "Breaker",
      brand: "Acme",
      mpn: "BR-1",
      sku: "WX-1",
      gtin: "0712345678901",
      image: "https://ex.com/a.jpg", // first image of the array
      url: "https://ex.com/p/br-1",
    });
    expect(p.attributes).toEqual([{ name: "Amps", value: "20" }]);
  });

  it("handles @type arrays that include Product", () => {
    const nodes = extractJsonLd(`<script type="application/ld+json">{"@type":["Product","IndividualProduct"],"name":"Z","mpn":"M"}</script>`);
    expect(schemaOrgProducts(nodes)).toHaveLength(1);
  });

  it("collects ALL images (string | array | ImageObject) in document order", () => {
    const arr = schemaOrgProducts(extractJsonLd(PAGE))[0];
    expect(arr.images).toEqual(["https://ex.com/a.jpg", "https://ex.com/b.jpg"]);
    expect(arr.image).toBe("https://ex.com/a.jpg");

    const single = schemaOrgProducts(extractJsonLd(`<script type="application/ld+json">{"@type":"Product","name":"P","mpn":"M","image":"https://ex.com/one.jpg"}</script>`))[0];
    expect(single.images).toEqual(["https://ex.com/one.jpg"]);

    const obj = schemaOrgProducts(extractJsonLd(`<script type="application/ld+json">{"@type":"Product","name":"P","mpn":"M","image":{"@type":"ImageObject","url":"https://ex.com/io.jpg"}}</script>`))[0];
    expect(obj.images).toEqual(["https://ex.com/io.jpg"]);
  });
});

describe("productsFromHtml", () => {
  it("is the one-call convenience over extract + filter", () => {
    expect(productsFromHtml(PAGE).map((p) => p.name)).toEqual(["Breaker", "No Key Part"]);
  });
});

describe("politeGet", () => {
  it("rate-limits per host (waits when called twice quickly) and returns a RawPayload", async () => {
    const waits: number[] = [];
    let clock = 1_000_000;
    const fetchImpl = (async (url: string) =>
      new Response("body-of " + url, { status: 200, headers: { "content-type": "text/html" } })) as unknown as typeof fetch;
    const deps = {
      fetchImpl,
      nowMs: () => clock,
      sleep: async (ms: number) => {
        waits.push(ms);
      },
    };
    const a = await politeGet("https://host.example/one", deps);
    expect(a.body).toContain("body-of");
    expect(a.contentType).toBe("text/html");
    // Second call to same host in the same tick must request a throttle wait.
    await politeGet("https://host.example/two", deps);
    expect(waits.some((w) => w > 0)).toBe(true);
  });

  it("throws on a non-OK status so the run captures it", async () => {
    const fetchImpl = (async () => new Response("nope", { status: 404 })) as unknown as typeof fetch;
    await expect(
      politeGet("https://host404.example/x", { fetchImpl, nowMs: () => 1, sleep: async () => {} }),
    ).rejects.toThrow(/HTTP 404/);
  });
});
