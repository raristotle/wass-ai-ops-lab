import { describe, it, expect, afterEach, vi } from "vitest";
import { hubspotConfigured, contactUpsertBody, dealCreateBody, syncWonQuoteToHubspot, type WonQuote } from "@/lib/integration/hubspot-live";

const QUOTE: WonQuote = { email: "anna@acme.com", firstName: "Anna", lastName: "Smith", dealName: "Acme — Q-1042", amount: 12500 };

afterEach(() => {
  delete process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  delete process.env.HUBSPOT_DEAL_PIPELINE;
  delete process.env.HUBSPOT_DEAL_WON_STAGE;
  vi.unstubAllGlobals();
});

describe("hubspotConfigured", () => {
  it("is false until the private-app token is set", () => {
    expect(hubspotConfigured()).toBe(false);
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    expect(hubspotConfigured()).toBe(true);
  });
});

describe("pure body builders", () => {
  it("contactUpsertBody upserts by email with name properties", () => {
    expect(contactUpsertBody(QUOTE)).toEqual({
      inputs: [{ idProperty: "email", id: "anna@acme.com", properties: { email: "anna@acme.com", firstname: "Anna", lastname: "Smith" } }],
    });
  });

  it("dealCreateBody sends amount as a string, default won stage, inline association", () => {
    const b = dealCreateBody(QUOTE, "555");
    expect(b.properties).toEqual({ dealname: "Acme — Q-1042", amount: "12500.00", dealstage: "closedwon" });
    expect(b.properties.pipeline).toBeUndefined(); // omitted unless env set
    expect(b.associations[0]).toEqual({ to: { id: "555" }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }] });
  });

  it("dealCreateBody honors env pipeline + won-stage overrides", () => {
    process.env.HUBSPOT_DEAL_PIPELINE = "p9";
    process.env.HUBSPOT_DEAL_WON_STAGE = "1234567";
    const b = dealCreateBody(QUOTE, "555");
    expect(b.properties.pipeline).toBe("p9");
    expect(b.properties.dealstage).toBe("1234567");
  });
});

describe("syncWonQuoteToHubspot (dormant)", () => {
  it("returns no-keys and makes NO network call when the token is unset", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await syncWonQuoteToHubspot(QUOTE);
    expect(r).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
