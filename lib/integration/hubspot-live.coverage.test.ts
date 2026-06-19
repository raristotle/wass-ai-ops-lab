import { describe, it, expect, afterEach, vi } from "vitest";
import {
  contactUpsertBody,
  dealCreateBody,
  syncWonQuoteToHubspot,
  type WonQuote,
} from "@/lib/integration/hubspot-live";

const QUOTE: WonQuote = {
  email: "anna@acme.com",
  firstName: "Anna",
  lastName: "Smith",
  dealName: "Acme — Q-1042",
  amount: 12500,
};

// Minimal won quote: no first/last name (exercises the omitted-property branches).
const MINIMAL: WonQuote = { email: "bare@acme.com", dealName: "Bare — Q-9", amount: 0 };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  delete process.env.HUBSPOT_DEAL_PIPELINE;
  delete process.env.HUBSPOT_DEAL_WON_STAGE;
});

describe("pure body builders — minimal-quote edges", () => {
  it("contactUpsertBody omits firstname/lastname when absent", () => {
    expect(contactUpsertBody(MINIMAL)).toEqual({
      inputs: [{ idProperty: "email", id: "bare@acme.com", properties: { email: "bare@acme.com" } }],
    });
  });

  it("dealCreateBody formats a zero amount as '0.00'", () => {
    const b = dealCreateBody(MINIMAL, "777");
    expect(b.properties.amount).toBe("0.00");
    expect(b.properties.dealname).toBe("Bare — Q-9");
  });
});

describe("syncWonQuoteToHubspot (live fetch wrapper)", () => {
  it("full success: upserts contact, creates deal, returns ids + ISO timestamp", async () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    const fetchSpy = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: "C-1" }] }))
      .mockResolvedValueOnce(jsonResponse({ id: "D-9" }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await syncWonQuoteToHubspot(QUOTE);

    expect(r).toEqual({
      enabled: true,
      contactId: "C-1",
      dealId: "D-9",
      syncedAt: expect.any(String),
    });
    // syncedAt is a real ISO-8601 string.
    if (r.enabled) expect(Number.isNaN(Date.parse(r.syncedAt))).toBe(false);

    // Two calls: contact upsert, then deal create — with Bearer auth.
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [contactUrl, contactInit] = fetchSpy.mock.calls[0];
    expect(String(contactUrl)).toContain("/crm/v3/objects/contacts/batch/upsert");
    expect((contactInit as RequestInit).method).toBe("POST");
    expect((contactInit as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBe(
      "Bearer pat-na1-x",
    );
    const [dealUrl] = fetchSpy.mock.calls[1];
    expect(String(dealUrl)).toContain("/crm/v3/objects/deals");
  });

  it("contact non-OK (HTTP 500) fails closed with reason 'error' and no deal call", async () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 500 }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await syncWonQuoteToHubspot(QUOTE);

    expect(r).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).toHaveBeenCalledTimes(1); // bailed before the deal call
  });

  it("contact 200 but no results[0].id fails closed with reason 'error'", async () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ results: [] }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await syncWonQuoteToHubspot(QUOTE);

    expect(r).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("contact 200 with unparseable body (.catch(()=>({}))) fails closed", async () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    // 200 OK but body is not JSON → res.json() rejects → caught → {} → no id.
    const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(new Response("<<not json>>", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await syncWonQuoteToHubspot(QUOTE);

    expect(r).toEqual({ enabled: false, reason: "error" });
  });

  it("deal non-OK (HTTP 400) after good contact fails closed with reason 'error'", async () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    const fetchSpy = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: "C-1" }] }))
      .mockResolvedValueOnce(new Response("", { status: 400 }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await syncWonQuoteToHubspot(QUOTE);

    expect(r).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("deal 200 but missing id fails closed with reason 'error'", async () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    const fetchSpy = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: "C-1" }] }))
      .mockResolvedValueOnce(jsonResponse({})); // no id
    vi.stubGlobal("fetch", fetchSpy);

    const r = await syncWonQuoteToHubspot(QUOTE);

    expect(r).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("network throw (timeout/abort) is caught and fails closed with reason 'error'", async () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    const fetchSpy = vi.fn<typeof fetch>().mockRejectedValue(new Error("net"));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await syncWonQuoteToHubspot(QUOTE);

    expect(r).toEqual({ enabled: false, reason: "error" });
  });

  it("never throws: a fetch that rejects still resolves to the fail-closed union", async () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => {
        throw new Error("boom");
      }),
    );
    await expect(syncWonQuoteToHubspot(QUOTE)).resolves.toEqual({ enabled: false, reason: "error" });
  });

  it("passes the env won-stage + pipeline through to the deal-create request body", async () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = "pat-na1-x";
    process.env.HUBSPOT_DEAL_PIPELINE = "p9";
    process.env.HUBSPOT_DEAL_WON_STAGE = "stage-42";
    const fetchSpy = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: "C-1" }] }))
      .mockResolvedValueOnce(jsonResponse({ id: "D-9" }));
    vi.stubGlobal("fetch", fetchSpy);

    await syncWonQuoteToHubspot(QUOTE);

    const dealInit = fetchSpy.mock.calls[1][1] as RequestInit;
    const body = JSON.parse(String(dealInit.body)) as { properties: Record<string, string> };
    expect(body.properties.pipeline).toBe("p9");
    expect(body.properties.dealstage).toBe("stage-42");
  });
});
