import { describe, it, expect, afterEach } from "vitest";
import {
  salesforceConfigured,
  contactBody,
  opportunityBody,
  syncWonQuoteToSalesforce,
} from "@/lib/integration/salesforce-live";

const q = { email: "jane@acme.com", firstName: "Jane", lastName: "Doe", dealName: "Acme Q3", amount: 1234.5 };

describe("contactBody / opportunityBody (pure)", () => {
  it("builds a Contact with a required LastName", () => {
    expect(contactBody(q)).toEqual({ Email: "jane@acme.com", LastName: "Doe", FirstName: "Jane" });
    // Falls back to the email local-part when no LastName.
    expect(contactBody({ email: "bob@x.com", dealName: "d", amount: 1 }).LastName).toBe("bob");
  });

  it("builds an Opportunity in the won stage with a numeric amount + close date", () => {
    const o = opportunityBody(q, "003XXX", "2026-06-19");
    expect(o.Name).toBe("Acme Q3");
    expect(o.Amount).toBe(1234.5);
    expect(o.StageName).toBe("Closed Won");
    expect(o.CloseDate).toBe("2026-06-19");
    expect(o.ContactId).toBe("003XXX");
  });
});

describe("salesforceConfigured / syncWonQuoteToSalesforce (dormant gate)", () => {
  const prevToken = process.env.SALESFORCE_ACCESS_TOKEN;
  const prevUrl = process.env.SALESFORCE_INSTANCE_URL;
  afterEach(() => {
    if (prevToken === undefined) delete process.env.SALESFORCE_ACCESS_TOKEN;
    else process.env.SALESFORCE_ACCESS_TOKEN = prevToken;
    if (prevUrl === undefined) delete process.env.SALESFORCE_INSTANCE_URL;
    else process.env.SALESFORCE_INSTANCE_URL = prevUrl;
  });

  it("is dormant unless BOTH token and instance URL are set", async () => {
    delete process.env.SALESFORCE_ACCESS_TOKEN;
    delete process.env.SALESFORCE_INSTANCE_URL;
    expect(salesforceConfigured()).toBe(false);
    expect(await syncWonQuoteToSalesforce(q, "2026-06-19T00:00:00.000Z")).toEqual({ enabled: false, reason: "no-keys" });

    process.env.SALESFORCE_ACCESS_TOKEN = "tok";
    expect(salesforceConfigured()).toBe(false); // still missing instance URL
  });
});
