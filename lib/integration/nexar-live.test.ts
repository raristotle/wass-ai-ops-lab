import { describe, it, expect, afterEach, vi } from "vitest";
import { nexarConfigured, nexarSearchToEnrichment, enrichByMpn, type NexarPart } from "@/lib/integration/nexar-live";

const PARTS: NexarPart[] = [
  {
    mpn: "LM339N",
    name: "LM339N comparator",
    octopartUrl: "https://octopart.com/lm339n",
    manufacturer: { name: "Texas Instruments" },
    bestDatasheet: { url: "https://ti.com/lm339.pdf" },
    documentCollections: [
      {
        name: "Compliance",
        documents: [
          { name: "RoHS cert", url: "https://x/rohs.pdf", mimeType: "application/pdf" },
          { name: "No URL doc" }, // dropped — no url
        ],
      },
    ],
    sellers: [
      {
        company: { name: "Mouser", isVerified: true },
        offers: [
          {
            sku: "595-LM339N",
            inventoryLevel: 12000,
            clickUrl: "https://mouser/x",
            prices: [
              { quantity: 1, price: 0.5, currency: "USD" },
              { quantity: 100, price: 0.3, currency: "USD" },
            ],
          },
        ],
      },
    ],
  },
  { mpn: "LM339NSR", manufacturer: { name: "ON Semi" }, octopartUrl: "https://octopart.com/lm339nsr" },
];

afterEach(() => {
  delete process.env.NEXAR_CLIENT_ID;
  delete process.env.NEXAR_CLIENT_SECRET;
  vi.unstubAllGlobals();
});

describe("nexarConfigured", () => {
  it("is false unless BOTH credentials are present (dormant)", () => {
    expect(nexarConfigured()).toBe(false);
    process.env.NEXAR_CLIENT_ID = "id";
    expect(nexarConfigured()).toBe(false);
    process.env.NEXAR_CLIENT_SECRET = "secret";
    expect(nexarConfigured()).toBe(true);
  });
});

describe("nexarSearchToEnrichment (pure transform)", () => {
  it("maps the primary part + second sources, flattening compliance and offers", () => {
    const e = nexarSearchToEnrichment(PARTS);
    expect(e).not.toBeNull();
    if (!e) return;
    expect(e.manufacturer).toBe("Texas Instruments");
    expect(e.datasheetUrl).toBe("https://ti.com/lm339.pdf");
    // Only the document that has a url survives.
    expect(e.compliance).toEqual([{ name: "RoHS cert", url: "https://x/rohs.pdf", mimeType: "application/pdf" }]);
    expect(e.distributors[0]).toMatchObject({ name: "Mouser", verified: true, stock: 12000 });
    expect(e.distributors[0].priceBreaks).toHaveLength(2);
    // Every part contributes a second-source row.
    expect(e.secondSources.map((s) => s.manufacturer)).toEqual(["Texas Instruments", "ON Semi"]);
  });

  it("returns null when there are no parts", () => {
    expect(nexarSearchToEnrichment([])).toBeNull();
  });
});

describe("enrichByMpn (dormant)", () => {
  it("returns no-keys and makes NO network call when credentials are unset", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await enrichByMpn("LM339");
    expect(r).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
